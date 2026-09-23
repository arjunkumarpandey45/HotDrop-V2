import { X, Sparkles, Boxes } from "lucide-react";
import { FILTER_CATEGORIES } from "../../constants/topics";

export function TechFilterModal({ isOpen, onClose, onSelectTag }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 select-none">
      <button 
        type="button"
        aria-label="Close filter modal"
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer border-0 p-0"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
            onClose();
          }
        }}
      />
      <div 
        className="relative bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]"
      >
        <div className="p-4 px-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/60">
          <div className="flex items-center gap-2 text-slate-900">
            <Boxes size={18} className="text-blue-600" />
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">
              Filter Project by Tech Stack
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 rounded-full transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white flex items-center justify-between gap-3 shadow-sm">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-amber-300 text-[10px] font-black uppercase">
              <Sparkles size={12} /> HotDrop Stack Filter
            </div>
            <p className="text-xs font-bold text-blue-100">
              Select any tech stack to discover matching live project ! 🚀
            </p>
          </div>
        </div>

        <div className="p-4 overflow-y-auto space-y-4 max-h-[60vh]">
          {FILTER_CATEGORIES.map((cat) => (
            <div key={cat.id} className="space-y-2">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-tight block">
                {cat.category}
              </span>
              <div className="flex flex-wrap gap-2">
                {cat.tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      onClose();
                      onSelectTag(tag);
                    }}
                    className="bg-slate-50 hover:bg-blue-600 hover:text-white border border-slate-200/80 text-slate-800 text-xs font-extrabold px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TechFilterModal;
