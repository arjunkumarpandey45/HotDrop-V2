import { useState } from "react";

function PostDescription({ description }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxLength = 99;

  if (!description) return null;

  if (description.length <= maxLength) {
    return (
      <p className="text-[12px] text-slate-800 pb-3 font-medium leading-relaxed">
        {description}
      </p>
    );
  }

  return (
    <div className="relative pb-3">
      <p className="text-[12px] text-slate-900 font-bold leading-relaxed">
        {isExpanded ? description : `${description.slice(0, maxLength)}...`}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="ml-1 text-[12px] text-blue-600 hover:text-indigo-400 font-bold transition-colors cursor-pointer inline-block"
        >
          {isExpanded ? " Show Less" : " Read More"}
        </button>
      </p>
    </div>
  );
}

export default PostDescription;
