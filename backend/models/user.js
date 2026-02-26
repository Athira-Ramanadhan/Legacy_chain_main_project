const mongoose = require("mongoose");

/**
 * HEIR SUB-SCHEMA
 * Purpose: Defines the technical structure for a digital asset recipient.
 * Order: Must be defined BEFORE userSchema.
 */
const heirSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false, // Allows Ghost/Silent Nominees who haven't signed up yet
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  nickname: {
    type: String,
    required: true,
    trim: true,
  },
  secretQuestion: {
    type: String,
    required: true, 
  },
  hint: {
    type: String,
    required: false, // Optional fail-safe
  },
  secretAnswer: {
    type: String,
    required: true, 
  },
  status: {
    type: String,
    enum: ["VERIFIED", "GHOST"],
    default: "GHOST",
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

/**
 * MAIN USER SCHEMA
 * Purpose: The core profile for the digital asset owner.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    walletAddress: {
      type: String,
      required: true,
    },
    
    // --- DEADMAN SWITCH PROTOCOL ---
    lastActive: {
      type: Date,
      default: Date.now,
    },
    inactivityThreshold: {
      type: Number,
      default: 180, // Days until warning
    },
    gracePeriod: {
      type: Number,
      default: 30, // Days after warning before asset release
    },
    inheritanceStatus: {
      type: String,
      enum: ["ACTIVE", "WARNING_SENT", "AUTO_TRIGGERED", "COMPLETED"],
      default: "ACTIVE",
    },
    warningSentAt: {
      type: Date,
    },

    // --- RECIPIENT REGISTRY ---
    heirs: [heirSchema], // References the sub-schema above
  },
  { timestamps: true }
);

// Virtuals for JSON responses
userSchema.set("toObject", { virtuals: true });
userSchema.set("toJSON", { virtuals: true });

// Prevent Model Overwrite Errors
// models/User.js
module.exports = mongoose.models.User || mongoose.model("User", userSchema);