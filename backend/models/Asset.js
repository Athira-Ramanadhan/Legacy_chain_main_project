const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, required: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  
  nomineeName: { type: String, required: true },
  nomineeEmail: { type: String, required: true },
  nomineeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },

  // 1. UPDATED: Made required false to allow for File-only assets [cite: 2026-03-08]
  encryptedData: { type: String, required: false },

  // 2. NEW: Storage for PDF/Photo uploads [cite: 2026-03-08]
  fileUrl: { type: String, default: null }, 
  isBinary: { type: Boolean, default: false }, // Flag to tell frontend how to render [cite: 2026-03-08]

  status: { 
    type: String, 
    enum: ["LOCKED", "RELEASED", "PENDING_RELEASE", "PENDING_ADMIN"], 
    default: "LOCKED" 
  },
  blockchainId: { type: String, unique: true, sparse: true },
  txHash: { type: String },
  
  gracePeriod: { type: Number, default: 7 },
  claimStartedAt: { type: Date, default: null },
  deathCertificateUrl: { type: String, default: null }

}, { timestamps: true });

module.exports = mongoose.models.Asset || mongoose.model("Asset", assetSchema);