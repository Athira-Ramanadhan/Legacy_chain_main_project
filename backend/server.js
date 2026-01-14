const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// global middleware
app.use(cors());
app.use(express.json());

// routes
app.use("/auth", require("./routes/auth.routes"));
app.use("/assets", require("./routes/asset.routes"));

// health check
app.get("/", (req, res) => {
  res.send("LegacyChain backend is running");
});

// global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
});

// connect DB & start server
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
