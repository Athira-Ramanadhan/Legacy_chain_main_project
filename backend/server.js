const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
require("./automationEngine");

const app = express();

// ✅ GLOBAL MIDDLEWARE (Keep these together)
app.use(cors());
app.use(express.json());
// Move this here so it's ready before any routes are called [cite: 2026-03-07]
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
const fs = require('fs');
['uploads/vault', 'uploads/claims'].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ✅ ROUTES
app.use("/auth", require("./routes/auth.routes"));
app.use("/assets", require("./routes/asset.routes"));

// Health check
app.get("/", (req, res) => {
  res.send("LegacyChain backend is running");
});

// ✅ DATABASE & SERVER START
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => console.error("DB connection failed:", err));