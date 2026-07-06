import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import QuestionEditor from "../components/QuestionEditor.jsx";

const emptyQuestion = () => ({
  questionText: "",
  options: ["", ""],
  isMultiSelect: false,
  correctOptionIndexes: [0],
});

const CreateQuiz = () => {
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const updateQuestion = (index, updated) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? updated : q)));
  };

  const addQuestion = () => setQuestions((prev) => [...prev, emptyQuestion()]);

  const removeQuestion = (index) =>
    setQuestions((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (questions.some((q) => !q.questionText.trim() || q.options.some((o) => !o.trim()))) {
      setError("Please fill in all question and option fields.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/quizzes", { title, topic, description, isPublic, questions });
      navigate("/my-quizzes");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create quiz");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Create a Quiz</h1>

      <form onSubmit={handleSubmit}>
        <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4 space-y-3">
          <input
            type="text"
            placeholder="Quiz title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-slate-300 rounded-md px-3 py-2"
            required
          />
          <input
            type="text"
            placeholder="Topic (e.g. JavaScript, History)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full border border-slate-300 rounded-md px-3 py-2"
            required
          />
          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-slate-300 rounded-md px-3 py-2"
            rows={2}
          />
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            Make this quiz public and shareable
          </label>
        </div>

        <h2 className="font-semibold mb-2">Questions</h2>
        {questions.map((q, i) => (
          <QuestionEditor
            key={i}
            index={i}
            question={q}
            onChange={updateQuestion}
            onRemove={removeQuestion}
            canRemove={questions.length > 1}
          />
        ))}

        <button
          type="button"
          onClick={addQuestion}
          className="text-brand-600 font-medium hover:underline mb-6"
        >
          + Add another question
        </button>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <div>
          <button
            type="submit"
            disabled={submitting}
            className="bg-brand-500 text-white px-6 py-2 rounded-md hover:bg-brand-600 disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create Quiz"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateQuiz;
