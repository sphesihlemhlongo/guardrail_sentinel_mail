require("dotenv").config();
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { sendOTP } = require("./emailService");

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());

// ---------------------- Data Stores ----------------------
const users = {}; // { email, verified, twoFAEnabled }
const otpStore = {}; // { email: { otp, expires, purpose } }
const OTP_EXPIRATION = parseInt(process.env.OTP_EXPIRATION) || 300000;

function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

// ---------------------- OTP Request ----------------------
app.post("/request-otp", async (req, res) => {
  const { email, purpose } = req.body;
  if (!email || !purpose)
    return res.status(400).json({ error: "Email and purpose required" });

  const otp = generateOTP();
  otpStore[email] = { otp, expires: Date.now() + OTP_EXPIRATION, purpose };

  if (!users[email])
    users[email] = { email, verified: false, twoFAEnabled: false };

  try {
    await sendOTP(email, otp);
    console.log(`OTP sent to ${email} for ${purpose}: ${otp}`);
    res.json({ message: "OTP sent" });
  } catch (err) {
    console.error("Error sending OTP:", err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

// ---------------------- OTP Verification ----------------------
app.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp)
    return res.status(400).json({ error: "Email and OTP required" });

  const record = otpStore[email];
  if (!record) return res.status(400).json({ error: "No OTP requested" });
  if (record.expires < Date.now()) {
    delete otpStore[email];
    return res.status(400).json({ error: "OTP expired" });
  }
  if (record.otp !== otp) return res.status(400).json({ error: "Invalid OTP" });

  // Mark based on purpose
  if (record.purpose === "signup") users[email].verified = true;
  if (record.purpose === "2fa") users[email].twoFAEnabled = true;

  delete otpStore[email];

  const token = jwt.sign(
    { email, twoFA: users[email].twoFAEnabled },
    process.env.JWT_SECRET,
    {
      expiresIn: "1h",
    }
  );

  res.json({
    message: "OTP verified",
    token,
    verified: users[email].verified,
    twoFAEnabled: users[email].twoFAEnabled,
  });
});

// ---------------------- Disable 2FA ----------------------
app.post("/disable-2fa", (req, res) => {
  const { email } = req.body;
  if (!email || !users[email])
    return res.status(400).json({ error: "Invalid user" });

  users[email].twoFAEnabled = false;
  res.json({ message: "2FA disabled", twoFAEnabled: false });
});

// ---------------------- Get User Status ----------------------
app.get("/user-status", (req, res) => {
  const { email } = req.query;
  if (!email || !users[email])
    return res.status(400).json({ error: "Invalid user" });

  res.json({
    verified: users[email].verified,
    twoFAEnabled: users[email].twoFAEnabled,
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
