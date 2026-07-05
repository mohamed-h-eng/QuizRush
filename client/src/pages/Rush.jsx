import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios.js";

const CreateQuiz = () => {
  const navigate = useNavigate();

  const [isPublic, setIsPublic] = useState(true);

  const [file, setFile] = useState(null);
  const [textContent, setTextContent] = useState("");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

 const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");

  if (!file && !textContent.trim()) {
    setError("Please upload a file or paste some text.");
    return;
  }

  setSubmitting(true);

  try {
    const formData = new FormData();

    if (file) {
      formData.append("file", file);
    }

    if (textContent.trim()) {
      formData.append("text", textContent);
    }

    // Generate quizzes using n8n
    const { data } = await api.post(
      "http://localhost:5678/webhook-test/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    // Handle:
    // [ {...} ]
    // [[ {...} ]]
    // { quizzes:[...] }
    let quizzes;

    // if (Array.isArray(data)) {
    //   quizzes = Array.isArray(data[0]) ? data[0] : data;
    // } else if (Array.isArray(data.quizzes)) {
    //   quizzes = data.quizzes;
    // } else {
    //   throw new Error("AI did not return a valid quizzes array.");
    // }

    // Inject visibility flag
    // const payload = quizzes.map((quiz) => ({
    //   ...quiz,
    //   isPublic,
    // }));

    // Save quizzes to your backend
    await api.post("/api/quizzes/rush", data);

    navigate("/my-quizzes");
  } catch (err) {
    console.error(err);

    setError(
      err.response?.data?.message ||
        err.message ||
        "Failed to generate quizzes."
    );
  } finally {
    setSubmitting(false);
  }
};
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        Generate Quizzes with AI
      </h1>

      <form onSubmit={handleSubmit}>
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4">

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            Make generated quizzes public
          </label>

          <div className="border-t pt-4">
            <label className="block font-medium mb-2">
              Upload a document
            </label>

            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt,.md"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full"
            />
          </div>

          <div className="text-center text-slate-500 font-medium">
            OR
          </div>

          <div>
            <label className="block font-medium mb-2">
              Paste text
            </label>

            <textarea
              rows={10}
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Paste your lecture notes, textbook, article, or study material here..."
              className="w-full border rounded-md px-3 py-2"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="bg-brand-500 text-white px-6 py-2 rounded-md hover:bg-brand-600 disabled:opacity-50"
          >
            {submitting ? "Generating..." : "Generate Quizzes"}
          </button>

        </div>
      </form>
    </div>
  );
};

export default CreateQuiz;