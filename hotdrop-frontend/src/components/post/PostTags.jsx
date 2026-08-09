import React, { useState } from "react";
import { Tag, X, Sparkles } from "lucide-react";

function PostTags({ tags, postTitle }) {
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

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {initialTags.map((tag, idx) => (
        <span
          key={idx}
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-extrabold uppercase border border-blue-100/80 shadow-2xs hover:bg-blue-100 transition-colors"
        >
          <Tag size={10} className="text-blue-500" />
          #{tag.replace(/^#/, "")}
        </span>
      ))}

      {remainingCount > 0 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowModal(true);
            }}
            className="inline-flex items-center justify-center px-2 py-0.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black tracking-wider transition-all duration-200 cursor-pointer shadow-sm active:scale-95 shrink-0"
            title={`View all ${tagList.length} tags`}
          >
            +{remainingCount}
          </button>

          {showModal && (
            <div
              className="fixed inset-0 z-[9999] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 select-none"
              onClick={(e) => {
                e.stopPropagation();
                setShowModal(false);
              }}
            >
              <div
                className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150 flex flex-col space-y-4"
                onClick={(e) => e.stopPropagation()}
              >
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
                  {tagList.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-extrabold border border-blue-100 shadow-2xs hover:bg-blue-100 transition-all"
                    >
                      <Sparkles size={12} className="text-blue-500" />
                      #{tag.replace(/^#/, "")}
                    </span>
                  ))}
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
