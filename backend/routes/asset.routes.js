const express = require("express");
const router = express.Router();

const Asset = require("../models/asset");
const { encrypt, decrypt } = require("../utils/encrypt");
const auth = require("../middleware/auth");

// import blockchain contract
const contract = require("../config/blockchain");


// ==========================
// CREATE ASSET (protected)
// ==========================
router.post("/create", auth, async (req, res) => {
  try {

    const { title, type, nomineeId, data } = req.body;
    const ownerId = req.user.id;

    if (!title || !type || !nomineeId || !data) {
      return res.status(400).json({ message: "Missing fields" });
    }

    if (ownerId === nomineeId) {
      return res.status(400).json({
        message: "Owner and nominee cannot be same",
      });
    }

    // encrypt data
    const encryptedData = encrypt(data);

    // generate numeric blockchainId
    const blockchainId = Date.now();

    // STORE ON BLOCKCHAIN FIRST
    const tx = await contract.createAsset(blockchainId);

    const receipt = await tx.wait();

    // save in MongoDB
    const asset = await Asset.create({
      title,
      type,
      ownerId,
      nomineeId,
      encryptedData,
      status: "LOCKED",
      blockchainId,
      txHash: receipt.hash
    });

    res.status(201).json({
      message: "Asset created and stored on blockchain",
      assetId: asset._id,
      blockchainId: blockchainId,
      txHash: receipt.hash
    });

  } catch (err) {

    console.error("Create asset error:", err);

    res.status(500).json({
      error: err.message
    });

  }
});


// ==========================
// GET ALL ASSETS 
// ==========================

// ==========================
// GET ALL ASSETS (OWNER + NOMINEE)
// ==========================
router.get("/", auth, async (req, res) => {

  try {

    const userId = req.user.id;

    const assets = await Asset.find({
      $or: [
        { ownerId: userId },
        { nomineeId: userId }
      ]
    }).sort({ createdAt: -1 });

    res.json(assets);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: err.message
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
        message: "Asset not found"
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
        txHash: asset.txHash || null,
        blockchainId: asset.blockchainId
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
        txHash: asset.txHash || null,
        blockchainId: asset.blockchainId
      });
    }

    return res.status(403).json({
      message: "Access denied"
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: err.message
    });

  }
});


// ==========================
// RELEASE ASSET (BLOCKCHAIN)
// ==========================
router.post("/:id/release", auth, async (req, res) => {

  try {

    const assetId = req.params.id;
    const userId = req.user.id;

    const asset = await Asset.findById(assetId);

    if (!asset) {
      return res.status(404).json({
        message: "Asset not found",
      });
    }

    // verify owner
    if (asset.ownerId !== userId) {
      return res.status(403).json({
        message: "Only owner can release asset",
      });
    }

    // already released
    if (asset.status === "RELEASED") {
      return res.status(400).json({
        message: "Asset already released",
      });
    }

    // CRITICAL FIX: use blockchainId instead of MongoDB _id
    const tx = await contract.verifyDeathAndRelease(asset.blockchainId);

    // wait confirmation
    const receipt = await tx.wait();

    // update database
    asset.status = "RELEASED";
    asset.releasedAt = new Date();
    asset.txHash = receipt.hash;

    await asset.save();

    res.json({
      message: "Asset released on blockchain",
      assetId: asset._id,
      blockchainId: asset.blockchainId,
      txHash: receipt.hash,
      releasedAt: asset.releasedAt,
    });

  } catch (err) {

    console.error("Release error:", err);

    res.status(500).json({
      error: err.message,
    });

  }

});

module.exports = router;
