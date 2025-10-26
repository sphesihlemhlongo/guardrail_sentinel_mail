require("dotenv").config();
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { sendOTP } = require("./emailService");
<<<<<<< HEAD
require("dotenv").config();
=======
>>>>>>> master

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());

<<<<<<< HEAD
const otpStore = {};
const users = {};
=======
// ---------------------- Data Stores ----------------------
const users = {}; // { email, verified, twoFAEnabled }
const otpStore = {}; // { email: { otp, expires, purpose } }
>>>>>>> master
const OTP_EXPIRATION = parseInt(process.env.OTP_EXPIRATION) || 300000;

function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

<<<<<<< HEAD
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
=======
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
>>>>>>> master
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

<<<<<<< HEAD
// Verify OTP
=======
// ---------------------- OTP Verification ----------------------
>>>>>>> master
app.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp)
    return res.status(400).json({ error: "Email and OTP required" });

  const record = otpStore[email];
<<<<<<< HEAD
  if (!record)
    return res.status(400).json({ error: "No OTP requested for this email" });

=======
  if (!record) return res.status(400).json({ error: "No OTP requested" });
>>>>>>> master
  if (record.expires < Date.now()) {
    delete otpStore[email];
    return res.status(400).json({ error: "OTP expired" });
  }
<<<<<<< HEAD

  if (record.otp !== otp) return res.status(400).json({ error: "Invalid OTP" });

  delete otpStore[email];
  const token = jwt.sign({ email }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  res.json({ message: "Authenticated", token });
=======
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
>>>>>>> master
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
