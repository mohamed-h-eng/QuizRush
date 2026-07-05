import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import QuizCard from "../components/QuizCard.jsx";

const MyQuizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyQuizzes = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/quizzes", { params: { mine: "true" } });
      setQuizzes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyQuizzes();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this quiz? This cannot be undone.")) return;
    try {
      await api.delete(`/quizzes/${id}`);
      setQuizzes((prev) => prev.filter((q) => q._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete quiz");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">My Quizzes</h1>
        <Link
          to="/create"
          className="bg-brand-500 text-white px-4 py-2 rounded-md hover:bg-brand-600"
        >
          + New Quiz
        </Link>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : quizzes.length === 0 ? (
        <p className="text-slate-500">You haven't created any quizzes yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {quizzes.map((quiz) => (
            <QuizCard
              key={quiz._id}
              quiz={quiz}
              showOwnerActions
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyQuizzes;
