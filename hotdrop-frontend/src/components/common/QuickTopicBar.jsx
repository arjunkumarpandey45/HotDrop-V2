import { SlidersHorizontal, Boxes } from "lucide-react";
import { QUICK_TOPICS } from "../../constants/topics";

export function QuickTopicBar({ onOpenFilter, onSelectTopic, className = "" }) {
  return (
    <div className={`flex items-center justify-between gap-2.5 ${className}`}>
      <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-0.5 flex-1 min-w-0">
        <button
          type="button"
          onClick={onOpenFilter}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider shrink-0 shadow-md shadow-blue-500/20 transition cursor-pointer"
        >
          <SlidersHorizontal size={14} />
          <span>Filter</span>
        </button>

        <div className="h-4 w-[1px] bg-slate-200 shrink-0" />

        {QUICK_TOPICS.map((topic) => (
          <button
            key={topic}
            type="button"
            onClick={() => onSelectTopic(topic)}
            className="px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-700 text-[11px] font-extrabold whitespace-nowrap transition cursor-pointer shrink-0 border border-slate-200/70"
          >
            #{topic}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onOpenFilter}
        className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-blue-600 hover:text-white transition cursor-pointer shrink-0"
        title="All Tech Topics Filter"
      >
        <Boxes size={16} />
      </button>
    </div>
  );
}

export default QuickTopicBar;
