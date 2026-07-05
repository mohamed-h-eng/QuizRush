import { useState } from "react";

const SearchBar = ({ onSearch, initialValue = "" }) => {
  const [topic, setTopic] = useState(initialValue);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(topic.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
      <input
        type="text"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="Enter a topic e.g. JavaScript, History, Biology..."
        className="flex-1 border border-slate-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
      <button
        type="submit"
        className="bg-brand-500 text-white px-5 py-2 rounded-md hover:bg-brand-600"
      >
        Search
      </button>
      {topic && (
        <button
          type="button"
          onClick={() => {
            setTopic("");
            onSearch("");
          }}
          className="text-slate-500 px-3 py-2 hover:text-slate-700"
        >
          Clear
        </button>
      )}
    </form>
  );
};

export default SearchBar;
