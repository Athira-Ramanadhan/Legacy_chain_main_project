const express = require("express");
const router = express.Router();
const Asset = require("../models/Asset");
const User = require("../models/User");
const auth = require("../middleware/auth");
const { encrypt, decrypt } = require("../utils/encrypt");
const contract = require("../config/blockchain");
const checkDeadmanSwitch = require("../utils/deadmanSwitch");
// 1. CREATE ASSET (Supports Ghost Nominees)
// ==========================================
router.post("/create", auth, async (req, res) => {
  try {
    const { title, type, nomineeId, data } = req.body;
    const ownerId = req.user.id;
    console.log("REQ USER:", req.user);

    if (!title || !type || !nomineeId || !data) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Find owner and the specific heir entry from their sub-document array
    const owner = await User.findById(ownerId);
    const heirEntry = owner.heirs.id(nomineeId); 

    if (!heirEntry) {
      return res.status(404).json({ message: "Nominee not found in your registry." });
    }

    // Check if this email is already registered as a User
    const registeredUser = await User.findOne({ email: heirEntry.email.toLowerCase() });

    const encryptedData = encrypt(data);
    let txHash = "PENDING_REGISTRATION";

    // Only interact with Blockchain if nominee is registered and has a wallet
    if (registeredUser && registeredUser.walletAddress) {
      try {
        const tx = await contract.addAsset(encryptedData, registeredUser.walletAddress);
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
      nomineeEmail: heirEntry.email.toLowerCase(), // Critical for late-binding
      nomineeId: registeredUser ? registeredUser._id : null, 
      encryptedData,
      blockchainId: Math.floor(Date.now() / 1000),
      txHash,
      status: "LOCKED"
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

    // 1. Assets you own
    const myAssets = await Asset.find({ ownerId: userId })
      .populate("nomineeId", "name email")
      .sort({ createdAt: -1 });

    // 2. Assets you are inheriting (Checks BOTH ID and Email for new users)
    const inheritances = await Asset.find({
      $or: [{ nomineeId: userId }, { nomineeEmail: userEmail }]
    })
      .populate("ownerId", "name email")
      .sort({ createdAt: -1 });

    res.json({ myAssets, inheritances });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. CLAIM ASSET (With Secret Question Verification)
// ==========================================
router.post("/:id/claim", auth, async (req, res) => {
  try {
    const { answer } = req.body; 
    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.status(404).json({ message: "Asset not found." });

    const owner = await User.findById(asset.ownerId);
    
    // Find the security settings the owner set for THIS specific nominee
    const securitySettings = owner.heirs.find(h => h.email.toLowerCase() === req.user.email.toLowerCase());

    if (!securitySettings) {
      return res.status(403).json({ message: "You are not authorized for this asset." });
    }

    // VERIFICATION STEP
    if (securitySettings.secretAnswer.toLowerCase() !== answer?.toLowerCase()) {
      return res.status(403).json({ message: "Security Challenge Failed: Incorrect Answer." });
    }

    // DEADMAN SWITCH STEP
    const deadmanStatus = await checkDeadmanSwitch(asset.ownerId);
    if (deadmanStatus === "ACTIVE") {
      return res.status(403).json({ message: "Access Denied: Owner is still active." });
    }

    asset.status = "RELEASED";
    asset.releasedAt = new Date();
    await asset.save();

    res.json({ message: "Asset released! You can now view the data.", asset });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;