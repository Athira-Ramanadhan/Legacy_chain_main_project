const cron = require("node-cron");
const User = require("./models/User");
const Asset = require("./models/Asset");
const releaseAsset = require("./utils/releaseAsset");

cron.schedule("* * * * *", async () => {
  console.log("Automation running...");

  const users = await User.find();
  const now = new Date();

  for (let user of users) {
    const inactiveMinutes =
      (now - user.lastActive) / (1000 * 60);

    // 🔹 STEP 1 — Send Warning
    if (
      inactiveMinutes > user.inactivityThreshold &&
      user.inheritanceStatus === "ACTIVE"
    ) {
      console.log(`Warning triggered for ${user.email}`);

      user.inheritanceStatus = "WARNING_SENT";
      user.warningSentAt = new Date();

      await user.save();
    }

    // 🔹 STEP 2 — Auto Transfer After Grace Period
    if (user.inheritanceStatus === "WARNING_SENT") {
      const graceMinutes =
        (now - user.warningSentAt) / (1000 * 60);

      if (graceMinutes > user.gracePeriod) {
        console.log(`Auto transfer triggered for ${user.email}`);

        // 🔥 Prevent repeated execution
        user.inheritanceStatus = "AUTO_TRIGGERED";
        await user.save();

        const assets = await Asset.find({
          ownerId: user._id,
          status: "LOCKED"
        });

        for (let asset of assets) {
          await releaseAsset(asset);
        }

        user.inheritanceStatus = "COMPLETED";
        await user.save();
      }
    }
  }
});
