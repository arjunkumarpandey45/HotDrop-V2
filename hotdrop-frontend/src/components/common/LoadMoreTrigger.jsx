import { Loader2 } from "lucide-react";

/**
 * Reusable LoadMore / Infinite Scroll Trigger component
 *
 * @param {Object} props
 * @param {boolean} props.hasMore - Whether more items are available
 * @param {boolean} props.loadingMore - Whether next page is currently loading
 * @param {Function} props.onLoadMore - Function to trigger next page fetch
 * @param {Function|Object} [props.sentinelRef] - Ref callback for IntersectionObserver
 * @param {string} [props.label="Load More"] - Button text
 * @param {boolean} [props.showEndMessage=false] - Whether to show "No more items" message
 * @param {string} [props.endMessage="No more items"] - Message when end is reached
 * @param {"button"|"auto"|"both"} [props.mode="both"] - "auto" for pure infinite scroll, "button" for manual, "both" for auto with button fallback
 */
export function LoadMoreTrigger({
  hasMore,
  loadingMore,
  onLoadMore,
  sentinelRef,
  label = "Load More",
  showEndMessage = false,
  endMessage = "All caught up",
  mode = "both",
}) {
  if (!hasMore && !loadingMore) {
    if (showEndMessage) {
      return (
        <div className="py-3 text-center text-xs font-semibold text-slate-400">
          {endMessage}
        </div>
      );
    }
    return null;
  }

  return (
    <div
      ref={sentinelRef}
      className="py-4 flex flex-col items-center justify-center w-full min-h-[48px]"
    >
      {loadingMore ? (
        <div className="flex items-center gap-2 text-xs font-bold text-blue-600 py-1.5 animate-in fade-in duration-200">
          <Loader2 size={16} className="animate-spin text-blue-600" />
          <span className="text-[11px] font-semibold text-slate-500">Loading more...</span>
        </div>
      ) : hasMore && (mode === "button" || mode === "both") ? (
        <button
          type="button"
          onClick={onLoadMore}
          className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200/80 text-xs font-bold transition-all duration-200 cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
        >
          {label}
        </button>
      ) : null}
    </div>
  );
}

export default LoadMoreTrigger;
