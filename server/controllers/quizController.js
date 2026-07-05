const { nanoid } = require("nanoid");
const Quiz = require("../models/Quiz");
const Attempt = require("../models/Attempt");

// POST /api/quizzes
const createQuiz = async (req, res, next) => {
  try {
    const { title, topic, description, questions, isPublic } = req.body;

    const slug = `${title}`
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 40) + "-" + nanoid(6);

    const quiz = await Quiz.create({
      title,
      topic,
      description,
      questions,
      isPublic: isPublic !== undefined ? isPublic : true,
      slug,
      createdBy: req.user._id,
    });

    res.status(201).json(quiz);
  } catch (err) {
    next(err);
  }
};

// GET /api/quizzes?topic=xyz&mine=true
const getQuizzes = async (req, res, next) => {
  try {
    const { topic, mine } = req.query;
    const filter = {};

    if (topic) {
      filter.topic = { $regex: topic, $options: "i" };
    }

    if (mine === "true" && req.user) {
      filter.createdBy = req.user._id;
    } else {
      filter.isPublic = true;
    }

    const quizzes = await Quiz.find(filter)
      .select("-questions.correctOptionIndex")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    res.json(quizzes);
  } catch (err) {
    next(err);
  }
};

// GET /api/quizzes/:id  (owner view - includes correct answers)
const getQuizById = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    if (quiz.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to view this quiz's answers" });
    }

    res.json(quiz);
  } catch (err) {
    next(err);
  }
};

// GET /api/quizzes/share/:slug  (public - hides correct answers)
const getQuizBySlug = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ slug: req.params.slug, isPublic: true }).select(
      "-questions.correctOptionIndex"
    );
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
    res.json(quiz);
  } catch (err) {
    next(err);
  }
};

// PUT /api/quizzes/:id
const updateQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    if (quiz.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to edit this quiz" });
    }

    const { title, topic, description, questions, isPublic } = req.body;
    if (title !== undefined) quiz.title = title;
    if (topic !== undefined) quiz.topic = topic;
    if (description !== undefined) quiz.description = description;
    if (questions !== undefined) quiz.questions = questions;
    if (isPublic !== undefined) quiz.isPublic = isPublic;

    await quiz.save();
    res.json(quiz);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/quizzes/:id
const deleteQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    if (quiz.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this quiz" });
    }

    await quiz.deleteOne();
    res.json({ message: "Quiz deleted" });
  } catch (err) {
    next(err);
  }
};

// POST /api/quizzes/:id/attempt   body: { answers: [Number], guestName? }
const submitAttempt = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const { answers, guestName } = req.body;
    if (!Array.isArray(answers) || answers.length !== quiz.questions.length) {
      return res.status(400).json({ message: "Answers must match number of questions" });
    }

    let score = 0;
    quiz.questions.forEach((q, i) => {
      if (answers[i] === q.correctOptionIndex) score += 1;
    });

    const attempt = await Attempt.create({
      quiz: quiz._id,
      user: req.user ? req.user._id : null,
      guestName: req.user ? null : guestName || "Guest",
      answers,
      score,
      total: quiz.questions.length,
    });

    // Return per-question correctness + correct answers for review
    const review = quiz.questions.map((q, i) => ({
      questionText: q.questionText,
      options: q.options,
      correctOptionIndex: q.correctOptionIndex,
      selectedIndex: answers[i],
      isCorrect: answers[i] === q.correctOptionIndex,
    }));

    res.status(201).json({ score, total: quiz.questions.length, attemptId: attempt._id, review });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createQuiz,
  getQuizzes,
  getQuizById,
  getQuizBySlug,
  updateQuiz,
  deleteQuiz,
  submitAttempt,
};
