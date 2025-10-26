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
    subject: "Your Guardrail OTP Code",
    text: (otp) =>
      `Hello,

Your OTP code is: ${otp}

This code expires in 5 minutes. If you did not request this, ignore this email.

Best regards,
Guardrail Team`,
    html: (otp) =>
      `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Guardrail OTP</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      background: #ffffff;
      color: #333333;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 30px;
      text-align: center;
    }
    .logo {
      margin-bottom: 20px;
    }
    .header {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .subheader {
      font-size: 16px;
      color: #555555;
      margin-bottom: 30px;
    }
    .otp-box {
      display: inline-block;
      background: #f4f4f4;
      padding: 20px 30px;
      border-radius: 10px;
      font-size: 32px;
      font-weight: bold;
      letter-spacing: 8px;
      color: #2563eb;
      cursor: pointer;
      user-select: all;
      margin-bottom: 20px;
    }
    .footer {
      font-size: 12px;
      color: #999999;
      margin-top: 30px;
      border-top: 1px solid #e5e5e5;
      padding-top: 15px;
    }
    .warning {
      font-size: 13px;
      color: #dc2626;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <img src="https://guardrailsentinel.netlify.app/_next/image?url=%2Ffavicon.ico&w=96&q=75" alt="Guardrail Logo" class="logo" width="120" />
    <div class="header">Verify Your Account</div>
    <div class="subheader">Use the OTP below to complete your verification:</div>
    <div class="otp-box" onclick="navigator.clipboard.writeText('${otp}')">${otp}</div>
    <div class="subheader"><strong>This code will expire in 5 minutes.</strong></div>
    <div class="warning">⚠️ If you did not request this code, please ignore this email.</div>
    <div class="footer">
      Best regards,<br>
      Guardrail Team
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
async function sendOTP(email, otp) {
  try {
    if (!email || !otp) throw new Error("Email and OTP are required");

    const mailOptions = {
      from: { name: "Guardrail", address: process.env.GMAIL_USER },
      to: email,
      subject: emailTemplates.otp.subject,
      text: emailTemplates.otp.text(otp),
      html: emailTemplates.otp.html(otp),
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("✅ OTP sent:", {
      messageId: info.messageId,
      recipient: email,
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
    });
    throw new Error(`Failed to send OTP: ${error.message}`);
  }
}

async function sendEmail({ to, subject, text, html }) {
  try {
    if (!to || !subject || !text)
      throw new Error("To, subject, and text are required");

    const mailOptions = {
      from: { name: "Guardrail", address: process.env.GMAIL_USER },
      to,
      subject,
      text,
      html: html || text,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Email sent:", {
      messageId: info.messageId,
      recipient: to,
      subject,
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
    });
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

module.exports = { sendOTP, sendEmail, transporter };
