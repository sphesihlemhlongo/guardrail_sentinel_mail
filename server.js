require("dotenv").config();
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { sendOTP } = require("./emailService");
require("dotenv").config();

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());

const otpStore = {};
const users = {};
const OTP_EXPIRATION = parseInt(process.env.OTP_EXPIRATION) || 300000;

function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

// Request OTP
app.post("/request-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  const otp = generateOTP();
  otpStore[email] = { otp, expires: Date.now() + OTP_EXPIRATION };
  if (!users[email]) users[email] = { email };

  console.log(`Generated OTP for ${email}: ${otp}`); // debug log

  try {
    await sendOTP(email, otp);
    console.log(`OTP sent to ${email}`); // debug log
    res.json({ message: "OTP sent" });
  } catch (err) {
    console.error("Error sending OTP:", err); // show detailed error
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

// Verify OTP
app.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp)
    return res.status(400).json({ error: "Email and OTP required" });

  const record = otpStore[email];
  if (!record)
    return res.status(400).json({ error: "No OTP requested for this email" });

  if (record.expires < Date.now()) {
    delete otpStore[email];
    return res.status(400).json({ error: "OTP expired" });
  }

  if (record.otp !== otp) return res.status(400).json({ error: "Invalid OTP" });

  delete otpStore[email];
  const token = jwt.sign({ email }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  res.json({ message: "Authenticated", token });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
