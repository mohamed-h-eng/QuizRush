const { nanoid } = require("nanoid");
const Quiz = require("../models/Quiz");
const Attempt = require("../models/Attempt");

const makeSlug = (title) =>
  `${title}`
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40) +
  "-" +
  nanoid(6);

// Normalizes one question from an external payload (e.g. n8n / LLM generated JSON).
// Accepts, for the correct-answer(s), any of:
//   - correctOptionIndexes: [Number]   (preferred, works for single or multi)
//   - correctOptionIndex: Number       (back-compat single-select)
//   - correctAnswers: [String]         (answer text, multi-select)
//   - correctAnswer: String            (answer text, single-select)
// isMultiSelect is inferred from the input if not explicit (true when more
// than one correct answer is given).
// Throws a descriptive Error if the question is malformed.
const normalizeQuestion = (q, position) => {
  const label = `Question ${position + 1}`;

  const questionText = (q.questionText || q.question || q.text || "").trim();
  if (!questionText) throw new Error(`${label}: missing questionText`);

  const options = Array.isArray(q.options) ? q.options.map((o) => `${o}`.trim()) : [];
  if (options.length < 2) throw new Error(`${label}: needs at least 2 options`);

  let correctOptionIndexes;

  if (Array.isArray(q.correctOptionIndexes)) {
    correctOptionIndexes = q.correctOptionIndexes.map(Number);
  } else if (typeof q.correctOptionIndex === "number") {
    correctOptionIndexes = [q.correctOptionIndex];
  } else if (Array.isArray(q.correctAnswers)) {
    correctOptionIndexes = q.correctAnswers.map((ans) => {
      const answer = `${ans}`.trim().toLowerCase();
      const idx = options.findIndex((o) => o.toLowerCase() === answer);
      if (idx === -1) throw new Error(`${label}: correctAnswer "${ans}" does not match any option`);
      return idx;
    });
  } else if (q.correctAnswer !== undefined) {
    const answer = `${q.correctAnswer}`.trim().toLowerCase();
    const idx = options.findIndex((o) => o.toLowerCase() === answer);
    if (idx === -1) {
      throw new Error(`${label}: correctAnswer "${q.correctAnswer}" does not match any option`);
    }
    correctOptionIndexes = [idx];
  } else {
    throw new Error(`${label}: provide correctOptionIndexes, correctOptionIndex, correctAnswers, or correctAnswer`);
  }

  if (correctOptionIndexes.length === 0) {
    throw new Error(`${label}: needs at least 1 correct answer`);
  }

  correctOptionIndexes.forEach((idx) => {
    if (typeof idx !== "number" || idx < 0 || idx >= options.length) {
      throw new Error(`${label}: correct answer index out of range`);
    }
  });

  // Dedupe just in case the source sent the same correct index/text twice
  correctOptionIndexes = [...new Set(correctOptionIndexes)];

  const isMultiSelect =
    q.isMultiSelect !== undefined ? !!q.isMultiSelect : correctOptionIndexes.length > 1;

  return { questionText, options, isMultiSelect, correctOptionIndexes };
};

// Normalizes one quiz payload's title/topic/description/isPublic/questions,
// independent of persistence concerns (no slug/owner attached here).
// Throws with a readable message on invalid input.
const normalizeQuizPayload = (payload) => {
  const title = (payload.title || "").trim();
  const topic = (payload.topic || "").trim();
  const description = (payload.description || "").trim();

  if (!title) throw new Error("title is required");
  if (!topic) throw new Error("topic is required");

  const rawQuestions = Array.isArray(payload.questions) ? payload.questions : [];
  if (rawQuestions.length === 0) throw new Error("at least one question is required");

  const questions = rawQuestions.map((q, i) => normalizeQuestion(q, i));

  return {
    title,
    topic,
    description,
    isPublic: payload.isPublic !== undefined ? !!payload.isPublic : true,
    questions,
  };
};

// Normalizes a quiz payload and attaches persistence fields (slug, createdBy),
// ready for Quiz.create(). Throws with a readable message on invalid input so
// the caller can report per-quiz errors.
const buildQuizDoc = (payload, ownerId) => {
  const normalized = normalizeQuizPayload(payload);
  return {
    ...normalized,
    slug: makeSlug(normalized.title),
    createdBy: ownerId,
  };
};

// POST /api/quizzes
const createQuiz = async (req, res, next) => {
  try {
    const { title, topic, description, questions, isPublic } = req.body;
    const slug = makeSlug(title);

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
      .select("-questions.correctOptionIndexes")
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
      "-questions.correctOptionIndexes"
    );
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
    res.json(quiz);
  } catch (err) {
    next(err);
  }
};

// POST /api/quizzes/share/:slug/questions/:questionId/check
// body: { selectedIndexes: [Number] }
// Public endpoint used for INSTANT per-question reveal while taking a shared
// quiz. Only returns the correct answer for the ONE question being checked
// (not the whole quiz's answer key), so a user who only wants to peek can't
// get everything from a single request the way they could if we sent all
// correctOptionIndexes down with the initial quiz payload.
const checkAnswer = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ slug: req.params.slug, isPublic: true });
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const question = quiz.questions.id(req.params.questionId);
    if (!question) return res.status(404).json({ message: "Question not found" });

    const selected = Array.isArray(req.body.selectedIndexes)
      ? req.body.selectedIndexes.map(Number)
      : [];

    const correctSet = new Set(question.correctOptionIndexes);
    const selectedSet = new Set(selected);
    const isCorrect =
      correctSet.size === selectedSet.size &&
      [...correctSet].every((idx) => selectedSet.has(idx));

    res.json({
      isCorrect,
      isMultiSelect: question.isMultiSelect,
      correctOptionIndexes: question.correctOptionIndexes,
    });
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

// POST /api/quizzes/:id/attempt   body: { answers: [[Number]], guestName? }
// Each entry in `answers` is an array of selected option indices for that
// question (length 1 for a single-select answer).
const submitAttempt = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const { answers, guestName } = req.body;
    if (!Array.isArray(answers) || answers.length !== quiz.questions.length) {
      return res.status(400).json({ message: "Answers must match number of questions" });
    }

    const isAnswerCorrect = (selected, correctIndexes) => {
      const selectedSet = new Set((selected || []).map(Number));
      const correctSet = new Set(correctIndexes);
      return (
        selectedSet.size === correctSet.size &&
        [...correctSet].every((idx) => selectedSet.has(idx))
      );
    };

    let score = 0;
    quiz.questions.forEach((q, i) => {
      if (isAnswerCorrect(answers[i], q.correctOptionIndexes)) score += 1;
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
      isMultiSelect: q.isMultiSelect,
      correctOptionIndexes: q.correctOptionIndexes,
      selectedIndexes: answers[i] || [],
      isCorrect: isAnswerCorrect(answers[i], q.correctOptionIndexes),
    }));

    res.status(201).json({ score, total: quiz.questions.length, attemptId: attempt._id, review });
  } catch (err) {
    next(err);
  }
};

// POST /api/integrations/quizzes  (authenticated via x-api-key header, see apiKeyAuth)
// Accepts EITHER a single quiz object OR { "quizzes": [ ... ] } for bulk import.
// Designed for automated senders like an n8n workflow producing formatted JSON.
//
// Single quiz body:
// {
//   "title": "Capitals of the World",
//   "topic": "Geography",
//   "description": "10 quick questions",
//   "isPublic": true,
//   "questions": [
//     { "questionText": "Capital of France?", "options": ["Paris","Rome","Berlin","Madrid"], "correctAnswer": "Paris" },
//     { "questionText": "Which are prime numbers?", "options": ["2","4","5","9"], "correctAnswers": ["2","5"], "isMultiSelect": true }
//   ]
// }
//
// Bulk body: { "quizzes": [ <quiz object>, <quiz object>, ... ] }
const importQuizzes = async (req, res, next) => {
  try {
    const payloads = Array.isArray(req.body?.quizzes)
      ? req.body.quizzes
      : Array.isArray(req.body)
      ? req.body
      : [req.body];

    if (payloads.length === 0) {
      return res.status(400).json({ message: "No quiz data provided" });
    }

    const created = [];
    const failed = [];

    for (let i = 0; i < payloads.length; i++) {
      try {
        const doc = buildQuizDoc(payloads[i], req.user._id);
        const quiz = await Quiz.create(doc);
        created.push({
          index: i,
          id: quiz._id,
          title: quiz.title,
          slug: quiz.slug,
          shareUrl: `${req.protocol}://${req.get("host")}/quiz/share/${quiz.slug}`,
          questionCount: quiz.questions.length,
        });
      } catch (err) {
        failed.push({ index: i, title: payloads[i]?.title, error: err.message });
      }
    }

    const status = created.length > 0 ? 201 : 400;
    res.status(status).json({
      createdCount: created.length,
      failedCount: failed.length,
      created,
      failed,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/quizzes/validate-draft   (JWT-protected, normal logged-in user)
// Takes the raw JSON that n8n returned after AI-formatting an uploaded file/text,
// and normalizes/validates it WITHOUT writing to the database. Used to power the
// "review before saving" screen when generating quizzes from files.
//
// Accepts the same shape as the bulk-import endpoint: a single quiz object, or
// { "quizzes": [ ... ] }. Returns one entry per input quiz:
//   - valid: true  -> normalized `quiz` object ready to submit to POST /api/quizzes
//   - valid: false -> `error` message and the original raw payload for reference
const validateDraft = async (req, res, next) => {
  try {
    const payloads = Array.isArray(req.body?.quizzes)
      ? req.body.quizzes
      : Array.isArray(req.body)
      ? req.body
      : [req.body];

    if (payloads.length === 0) {
      return res.status(400).json({ message: "No quiz data provided" });
    }

    const results = payloads.map((payload, index) => {
      try {
        const quiz = normalizeQuizPayload(payload);
        return { index, valid: true, quiz };
      } catch (err) {
        return { index, valid: false, error: err.message, raw: payload };
      }
    });

    const validCount = results.filter((r) => r.valid).length;

    res.json({
      validCount,
      invalidCount: results.length - validCount,
      results,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createQuiz,
  getQuizzes,
  getQuizById,
  getQuizBySlug,
  checkAnswer,
  updateQuiz,
  deleteQuiz,
  submitAttempt,
  importQuizzes,
  validateDraft,
  buildQuizDoc,
  normalizeQuestion,
  normalizeQuizPayload,
};
