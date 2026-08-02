import { useEffect, useState } from "react";
import { X, Send, MessageSquare, Trash2, Loader2 } from "lucide-react";
import API from "../../api/Api";
import { useAuthStore } from "../../store/useAuthStore";
import { showCommentDeletedToast, showErrorToast } from "../../toast/Toast";
import { useNavigate } from "react-router-dom";
import dp from "../../assets/dp.jpg";

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
  const [loadingComments, setLoadingComments] = useState(false);
  const [localComments, setLocalComments] = useState(post?.comments || []);

  const postId = post?.id || post?._id;

  // 1. Instantly update local comments when post.comments prop changes!
  useEffect(() => {
    if (Array.isArray(post?.comments)) {
      setLocalComments(post.comments);
    }
  }, [post?.comments]);

  // 2. Fetch fresh comments list from backend on modal open
  useEffect(() => {
    const fetchComments = async () => {
      if (!postId) return;
      try {
        setLoadingComments(true);
        // 🎯 Official Endpoint: GET /posts/comments/{postId}
        const res = await API.get(`/posts/comments/${postId}`);
        const commentsList = res.data?.data || res.data || [];

        if (Array.isArray(commentsList)) {
          setLocalComments(commentsList);

          if (setCommentPost) {
            setCommentPost((prev) => {
              if (!prev) return post;
              return {
                ...prev,
                comments: commentsList,
                commentCount: commentsList.length,
              };
            });
          }
        }
      } catch (err) {
        console.error("Fetch comments error:", err?.message);
      } finally {
        setLoadingComments(false);
      }
    };

    fetchComments();
  }, [postId]);

  const handleDeleteComment = async (commentId) => {
    if (isDeleting) return;
    setIsDeleting(true);

    // ⚡ 1. INSTANT OPTIMISTIC UI DELETION
    const previousComments = [...localComments];
    setLocalComments((prev) =>
      prev.filter((c) => String(c.id || c._id || c) !== String(commentId))
    );

    if (setCommentPost) {
      setCommentPost((prev) => {
        if (!prev) return null;
        const filtered = (prev.comments || []).filter(
          (c) => String(c.id || c._id || c) !== String(commentId)
        );
        return {
          ...prev,
          comments: filtered,
          commentCount: Math.max(0, (prev.commentCount ?? (prev.comments || []).length) - 1),
        };
      });
    }

    useAuthStore.setState((state) => {
      const updateFn = (p) =>
        String(p.id || p._id) === String(postId)
          ? {
              ...p,
              comments: (p.comments || []).filter(
                (c) => String(c.id || c._id || c) !== String(commentId)
              ),
              commentCount: Math.max(
                0,
                (p.commentCount ?? (p.comments || []).length) - 1
              ),
            }
          : p;

      return {
        userPosts: (state.userPosts || []).map(updateFn),
        user: state.user
          ? {
              ...state.user,
              posts: (state.user.posts || []).map(updateFn),
            }
          : null,
      };
    });

    try {
      // 🎯 Official Backend Endpoint: DELETE /posts/delete-comment/{commentId}
      await API.delete(`/posts/delete-comment/${commentId}`);
      showCommentDeletedToast("Comment deleted!");
    } catch (error) {
      console.error("Delete comment error:", error);
      showErrorToast("Failed to delete comment");
      // Revert if API fails
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

    const textToSubmit = commentText;
    setCommentText(""); // clear input immediately!

    try {
      setIsSubmitting(true);
      await submitComment(e);
    } catch (error) {
      console.error("Error submitting comment:", error);
      setCommentText(textToSubmit);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[1500] flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* SLEEK DELETE CONFIRMATION MODAL */}
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
                className="flex-1 py-2 text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 transition disabled:opacity-60 flex items-center justify-center gap-1 shadow-md shadow-red-500/20 active:scale-95 cursor-pointer"
              >
                {isDeleting ? <Loader2 size={12} className="animate-spin" /> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIALOG BOX */}
      <div className="bg-white w-full max-w-md h-[520px] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <MessageSquare size={18} />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">
              Comments ({localComments.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* COMMENTS LIST */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {loadingComments && localComments.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-blue-600 py-12">
              <Loader2 size={32} className="animate-spin mb-2" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Loading comments...</span>
            </div>
          ) : localComments.length > 0 ? (
            [...localComments]
              .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
              .map((c, i) => {
                const cId = c.id || c._id || i;
                const author = c.user || c.creator || {};
                const authorId = String(author.id || author._id || c.user || c.creator || "");
                const authorAvatar = author.profilePicture || author.profileImageUrl || dp;
                const authorHotdropId = author.hotdropId || "user";
                const textContent = c.text || "";

                const currentUserId = String(user?.id || user?._id || "");
                const postOwner = (typeof post?.creator === "object" ? post.creator : null) || (typeof post?.user === "object" ? post.user : null) || {};
                const postOwnerId = String(postOwner.id || postOwner._id || post?.creator || post?.user || "");

                const canDelete =
                  Boolean(currentUserId) &&
                  (currentUserId === authorId || currentUserId === postOwnerId);

                return (
                  <div key={cId} className="flex gap-3 group/comment">
                    <img
                      src={authorAvatar}
                      className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-slate-100"
                      alt="avatar"
                    />
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span
                          onClick={() => {
                            onClose();
                            navigate(`/user/userprofile/${authorHotdropId}`);
                          }}
                          className="text-xs font-bold text-slate-900 hover:text-blue-600 cursor-pointer truncate"
                        >
                          @{authorHotdropId}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] text-slate-400 font-medium">
                            {formatDate(c.createdAt)}
                          </span>
                          {canDelete && (
                            <button
                              onClick={() => setDeleteConfirm(cId)}
                              className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete comment"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="mt-1 bg-slate-50 border border-slate-100 px-3.5 py-2 rounded-2xl max-w-full">
                        <p className="text-xs text-slate-700 break-words whitespace-pre-wrap leading-relaxed font-normal">
                          {textContent}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 py-12">
              <MessageSquare size={36} />
              <p className="text-xs font-semibold text-slate-400 mt-2">No comments yet. Be the first to reply!</p>
            </div>
          )}
        </div>

        {/* INPUT BOX */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition"
          >
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              autoFocus
              placeholder="Write a comment..."
              className="flex-1 text-xs font-medium text-slate-800 outline-none px-2"
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={!commentText?.trim() || isSubmitting}
              className="bg-blue-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-blue-700 transition disabled:opacity-50 shadow-md shadow-blue-500/20 cursor-pointer"
            >
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CommentModal;