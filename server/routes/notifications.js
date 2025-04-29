const express = require("express");
const router = express.Router();
const User = require("../models/User");

router.post("/update-fcm-token", async (req, res) => {
  const { token, userId } = req.body;

  if (!userId || !token) {
    return res.status(400).json({ message: "❌ Missing userId or token" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "❌ User not found" });
    }

    user.fcmToken = token;
    await user.save();

    console.log(`✅ Saved FCM token for ${user.email}`);
    res.status(200).json({ message: "✅ FCM token saved successfully" });
  } catch (error) {
    console.error("❌ Error saving FCM token:", error.message);
    res.status(500).json({ message: "Server error saving token" });
  }
});

module.exports = router;
