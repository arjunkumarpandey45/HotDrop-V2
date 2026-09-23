import { useState } from "react";
import { Tag, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

function PostTags({ tags, postTitle, onTagClick }) {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  let rawTags = tags;
  if (!rawTags) return null;

  let tagList = [];
  if (Array.isArray(rawTags)) {
    tagList = rawTags
      .flatMap((t) => (typeof t === "string" ? t.split(",") : []))
      .map((t) => t.trim())
      .filter(Boolean);
  } else if (typeof rawTags === "string") {
    tagList = rawTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }

  if (tagList.length === 0) return null;

  const initialTags = tagList.slice(0, 3);
  const remainingCount = tagList.length - 3;

  const handleTagClick = (e, rawTag) => {
    e.stopPropagation();
    e.preventDefault();
    setShowModal(false);
    const cleanTag = (rawTag || "").replace(/^#+/, "").trim();
    if (!cleanTag) return;

    if (typeof onTagClick === "function") {
      onTagClick(cleanTag);
    } else {
      navigate(`/search?q=${encodeURIComponent(cleanTag)}`);
    }
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {initialTags.map((tag, idx) => {
        const displayTag = tag.replace(/^#+/, "");
        return (
          <button
            key={idx}
            type="button"
            onClick={(e) => handleTagClick(e, tag)}
            title={`Search #${displayTag}`}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 text-[10px] font-extrabold uppercase border border-blue-100/80 hover:border-blue-200 shadow-2xs transition-all duration-150 cursor-pointer active:scale-95 group/tag select-none"
          >
            <Tag size={10} className="text-blue-500 group-hover/tag:scale-110 transition-transform" />
            <span>#{displayTag}</span>
          </button>
        );
      })}

      {remainingCount > 0 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setShowModal(true);
            }}
            className="inline-flex items-center justify-center px-2 py-0.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black tracking-wider transition-all duration-200 cursor-pointer shadow-sm active:scale-95 shrink-0"
            title={`View all ${tagList.length} tags`}
          >
            +{remainingCount}
          </button>

          {showModal && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200 select-none">
              <div
                role="button"
                tabIndex={0}
                aria-label="Close tags modal"
                className="fixed inset-0 bg-slate-950/60 backdrop-blur-md"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowModal(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
                    e.stopPropagation();
                    setShowModal(false);
                  }
                }}
              />
              <div className="relative z-10 bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150 flex flex-col space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                      <Tag size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                        Tech Stack Tags
                      </h4>
                      <p className="text-[10px] text-slate-400 font-semibold truncate max-w-[200px]">
                        {postTitle || "Project Tags"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowModal(false);
                    }}
                    className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-full transition cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto p-1">
                  {tagList.map((tag, idx) => {
                    const displayTag = tag.replace(/^#+/, "");
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={(e) => handleTagClick(e, tag)}
                        title={`Search #${displayTag}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 text-xs font-extrabold border border-blue-100 hover:border-blue-200 shadow-2xs transition-all duration-150 cursor-pointer active:scale-95 group/tag select-none"
                      >
                        <Tag size={11} className="text-blue-500 group-hover/tag:scale-110 transition-transform" />
                        <span>#{displayTag}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-slate-100 text-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowModal(false);
                    }}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer shadow-md shadow-blue-500/20"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default PostTags;
