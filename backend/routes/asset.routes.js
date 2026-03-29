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
const { getClaimAlertEmailHtml } = require("../utils/emailTemplates"); //
const sendMail = require("../utils/mailer");
const { isAdmin } = require("../middleware/adminAuth");

// ==========================================
// 1. CREATE ASSET (Supports Ghost Nominees)
// ==========================================
// Add upload.single("vaultFile") to intercept the PDF/Photo if it exists [cite: 2026-03-08]
router.post("/create", auth, upload.single("vaultFile"), async (req, res) => {
  try {
    const { title, type, nomineeId, data } = req.body;
    const ownerId = req.user.id;

    // 1. Validation Logic
    // If it's not a file, 'data' (text) is required [cite: 2026-03-08]
    if (!title || !type || !nomineeId || (!data && !req.file)) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const owner = await User.findById(ownerId);
    const heirEntry = owner.heirs.id(nomineeId);
    if (!heirEntry) {
      return res.status(404).json({ message: "Nominee not found." });
    }

    const registeredUser = await User.findOne({
      email: heirEntry.email.toLowerCase(),
    });

    // 2. Data Processing (Binary vs Text) [cite: 2026-03-08]
    let encryptedData = "";
    let fileUrl = "";
    let isBinary = false;
    let txHash = "N/A";

    if (req.file) {
      // It's a PDF/Image - Save the path [cite: 2026-03-08]
      fileUrl = req.file.path;
      isBinary = true;
      txHash = "FILE_STORED_LOCALLY"; // Files are usually too big for basic smart contracts [cite: 2026-03-08]
    } else {
      // It's Text - Encrypt and send to Blockchain [cite: 2026-03-08]
      encryptedData = encrypt(data);
      isBinary = false;

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
    }

    // 3. Save to Database [cite: 2026-03-08]
    const asset = await Asset.create({
      title,
      type,
      ownerId,
      nomineeEmail: heirEntry.email.toLowerCase(),
      nomineeName: heirEntry.fullName || heirEntry.nickname,
      nomineeId: registeredUser ? registeredUser._id : null,
      encryptedData,
      fileUrl, // NEW FIELD [cite: 2026-03-08]
      isBinary, // NEW FIELD [cite: 2026-03-08]
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

// 3. CLAIM ASSET (Nominee Final Unlock)
router.post("/:id/claim", auth, async (req, res) => {
  try {
    const { answer } = req.body;
    const asset = await Asset.findById(req.params.id);

    if (!asset) return res.status(404).json({ message: "Asset not found." });

    // ✅ FIX 1: Allow nominees to claim if status is PENDING_RELEASE (waiting)
    // OR RELEASED (Admin already finalized) [cite: 2026-03-08]
    const allowedStatuses = ["PENDING_RELEASE", "RELEASED"];
    if (!allowedStatuses.includes(asset.status)) {
      return res.status(403).json({
        message: `Access Denied: Current status is ${asset.status}. Legal Authority must verify proof first.`,
      });
    }

    // ✅ FIX 2: Grace Period Check [cite: 2026-03-08]
    if (!asset.claimStartedAt) {
      return res
        .status(400)
        .json({ message: "Security protocol has not been initiated." });
    }

    const now = new Date();
    // 🕒 SYNCED FOR DEMO: Using seconds multiplier (1000ms) [cite: 2026-03-08]
    const graceInMs = (asset.gracePeriod || 1) * 1000;
    const releaseTime = new Date(asset.claimStartedAt.getTime() + graceInMs);

    if (now < releaseTime) {
      const secondsLeft = Math.ceil((releaseTime - now) / 1000);
      return res.status(403).json({
        message: `Security Lock: Grace period active. Vault opens in ${secondsLeft} seconds.`,
      });
    }

    // 3. Identity Check
    const owner = await User.findById(asset.ownerId);
    const securitySettings = owner.heirs.find(
      (h) => h.email.toLowerCase() === req.user.email.toLowerCase(),
    );

    if (!securitySettings) {
      return res.status(403).json({
        message:
          "Identity Mismatch: You are not the registered nominee for this asset.",
      });
    }

    // 4. Secret Answer Check [cite: 2026-03-08]
    const isMatch = await bcrypt.compare(
      answer.toLowerCase().trim(),
      securitySettings.secretAnswer,
    );

    if (!isMatch) {
      return res.status(403).json({
        message: "Security Challenge Failed: Incorrect secret answer.",
      });
    }

    // 5. Success: Release
    asset.status = "RELEASED";
    asset.releasedAt = new Date();
    await asset.save();

    let decryptedResult = "";

    if (asset.isBinary) {
      const formattedPath = asset.fileUrl.replace(/\\/g, "/");
      decryptedResult = `http://localhost:5000/${formattedPath}`;
    } else {
      if (!asset.encryptedData) {
        return res.status(404).json({ message: "No data found." });
      }
      decryptedResult = decrypt(asset.encryptedData);
    }

    res.json({
      message: "Vault Released successfully.",
      data: decryptedResult,
      isBinary: asset.isBinary,
      title: asset.title,
    });
  } catch (err) {
    res.status(500).json({ error: "Vault Error: " + err.message });
  }
});

// 4. INSPECT ASSET (Enhanced with Binary Flag for UI Buttons)
router.get("/:id/inspect", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email.toLowerCase();

    // 1. Find Asset (Ensuring user is either Owner or Nominee)
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

    // 2. Fetch the security question from the owner's heir registry
    const owner = await User.findById(asset.ownerId);
    const heirSettings = owner.heirs.find(
      (h) =>
        h.email.toLowerCase() === userEmail ||
        h.user?.toString() === userId.toString(),
    );

    // 3. SEND CHALLENGE DATA + BINARY FLAGS [cite: 2026-03-08]
    res.json({
      title: asset.title,
      status: asset.status,
      // 🚀 CRITICAL UI FIELDS:
      isBinary: asset.isBinary || false,
      fileUrl: asset.fileUrl || "",

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
    const user = await User.findById(req.user.id);
    user.lastActive = new Date();
    await user.save();

    // THE VETO: Reset status across ALL claim stages [cite: 2026-03-08]
    await Asset.updateMany(
      {
        ownerId: req.user.id,
        // 🚨 FIX: Added "RELEASED" to the list below [cite: 2026-03-08]
        status: {
          $in: ["PENDING_RELEASE", "PENDING_ADMIN", "APPROVED", "RELEASED"],
        },
      },
      {
        status: "LOCKED",
        claimStartedAt: null, // ⏱️ Resets the grace period timer
        deathCertificateUrl: null, // 🗑️ Deletes the path to the PDF proof
        releasedAt: null, // 🧹 Clears any payout timestamp
        // 🚀 ADD THIS LINE:
        isClaimActive: false,
      },
    );

    res.json({ message: "Global Heartbeat Detected. All claims revoked." });
  } catch (err) {
    res.status(500).json({ error: "Veto Failed: " + err.message });
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
// ==========================================
// 7. UPLOAD DEATH CERTIFICATE (Nominee Action)
//==============================================
router.post(
  "/:id/upload-cert",
  auth,
  upload.single("deathCertificate"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file received." });
      }

      // 🚀 FIX: We MUST populate ownerId to get the email address [cite: 2026-03-10]
      const asset = await Asset.findById(req.params.id).populate("ownerId");
      if (!asset) return res.status(404).json({ error: "Asset not found" });

      asset.deathCertificateUrl = req.file.path;
      asset.status = "PENDING_ADMIN";
      asset.claimStartedAt = new Date();

      await asset.save();

      // 🚀 TRIGGER VETO ALERT TO OWNER IMMEDIATELY 
      try {
        const { getClaimAlertEmailHtml } = require("../utils/emailTemplates");
        const emailHtml = getClaimAlertEmailHtml(asset.ownerId, asset.title);
        
        await sendMail(
          asset.ownerId.email,
          "⚠️ URGENT SECURITY ALERT: Asset Claim Initiated",
          emailHtml
        );
        console.log(`[MAILER]: Veto Alert dispatched to ${asset.ownerId.email}`);
      } catch (mailErr) {
        console.error("[MAILER ERROR]:", mailErr.message);
      }

      res.json({ message: "Proof submitted. Owner has been notified for Veto." });
    } catch (err) {
      console.error("Upload Error:", err);
      res.status(500).json({ error: err.message });
    }
  }
);
// 8. ADMIN SECURITY PROTOCOLS (2-Step Release)//
/* BUTTON 1: INITIATE VETO ALERT (Admin Action)*/
router.post("/:id/trigger-veto", auth, isAdmin, async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id).populate("ownerId");
    if (!asset) return res.status(404).json({ error: "Asset not found" });

    // 🛡️ SECURITY GUARD: If owner just logged in, status is LOCKED. Stop Admin!
    // Inside your Admin Approve Route
    if (asset.status === "LOCKED") {
      return res
        .status(403)
        .json({
          message: "Veto detected: Asset is no longer in a claimable state.",
        });
    }

    asset.status = "PENDING_RELEASE";
    asset.claimStartedAt = new Date();
    await asset.save();

    // ... rest of your email code ...
    res.json({ message: "Veto alert sent. Grace period initiated." });
  } catch (err) {
    res.status(500).json({ error: "Veto Trigger Error: " + err.message });
  }
});

/*
 * BUTTON 2: FINALIZE VERIFICATION [cite: 2026-03-08]
 */
router.post("/:id/verify-final", auth, isAdmin, async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.status(404).json({ error: "Asset not found" });

    // 🛡️ TIME CHECK: Ensure grace period has actually passed
    const now = new Date();
    // Change this line in POST /:id/verify-final for your demo [cite: 2026-03-08]
    const graceInMs = (asset.gracePeriod || 1) * 1000; // Switch to minutes for demo [cite: 2026-03-08] // Convert days to ms
    const releaseTime = new Date(asset.claimStartedAt.getTime() + graceInMs);

    if (now < releaseTime) {
      return res.status(403).json({
        message: "Grace period active. Protocol prevents early release.",
      });
    }

    // Success: Finalize [cite: 2026-03-08]
    asset.status = "RELEASED";
    await asset.save();

    res.json({ message: "Asset successfully released to the nominee." });
  } catch (err) {
    res.status(500).json({ error: "Finalization Error: " + err.message });
  }
});
// 9. GET NOMINEE INHERITANCES (Used by NomineeDashboard)
// ==========================================
router.get("/my-inheritances", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email.toLowerCase();

    // 🛠️ STEP 1: PERMANENT LINKING [cite: 2026-03-08]
    // If an asset has this user's email but no nomineeId, link it now.
    await Asset.updateMany(
      { nomineeEmail: userEmail, nomineeId: null },
      { nomineeId: userId },
    );

    // 🛠️ STEP 2: FETCH UPDATED RECORDS [cite: 2026-03-08]
    const inheritances = await Asset.find({
      $or: [{ nomineeId: userId }, { nomineeEmail: userEmail }],
    }).populate("ownerId", "name email");

    // 🕒 STEP 3: AUTO-RELEASE LOGIC

    for (let asset of inheritances) {
      if (asset.status === "PENDING_RELEASE" && asset.claimStartedAt) {
        const now = new Date();

        // Ensure we are using the correct time unit (Minutes for Demo) [cite: 2026-03-08]
        const graceInMs = (asset.gracePeriod || 1) * 60 * 1000;
        const releaseTime =
          new Date(asset.claimStartedAt).getTime() + graceInMs;

        if (now.getTime() >= releaseTime) {
          asset.status = "RELEASED";
          await asset.save();
          console.log(
            `[VAULT]: ${asset.title} released after grace period. [cite: 2026-03-08]`,
          );
        }
      }
    }
    res.json(inheritances);
  } catch (err) {
    console.error("Vault Retrieval Error:", err);
    res.status(500).json({ error: "Sync failed: " + err.message });
  }
});
// ADMIN DASHBOARD DATA (Queue + Stats)

router.get("/admin/dashboard", auth, async (req, res) => {
  try {
    // 🛠️ FIX: Fetch both New Claims AND assets in the Grace Period
    const pending = await Asset.find({
      status: { $in: ["PENDING_ADMIN", "PENDING_RELEASE"] },
    })
      .populate("ownerId", "name email")
      .sort({ updatedAt: -1 });

    // Ensure your stats also count the grace period assets correctly
    const stats = {
      total: await Asset.countDocuments(),
      pending: await Asset.countDocuments({ status: "PENDING_ADMIN" }),
      released: await Asset.countDocuments({ status: "RELEASED" }),
      grace: await Asset.countDocuments({ status: "PENDING_RELEASE" }),
    };

    res.json({ pending, stats });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Authority Retrieval Error: " + err.message });
  }
});

module.exports = router;
