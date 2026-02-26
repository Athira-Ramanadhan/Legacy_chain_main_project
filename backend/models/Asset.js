const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, required: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  nomineeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  nomineeEmail: { type: String, required: true },
  encryptedData: { type: String, required: true },
  status: { type: String, default: "LOCKED" },
  blockchainId: { 
    type: String, 
    unique: true, 
    sparse: true 
  }
}, { timestamps: true });

// DEFENSIVE EXPORT: Checks if model exists before creating it
module.exports = mongoose.models.Asset || mongoose.model("Asset", assetSchema);