const express = require("express");
const router = express.Router();
const { register, login, logout } = require("../controller/authController");
const { ensureAuth } = require("../middleware/auth");

router.post("/register", register);
router.post("/login", login);
router.post("/logout", ensureAuth, logout);

module.exports = router;
