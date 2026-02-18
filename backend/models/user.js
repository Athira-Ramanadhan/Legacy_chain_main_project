const mongoose = require("mongoose");

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

    // NEW FIELD: Last time user was active
    lastActive: {
      type: Date,
      default: Date.now,
    },

    // NEW FIELD: Inactivity threshold in days
    // Example: 180 days = 6 months
    inactivityThreshold: {
      type: Number,
      default: 180,
    },

    // NEW FIELD: Grace period in days
    // Example: 30 days grace period
    gracePeriod: {
      type: Number,
      default: 30,
    },
    walletAddress: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
