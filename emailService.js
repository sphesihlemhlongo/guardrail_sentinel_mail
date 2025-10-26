// =============================================================================
// EMAIL SERVICE - Nodemailer Configuration
// =============================================================================
// Purpose: Handle all email operations including OTP sending
// Dependencies: nodemailer
// Environment Variables Required:
//   - GMAIL_USER: Your Gmail address
//   - GMAIL_PASS: Your Gmail app password (not regular password)
// =============================================================================

const nodemailer = require("nodemailer");

// -----------------------------------------------------------------------------
// TRANSPORTER CONFIGURATION
// -----------------------------------------------------------------------------
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
  // Optional: Add connection pooling for better performance
  pool: true,
  maxConnections: 5,
  maxMessages: 10,
});

// Verify transporter configuration on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email transporter configuration error:", error.message);
  } else {
    console.log("✅ Email server is ready to send messages");
  }
});

// -----------------------------------------------------------------------------
// EMAIL TEMPLATES
// -----------------------------------------------------------------------------
const emailTemplates = {
  otp: {
    subject: "Your Olyxee Secure OTP",
    text: (otp) =>
      `
Hello,

Your OTP verification code is: ${otp}

This code will expire in 5 minutes for security purposes.

If you did not request this code, please ignore this email.

Best regards,
Olyxee Team
    `.trim(),
    html: (otp) =>
      `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .otp-box { background: #f4f4f4; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; }
    .otp-code { font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 8px; }
    .warning { color: #dc2626; font-size: 14px; margin-top: 20px; }
    .footer { margin-top: 30px; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Verify Your Account</h2>
    <p>Hello Mr Stakio,</p>
    <p>Use the following OTP to complete your verification:</p>
    <div class="otp-box">
      <div class="otp-code">${otp}</div>
    </div>
    <p><strong>This code will expire in 5 minutes.</strong></p>
    <p class="warning">⚠️ If you did not request this code, please ignore this email.</p>
    <div class="footer">
      <p>Best regards,<br>Guardrail Team</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  },
};

// -----------------------------------------------------------------------------
// MAIN EMAIL FUNCTIONS
// -----------------------------------------------------------------------------

/**
 * Send OTP to user's email
 * @param {string} email - Recipient email address
 * @param {string} otp - One-time password to send
 * @returns {Promise<Object>} Email send result
 */
async function sendOTP(email, otp) {
  try {
    // Validate inputs
    if (!email || !otp) {
      throw new Error("Email and OTP are required");
    }

    // Email options
    const mailOptions = {
      from: {
        name: "Guardrail",
        address: process.env.GMAIL_USER,
      },
      to: email,
      subject: emailTemplates.otp.subject,
      text: emailTemplates.otp.text(otp),
      html: emailTemplates.otp.html(otp),
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log("✅ OTP sent successfully:", {
      messageId: info.messageId,
      recipient: email,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
    };
  } catch (error) {
    console.error("❌ Email send error:", {
      error: error.message,
      recipient: email,
      timestamp: new Date().toISOString(),
    });
    throw new Error(`Failed to send OTP: ${error.message}`);
  }
}

/**
 * Send a generic email (for future use)
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content (optional)
 * @returns {Promise<Object>} Email send result
 */
async function sendEmail({ to, subject, text, html }) {
  try {
    if (!to || !subject || !text) {
      throw new Error("To, subject, and text are required");
    }

    const mailOptions = {
      from: {
        name: "Guardrail",
        address: process.env.GMAIL_USER,
      },
      to,
      subject,
      text,
      html: html || text,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Email sent successfully:", {
      messageId: info.messageId,
      recipient: to,
      subject,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
    };
  } catch (error) {
    console.error("❌ Email send error:", {
      error: error.message,
      recipient: to,
      timestamp: new Date().toISOString(),
    });
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

// -----------------------------------------------------------------------------
// EXPORTS
// -----------------------------------------------------------------------------
module.exports = {
  sendOTP,
  sendEmail,
  transporter, // Export for testing or advanced use cases
};
