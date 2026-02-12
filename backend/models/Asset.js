const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema(
  {
    // Display name of the asset
    title: {
      type: String,
      required: true,
    },

    // Type of digital asset
   type: {
  type: String,
  enum: [
    "DOCUMENT",
    "PASSWORD",
    "FINANCIAL",
    "PROPERTY",
    "MESSAGE"
  ],
  required: true
},

    // Owner
    ownerId: {
      type: String,
      required: true,
    },

    // Nominee
    nomineeId: {
      type: String,
      required: true,
    },

    // Encrypted asset content
    encryptedData: {
      type: String,
      required: true,
    },

    // Blockchain numeric ID (CRITICAL FIX)
    blockchainId: {
      type: Number,
      required: true,
      unique: true,
    },

    // Asset state
    status: {
      type: String,
      enum: ["LOCKED", "RELEASED"],
      default: "LOCKED",
    },

    // Transaction hash from blockchain
    txHash: {
      type: String,
      default: null,
    },

    // Release time
    releasedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Asset", assetSchema);
