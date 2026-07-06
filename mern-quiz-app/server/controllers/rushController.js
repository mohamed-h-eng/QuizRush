const RushLog = require("../models/RushLog");

// Returns today's date key in UTC, e.g. "2026-07-05".
const todayKey = () => new Date().toISOString().slice(0, 10);

// Returns the ISO timestamp of the next UTC midnight (when the limit resets).
const nextResetAt = () => {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return next.toISOString();
};

// GET /api/quizzes/rush/status  (auth required)
// Read-only check — does NOT consume the daily usage. Lets the frontend show
// "you've already used Quiz Rush today" before the user even starts uploading.
const getRushStatus = async (req, res, next) => {
  try {
    const existing = await RushLog.findOne({ user: req.user._id, date: todayKey() });
    res.json({
      usedToday: !!existing,
      nextAvailableAt: existing ? nextResetAt() : null,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/quizzes/rush/use  (auth required)
// Atomically checks-and-logs one day's usage. Call this BEFORE sending files
// to the n8n webhook. Relies on the unique (user, date) index in RushLog to
// prevent race conditions from double-clicks or parallel requests — the
// second attempt on the same day fails at the database level (code 11000),
// not via a separate read-then-write check.
const useRush = async (req, res, next) => {
  try {
    await RushLog.create({ user: req.user._id, date: todayKey() });
    return res.status(200).json({ allowed: true });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(429).json({
        allowed: false,
        message: "You've already used Quiz Rush today. Try again tomorrow.",
        nextAvailableAt: nextResetAt(),
      });
    }
    next(err);
  }
};

module.exports = { getRushStatus, useRush };
