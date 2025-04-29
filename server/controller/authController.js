const UserModel = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  sendExpiringDocumentNotification
} = require("./notificationController");

// ——— REGISTER ———
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const existing = await UserModel.findOne({ email });
    if (existing) {
      existing.username = username;
      existing.password = hashedPassword;
      await existing.save();
      return res
        .status(200)
        .json({ msg: "Existing user updated", userId: existing._id });
    }

    const newUser = await UserModel.create({
      username,
      email,
      password: hashedPassword
    });

    return res
      .status(201)
      .json({ msg: "New user created", userId: newUser._id });
  } catch (err) {
    console.error(err);
    if (err.code === 11000 && err.keyPattern?.email) {
      return res.status(409).json({ msg: "Email conflict on save" });
    }
    return res.status(500).json({ msg: "Server error" });
  }
};

// ——— LOGIN ———
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ msg: "Invalid credentials" });

    // ✅ Set user as online
    user.isOnline = true;
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d"
    });

    // Optional: Trigger document expiry check only on login if you want (not required)
    // await sendExpiringDocumentNotification(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};

// ——— LOGOUT ———
const logout = async (req, res) => {
  try {
    const userId = req.user._id;
    await UserModel.findByIdAndUpdate(userId, { isOnline: false });
    res.json({ msg: "Logged out successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Logout failed" });
  }
};

module.exports = { register, login, logout };
