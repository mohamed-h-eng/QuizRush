import { useEffect, useState, useCallback } from "react";
import api from "../api/axios";
import SearchBar from "../components/SearchBar.jsx";
import QuizCard from "../components/QuizCard.jsx";

const Home = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState("");

  const fetchQuizzes = useCallback(async (topicFilter) => {
    setLoading(true);
    try {
      const { data } = await api.get("/quizzes", {
        params: topicFilter ? { topic: topicFilter } : {},
      });
      setQuizzes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuizzes("");
  }, [fetchQuizzes]);

  const handleSearch = (value) => {
    setTopic(value);
    fetchQuizzes(value);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Browse Quizzes</h1>
      <p className="text-slate-500 mb-4">Search by topic to find quizzes shared by the community.</p>

      <SearchBar onSearch={handleSearch} initialValue={topic} />

      {loading ? (
        <p className="text-slate-500">Loading quizzes...</p>
      ) : quizzes.length === 0 ? (
        <p className="text-slate-500">No quizzes found{topic ? ` for topic "${topic}"` : ""}.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {quizzes.map((quiz) => (
            <QuizCard key={quiz._id} quiz={quiz} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
