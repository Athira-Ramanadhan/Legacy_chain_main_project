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

// ==========================================
// 3. CLAIM ASSET (Secured with Hashed Verification)
// ==========================================
// ==========================================
// 3. CLAIM ASSET (Secured with Hashed Verification & Legal Audit)
// ==========================================
router.post("/:id/claim", auth, async (req, res) => {
  try {
    const { answer } = req.body;
    const asset = await Asset.findById(req.params.id);
    
    if (!asset) return res.status(404).json({ message: "Asset not found." });

    // 1. Check Legal Status FIRST (The Brutal Fix)
    // Even if the owner is dead, we need the Admin's "Green Light" on the certificate
    if (asset.status !== "APPROVED") {
      return res.status(403).json({ 
        message: `Access Denied: Current status is ${asset.status}. You must have a verified death certificate approved by an admin to proceed.` 
      });
    }

    // 2. Check Deadman Switch Status
    const deadmanStatus = await checkDeadmanSwitch(asset.ownerId);
    
    if (deadmanStatus === "ACTIVE") {
      return res.status(403).json({ message: "Security Protocol: Owner heartbeat is still active." });
    }
    
    if (deadmanStatus === "GRACE_PERIOD") {
      return res.status(403).json({ 
        message: "Vault is in a security grace period. The owner has been notified." 
      });
    }

    // 3. Identify the Heir/Nominee settings in the Owner's Profile
    const owner = await User.findById(asset.ownerId);
    const securitySettings = owner.heirs.find(
      (h) => h.email.toLowerCase() === req.user.email.toLowerCase()
    );

    if (!securitySettings) {
      return res.status(403).json({ message: "Identity Mismatch: You are not the registered nominee for this specific legacy." });
    }

    // 4. Verify the Secret Answer (Bcrypt Comparison)
    const isMatch = await bcrypt.compare(
      answer.toLowerCase().trim(),
      securitySettings.secretAnswer
    );

    if (!isMatch) {
      return res.status(403).json({ message: "Security Challenge Failed: Incorrect Answer." });
    }

    // 5. Release the Asset & Record Transaction
    asset.status = "RELEASED";
    asset.releasedAt = new Date();
    await asset.save();

    // 6. Return decrypted data (Ensure this matches your model field name: 'encryptedData' vs 'data')
    // Since we usually store it as 'encryptedData', we return that for the frontend to decrypt
    // or we decrypt it here on the backend.
    res.json({ 
      message: "Identity Confirmed. Vault Released.", 
      data: asset.encryptedData || asset.data, 
      title: asset.title 
    });

  } catch (err) {
    res.status(500).json({ error: "Critical Vault Error: " + err.message });
  }
});
// ==========================================
// 4. INSPECT ASSET (Detailed Security Audit)
// ==========================================
router.get("/:id/inspect", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Find the asset and ensure the logged-in user is the owner
    const asset = await Asset.findOne({
      _id: req.params.id,
      ownerId: userId,
    }).populate("nomineeId", "name email");

    if (!asset) {
      return res
        .status(404)
        .json({ message: "Asset not found or unauthorized access." });
    }

    // We send the asset details + the contract address for the audit view
    res.json({
      ...asset._doc,
      contractAddress: process.env.CONTRACT_ADDRESS, // Proof from your .env file
      encryptionMethod: "AES-256-CBC", // Highlighting your security standard
    });
  } catch (err) {
    res.status(500).json({ error: "Audit Error: " + err.message });
  }
});

// ... existing routes (create, get, claim, inspect)

// ==========================================
// 5. ASSET HEARTBEAT (The "I Am Alive" Button)
// ==========================================
router.post("/:id/heartbeat", auth, async (req, res) => {
  try {
    // Find the asset to ensure the user actually owns it
    const asset = await Asset.findOne({ _id: req.params.id, ownerId: req.user.id });
    if (!asset) return res.status(404).json({ message: "Asset not found" });

    // Update the owner's global status to stop the Deadman Switch
    const user = await User.findById(req.user.id);
    user.lastActive = new Date();
    user.inheritanceStatus = "ACTIVE"; 
    await user.save();

    res.json({ message: "Timer reset. Your legacy remains sealed." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. PURGE ASSET (Permanent Wipe)
// ==========================================
router.delete("/:id", auth, async (req, res) => {
  try {
    const asset = await Asset.findOne({ _id: req.params.id, ownerId: req.user.id });

    if (!asset) {
      return res.status(404).json({ message: "Asset not found or unauthorized." });
    }

    // BRUTAL TRUTH: We delete from DB, but the Blockchain txHash remains 
    // as an immutable 'tombstone' that the asset once existed.
    await Asset.findByIdAndDelete(req.params.id);

    res.json({ message: "Asset successfully purged from the vault." });
  } catch (err) {
    res.status(500).json({ error: "Purge Error: " + err.message });
  }
});
// ==========================================
// 7. UPLOAD DEATH CERTIFICATE (Nominee Action)
// ==========================================


router.post("/:id/upload-cert", auth, upload.single("deathCertificate"), async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.status(404).json({ message: "Asset not found" });

    // Ensure only the assigned nominee can upload
    if (asset.nomineeEmail.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(403).json({ message: "Unauthorized: You are not the nominee." });
    }

    asset.deathCertificatePath = req.file.path;
    asset.status = "PENDING_ADMIN"; // Move to Admin Queue
    await asset.save();

    res.json({ message: "Certificate uploaded. Waiting for Admin Approval." });
  } catch (err) {
    res.status(500).json({ error: "Upload Error: " + err.message });
  }
});

// ==========================================
// 8. ADMIN VERIFICATION (Admin Action)
// ==========================================
// Assuming you have an isAdmin middleware
const { isAdmin } = require("../middleware/adminAuth"); 

router.post("/:id/verify", auth, isAdmin, async (req, res) => {
  try {
    const { action } = req.body; // 'APPROVE' or 'REJECT'
    const asset = await Asset.findById(req.params.id);

    if (action === "APPROVE") {
      asset.status = "APPROVED"; // This unlocks the 'Claim' button for Nominee
    } else {
      asset.status = "REJECTED";
    }

    await asset.save();
    res.json({ message: `Asset ${action}ED successfully.` });
  } catch (err) {
    res.status(500).json({ error: "Admin Error: " + err.message });
  }
});

module.exports = router;
