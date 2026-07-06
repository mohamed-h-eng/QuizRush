const mongoose = require("mongoose");

// One document per user per day. The unique index on (user, date) is what
// actually enforces "once per day" — we rely on Mongo rejecting the second
// insert attempt rather than a read-then-write check, so it's safe even if
// two requests race each other.
const rushLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // Calendar day the usage counts against, in UTC, formatted YYYY-MM-DD.
    date: { type: String, required: true },
  },
  { timestamps: true }
);

rushLogSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("RushLog", rushLogSchema);
