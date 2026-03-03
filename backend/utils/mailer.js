const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendMail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"LegacyChain Security" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`[EMAIL]: Sent to ${to}`);
    return info;
  } catch (error) {
    console.error("[EMAIL ERROR]:", error);
    throw error;
  }
};

module.exports = sendMail;