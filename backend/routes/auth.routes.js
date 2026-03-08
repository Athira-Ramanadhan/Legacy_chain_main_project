const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();
// REGISTER

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

    try {
      const Asset = require("../models/Asset"); // Ensure this is imported
      await Asset.updateMany(
        { nomineeEmail: cleanEmail, nomineeId: null },
        { nomineeId: user._id }
      );
    } catch (syncErr) {
      console.error("Ghost Sync Error:", syncErr);
    }
    

    // FIX: Include email in token immediately upon registration
    const token = jwt.sign(
      { id: user._id, email: user.email,role:user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: "1d" }
    );

    res.status(201).json({ message: "User registered", token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
     });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGIN

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
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: "1h" }
    );

    res.json({
      token, // ✅ CRITICAL: Sending the actual token string
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      }
    });
    // Include the email and role in the JWT payload
   
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});// HEARTBEAT ROUTE: Resets the Deadman Switch timer

router.get("/heartbeat", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Reset everything to safety
    user.lastActive = new Date();
    user.inheritanceStatus = "ACTIVE"; // Clear the "WARNING_SENT" state
    user.warningSentAt = null;         // Stop the grace period countdown
    
    await user.save();
    
    res.json({ 
      status: "ALIVE", 
      inheritanceStatus: user.inheritanceStatus,
      lastActive: user.lastActive 
    });
  } catch (err) {
    res.status(500).json({ error: "Heartbeat failed to reset the switch." });
  }
});

// ADD HEIR 
router.post("/add-heir", auth, async (req, res) => {
  try {
    // 1. Capture 'fullName' from the request body
    const { fullName, email, nickname, secretQuestion, hint, secretAnswer } = req.body;
    
    // 2. Make fullName a requirement for a "Simple Understandable Will"
    if (!fullName || !email || !secretQuestion || !secretAnswer) {
      return res.status(400).json({ message: "Missing required identity or security parameters." });
    }

    const cleanEmail = email.toLowerCase().trim();
    const registeredHeir = await User.findOne({ email: cleanEmail });

    // HASH THE ANSWER
    const salt = await bcrypt.genSalt(10);
    const hashedAnswer = await bcrypt.hash(secretAnswer.toLowerCase().trim(), salt);

    if (registeredHeir && registeredHeir._id.toString() === req.user.id) {
      return res.status(400).json({ message: "You cannot nominate yourself." });
    }

    const currentUser = await User.findById(req.user.id);
    
    if (currentUser.heirs.some(h => h.email === cleanEmail)) {
      return res.status(400).json({ message: "Nominee already exists in your registry." });
    }

    // 3. SAVE THE FULL NAME to the database
    currentUser.heirs.push({
      user: registeredHeir ? registeredHeir._id : null, 
      fullName: fullName.trim(), // <--- NEW FIELD FOR THE WILL
      email: cleanEmail,
      nickname: nickname || "Digital Heir",
      secretQuestion,
      hint,
      secretAnswer: hashedAnswer, 
      status: registeredHeir ? "VERIFIED" : "GHOST" 
    });

    await currentUser.save();
    res.json({ 
      message: "Security Handover Authorized.",
      heirName: fullName.trim() 
    });
  } catch (err) {
    res.status(500).json({ error: "Registry Error: " + err.message });
  }
});

// GET HEIRS
// backend/routes/auth.js
router.get("/heirs", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("heirs.user", "name email");
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

// This is the specific route for your "Confirm Identity" page
// backend/routes/auth.js
router.post("/verify-and-heartbeat", auth, async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user.id); // req.user.id comes from auth middleware

    if (!user) return res.status(404).json({ message: "User not found" });

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Reset status to ACTIVE
    user.lastActive = new Date();
    user.inheritanceStatus = "ACTIVE";
    user.warningSentAt = null;
    
    await user.save();
    res.json({ message: "Success" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;