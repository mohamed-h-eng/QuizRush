const express = require("express");
const router = express.Router();
const {
  createQuiz,
  getQuizzes,
  getQuizById,
  getQuizBySlug,
  updateQuiz,
  deleteQuiz,
  submitAttempt,
} = require("../controllers/quizController");
const { protect, optionalAuth } = require("../middleware/auth");

// Public share route must be declared before /:id to avoid slug being treated as an id
router.get("/share/:slug", getQuizBySlug);

router.route("/")
  .get(optionalAuth, getQuizzes)
  .post(protect, createQuiz);

router.route("/:id")
  .get(protect, getQuizById)
  .put(protect, updateQuiz)
  .delete(protect, deleteQuiz);

router.post("/:id/attempt", optionalAuth, submitAttempt);

module.exports = router;
