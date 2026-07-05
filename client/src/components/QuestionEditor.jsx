const QuestionEditor = ({ question, index, onChange, onRemove, canRemove }) => {
  const updateField = (field, value) => {
    onChange(index, { ...question, [field]: value });
  };

  const updateOption = (optIndex, value) => {
    const options = [...question.options];
    options[optIndex] = value;
    updateField("options", options);
  };

  const addOption = () => {
    updateField("options", [...question.options, ""]);
  };

  const removeOption = (optIndex) => {
    if (question.options.length <= 2) return; // enforce minimum 2 options
    const options = question.options.filter((_, i) => i !== optIndex);
    let correctOptionIndex = question.correctOptionIndex;
    if (correctOptionIndex >= options.length) correctOptionIndex = 0;
    onChange(index, { ...question, options, correctOptionIndex });
  };

  return (
    <div className="border border-slate-200 rounded-lg p-4 bg-white mb-4">
      <div className="flex justify-between items-center mb-3">
        <span className="font-medium text-slate-700">Question {index + 1}</span>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-red-500 text-sm hover:text-red-600"
          >
            Remove question
          </button>
        )}
      </div>

      <input
        type="text"
        placeholder="Question text"
        value={question.questionText}
        onChange={(e) => updateField("questionText", e.target.value)}
        className="w-full border border-slate-300 rounded-md px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
        required
      />

      <div className="space-y-2">
        {question.options.map((option, optIndex) => (
          <div key={optIndex} className="flex items-center gap-2">
            <input
              type="radio"
              name={`correct-${index}`}
              checked={question.correctOptionIndex === optIndex}
              onChange={() => updateField("correctOptionIndex", optIndex)}
              title="Mark as correct answer"
            />
            <input
              type="text"
              placeholder={`Option ${optIndex + 1}`}
              value={option}
              onChange={(e) => updateOption(optIndex, e.target.value)}
              className="flex-1 border border-slate-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            />
            {question.options.length > 2 && (
              <button
                type="button"
                onClick={() => removeOption(optIndex)}
                className="text-slate-400 hover:text-red-500"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addOption}
        className="text-brand-600 text-sm mt-2 hover:underline"
      >
        + Add option
      </button>
      <p className="text-xs text-slate-400 mt-2">
        Select the radio button next to the correct option.
      </p>
    </div>
  );
};

export default QuestionEditor;
