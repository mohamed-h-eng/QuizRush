const mongoose = require("mongoose");

const attemptSchema = new mongoose.Schema(
  {
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    guestName: { type: String, default: null },
    // One entry per question, each entry itself an array of selected option
    // indices (length 1 for single-select answers, 0+ for multi-select).
    answers: { type: [[Number]], required: true },
    score: { type: Number, required: true },
    total: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Attempt", attemptSchema);
