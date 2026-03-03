const cron = require("node-cron");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const Asset = require("./models/Asset");
const releaseAsset = require("./utils/releaseAsset");
const sendMail = require("./utils/mailer");
const { getWarningEmailHtml } = require("./utils/emailTemplates");

cron.schedule("*/10 * * * * *", async () => {
  console.log("⏱️ Automation Heartbeat...");

  try {
    const users = await User.find({ inheritanceStatus: { $ne: "COMPLETED" } });

    for (let user of users) {
      const now = new Date();
      const inactiveMinutes = (now - new Date(user.lastActive)) / (1000 * 60);

      if (inactiveMinutes > user.inactivityThreshold && user.inheritanceStatus === "ACTIVE") {
        console.log(`⚠️ Threshold hit for ${user.email}. Generating security token...`);

        // 2. GENERATE A TEMPORARY TOKEN (valid for 1 hour)
        const token = jwt.sign(
          { id: user._id, email: user.email }, 
          process.env.JWT_SECRET, 
          { expiresIn: "1h" }
        );

        user.inheritanceStatus = "WARNING_SENT";
        user.warningSentAt = new Date();
        await user.save();

        try {
          // 3. PASS THE TOKEN TO THE TEMPLATE
          const emailHtml = getWarningEmailHtml(user, token); 
          await sendMail(user.email, "ACTION REQUIRED: LegacyChain Security Alert", emailHtml);
          console.log(`✅ Warning email delivered with secure token to ${user.email}`);
        } catch (mailErr) {
          console.error(`❌ Failed to send email to ${user.email}:`, mailErr.message);
        }
      }
      // ... rest of your logic ...
    }
  } catch (err) {
    console.error("Cron Job Global Error:", err);
  }
});