const mongoose = require("mongoose");

const attemptSchema = new mongoose.Schema(
  {
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    guestName: { type: String, default: null },
    answers: { type: [Number], required: true }, // chosen option index per question
    score: { type: Number, required: true },
    total: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Attempt", attemptSchema);
