import { Link } from "react-router-dom";

const QuizCard = ({ quiz, showOwnerActions, onDelete }) => {
  const shareUrl = `${window.location.origin}/quiz/share/${quiz.slug}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    alert("Share link copied to clipboard!");
  };

  return (
    <div className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm flex flex-col gap-2">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-slate-800">{quiz.title}</h3>
          <span className="inline-block text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full mt-1">
            {quiz.topic}
          </span>
        </div>
        <span className="text-xs text-slate-400">{quiz.questions?.length ?? ""} Qs</span>
      </div>

      {quiz.description && (
        <p className="text-sm text-slate-500 line-clamp-2">{quiz.description}</p>
      )}

      <div className="flex gap-3 mt-2 text-sm">
        <Link
          to={`/quiz/share/${quiz.slug}`}
          className="text-brand-600 font-medium hover:underline"
        >
          Take quiz
        </Link>
        <button onClick={copyLink} className="text-slate-500 hover:text-slate-700">
          Copy share link
        </button>

        {showOwnerActions && (
          <>
            <Link to={`/edit/${quiz._id}`} className="text-slate-500 hover:text-slate-700">
              Edit
            </Link>
            <button
              onClick={() => onDelete(quiz._id)}
              className="text-red-500 hover:text-red-600"
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default QuizCard;
