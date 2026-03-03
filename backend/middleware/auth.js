
const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    // 1. Verify the token using your secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 2. ADD THIS LOG HERE: This confirms the middleware passed!
    console.log("🔓 Token Verified for User ID:", decoded.id); 

    // 3. Attach user info to the request object
    req.user = { id: decoded.id, email: decoded.email };
    
    next();
  } catch (err) {
    // If verification fails (expired or wrong secret), this runs
    console.error("❌ JWT Verification Error:", err.message);
    return res.status(401).json({ message: "Invalid token" });
  }
};