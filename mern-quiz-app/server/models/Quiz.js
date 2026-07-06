const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true, trim: true },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => arr.length >= 2,
        message: "A question needs at least 2 options",
      },
    },
    // Whether the user may select more than one correct option
    isMultiSelect: { type: Boolean, default: false },
    // Always an array of indices into `options`, even for single-select
    // questions (length 1 in that case). Using one field for both keeps
    // scoring/normalization logic uniform.
    correctOptionIndexes: {
      type: [Number],
      required: true,
      validate: {
        validator: (arr) => arr.length >= 1,
        message: "A question needs at least 1 correct answer",
      },
    },
  },
  { _id: true }
);

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    topic: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    slug: { type: String, required: true, unique: true },
    isPublic: { type: Boolean, default: true },
    questions: {
      type: [questionSchema],
      validate: {
        validator: (arr) => arr.length > 0,
        message: "A quiz needs at least 1 question",
      },
    },
  },
  { timestamps: true }
);

// Enables partial-word topic/title search
quizSchema.index({ topic: "text", title: "text" });

module.exports = mongoose.model("Quiz", quizSchema);
