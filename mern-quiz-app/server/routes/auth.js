const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getMe,
  getApiKey,
  regenerateApiKey,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.get("/api-key", protect, getApiKey);
router.post("/api-key/regenerate", protect, regenerateApiKey);

module.exports = router;
