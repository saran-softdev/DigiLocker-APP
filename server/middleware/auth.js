// src/middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.ensureAuth = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer "))
    return res.status(401).json({ error: "No token provided" });

  const token = auth.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // attach user to req
    const user = await User.findById(payload.id).select("_id");
    if (!user) throw new Error("User not found");
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
