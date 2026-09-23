export function PostSkeleton({ count = 3 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={`post-skeleton-${i}`}
          className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm animate-pulse space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-200 rounded-full" />
            <div className="space-y-2 flex-1">
              <div className="h-3 bg-slate-200 rounded w-1/3" />
              <div className="h-2 bg-slate-200 rounded w-1/4" />
            </div>
          </div>
          <div className="w-full aspect-[16/9] bg-slate-200 rounded-2xl" />
        </div>
      ))}
    </div>
  );
}

export default PostSkeleton;
