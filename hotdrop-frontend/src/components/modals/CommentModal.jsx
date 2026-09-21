import { useEffect, useState } from "react";
import { X, Send, MessageSquare, Trash2, Loader2 } from "lucide-react";
import API from "../../api/Api";
import { useAuthStore } from "../../store/useAuthStore";
import { showCommentDeletedToast, showErrorToast } from "../../toast/Toast";
import { useNavigate } from "react-router-dom";
import dp from "../../assets/dp.jpg";
import usePaginatedFetch, { mergeDeduplicated } from "../../hooks/usePaginatedFetch";
import LoadMoreTrigger from "../common/LoadMoreTrigger";

function CommentModal({
  post,
  commentText,
  setCommentText,
  submitComment,
  onClose,
  setCommentPost,
}) {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const postId = post?.id || post?._id;

  // Paginated comments fetch
  const {
    items: localComments,
    setItems: setLocalComments,
    loading: loadingComments,
    loadingMore,
    hasMore,
    totalElements,
    loadMore,
    sentinelRef,
    handleScroll,
  } = usePaginatedFetch({
    url: postId ? `/posts/get-comment-by-post-id/${postId}` : null,
    pageSize: 10,
    enabled: Boolean(postId),
    initialItems: Array.isArray(post?.comments) ? post.comments : [],
    onSuccess: (newItems, parsed) => {
      if (setCommentPost) {
        setCommentPost((prev) => {
          if (!prev) return post;
          return {
            ...prev,
            commentCount: parsed.totalElements,
          };
        });
      }
    },
  });

  // Keep synced if parent post comments change (e.g., initial load or comment added)
  useEffect(() => {
    if (Array.isArray(post?.comments) && post.comments.length > 0) {
      setLocalComments((prev) => mergeDeduplicated(post.comments, prev));
    }
  }, [post?.comments, setLocalComments]);

  const handleDeleteComment = async (commentId) => {
    if (isDeleting) return;
    setIsDeleting(true);

    const previousComments = [...localComments];
    const updatedComments = localComments.filter(
      (c) => String(c.id || c._id || c) !== String(commentId)
    );

    setLocalComments(updatedComments);

    if (setCommentPost) {
      setCommentPost((prev) => {
        const targetPost = typeof prev === "object" && prev ? prev : post;
        if (!targetPost) return null;
        return {
          ...targetPost,
          comments: updatedComments,
          commentCount: Math.max(0, (targetPost.commentCount ?? (updatedComments.length + 1)) - 1),
        };
      });
    }

    try {
      await API.delete(`/posts/delete-comment/${commentId}`);
      showCommentDeletedToast("Comment deleted!");
    } catch (error) {
      console.error("Delete comment error:", error);
      if (error.response?.status !== 429) {
        showErrorToast(error.response?.data?.message || "Failed to delete comment");
      }
      setLocalComments(previousComments);
    } finally {
      setDeleteConfirm(null);
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "just now";
    try {
      const options = {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      };
      return new Date(dateString).toLocaleDateString("en-US", options);
    } catch {
      return "just now";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!commentText?.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await submitComment(e, commentText.trim());
    } catch (error) {
      console.error("Error submitting comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalCount = totalElements || localComments.length;

  return (
    <div 
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[1500] flex items-center justify-center p-4 animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      {deleteConfirm && (
        <div className="fixed inset-0 z-[1600] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => !isDeleting && setDeleteConfirm(null)}
          />
          <div className="relative bg-white w-full max-w-xs rounded-3xl p-5 shadow-2xl text-center border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 border border-red-100 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Trash2 size={24} strokeWidth={2.2} />
            </div>
            <h4 className="font-extrabold text-sm text-slate-900 mb-1">
              Delete Comment?
            </h4>
            <p className="text-xs text-slate-500 mb-4">This action cannot be undone.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeleting}
                className="flex-1 py-2 text-xs font-bold bg-slate-100 rounded-xl text-slate-600 hover:bg-slate-200 transition disabled:opacity-60 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteComment(deleteConfirm)}
                disabled={isDeleting}
                className="flex-1 py-2 text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 transition disabled:opacity-60 flex items-center justify-center gap-1 shadow-md shadow-red-500/20 cursor-pointer"
              >
                {isDeleting ? <Loader2 size={12} className="animate-spin" /> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div 
        className="bg-white w-full max-w-md h-[520px] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <MessageSquare size={18} />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">
              Comments ({totalCount})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div
          className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
          onScroll={(e) => handleScroll(e.currentTarget)}
        >
          {loadingComments && localComments.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-blue-600 py-12">
              <Loader2 size={32} className="animate-spin mb-2" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Loading comments...</span>
            </div>
          ) : localComments.length > 0 ? (
            <>
              {localComments.map((c, i) => {
                const cId = c.id || c._id || i;
                const author = c.user || c.creator || {};
                const authorAvatar = author.profilePicture || author.profileImageUrl || dp;
                const authorHotdropId = author.hotdropId || author.username || "user";
                const textContent = c.text || "";

                const currentUserId = String(user?.id || user?._id || user?.userId || "");
                const currentHotdropId = (user?.hotdropId || user?.username || "").toLowerCase();

                const authorId = String(author.id || author._id || author.userId || "");
                const authorHandle = (author.hotdropId || author.username || "").toLowerCase();

                const postOwner = (typeof post?.creator === "object" ? post.creator : null) || (typeof post?.user === "object" ? post.user : null) || {};
                const postOwnerId = String(postOwner.id || postOwner._id || postOwner.userId || "");
                const postOwnerHandle = (postOwner.hotdropId || postOwner.username || "").toLowerCase();

                const canDelete =
                  Boolean(user) &&
                  (
                    (currentUserId && authorId && currentUserId === authorId) ||
                    (currentHotdropId && authorHandle && currentHotdropId === authorHandle) ||
                    (currentUserId && postOwnerId && currentUserId === postOwnerId) ||
                    (currentHotdropId && postOwnerHandle && currentHotdropId === postOwnerHandle)
                  );

                return (
                  <div key={cId} className="flex gap-3 group/comment">
                    <img
                      src={authorAvatar}
                      className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 shrink-0 cursor-pointer"
                      alt={authorHotdropId}
                      onClick={() => {
                        onClose();
                        navigate(`/user/userprofile/${authorHotdropId}`);
                      }}
                    />
                    <div className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl p-3 text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span 
                          onClick={() => {
                            onClose();
                            navigate(`/user/userprofile/${authorHotdropId}`);
                          }}
                          className="font-bold text-slate-900 cursor-pointer hover:text-blue-600 truncate max-w-[140px]"
                        >
                          @{authorHotdropId}
                        </span>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-slate-400 font-mono">{formatDate(c.createdAt)}</span>
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirm(cId)}
                              className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition cursor-pointer flex items-center gap-1 font-bold text-[10px]"
                              title="Delete comment"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-slate-800 font-medium leading-relaxed">{textContent}</p>
                    </div>
                  </div>
                );
              })}

              {/* Infinite scroll sentinel & load more button */}
              <LoadMoreTrigger
                hasMore={hasMore}
                loadingMore={loadingMore}
                onLoadMore={loadMore}
                sentinelRef={sentinelRef}
                label="Load Older Comments"
              />
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-12 text-slate-400 text-xs font-semibold">
              No comments yet. Be the first to comment!
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t border-slate-100 bg-white flex items-center gap-2">
          <input
            type="text"
            placeholder={user ? "Write a comment..." : "Sign in to comment"}
            disabled={!user || isSubmitting}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-white transition disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!user || !commentText?.trim() || isSubmitting}
            className="p-2.5 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition disabled:opacity-40 cursor-pointer shadow-md shadow-blue-500/20"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CommentModal;
