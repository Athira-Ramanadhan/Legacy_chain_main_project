const User = require("../models/User");

const isAdmin = async (req, res, next) => {
  try {
    // req.user was already populated by your first middleware (auth.js)
    const user = await User.findById(req.user.id);

    if (user && user.role === "admin") {
      next(); // Success: Proceed to the Admin route
    } else {
      // Brutal Truth: If they aren't an admin, block them immediately
      res.status(403).json({ message: "Access Denied: Admin privileges required." });
    }
  } catch (err) {
    res.status(500).json({ error: "Authorization error: " + err.message });
  }
};

module.exports = { isAdmin };