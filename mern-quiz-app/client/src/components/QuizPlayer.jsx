import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "../styles/quizPlayer.css";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

const formatTime = (sec) => {
  const h = String(Math.floor(sec / 3600)).padStart(2, "0");
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
};

/**
 * Full exam-style quiz-taking experience: sidebar question grid with
 * search/filters, one question at a time in the main area, INSTANT reveal
 * of correctness as soon as an answer is chosen (single-select) or checked
 * (multi-select), bookmarks/flags, a timer, and a results summary modal.
 *
 * Props:
 *  - quiz: { _id, slug, title, questions: [{ _id, questionText, options, isMultiSelect }] }
 */
const QuizPlayer = ({ quiz }) => {
  const navigate = useNavigate();
  const total = quiz.questions.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  // answers[questionId] = { selected: [idx,...], revealed, isCorrect, correctOptionIndexes, checking }
  const [answers, setAnswers] = useState({});
  const [bookmarks, setBookmarks] = useState(new Set());
  const [flags, setFlags] = useState(new Set());
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 768);
  const [jumpValue, setJumpValue] = useState("");
  const [timerSec, setTimerSec] = useState(0);
  const [timerRunning, setTimerRunning] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [finalStats, setFinalStats] = useState(null);
  const timerRef = useRef(null);

  const currentQuestion = quiz.questions[currentIndex];
  const currentAnswer = answers[currentQuestion._id] || { selected: [], revealed: false };

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setTimerSec((s) => s + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [timerRunning]);

  const stats = useMemo(() => {
    let correct = 0,
      wrong = 0,
      answered = 0;
    quiz.questions.forEach((q) => {
      const a = answers[q._id];
      if (a?.revealed) {
        answered++;
        if (a.isCorrect) correct++;
        else wrong++;
      }
    });
    return { correct, wrong, answered, unanswered: total - answered, total };
  }, [answers, quiz.questions, total]);

  const isQuestionCorrect = (q) => answers[q._id]?.revealed && answers[q._id]?.isCorrect;
  const isQuestionWrong = (q) => answers[q._id]?.revealed && !answers[q._id]?.isCorrect;
  const isQuestionAnswered = (q) => !!answers[q._id]?.revealed;

  const filteredIds = useMemo(() => {
    let list = quiz.questions;
    if (filter === "answered") list = list.filter(isQuestionAnswered);
    else if (filter === "unanswered") list = list.filter((q) => !isQuestionAnswered(q));
    else if (filter === "correct") list = list.filter(isQuestionCorrect);
    else if (filter === "incorrect") list = list.filter(isQuestionWrong);
    else if (filter === "bookmarked") list = list.filter((q) => bookmarks.has(q._id));
    else if (filter === "flagged") list = list.filter((q) => flags.has(q._id));

    if (search.trim()) {
      const s = search.trim().toLowerCase();
      list = list.filter(
        (q) =>
          q.questionText.toLowerCase().includes(s) ||
          q.options.some((o) => o.toLowerCase().includes(s))
      );
    }
    return new Set(list.map((q) => q._id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz.questions, filter, search, answers, bookmarks, flags]);

  const goTo = (index) => {
    if (index >= 0 && index < total) setCurrentIndex(index);
  };

  const handleJump = () => {
    const v = parseInt(jumpValue, 10);
    if (v >= 1 && v <= total) {
      goTo(v - 1);
      setJumpValue("");
    }
  };

  // Calls the backend to check ONE question's answer and reveal correctness,
  // without exposing the rest of the quiz's answer key.
  const checkAnswer = async (question, selected) => {
    setAnswers((prev) => ({
      ...prev,
      [question._id]: { selected, revealed: false, checking: true },
    }));
    try {
      const { data } = await api.post(
        `/quizzes/share/${quiz.slug}/questions/${question._id}/check`,
        { selectedIndexes: selected }
      );
      setAnswers((prev) => ({
        ...prev,
        [question._id]: {
          selected,
          revealed: true,
          checking: false,
          isCorrect: data.isCorrect,
          correctOptionIndexes: data.correctOptionIndexes,
        },
      }));
    } catch (err) {
      setAnswers((prev) => ({
        ...prev,
        [question._id]: { selected, revealed: false, checking: false, error: true },
      }));
    }
  };

  // Single-select: clicking an option immediately reveals the result.
  const selectSingle = (optIndex) => {
    if (currentAnswer.revealed || currentAnswer.checking) return;
    checkAnswer(currentQuestion, [optIndex]);
  };

  // Multi-select: toggling builds up a pending selection; "Check Answer"
  // (below) triggers the actual reveal.
  const toggleMulti = (optIndex) => {
    if (currentAnswer.revealed || currentAnswer.checking) return;
    const selected = currentAnswer.selected.includes(optIndex)
      ? currentAnswer.selected.filter((i) => i !== optIndex)
      : [...currentAnswer.selected, optIndex];
    setAnswers((prev) => ({ ...prev, [currentQuestion._id]: { selected, revealed: false } }));
  };

  const confirmMulti = () => {
    if (currentAnswer.selected.length === 0) return;
    checkAnswer(currentQuestion, currentAnswer.selected);
  };

  const tryAgain = () => {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[currentQuestion._id];
      return next;
    });
  };

  const toggleBookmark = () => {
    setBookmarks((prev) => {
      const next = new Set(prev);
      next.has(currentQuestion._id) ? next.delete(currentQuestion._id) : next.add(currentQuestion._id);
      return next;
    });
  };

  const toggleFlag = () => {
    setFlags((prev) => {
      const next = new Set(prev);
      next.has(currentQuestion._id) ? next.delete(currentQuestion._id) : next.add(currentQuestion._id);
      return next;
    });
  };

  const finishQuiz = async () => {
    setFinishing(true);
    setTimerRunning(false);
    try {
      const payload = quiz.questions.map((q) => answers[q._id]?.selected || []);
      const { data } = await api.post(`/quizzes/${quiz._id}/attempt`, { answers: payload });
      setFinalStats(data);
    } catch (err) {
      setFinalStats(null);
    } finally {
      setFinishing(false);
      setShowResults(true);
    }
  };

  const wrongQuestions = quiz.questions.filter(isQuestionWrong);

  return (
    <div className="qp-root">
      {/* Sidebar */}
      <aside className={`qp-sidebar ${sidebarOpen ? "" : "qp-collapsed"}`}>
        <div className="qp-sidebar-header">
          <div className="qp-sidebar-title">{quiz.title}</div>
          <input
            type="text"
            className="qp-search-input"
            placeholder="Search questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="qp-filter-bar">
          {[
            ["all", "All"],
            ["answered", "Answered"],
            ["unanswered", "Unanswered"],
            ["correct", "Correct"],
            ["incorrect", "Incorrect"],
            ["bookmarked", "Bookmarked"],
            ["flagged", "Flagged"],
          ].map(([key, label]) => (
            <button
              key={key}
              className={`qp-filter-btn ${filter === key ? "qp-active" : ""}`}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
        {(search || filter !== "all") && (
          <div className="qp-search-info">{filteredIds.size} question(s)</div>
        )}
        <div className="qp-grid">
          {quiz.questions.map((q, i) => {
            const classes = ["qp-num"];
            if (i === currentIndex) classes.push("qp-current");
            if (isQuestionCorrect(q)) classes.push("qp-answered");
            if (isQuestionWrong(q)) classes.push("qp-wrong");
            if (bookmarks.has(q._id)) classes.push("qp-bookmarked");
            if (flags.has(q._id)) classes.push("qp-flagged");
            if (!filteredIds.has(q._id)) classes.push("qp-dimmed");
            return (
              <div
                key={q._id}
                className={classes.join(" ")}
                title={`Question ${i + 1}`}
                onClick={() => filteredIds.has(q._id) && goTo(i)}
              >
                {i + 1}
              </div>
            );
          })}
        </div>
      </aside>

      {/* Main */}
      <div className="qp-main">
        <div className="qp-top-bar">
          <button
            className="qp-icon-btn"
            title="Toggle sidebar"
            onClick={() => setSidebarOpen((v) => !v)}
          >
            &#9776;
          </button>
          <button className="qp-icon-btn" title="Exit quiz" onClick={() => navigate("/")}>
            &#10005;
          </button>
          <div className="qp-top-info">
            <div className="qp-progress-wrap">
              <div className="qp-progress-bar">
                <div
                  className="qp-progress-fill"
                  style={{ width: (stats.answered / total) * 100 + "%" }}
                />
              </div>
              <span className="qp-progress-text">
                {stats.answered} / {total}
              </span>
            </div>
            <div className="qp-score-badge">
              <span>
                Correct: <b>{stats.correct}</b>
              </span>
              <span>
                Wrong: <b>{stats.wrong}</b>
              </span>
            </div>
          </div>
          <span className="qp-timer-display">{formatTime(timerSec)}</span>
          <button
            className="qp-icon-btn"
            title="Pause/resume timer"
            onClick={() => setTimerRunning((v) => !v)}
          >
            {timerRunning ? "\u23F8" : "\u25B6"}
          </button>
          <button
            className={"qp-icon-btn " + (bookmarks.has(currentQuestion._id) ? "qp-active-bookmark" : "")}
            title="Bookmark"
            onClick={toggleBookmark}
          >
            {bookmarks.has(currentQuestion._id) ? "\u2605" : "\u2606"}
          </button>
          <button
            className={"qp-icon-btn " + (flags.has(currentQuestion._id) ? "qp-active-flag" : "")}
            title="Flag for review"
            onClick={toggleFlag}
          >
            &#9873;
          </button>
          <button className="qp-nav-btn qp-primary" onClick={finishQuiz} disabled={finishing}>
            {finishing ? "Finishing..." : "Finish"}
          </button>
        </div>

        <div className="qp-question-area">
          <div className="qp-q-header">
            <span className="qp-q-number">Question {currentIndex + 1}</span>
            {currentQuestion.isMultiSelect && (
              <span className="qp-q-multi-badge">Multiple answers</span>
            )}
            <span className="qp-q-page">
              {currentIndex + 1} of {total}
            </span>
          </div>

          <div className="qp-q-text">{currentQuestion.questionText}</div>

          <div className="qp-choices">
            {currentQuestion.options.map((option, i) => {
              const letter = LETTERS[i] || i + 1;
              const selected = currentAnswer.selected.includes(i);
              const revealed = currentAnswer.revealed;
              const isCorrectOption = revealed && currentAnswer.correctOptionIndexes && currentAnswer.correctOptionIndexes.includes(i);
              const isWrongSelected = revealed && selected && !isCorrectOption;

              const classes = ["qp-choice"];
              if (selected) classes.push("qp-selected");
              if (revealed) classes.push("qp-disabled");
              if (isCorrectOption) classes.push("qp-correct-reveal");
              if (isWrongSelected) classes.push("qp-wrong-reveal");

              return (
                <div
                  key={i}
                  className={classes.join(" ")}
                  onClick={() =>
                    currentQuestion.isMultiSelect ? toggleMulti(i) : selectSingle(i)
                  }
                >
                  <span className="qp-choice-letter">{letter}</span>
                  <span className="qp-choice-text">{option}</span>
                </div>
              );
            })}
          </div>

          {currentQuestion.isMultiSelect && !currentAnswer.revealed && (
            <button
              className="qp-check-btn"
              disabled={currentAnswer.selected.length === 0 || currentAnswer.checking}
              onClick={confirmMulti}
            >
              {currentAnswer.checking ? "Checking..." : "Check Answer"}
            </button>
          )}

          {currentAnswer.revealed && (
            <div className="qp-answer-section">
              <div className="qp-answer-label">Result</div>
              <div className={"qp-answer-value " + (currentAnswer.isCorrect ? "qp-is-correct" : "qp-is-wrong")}>
                {currentAnswer.isCorrect ? "Correct! \u2705" : "Incorrect \u274C"}
              </div>
              {!currentAnswer.isCorrect && (
                <button
                  onClick={tryAgain}
                  className="text-sm underline"
                  style={{ color: "var(--qp-accent)" }}
                >
                  Try this question again
                </button>
              )}
            </div>
          )}
        </div>

        <div className="qp-bottom-bar">
          <button
            className="qp-nav-btn qp-secondary"
            onClick={() => goTo(currentIndex - 1)}
            disabled={currentIndex === 0}
          >
            &#8592; Prev
          </button>
          <div className="qp-spacer" />
          <input
            type="number"
            className="qp-jump-input"
            placeholder="#"
            min={1}
            max={total}
            value={jumpValue}
            onChange={(e) => setJumpValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleJump()}
          />
          <button className="qp-nav-btn qp-secondary" onClick={handleJump}>
            Jump
          </button>
          <div className="qp-spacer" />
          <button
            className="qp-nav-btn qp-primary"
            onClick={() => goTo(currentIndex + 1)}
            disabled={currentIndex === total - 1}
          >
            Next &#8594;
          </button>
        </div>
      </div>

      {/* Results modal */}
      {showResults && (
        <div className="qp-results-overlay" onClick={(e) => e.target === e.currentTarget && setShowResults(false)}>
          <div className="qp-results-modal">
            <div className="qp-results-title">Quiz Results</div>
            <div className="qp-results-grid">
              <div className="qp-result-card qp-gold">
                <div className="qp-num">
                  {stats.answered ? Math.round((stats.correct / stats.answered) * 100) : 0}%
                </div>
                <div className="qp-lbl">Score</div>
              </div>
              <div className="qp-result-card qp-green">
                <div className="qp-num">{finalStats && finalStats.score !== undefined ? finalStats.score : stats.correct}</div>
                <div className="qp-lbl">Correct</div>
              </div>
              <div className="qp-result-card qp-red">
                <div className="qp-num">{stats.wrong}</div>
                <div className="qp-lbl">Wrong</div>
              </div>
              <div className="qp-result-card">
                <div className="qp-num">{stats.unanswered}</div>
                <div className="qp-lbl">Unanswered</div>
              </div>
              <div className="qp-result-card">
                <div className="qp-num">{stats.answered}</div>
                <div className="qp-lbl">Answered</div>
              </div>
              <div className="qp-result-card">
                <div className="qp-num">{formatTime(timerSec)}</div>
                <div className="qp-lbl">Time Used</div>
              </div>
            </div>

            {wrongQuestions.length > 0 ? (
              <div className="qp-wrong-list">
                <h3>Wrong Answers ({wrongQuestions.length})</h3>
                {wrongQuestions.map((q) => {
                  const i = quiz.questions.findIndex((x) => x._id === q._id);
                  return (
                    <div
                      key={q._id}
                      className="qp-wrong-item"
                      onClick={() => {
                        goTo(i);
                        setShowResults(false);
                      }}
                    >
                      <span className="qp-wi-num">{i + 1}</span>
                      <span className="qp-wi-text">{q.questionText}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              stats.answered > 0 && <div className="qp-no-results-msg">No wrong answers!</div>
            )}

            <button className="qp-close-results" onClick={() => setShowResults(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizPlayer;
