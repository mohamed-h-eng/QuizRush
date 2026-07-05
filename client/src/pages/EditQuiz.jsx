import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import QuestionEditor from "../components/QuestionEditor.jsx";

const EditQuiz = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/quizzes/${id}`);
        setQuiz(data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load quiz");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const updateField = (field, value) => setQuiz((prev) => ({ ...prev, [field]: value }));

  const updateQuestion = (index, updated) => {
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) => (i === index ? updated : q)),
    }));
  };

  const addQuestion = () =>
    setQuiz((prev) => ({
      ...prev,
      questions: [...prev.questions, { questionText: "", options: ["", ""], correctOptionIndex: 0 }],
    }));

  const removeQuestion = (index) =>
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.put(`/quizzes/${id}`, {
        title: quiz.title,
        topic: quiz.topic,
        description: quiz.description,
        isPublic: quiz.isPublic,
        questions: quiz.questions,
      });
      navigate("/my-quizzes");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update quiz");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="text-slate-500">Loading...</p>;
  if (!quiz) return <p className="text-red-500">{error || "Quiz not found"}</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Edit Quiz</h1>

      <form onSubmit={handleSubmit}>
        <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4 space-y-3">
          <input
            type="text"
            value={quiz.title}
            onChange={(e) => updateField("title", e.target.value)}
            className="w-full border border-slate-300 rounded-md px-3 py-2"
            required
          />
          <input
            type="text"
            value={quiz.topic}
            onChange={(e) => updateField("topic", e.target.value)}
            className="w-full border border-slate-300 rounded-md px-3 py-2"
            required
          />
          <textarea
            value={quiz.description}
            onChange={(e) => updateField("description", e.target.value)}
            className="w-full border border-slate-300 rounded-md px-3 py-2"
            rows={2}
          />
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={quiz.isPublic}
              onChange={(e) => updateField("isPublic", e.target.checked)}
            />
            Make this quiz public and shareable
          </label>
        </div>

        <h2 className="font-semibold mb-2">Questions</h2>
        {quiz.questions.map((q, i) => (
          <QuestionEditor
            key={q._id || i}
            index={i}
            question={q}
            onChange={updateQuestion}
            onRemove={removeQuestion}
            canRemove={quiz.questions.length > 1}
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

        <button
          type="submit"
          disabled={submitting}
          className="bg-brand-500 text-white px-6 py-2 rounded-md hover:bg-brand-600 disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
};

export default EditQuiz;
