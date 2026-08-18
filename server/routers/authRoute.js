const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Register a new user

router.post("/register", authController.registerUser);

// Login a user
router.post("/login", authController.loginUser);

// verify otp

router.post("/verify-otp", authController.verifyOTP);

//resend otp

router.post("/resend-otp", authController.resendOTP);

module.exports = router;
