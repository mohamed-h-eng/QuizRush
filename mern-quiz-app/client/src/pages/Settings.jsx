import { useEffect, useState } from "react";
import api from "../api/axios";

const Settings = () => {
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await api.get("/auth/api-key");
    setApiKey(data.apiKey);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleRegenerate = async () => {
    if (!window.confirm("Regenerating will invalidate the old key. Continue?")) return;
    setRegenerating(true);
    try {
      const { data } = await api.post("/auth/api-key/regenerate");
      setApiKey(data.apiKey);
    } finally {
      setRegenerating(false);
    }
  };

  const copyKey = async () => {
    await navigator.clipboard.writeText(apiKey);
    alert("API key copied to clipboard!");
  };

  const endpointUrl = `${window.location.origin.replace(":5173", ":5000")}/api/integrations/quizzes`;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Integrations</h1>
      <p className="text-slate-500 mb-6">
        Use this API key to let external tools like n8n push quizzes into your account.
      </p>

      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4">
        <label className="text-sm font-medium text-slate-600">Your API key</label>
        {loading ? (
          <p className="text-slate-400 mt-2">Loading...</p>
        ) : (
          <div className="flex gap-2 mt-2">
            <input
              readOnly
              value={apiKey}
              className="flex-1 border border-slate-300 rounded-md px-3 py-2 font-mono text-sm bg-slate-50"
            />
            <button
              onClick={copyKey}
              className="px-3 py-2 rounded-md border border-slate-300 hover:bg-slate-100 text-sm"
            >
              Copy
            </button>
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="px-3 py-2 rounded-md bg-red-50 text-red-600 hover:bg-red-100 text-sm disabled:opacity-50"
            >
              {regenerating ? "Regenerating..." : "Regenerate"}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 text-sm text-slate-600 space-y-2">
        <p className="font-medium text-slate-700">n8n HTTP Request setup</p>
        <p>
          Method: <span className="font-mono">POST</span> — URL:{" "}
          <span className="font-mono break-all">{endpointUrl}</span>
        </p>
        <p>Header: <span className="font-mono">x-api-key: {"<your key above>"}</span></p>
        <p>Body (JSON) — single quiz, or wrap multiple as <span className="font-mono">{"{ \"quizzes\": [...] }"}</span>:</p>
        <pre className="bg-slate-50 border border-slate-200 rounded-md p-3 overflow-x-auto text-xs">
{`{
  "title": "Capitals of the World",
  "topic": "Geography",
  "description": "10 quick questions",
  "isPublic": true,
  "questions": [
    {
      "questionText": "Capital of France?",
      "options": ["Paris", "Rome", "Berlin", "Madrid"],
      "correctAnswer": "Paris"
    },
    {
      "questionText": "Which of these are prime numbers?",
      "options": ["2", "4", "5", "9"],
      "correctAnswers": ["2", "5"],
      "isMultiSelect": true
    }
  ]
}`}
        </pre>
      </div>
    </div>
  );
};

export default Settings;
