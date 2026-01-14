const express = require("express");
const router = express.Router();
const Asset = require("../models/asset");
const { encrypt } = require("../utils/encrypt");
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

module.exports = router;
