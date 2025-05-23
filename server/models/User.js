// models/User.js
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    fcmToken: { type: String },
    isOnline: { type: Boolean, default: false } 
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.models.User || mongoose.model("User", UserSchema);
