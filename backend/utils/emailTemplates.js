/**
 * Generates the HTML for the Inactivity Warning Email.
 */
const getWarningEmailHtml = (user, token) => {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-alive?token=${token}`;

  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); overflow: hidden; border: 1px solid #e0e0e0;">
      <div style="background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%); color: #ffffff; padding: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; letter-spacing: 1px; text-transform: uppercase;">LegacyChain</h1>
        <p style="margin: 5px 0 0; opacity: 0.8; font-size: 14px;">Secure Digital Asset Handover</p>
      </div>
      <div style="padding: 40px; color: #2c3e50; line-height: 1.8;">
        <h2 style="color: #e74c3c; margin-top: 0; font-size: 22px; border-bottom: 2px solid #f8d7da; padding-bottom: 10px;">⚠️ Security Alert: Inactivity Detected</h2>
        <p>Hello,</p>
        <p>Our autonomous engine has detected that your account has been inactive beyond your preset threshold.</p>
        <div style="background-color: #fff5f5; border: 1px solid #feb2b2; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
          <span style="display: block; font-size: 13px; color: #c53030; text-transform: uppercase; font-weight: bold; margin-bottom: 5px;">Time Remaining in Grace Period</span>
          <span style="font-size: 32px; color: #2d3748; font-weight: 800;">${user.gracePeriod} Minutes</span>
        </div>
        <div style="text-align: center; margin: 35px 0;">
          <a href="${verifyUrl}" style="background-color: #2b6cb0; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">Confirm Identity & Reset Switch</a>
        </div>
      </div>
    </div>
  `;
}; // <--- THIS WAS PREVIOUSLY MISSING [cite: 2026-03-08]

/**
 * Generates the HTML for the Nominee Claim Alert Email.
 */
const getClaimAlertEmailHtml = (user, assetTitle) => {
  const loginUrl = `${process.env.FRONTEND_URL}/login`;

  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 20px auto; border: 2px solid #e11d48; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #e11d48; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">⚠️ URGENT SECURITY ALERT</h1>
      </div>
      <div style="padding: 30px; color: #1f2937;">
        <h2>Asset Claim Verified</h2>
        <p>Hello <strong>${user.name}</strong>,</p>
        <p>A death certificate has been verified for your asset: <strong>${assetTitle}</strong>.</p>
        <p style="background: #fff1f2; padding: 15px; border-left: 4px solid #e11d48;">
          <strong>Security Action Required:</strong> If you are alive, you must <strong>VETO</strong> this claim immediately.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" style="background-color: #1f2937; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Login to Veto Claim</a>
        </div>
        <p style="font-size: 12px; color: #6b7280;">Vault opens in ${user.gracePeriod} hours if no action is taken.</p>
      </div>
    </div>
  `;
};

module.exports = { getWarningEmailHtml, getClaimAlertEmailHtml };