import { useState } from "react";
import api from "../api/axios";

/**
 * Renders a quiz one question at a time.
 * Props:
 *  - quiz: { _id, title, questions: [{ questionText, options }] }
 */
const QuizPlayer = ({ quiz }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState(Array(quiz.questions.length).fill(null));
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { score, total, review }
  const [error, setError] = useState("");

  const totalQuestions = quiz.questions.length;
  const currentQuestion = quiz.questions[currentIndex];
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const hasAnsweredCurrent = answers[currentIndex] !== null;

  const selectOption = (optionIndex) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[currentIndex] = optionIndex;
      return next;
    });
  };

  const goNext = () => {
    if (!isLastQuestion) setCurrentIndex((i) => i + 1);
  };

  const goBack = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  const handleSubmit = async () => {
    if (answers.some((a) => a === null)) {
      setError("Please answer every question before submitting.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const { data } = await api.post(`/quizzes/${quiz._id}/attempt`, { answers });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit quiz");
    } finally {
      setSubmitting(false);
    }
  };

  // ----- Results view -----
  if (result) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-2">Quiz complete!</h2>
        <p className="text-lg mb-6">
          You scored <span className="font-bold text-brand-600">{result.score}</span> /{" "}
          {result.total}
        </p>

        <div className="space-y-4">
          {result.review.map((r, i) => (
            <div
              key={i}
              className={`border rounded-md p-3 ${
                r.isCorrect ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"
              }`}
            >
              <p className="font-medium mb-1">
                {i + 1}. {r.questionText}
              </p>
              <p className="text-sm">
                Your answer: {r.options[r.selectedIndex]}{" "}
                {r.isCorrect ? "✅" : "❌"}
              </p>
              {!r.isCorrect && (
                <p className="text-sm text-green-700">
                  Correct answer: {r.options[r.correctOptionIndex]}
                </p>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={() => {
            setResult(null);
            setAnswers(Array(totalQuestions).fill(null));
            setCurrentIndex(0);
          }}
          className="mt-6 bg-brand-500 text-white px-4 py-2 rounded-md hover:bg-brand-600"
        >
          Retake quiz
        </button>
      </div>
    );
  }

  // ----- One-question-at-a-time view -----
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6">
      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>
            Question {currentIndex + 1} of {totalQuestions}
          </span>
          <span>{Math.round(((currentIndex + 1) / totalQuestions) * 100)}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div
            className="bg-brand-500 h-2 rounded-full transition-all"
            style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-4">{currentQuestion.questionText}</h2>

      <div className="space-y-2 mb-6">
        {currentQuestion.options.map((option, i) => {
          const selected = answers[currentIndex] === i;
          return (
            <button
              key={i}
              onClick={() => selectOption(i)}
              className={`w-full text-left border rounded-md px-4 py-2 transition-colors ${
                selected
                  ? "border-brand-500 bg-brand-50 text-brand-700 font-medium"
                  : "border-slate-200 hover:border-brand-300"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      <div className="flex justify-between">
        <button
          onClick={goBack}
          disabled={currentIndex === 0}
          className="px-4 py-2 rounded-md text-slate-600 disabled:opacity-40 hover:bg-slate-100"
        >
          Back
        </button>

        {isLastQuestion ? (
          <button
            onClick={handleSubmit}
            disabled={!hasAnsweredCurrent || submitting}
            className="bg-brand-500 text-white px-5 py-2 rounded-md hover:bg-brand-600 disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit quiz"}
          </button>
        ) : (
          <button
            onClick={goNext}
            disabled={!hasAnsweredCurrent}
            className="bg-brand-500 text-white px-5 py-2 rounded-md hover:bg-brand-600 disabled:opacity-50"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizPlayer;
