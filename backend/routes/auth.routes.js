const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

// ==========================
// REGISTER
// ==========================
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, walletAddress } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await User.create({
      name,
      email: cleanEmail,
      password: hashedPassword,
      walletAddress: walletAddress || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      lastActive: new Date(),
    });

    // FIX: Include email in token immediately upon registration
    const token = jwt.sign(
      { id: user._id, email: user.email }, 
      process.env.JWT_SECRET, 
      { expiresIn: "1d" }
    );

    res.status(201).json({ message: "User registered", token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// LOGIN
// ==========================
router.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;
    const cleanEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: cleanEmail });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    user.lastActive = new Date();
    await user.save();

    // FIX: You MUST include the email in the JWT payload for the Ghost system
    const token = jwt.sign(
      { id: user._id, email: user.email }, 
      process.env.JWT_SECRET, 
      { expiresIn: "1d" }
    );

    res.json({ message: "Login successful", token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// HEARTBEAT ROUTE: Resets the Deadman Switch timer
router.get("/heartbeat", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.lastActive = new Date();
    await user.save();
    res.json({ status: "ALIVE", lastActive: user.lastActive });
  } catch (err) {
    res.status(500).json({ error: "Heartbeat failed" });
  }
});

// ==========================
// ADD HEIR (FULL SECURITY MODE)
// ==========================
router.post("/add-heir", auth, async (req, res) => {
  try {
    const { email, nickname, secretQuestion, hint, secretAnswer } = req.body;
    
    // FIX: Mongoose requires these fields now!
    if (!email || !secretQuestion || !secretAnswer) {
      return res.status(400).json({ message: "Missing security parameters. Handover protocol rejected." });
    }

    const cleanEmail = email.toLowerCase().trim();
    const registeredHeir = await User.findOne({ email: cleanEmail });

    // Prevent self-nomination
    if (registeredHeir && registeredHeir._id.toString() === req.user.id) {
      return res.status(400).json({ message: "You cannot nominate yourself." });
    }

    const currentUser = await User.findById(req.user.id);
    
    // Prevent duplicates
    if (currentUser.heirs.some(h => h.email === cleanEmail)) {
      return res.status(400).json({ message: "Nominee already exists." });
    }

    // Push with full security challenge data
    currentUser.heirs.push({
      user: registeredHeir ? registeredHeir._id : null, 
      email: cleanEmail,
      nickname: nickname || "Digital Heir",
      secretQuestion,
      hint,
      secretAnswer, // Should ideally be hashed, but for dev plain text is okay
      status: registeredHeir ? "VERIFIED" : "GHOST" 
    });

    await currentUser.save();

    res.json({ message: "Security Handover Authorized." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// GET HEIRS
// ==========================
// backend/routes/auth.js

// backend/routes/auth.js
router.get("/heirs", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    let changed = false;

    for (let heir of user.heirs) {
      // If marked as ghost/unregistered, check the global User collection
      if (!heir.user || heir.status === "GHOST") {
        const registeredUser = await User.findOne({ 
          email: heir.email.toLowerCase().trim() 
        });
        
        if (registeredUser) {
          heir.user = registeredUser._id;
          heir.status = "VERIFIED";
          changed = true;
          console.log(`System: Linked ghost nominee ${heir.email} to UID ${registeredUser._id}`);
        }
      }
    }

    if (changed) await user.save(); // Permanently update YOUR registry
    res.json(user.heirs);
  } catch (err) {
    res.status(500).json({ error: "Registry sync failure." });
  }
});

// ==========================
// DELETE/REVOKE HEIR
// ==========================
router.delete("/heirs/:email", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Brutal Check: Does this person even exist in the registry?
    const initialCount = user.heirs.length;
    user.heirs = user.heirs.filter(
      (h) => h.email.toLowerCase() !== req.params.email.toLowerCase().trim()
    );

    if (user.heirs.length === initialCount) {
      return res.status(404).json({ message: "Nominee not found in registry." });
    }

    await user.save();
    res.json({ message: "Access keys purged. Nominee removed.", heirs: user.heirs });
  } catch (err) {
    res.status(500).json({ error: "Failed to purge nominee: " + err.message });
  }
});
module.exports = router;