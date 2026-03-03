const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    required: true 
  },
  ownerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  // --- ADDED THIS FOR THE SIMPLE WILL ---
  nomineeName: { 
    type: String, 
    required: true // Ensures every asset has a human name attached
  },
  nomineeEmail: { 
    type: String, 
    required: true 
  },
  nomineeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: false // Stays null for Ghost nominees
  },
  encryptedData: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ["LOCKED", "RELEASED"], 
    default: "LOCKED" 
  },
  blockchainId: { 
    type: String, 
    unique: true, 
    sparse: true 
  },
  txHash: { 
    type: String // Added to store the Blockchain receipt hash
  }
}, { timestamps: true });

// DEFENSIVE EXPORT: Checks if model exists before creating it
module.exports = mongoose.models.Asset || mongoose.model("Asset", assetSchema);