const express = require("express");
const router = express.Router();
const Asset = require("../models/asset");
const { encrypt, decrypt } = require("../utils/encrypt");
const auth = require("../middleware/auth");

// CREATE ASSET (protected)
router.post("/create", auth, async (req, res) => {
  try {
    const { title, type, nomineeId, data } = req.body;
    const ownerId = req.user.id;

    if (!title || !type || !nomineeId || !data) {
      return res.status(400).json({ message: "Missing fields" });
    }

    if (ownerId === nomineeId) {
      return res
        .status(400)
        .json({ message: "Owner and nominee cannot be same" });
    }

    const encryptedData = encrypt(data);

    const asset = await Asset.create({
      title,
      type,
      ownerId,
      nomineeId,
      encryptedData,
      status: "LOCKED",
    });

    res.status(201).json({
      message: "Asset created successfully",
      assetId: asset._id,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// READ ASSET (protected)
router.get("/:id", auth, async (req, res) => {
  try {
    const assetId = req.params.id;
    const userId = req.user.id;

    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

    // OWNER access → always allowed
    if (asset.ownerId === userId) {
      const decryptedData = decrypt(asset.encryptedData);

      return res.json({
        role: "OWNER",
        title: asset.title,
        type: asset.type,
        data: decryptedData,
        status: asset.status,
      });
    }

    // NOMINEE access → only if RELEASED
    if (asset.nomineeId === userId) {
      if (asset.status !== "RELEASED") {
        return res.status(403).json({ message: "Asset is still locked" });
      }

      const decryptedData = decrypt(asset.encryptedData);

      return res.json({
        role: "NOMINEE",
        title: asset.title,
        type: asset.type,
        data: decryptedData,
        releasedAt: asset.releasedAt,
      });
    }

    // anyone else
    return res.status(403).json({ message: "Access denied" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// RELEASE ASSET (OWNER only)
router.post("/:id/release", auth, async (req, res) => {
  try {
    const assetId = req.params.id;
    const userId = req.user.id;

    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

    // only owner can release
    if (asset.ownerId !== userId) {
      return res.status(403).json({ message: "Only owner can release asset" });
    }

    if (asset.status === "RELEASED") {
      return res.status(400).json({ message: "Asset already released" });
    }

    asset.status = "RELEASED";
    asset.releasedAt = new Date();
    await asset.save();

    res.json({
      message: "Asset released successfully",
      assetId: asset._id,
      releasedAt: asset.releasedAt,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
