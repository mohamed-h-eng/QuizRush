import QuestionEditor from "./QuestionEditor.jsx";

// Best-effort client-side normalization for drafts the backend flagged as
// invalid (e.g. AI hallucinated a correctAnswer that doesn't match any
// option). This never blocks editing — it just gives the user something
// reasonable to start fixing instead of a blank form. The backend re-validates
// for real when the draft is actually submitted via POST /api/quizzes.
export const draftFromRaw = (raw) => {
  const questions = Array.isArray(raw?.questions) ? raw.questions : [];
  return {
    title: raw?.title || "",
    topic: raw?.topic || "",
    description: raw?.description || "",
    isPublic: raw?.isPublic !== undefined ? !!raw.isPublic : true,
    questions: questions.length
      ? questions.map((q) => {
          const options = Array.isArray(q.options) ? q.options.map((o) => `${o}`) : ["", ""];
          let correctOptionIndexes = [];

          if (Array.isArray(q.correctOptionIndexes)) {
            correctOptionIndexes = q.correctOptionIndexes.map(Number);
          } else if (typeof q.correctOptionIndex === "number") {
            correctOptionIndexes = [q.correctOptionIndex];
          } else if (Array.isArray(q.correctAnswers)) {
            correctOptionIndexes = q.correctAnswers
              .map((ans) =>
                options.findIndex((o) => o.trim().toLowerCase() === `${ans}`.trim().toLowerCase())
              )
              .filter((i) => i !== -1);
          } else if (typeof q.correctAnswer === "string") {
            const match = options.findIndex(
              (o) => o.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()
            );
            if (match !== -1) correctOptionIndexes = [match];
          }

          correctOptionIndexes = correctOptionIndexes.filter(
            (i) => i >= 0 && i < options.length
          );
          if (correctOptionIndexes.length === 0) correctOptionIndexes = [0];

          const isMultiSelect =
            q.isMultiSelect !== undefined ? !!q.isMultiSelect : correctOptionIndexes.length > 1;

          return {
            questionText: q.questionText || q.question || q.text || "",
            options: options.length >= 2 ? options : [...options, ""],
            isMultiSelect,
            correctOptionIndexes,
          };
        })
      : [{ questionText: "", options: ["", ""], isMultiSelect: false, correctOptionIndexes: [0] }],
  };
};

const QuizDraftCard = ({ draft, onChange, onRemove, error }) => {
  const updateField = (field, value) => onChange({ ...draft, [field]: value });

  const updateQuestion = (index, updated) => {
    onChange({
      ...draft,
      questions: draft.questions.map((q, i) => (i === index ? updated : q)),
    });
  };

  const addQuestion = () =>
    onChange({
      ...draft,
      questions: [
        ...draft.questions,
        { questionText: "", options: ["", ""], isMultiSelect: false, correctOptionIndexes: [0] },
      ],
    });

  const removeQuestion = (index) =>
    onChange({ ...draft, questions: draft.questions.filter((_, i) => i !== index) });

  return (
    <div className="border border-slate-200 rounded-lg bg-white p-4 mb-6">
      {error && (
        <div className="bg-amber-50 border border-amber-300 text-amber-800 text-sm rounded-md px-3 py-2 mb-3">
          The AI-generated draft had an issue and needs a fix before saving: <strong>{error}</strong>
        </div>
      )}

      <div className="flex justify-between items-start mb-3">
        <input
          type="text"
          value={draft.title}
          onChange={(e) => updateField("title", e.target.value)}
          placeholder="Quiz title"
          className="flex-1 font-semibold border border-slate-300 rounded-md px-3 py-2 mr-3"
          required
        />
        <button
          type="button"
          onClick={onRemove}
          className="text-red-500 text-sm hover:text-red-600 whitespace-nowrap"
        >
          Discard quiz
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-3">
        <input
          type="text"
          value={draft.topic}
          onChange={(e) => updateField("topic", e.target.value)}
          placeholder="Topic"
          className="border border-slate-300 rounded-md px-3 py-2"
          required
        />
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={draft.isPublic}
            onChange={(e) => updateField("isPublic", e.target.checked)}
          />
          Public and shareable
        </label>
      </div>

      <textarea
        value={draft.description}
        onChange={(e) => updateField("description", e.target.value)}
        placeholder="Description (optional)"
        rows={2}
        className="w-full border border-slate-300 rounded-md px-3 py-2 mb-4"
      />

      <p className="text-sm font-medium text-slate-600 mb-2">
        {draft.questions.length} question{draft.questions.length !== 1 ? "s" : ""} — review before saving
      </p>

      {draft.questions.map((q, i) => (
        <QuestionEditor
          key={i}
          index={i}
          question={q}
          onChange={updateQuestion}
          onRemove={removeQuestion}
          canRemove={draft.questions.length > 1}
        />
      ))}

      <button
        type="button"
        onClick={addQuestion}
        className="text-brand-600 text-sm hover:underline"
      >
        + Add another question
      </button>
    </div>
  );
};

export default QuizDraftCard;
