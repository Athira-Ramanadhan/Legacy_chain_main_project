const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs"); // <--- CRITICAL MISSING IMPORT
const Asset = require("../models/Asset");
const User = require("../models/User");
const auth = require("../middleware/auth");
const { encrypt, decrypt } = require("../utils/encrypt");
const contract = require("../config/blockchain");
const checkDeadmanSwitch = require("../utils/deadmanSwitch");
const upload = require("../middleware/multerConfig");

// ==========================================
// 1. CREATE ASSET (Supports Ghost Nominees)
// ==========================================
router.post("/create", auth, async (req, res) => {
  try {
    const { title, type, nomineeId, data } = req.body;
    const ownerId = req.user.id;

    if (!title || !type || !nomineeId || !data) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const owner = await User.findById(ownerId);
    const heirEntry = owner.heirs.id(nomineeId);

    if (!heirEntry) {
      return res
        .status(404)
        .json({ message: "Nominee not found in your registry." });
    }

    const registeredUser = await User.findOne({
      email: heirEntry.email.toLowerCase(),
    });
    const encryptedData = encrypt(data);
    let txHash = "PENDING_REGISTRATION";

    if (registeredUser && registeredUser.walletAddress) {
      try {
        const tx = await contract.addAsset(
          encryptedData,
          registeredUser.walletAddress,
        );
        const receipt = await tx.wait();
        txHash = receipt.hash;
      } catch (bcErr) {
        console.error("Blockchain Error:", bcErr);
        txHash = "BC_FAIL_DB_SAVED";
      }
    }

    const asset = await Asset.create({
      title,
      type,
      ownerId,
      nomineeEmail: heirEntry.email.toLowerCase(),
      nomineeName: heirEntry.fullName || heirEntry.nickname,
      nomineeId: registeredUser ? registeredUser._id : null,
      encryptedData,
      blockchainId: Math.floor(Date.now() / 1000),
      txHash,
      status: "LOCKED",
    });

    res.status(201).json({ message: "Asset secured in vault.", asset });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. GET ASSETS (Enhanced for Registration Sync)
// ==========================================
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email.toLowerCase();

    // BRUTAL FIX: Automatically link Ghost assets to User ID permanently
    await Asset.updateMany(
      { nomineeEmail: userEmail, nomineeId: null },
      { nomineeId: userId },
    );

    // Remove the semicolon after populate()
    const myAssets = await Asset.find({ ownerId: req.user.id })
      .populate("nomineeId", "name fullName email")
      .sort({ createdAt: -1 });

    const inheritances = await Asset.find({
      $or: [{ nomineeId: userId }, { nomineeEmail: userEmail }],
    })
      .populate("ownerId", "name email")
      .sort({ createdAt: -1 });

    res.json({ myAssets, inheritances });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. CLAIM ASSET

router.post("/:id/claim", auth, async (req, res) => {
  try {
    const { answer } = req.body;
    const asset = await Asset.findById(req.params.id);

    if (!asset) return res.status(404).json({ message: "Asset not found." });

    // 🛑 FIX 1: Change "APPROVED" to "PENDING_RELEASE" to match the Admin's work [cite: 2026-03-08]
    if (asset.status !== "PENDING_RELEASE") {
      return res.status(403).json({
        message: `Current Status: ${asset.status}. Legal Authority must verify proof first.`,
      });
    }

    // 🛑 FIX 2: Check if claimStartedAt exists before doing math [cite: 2026-03-08]
    if (!asset.claimStartedAt) {
      return res.status(400).json({ message: "Claim timer hasn't started yet." });
    }

    // 🛡️ THE TIME CHECK (Grace Period) [cite: 2026-03-08]
    const now = new Date();
    // Use asset.gracePeriod (in days) converted to milliseconds [cite: 2026-03-08]
    const gracePeriodInMs = asset.gracePeriod   * 1000; 
    const releaseTime = new Date(asset.claimStartedAt.getTime() + gracePeriodInMs);

    if (now < releaseTime) {
      const remainingMs = releaseTime - now;
      const hoursLeft = Math.ceil(remainingMs / (1000 * 60 * 60));
      return res.status(403).json({
        message: `Security Lock: Grace period active. Vault opens in ${hoursLeft} hours.`,
      });
    }

  
    // 3. Identity Check (Keep your existing logic here...)
    const owner = await User.findById(asset.ownerId);
    const securitySettings = owner.heirs.find(
      (h) => h.email.toLowerCase() === req.user.email.toLowerCase(),
    );

    if (!securitySettings) {
      return res.status(403).json({ message: "Identity Mismatch." });
    }

    // 4. Secret Answer Check
    const isMatch = await bcrypt.compare(
      answer.toLowerCase().trim(),

      securitySettings.secretAnswer,
    );

    if (!isMatch) {
      return res.status(403).json({ message: "Security Challenge Failed." });
    }

    // 5. Success: Release

    asset.status = "RELEASED";
    asset.releasedAt = new Date();
    await asset.save();

    // 🔓 THE REAL DECRYPTION
    const plainTextData = decrypt(asset.encryptedData);

    res.json({
      message: "Vault Released.",
      data: plainTextData,
      title: asset.title,
    });
  } catch (err) {
    // <--- ADD THIS
    res.status(500).json({ error: "Vault Error: " + err.message });
  } // <--- ADD THIS
}); // <--- ADD THIS



// 4. INSPECT ASSET (Detailed Security Audit)
// ==========================================
router.get("/:id/inspect", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email.toLowerCase();

    // 1. ALLOW BOTH OWNER AND NOMINEE TO FIND THE ASSET
    const asset = await Asset.findOne({
      _id: req.params.id,
      $or: [
        { ownerId: userId },
        { nomineeId: userId },
        { nomineeEmail: userEmail },
      ],
    }).populate("ownerId", "name email");

    if (!asset) {
      return res
        .status(404)
        .json({ message: "Asset not found or unauthorized access." });
    }

    // 2. FETCH THE SECURITY QUESTION FROM THE OWNER'S HEIR REGISTRY
    const owner = await User.findById(asset.ownerId);
    const heirSettings = owner.heirs.find(
      (h) =>
        h.email.toLowerCase() === userEmail ||
        h.user?.toString() === userId.toString(),
    );

    // 3. SEND ONLY NON-SENSITIVE CHALLENGE DATA
    res.json({
      title: asset.title,
      status: asset.status,
      secretQuestion:
        heirSettings?.secretQuestion || "No security question found.",
      hint: heirSettings?.hint || "",
      ownerName: owner.name,
      contractAddress: process.env.CONTRACT_ADDRESS,
      encryptionMethod: "AES-256-CBC",
    });
  } catch (err) {
    res.status(500).json({ error: "Audit Error: " + err.message });
  }
});

// 5. ASSET HEARTBEAT (The "I Am Alive" Button)

router.post("/heartbeat/global", auth, async (req, res) => {
  try {
    // 1. Reset the User's global timer
    const user = await User.findById(req.user.id);
    user.lastActive = new Date();
    await user.save();

    // 2. 🛡️ THE VETO: Reset ALL assets owned by this user
    // 
    await Asset.updateMany(
      {
        ownerId: req.user.id,
        status: { $in: ["PENDING_RELEASE", "PENDING_ADMIN", "APPROVED"] },
      },
      {
        status: "LOCKED",
        claimStartedAt: null,
        deathCertificateUrl: null,
      },
    );
    res.json({
      message: "Global Heartbeat Detected. All pending claims cancelled.",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. PURGE ASSET (Permanent Wipe)

router.delete("/:id", auth, async (req, res) => {
  try {
    const asset = await Asset.findOne({
      _id: req.params.id,
      ownerId: req.user.id,
    });

    if (!asset) {
      return res
        .status(404)
        .json({ message: "Asset not found or unauthorized." });
    }

    
    await Asset.findByIdAndDelete(req.params.id);

    res.json({ message: "Asset successfully purged from the vault." });
  } catch (err) {
    res.status(500).json({ error: "Purge Error: " + err.message });
  }
});

// 7. UPLOAD DEATH CERTIFICATE (Nominee Action)
router.post(
  "/:id/upload-cert",
  auth,
  upload.single("deathCertificate"), // This name MUST match frontend append
  async (req, res) => {
    try {
      // 🛡️ SAFETY CHECK: If the file didn't arrive, stop here!
      if (!req.file) {
        return res.status(400).json({ error: "No file received. Check field name." });
      }

      const asset = await Asset.findById(req.params.id);
      if (!asset) return res.status(404).json({ error: "Asset not found" });

      asset.deathCertificateUrl = req.file.path;
      asset.status = "PENDING_ADMIN"; 
      asset.claimStartedAt = new Date(); 
      
      await asset.save();
      res.json({ message: "Proof submitted. Claim timer initiated." });
    } catch (err) {
      console.error("Upload Error:", err); // 🔍 Log the real error in your terminal
      res.status(500).json({ error: err.message });
    }
  },
);

// 8. ADMIN VERIFICATION (Admin Action)
const { isAdmin } = require("../middleware/adminAuth");
// 8. ADMIN VERIFICATION (Admin Action) [cite: 2026-03-08]
router.post("/:id/verify", auth, isAdmin, async (req, res) => {
  try {
    const { action } = req.body; 
    const asset = await Asset.findById(req.params.id);

    if (action === "APPROVE") {
      // 🛑 CHANGE THIS: Use PENDING_RELEASE to trigger the timer logic [cite: 2026-03-08]
      asset.status = "PENDING_RELEASE"; 
      asset.claimStartedAt = new Date(); // ⏱️ Reset the clock to NOW [cite: 2026-03-08]
    } else {
      asset.status = "REJECTED";
    }

    await asset.save();
    res.json({ message: `Asset ${action}ED successfully.` });
  } catch (err) {
    res.status(500).json({ error: "Admin Error: " + err.message });
  }
});

// 9. GET NOMINEE INHERITANCES (Used by NomineeDashboard)
// ==========================================
router.get("/my-inheritances", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email.toLowerCase();

    // 1. Fetch the inheritances as you were doing
    const inheritances = await Asset.find({
      $or: [{ nomineeId: userId }, { nomineeEmail: userEmail }],
    }).populate("ownerId", "name email");

    // 🕒 2. AUTO-RELEASE LOGIC: Process each asset before sending to UI
    let updated = false;
    for (let asset of inheritances) {
      if (asset.status === "APPROVED" && asset.claimStartedAt) {
        const now = new Date();
        const graceInMs = asset.gracePeriod *60*1000; // Convert days to ms
        const releaseTime =
          new Date(asset.claimStartedAt).getTime() + graceInMs;

        if (now.getTime() >= releaseTime) {
          asset.status = "RELEASED";
          await asset.save();
          updated = true;
          console.log(
            `[SYSTEM]: Asset ${asset.title} officially RELEASED [cite: 2026-03-07].`,
          );
        }
      }
    }

    // 3. If any statuses changed, we might want to re-fetch or just send the updated list
    res.json(inheritances);
  } catch (err) {
    console.error("Backend Inheritance Fetch Error:", err);
    res.status(500).json({ error: "Vault Retrieval Error: " + err.message });
  }
});

// ADMIN DASHBOARD DATA (Queue + Stats)

router.get("/admin/dashboard", auth, async (req, res) => {
  try {
    // 1. Fetch the Queue (Assets waiting for Admin to see the certificate)
    const pending = await Asset.find({ status: "PENDING_ADMIN" })
      .populate("ownerId", "name email")
      .sort({ createdAt: -1 });

    // 2. Calculate the Stats for the Sidebar Cards [cite: 2026-03-07]
    const totalAssets = await Asset.countDocuments();
    const pendingCount = await Asset.countDocuments({
      status: "PENDING_ADMIN",
    });
    const releasedCount = await Asset.countDocuments({ status: "RELEASED" });
    const activeGracePeriods = await Asset.countDocuments({
      status: "PENDING_RELEASE",
    });

    res.json({
      pending,
      stats: {
        total: totalAssets,
        pending: pendingCount,
        released: releasedCount,
        grace: activeGracePeriods,
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Authority Retrieval Error: " + err.message });
  }
});
module.exports = router;
