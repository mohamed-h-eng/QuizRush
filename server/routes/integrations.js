const express = require("express");
const router = express.Router();
const { importQuizzes } = require("../controllers/quizController");
const { apiKeyAuth } = require("../middleware/auth");

// Authenticated via x-api-key header instead of a user JWT — meant for
// server-to-server callers like an n8n workflow, not the browser app.
router.post("/quizzes", apiKeyAuth, importQuizzes);

module.exports = router;
