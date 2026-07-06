import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import QuizPlayer from "../components/QuizPlayer.jsx";

const SharedQuiz = () => {
  const { slug } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/quizzes/share/${slug}`);
        setQuiz(data);
      } catch (err) {
        setError(err.response?.data?.message || "Quiz not found");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  if (loading) return <p className="text-slate-500">Loading quiz...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  // QuizPlayer renders itself as a fixed, full-viewport experience
  // (sidebar + question area), so no extra wrapper/padding here.
  return <QuizPlayer quiz={quiz} />;
};

export default SharedQuiz;
