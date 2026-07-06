const express = require("express");
const router = express.Router();
const {
  createQuiz,
  getQuizzes,
  getQuizById,
  getQuizBySlug,
  checkAnswer,
  updateQuiz,
  deleteQuiz,
  submitAttempt,
  validateDraft,
} = require("../controllers/quizController");
const { protect, optionalAuth } = require("../middleware/auth");

// Public share route must be declared before /:id to avoid slug being treated as an id
router.get("/share/:slug", getQuizBySlug);
router.post("/share/:slug/questions/:questionId/check", checkAnswer);

// Validates AI/n8n-generated draft JSON without saving — must be declared
// before /:id so "validate-draft" isn't captured as an :id param.
router.post("/validate-draft", protect, validateDraft);

router.route("/")
  .get(optionalAuth, getQuizzes)
  .post(protect, createQuiz);

router.route("/:id")
  .get(protect, getQuizById)
  .put(protect, updateQuiz)
  .delete(protect, deleteQuiz);

router.post("/:id/attempt", optionalAuth, submitAttempt);

module.exports = router;
