import {
  X,
  ChevronLeft,
  ChevronRight,
  Globe,
  ExternalLink,
  Heart,
  MessageCircle,
  Share2,
  Trash2,
  MoreVertical,
  Loader2,
} from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { formatDistanceToNow } from "date-fns";
import dp from "../../assets/dp.jpg";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import PreviewModal from "./PreviewModal";
import PostTags from "../post/PostTags";
import { Link } from "react-router-dom";
import API from "../../api/Api";
import { toast } from "react-toastify";
import { showProjectDeletedToast } from "../../toast/Toast";

function ImageModal({
  post,
  posts = [],
  onNavigatePost,
  modalIndex,
  setModalIndex,
  handleLike,
  onClose,
  setLikePost,
  setCommentPost,
  setSharePost,
  ownerOverride,
}) {
  const { user: currentUser } = useAuthStore();
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [slideDirection, setSlideDirection] = useState(0);

  const maxLength = 60;

  const livePost = post || {};
  const creator = livePost.creator || livePost.user || ownerOverride || currentUser;
  const creatorAvatar = creator?.profilePicture || creator?.profileImageUrl || dp;
  const creatorId = String(creator?.id || creator?._id || "");
  const currentUserId = String(currentUser?.id || currentUser?._id || "");
  const isOwner = currentUser && (creatorId === currentUserId || creator?.hotdropId === currentUser?.hotdropId);

  const rawImages = livePost.imageUrls || livePost.images || [];
  const images = rawImages.map((img) =>
    typeof img === "string" ? img : img?.url || img
  );

  const projectUrl = livePost.projectUrl || livePost.projectLink;
  const isLinkDead = livePost.linkDead ?? livePost.isLinkDead ?? false;
  const isLiked = livePost.liked ?? (livePost.likes?.some((l) => String(l.id || l._id || l) === String(currentUser?.id || currentUser?._id)));
  const likeCount = livePost.likeCount ?? livePost.likes?.length ?? 0;
  const commentCount = livePost.commentCount ?? livePost.comments?.length ?? 0;

  const currentPostId = String(livePost.id || livePost._id || "");
  const currentPostIndex = (posts || []).findIndex(
    (p) => String(p.id || p._id || "") === currentPostId
  );
  const hasPrevPost = posts && posts.length > 1 && currentPostIndex > 0;
  const hasNextPost = posts && posts.length > 1 && currentPostIndex !== -1 && currentPostIndex < posts.length - 1;

  const handlePrevPost = (e) => {
    if (e) e.stopPropagation();
    if (hasPrevPost && onNavigatePost) {
      setSlideDirection(-1);
      setModalIndex(0);
      onNavigatePost(posts[currentPostIndex - 1]);
    }
  };

  const handleNextPost = (e) => {
    if (e) e.stopPropagation();
    if (hasNextPost && onNavigatePost) {
      setSlideDirection(1);
      setModalIndex(0);
      onNavigatePost(posts[currentPostIndex + 1]);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (deleteConfirm || previewUrl) return;

      if (e.key === "ArrowLeft") {
        if (hasPrevPost) {
          handlePrevPost();
        }
      } else if (e.key === "ArrowRight") {
        if (hasNextPost) {
          handleNextPost();
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPostIndex, posts, hasPrevPost, hasNextPost, deleteConfirm, previewUrl]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const closeMenuOnOutsideClick = () => setMenuOpen(false);
    if (menuOpen) {
      window.addEventListener("click", closeMenuOnOutsideClick);
    }
    return () => window.removeEventListener("click", closeMenuOnOutsideClick);
  }, [menuOpen]);

  const toggleExpand = (e) => {
    e.preventDefault();
    setIsExpanded(!isExpanded);
  };

  const next = (e) => {
    e.stopPropagation();
    if (images.length === 0) return;
    setModalIndex((prev) => (prev + 1) % images.length);
  };

  const prev = (e) => {
    e.stopPropagation();
    if (images.length === 0) return;
    setModalIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleFinalDelete = async () => {
    setIsDeleting(true);
    const loadingToast = toast.loading("Removing your drop...");

    const targetId = livePost.id || livePost._id;

    try {
      const res = await API.delete(`/posts/delete-post/${targetId}`);
      if (res.status === 200 || res.data?.success || res.data?.statusCode === 200) {
        toast.dismiss(loadingToast);
        showProjectDeletedToast("Project");

        useAuthStore.setState((state) => {
          const filterFn = (p) => (p.id || p._id) !== targetId;
          const newPosts = (state.userPosts || []).filter(filterFn);
          const newAuthUserPosts = (state.user?.posts || []).filter(filterFn);
          return {
            user: state.user
              ? {
                  ...state.user,
                  postCount: Math.max(0, (state.user.postCount || 1) - 1),
                  posts: newAuthUserPosts,
                }
              : null,
            userPosts: newPosts,
          };
        });

        setDeleteConfirm(false);
        onClose();
      }
    } catch (error) {
      toast.update(loadingToast, {
        render: error.response?.data?.message || "Failed to delete!",
        type: "error",
        isLoading: false,
        autoClose: 2000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isMobile) {
    return (
      <div
        className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-[99] p-3 animate-in fade-in duration-200"
        onClick={onClose}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-5 right-5 text-white/80 hover:text-white transition-transform hover:scale-110 z-[1100]"
        >
          <X size={26} />
        </button>
        <div className="relative w-full h-full flex items-center justify-center">
          {images.length > 0 ? (
            <img
              src={images[modalIndex]}
              className="object-contain w-full h-full"
              alt="Preview"
            />
          ) : (
            <div className="text-white text-sm font-semibold">No Image Available</div>
          )}
          {images.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/20 text-white p-2.5 rounded-xl hover:bg-white/40 backdrop-blur-md"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/20 text-white p-2.5 rounded-xl hover:bg-white/40 backdrop-blur-md"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-[99] p-4 animate-in fade-in duration-200 select-none"
      onClick={() => {
        setMenuOpen(false);
        onClose();
      }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-6 right-6 text-white/70 hover:text-white transition-transform hover:scale-110 z-[1100]"
        title="Close Modal (Esc)"
      >
        <X size={26} />
      </button>

      {hasPrevPost && (
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.1, x: -3 }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePrevPost}
          className="hidden md:flex fixed left-5 top-1/2 -translate-y-1/2 bg-slate-900/85 hover:bg-black text-white p-3.5 rounded-2xl backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-colors duration-200 items-center gap-2 text-xs font-black uppercase tracking-wider z-[1200] border border-slate-700/60 select-none cursor-pointer"
          title="Previous Drop (Left Arrow)"
        >
          <ChevronLeft size={22} />

        </motion.button>
      )}

      {hasNextPost && (
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.1, x: 3 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleNextPost}
          className="hidden md:flex fixed right-5 top-1/2 -translate-y-1/2 bg-slate-900/85 hover:bg-black text-white p-3.5 rounded-2xl backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-colors duration-200 items-center gap-2 text-xs font-black uppercase tracking-wider z-[1200] border border-slate-700/60 select-none cursor-pointer"
          title="Next Drop (Right Arrow)"
        >

          <ChevronRight size={22} />
        </motion.button>
      )}

      <AnimatePresence mode="wait" custom={slideDirection}>
        <motion.div
          key={currentPostId}
          initial={{ opacity: 0, x: slideDirection * 50, scale: 0.97 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: slideDirection * -50, scale: 0.97 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="bg-white w-full max-w-[1000px] h-[85vh] flex flex-col md:flex-row rounded-3xl overflow-hidden shadow-2xl border border-slate-100 relative"
          onClick={(e) => {
            e.stopPropagation();
            if (menuOpen) setMenuOpen(false);
          }}
        >

          <div className="md:w-[65%] w-full bg-slate-950 flex items-center justify-center relative group">
            {images.length > 0 ? (
              <AnimatePresence mode="wait">
                <motion.img
                  key={`${currentPostId}-${modalIndex}`}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  src={images[modalIndex]}
                  className="object-contain w-full h-full p-2"
                  alt="Preview"
                />
              </AnimatePresence>
            ) : (
              <div className="text-slate-400 text-sm font-semibold flex flex-col items-center">
                <Globe size={40} className="mb-2" />
                <span>No Screenshot Available</span>
              </div>
            )}

            {images.length > 1 && (
              <>
                <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 flex justify-between z-10 pointer-events-none">
                  <button
                    onClick={prev}
                    className="pointer-events-auto bg-black/60 hover:bg-black/90 text-white p-2 rounded-full border border-white/30 shadow-md backdrop-blur-sm transition active:scale-90 cursor-pointer"
                    title="Previous Image"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={next}
                    className="pointer-events-auto bg-black/60 hover:bg-black/90 text-white p-2 rounded-full border border-white/30 shadow-md backdrop-blur-sm transition active:scale-90 cursor-pointer"
                    title="Next Image"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 pointer-events-none z-10">
                  {images.map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-full border border-black/80 transition-all duration-200 ${
                        i === modalIndex
                          ? "w-3 h-3 bg-white shadow-md scale-110"
                          : "w-2 h-2 bg-white/70"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="md:w-[35%] w-full flex flex-col bg-white overflow-hidden">

            <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <img
                  src={creatorAvatar}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100"
                  alt="avatar"
                />
                <div className="flex flex-col">
                  <Link
                    to={`/user/userprofile/${creator?.hotdropId}`}
                    className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors"
                  >
                    @{creator?.hotdropId || "user"}
                  </Link>
                  <span className="text-[10px] font-medium text-slate-400">
                    {livePost.createdAt ? (
                      formatDistanceToNow(new Date(livePost.createdAt), { addSuffix: true })
                    ) : (
                      "just now"
                    )}
                  </span>
                </div>
              </div>

                <div className="font-black text-xs tracking-wider uppercase select-none">
                  <span className="text-orange-500">HOT</span>
                  <span className="text-blue-600">DROP</span>
                </div>
              <div className="flex items-center ">

                {isOwner && (
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(!menuOpen);
                      }}
                      className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
                      title="Options"
                    >
                      <MoreVertical size={18} />
                    </button>

                    {menuOpen && (
                      <div
                        className="absolute right-0 mt-1 bg-white border border-slate-100 rounded-2xl shadow-xl p-1.5 z-30 min-w-[140px] animate-in zoom-in-95 duration-150"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            setDeleteConfirm(true);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <Trash2 size={15} className="text-red-500" />
                          <span>Delete Drop</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>

            <div className="p-5 space-y-4 flex-1 overflow-y-auto">

              <div className="flex items-start justify-between gap-3 mb-2 flex-wrap sm:flex-nowrap">
                <h2 className="font-extrabold text-base text-slate-900 leading-snug min-w-0 flex-1">
                  {livePost.title}
                </h2>
                <PostTags tags={livePost.tags || livePost.tagsList || livePost.tag} postTitle={livePost.title} />
              </div>

              <div className="relative">
                <p className="text-xs text-slate-900 font-bold leading-relaxed ">
                  {livePost.description && livePost.description.length > maxLength && !isExpanded
                    ? `${livePost.description.slice(0, maxLength)}...`
                    : livePost.description}

                  {livePost.description && livePost.description.length > maxLength && (
                    <button
                      onClick={toggleExpand}
                      className="ml-1 text-[11px] text-blue-600 hover:underline font-bold"
                    >
                      {isExpanded ? "Show Less" : "Read More"}
                    </button>
                  )}
                </p>
              </div>

              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                  Target Link
                </span>

                <div
                  onClick={(e) => {
                    e.preventDefault();
                    if (!isLinkDead && projectUrl) {
                      setPreviewUrl(projectUrl);
                    } else {
                      toast.error("This project link appears to be dead");
                    }
                  }}
                  className="group/link relative flex items-center cursor-pointer justify-between p-[1px] rounded-xl transition-all duration-300 hover:scale-[1.01]"
                >
                  <div
                    className={`absolute inset-0 rounded-xl opacity-20 group-hover/link:opacity-100 transition-opacity duration-500 bg-gradient-to-r ${
                      isLinkDead
                        ? "from-red-500 to-orange-500"
                        : "from-blue-600 via-indigo-500 to-emerald-400"
                    }`}
                  />
                  <div className="relative w-full flex items-center justify-between bg-white border border-slate-200/80 rounded-[11px] px-3 py-2 shadow-sm">
                    <div className="flex items-center gap-2 truncate">
                      <div
                        className={`flex items-center justify-center w-6 h-6 rounded-lg transition-colors ${
                          isLinkDead
                            ? "bg-red-50 text-red-500"
                            : "bg-blue-50 text-blue-600 group-hover/link:bg-blue-600 group-hover/link:text-white"
                        }`}
                      >
                        <Globe size={12} strokeWidth={2.5} />
                      </div>
                      <span className="text-[11px] font-bold text-slate-700 truncate">
                        {projectUrl ? projectUrl.replace(/^https?:\/\//, "") : "Project Link"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                          isLinkDead
                            ? "bg-red-50 text-red-600 border border-red-100"
                            : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isLinkDead ? "bg-red-500" : "bg-emerald-500 animate-pulse"
                          }`}
                        />
                        {isLinkDead ? "Dead" : "Live"}
                      </span>
                      <ExternalLink size={12} className="text-slate-400 group-hover/link:text-blue-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center p-4 border-t border-slate-100 bg-slate-50/50 mt-auto">
              <div className="flex gap-5 items-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLike(livePost);
                  }}
                  className="flex items-center gap-1.5 group/like"
                >
                  <Heart
                    size={18}
                    className={`transition-transform duration-200 group-hover/like:scale-110 ${
                      isLiked ? "fill-rose-500 text-rose-500" : "text-slate-400"
                    }`}
                  />
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      if (setLikePost) setLikePost(livePost);
                    }}
                    className="text-xs font-bold text-slate-700 hover:text-blue-600 cursor-pointer"
                  >
                    {likeCount}
                  </span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (setCommentPost) setCommentPost(livePost);
                  }}
                  className="flex items-center gap-1.5 group/comment"
                >
                  <MessageCircle
                    size={18}
                    className="text-slate-400 group-hover/comment:text-blue-600 transition"
                  />
                  <span className="text-xs font-bold text-slate-700 hover:text-blue-600 cursor-pointer">
                    {commentCount}
                  </span>
                </button>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (setSharePost) setSharePost(livePost);
                }}
                className="p-1.5 hover:bg-white rounded-xl transition text-slate-400 hover:text-slate-700"
              >
                <Share2 size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {deleteConfirm && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => !isDeleting && setDeleteConfirm(false)}
          />
          <div className="relative w-full max-w-xs bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col items-center text-center animate-in zoom-in-95 duration-200 z-[1001]">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 border border-red-100 flex items-center justify-center mb-3 shadow-inner">
              <Trash2 size={24} strokeWidth={2.2} />
            </div>
            <h4 className="text-base font-extrabold text-slate-900 mb-1">Delete Drop?</h4>
            <p className="text-xs text-slate-500 leading-relaxed mb-5">
              Are you sure you want to remove <span className="font-bold text-slate-800">"{livePost.title}"</span>? This action cannot be undone.
            </p>
            <div className="flex w-full gap-2">
              <button
                onClick={() => setDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleFinalDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 transition flex items-center justify-center gap-1.5 disabled:opacity-60 shadow-md shadow-red-500/20 active:scale-95"
              >
                {isDeleting ? <Loader2 size={14} className="animate-spin" /> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {previewUrl && (
          <PreviewModal
            key={previewUrl}
            url={previewUrl}
            onClose={() => setPreviewUrl(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default ImageModal;
