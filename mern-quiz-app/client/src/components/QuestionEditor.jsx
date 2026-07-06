const QuestionEditor = ({ question, index, onChange, onRemove, canRemove }) => {
  const correctOptionIndexes = question.correctOptionIndexes || [];
  const isMultiSelect = !!question.isMultiSelect;

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
    // Shift/drop correct indexes to match the new options array
    const newCorrect = correctOptionIndexes
      .filter((i) => i !== optIndex)
      .map((i) => (i > optIndex ? i - 1 : i));
    onChange(index, {
      ...question,
      options,
      correctOptionIndexes: newCorrect.length ? newCorrect : [0],
    });
  };

  const toggleMultiSelect = (checked) => {
    onChange(index, {
      ...question,
      isMultiSelect: checked,
      // Single-select can only keep one correct answer; keep the first if
      // switching off multi-select with several marked correct.
      correctOptionIndexes: checked ? correctOptionIndexes : correctOptionIndexes.slice(0, 1),
    });
  };

  const setSingleCorrect = (optIndex) => {
    updateField("correctOptionIndexes", [optIndex]);
  };

  const toggleMultiCorrect = (optIndex) => {
    const has = correctOptionIndexes.includes(optIndex);
    const next = has
      ? correctOptionIndexes.filter((i) => i !== optIndex)
      : [...correctOptionIndexes, optIndex];
    updateField("correctOptionIndexes", next);
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

      <label className="flex items-center gap-2 text-sm text-slate-600 mb-3">
        <input
          type="checkbox"
          checked={isMultiSelect}
          onChange={(e) => toggleMultiSelect(e.target.checked)}
        />
        Allow multiple correct answers (multi-select)
      </label>

      <div className="space-y-2">
        {question.options.map((option, optIndex) => (
          <div key={optIndex} className="flex items-center gap-2">
            {isMultiSelect ? (
              <input
                type="checkbox"
                checked={correctOptionIndexes.includes(optIndex)}
                onChange={() => toggleMultiCorrect(optIndex)}
                title="Mark as a correct answer"
              />
            ) : (
              <input
                type="radio"
                name={`correct-${index}`}
                checked={correctOptionIndexes[0] === optIndex}
                onChange={() => setSingleCorrect(optIndex)}
                title="Mark as the correct answer"
              />
            )}
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
        {isMultiSelect
          ? "Check every box that is a correct answer."
          : "Select the radio button next to the correct answer."}
      </p>
    </div>
  );
};

export default QuestionEditor;
