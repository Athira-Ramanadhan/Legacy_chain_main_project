const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema(
  {
    // Display name of the asset
    title: {
      type: String,
      required: true,
    },

    // Type of digital asset
    // NOTE = email, social media, wallet info
    // DOCUMENT = pdf, files
    // IMAGE = photos, id proof
    type: {
      type: String,
      enum: ["NOTE", "DOCUMENT", "IMAGE"],
      required: true,
    },

    // Owner (person who created the asset)
    ownerId: {
      type: String,
      required: true,
    },

    // Nominee (person who will receive the asset)
    nomineeId: {
      type: String,
      required: true,
    },

    // Encrypted asset content (text / base64)
    encryptedData: {
      type: String,
      required: true,
    },

    // Asset state
    // LOCKED  -> nominee cannot access
    // RELEASED -> nominee can access
    status: {
      type: String,
      enum: ["LOCKED", "RELEASED"],
      default: "LOCKED",
    },

    // When the asset was released
    releasedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // adds createdAt & updatedAt
  }
);

module.exports = mongoose.model("Asset", assetSchema);
