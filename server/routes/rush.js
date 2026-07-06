const express = require("express");
const router = express.Router();
const { getRushStatus, useRush } = require("../controllers/rushController");
const { protect } = require("../middleware/auth");

router.get("/status", protect, getRushStatus);
router.post("/use", protect, useRush);

module.exports = router;
