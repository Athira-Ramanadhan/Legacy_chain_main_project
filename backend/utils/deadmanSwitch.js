const User = require("../models/user");

const checkDeadmanSwitch = async (ownerId) => {

  const user = await User.findById(ownerId);

  if (!user) {
    throw new Error("Owner not found");
  }

  const now = new Date().getTime();

  const lastActive = new Date(user.lastActive).getTime();

  const inactivityLimit =
    lastActive +
    user.inactivityThreshold * 24 * 60 * 60 * 1000;

  const graceLimit =
    inactivityLimit +
    user.gracePeriod * 24 * 60 * 60 * 1000;

  if (now > graceLimit) {
    return "CLAIM_ALLOWED";
  }

  if (now > inactivityLimit) {
    return "GRACE_PERIOD";
  }

  return "ACTIVE";
};

module.exports = checkDeadmanSwitch;
