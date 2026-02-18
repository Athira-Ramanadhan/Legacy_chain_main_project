const express = require("express");
const router = express.Router();

const Asset = require("../models/asset");
const { encrypt, decrypt } = require("../utils/encrypt");
const auth = require("../middleware/auth");

// blockchain contract
const contract = require("../config/blockchain");

// DEADMAN SWITCH IMPORT
const checkDeadmanSwitch = require("../utils/deadmanSwitch");

// ==========================
// CREATE ASSET (protected)
// ==========================
router.post("/create", auth, async (req, res) => {
  try {
    const { title, type, nomineeId, data } = req.body;
    const ownerId = req.user.id;

    if (!title || !type || !nomineeId || !data) {
      return res.status(400).json({
        message: "Missing fields",
      });
    }

    if (ownerId === nomineeId) {
      return res.status(400).json({
        message: "Owner and nominee cannot be same",
      });
    }

    // encrypt asset data

    const encryptedData = encrypt(data);
    const blockchainId = Date.now();


    // USE VALID HARDHAT ADDRESS (STRING)
    const beneficiaryAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

    // call smart contract correctly
    const tx = await contract.addAsset(encryptedData, beneficiaryAddress);

    const receipt = await tx.wait();

    // store in MongoDB
    const asset = await Asset.create({
      title,
      type,
      ownerId,
      nomineeId,
      encryptedData,
      status: "LOCKED",
      blockchainId,
      txHash: receipt.hash,
    });

    res.status(201).json({
      message: "Asset created and stored on blockchain",
      assetId: asset._id,
      blockchainId: blockchainId,
      txHash: receipt.hash,
    });
  } catch (err) {
    console.error("Create asset error:", err);

    res.status(500).json({
      error: err.message,
    });
  }
});

// ==========================
// GET ALL ASSETS
// ==========================
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const assets = await Asset.find({
      $or: [{ ownerId: userId }, { nomineeId: userId }],
    }).sort({ createdAt: -1 });

    res.json(assets);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: err.message,
    });
  }
});

// ==========================
// READ ASSET (protected)
// ==========================
router.get("/:id", auth, async (req, res) => {
  try {
    const assetId = req.params.id;
    const userId = req.user.id;

    const asset = await Asset.findById(assetId);

    if (!asset) {
      return res.status(404).json({
        message: "Asset not found",
      });
    }

    // OWNER access
    if (asset.ownerId === userId) {
      const decryptedData = decrypt(asset.encryptedData);

      return res.json({
        role: "OWNER",
        title: asset.title,
        type: asset.type,
        data: decryptedData,
        status: asset.status,
        txHash: asset.txHash,
        blockchainId: asset.blockchainId,
      });
    }

    // NOMINEE access
    if (asset.nomineeId === userId) {
      if (asset.status !== "RELEASED") {
        return res.status(403).json({
          message: "Asset is still locked",
        });
      }

      const decryptedData = decrypt(asset.encryptedData);

      return res.json({
        role: "NOMINEE",
        title: asset.title,
        type: asset.type,
        data: decryptedData,
        releasedAt: asset.releasedAt,
        txHash: asset.txHash,
        blockchainId: asset.blockchainId,
      });
    }

    return res.status(403).json({
      message: "Access denied",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: err.message,
    });
  }
});

// ==========================
// CHECK DEADMAN SWITCH STATUS
// ==========================
router.get("/:id/status", auth, async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        message: "Asset not found",
      });
    }

    const status = await checkDeadmanSwitch(asset.ownerId);

    res.json({
      deadmanStatus: status,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

// ==========================
// CLAIM ASSET (NOMINEE)
// DEADMAN SWITCH CONTROLLED
// ==========================
router.post("/:id/claim", auth, async (req, res) => {
  try {
    const assetId = req.params.id;
    const userId = req.user.id;

    const asset = await Asset.findById(assetId);

    if (!asset) {
      return res.status(404).json({
        message: "Asset not found",
      });
    }

    // only nominee can claim
    if (asset.nomineeId !== userId) {
      return res.status(403).json({
        message: "Only nominee can claim this asset",
      });
    }

    // already released
    if (asset.status === "RELEASED") {
      return res.status(400).json({
        message: "Asset already released",
      });
    }

    // check Deadman Switch
    const deadmanStatus = await checkDeadmanSwitch(asset.ownerId);

    if (deadmanStatus === "ACTIVE") {
      return res.status(403).json({
        message: "Owner still active. Claim denied.",
      });
    }

    if (deadmanStatus === "GRACE_PERIOD") {
      return res.status(403).json({
        message: "Grace period active. Claim not allowed yet.",
      });
    }

    // claim allowed → release on blockchain
    const tx = await contract.verifyDeathAndRelease(asset.blockchainId);

    const receipt = await tx.wait();

    // update database
    asset.status = "RELEASED";
    asset.releasedAt = new Date();
    asset.txHash = receipt.hash;

    await asset.save();

    res.json({
      message: "Asset claimed successfully",
      assetId: asset._id,
      blockchainId: asset.blockchainId,
      txHash: receipt.hash,
      releasedAt: asset.releasedAt,
    });
  } catch (err) {
    console.error("Claim error:", err);

    res.status(500).json({
      error: err.message,
    });
  }
});

module.exports = router;
