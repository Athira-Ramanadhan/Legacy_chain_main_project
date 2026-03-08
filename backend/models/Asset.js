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
    enum: ["LOCKED", "RELEASED","PENDING_RELEASE","PENDING_ADMIN"], 
    default: "LOCKED" 
  },
  blockchainId: { 
    type: String, 
    unique: true, 
    sparse: true 
  },
  txHash: { 
    type: String // Added to store the Blockchain receipt hash
  },
  gracePeriod: { 
    type: Number, 
    default: 7, // Default to 7 days for the owner to veto
  },
  claimStartedAt: { 
    type: Date, 
    default: null // Sets the "Start Clock" for the grace period
  },
  deathCertificateUrl: {
    type: String, // Stores the proof uploaded by the nominee
    default: null
  }

}, { timestamps: true });

// DEFENSIVE EXPORT: Checks if model exists before creating it
module.exports = mongoose.models.Asset || mongoose.model("Asset", assetSchema);