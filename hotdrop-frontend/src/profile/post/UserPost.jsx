import { useAuthStore } from "../../store/useAuthStore";
import {
  Heart,
  MessageCircle,
  Share2,
  ChevronLeft,
  ChevronRight,
  Globe,
  Lock,
  Trash2,
  ExternalLink,
  MoreVertical,

  Loader2,
  ShieldCheck,

} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import ImageModal from "./ImageModal";
import CommentModal from "./CommentModal";
import LikeModal from "./LikeModal";
import ShareModal from "./ShareModal";
import PreviewModal from "./PreviewModal";
import API from "../../api/Api";
import { toast } from "react-toastify";
import { showLikeToast, showCommentToast } from "../../toast/Toast";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import dp from "../../assets/dp.jpg";
import { useEffect, useState, useRef } from "react";

function UserPost({ postsOverride, hideOptions, ownerOverride }) {
  const { user, userPosts } = useAuthStore();
  const navigate = useNavigate();

  const [previewUrl, setPreviewUrl] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [imagePost, setImagePost] = useState(null);
  const [commentPost, setCommentPost] = useState(null);
  const [likePost, setLikePost] = useState(null);
  const [sharePost, setSharePost] = useState(null);
  const [modalIndex, setModalIndex] = useState(0);
  const [currentImageIndexMap, setCurrentImageIndexMap] = useState({});
  const [menuOpen, setMenuOpen] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [expandedMap, setExpandedMap] = useState({});
  const [doubleTapHeartMap, setDoubleTapHeartMap] = useState({});
  const [hoveredPost, setHoveredPost] = useState(null);
  const [popoverPosition, setPopoverPosition] = useState("center");

  const handleCardHover = (e, post) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const screenWidth = window.innerWidth;
    const cardCenterX = rect.left + rect.width / 2;

    if (cardCenterX < screenWidth * 0.38) {
      setPopoverPosition("right");
    } else if (cardCenterX > screenWidth * 0.62) {
      setPopoverPosition("left");
    } else {
      setPopoverPosition("top");
    }

    setHoveredPost(post);
  };

  const lastTapTimeRef = useRef({});
  const clickTimeoutRef = useRef({});
  const maxLength = 100;

  /* CLOSE MENU ON OUTSIDE CLICK */
  useEffect(() => {
    const closeMenu = () => setMenuOpen(null);
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  const sourcePosts = postsOverride || userPosts || user?.posts || [];
  const posts = [...sourcePosts].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  const toggleExpand = (e, postId) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedMap((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const nextImage = (e, postId, total) => {
    e.stopPropagation();
    setCurrentImageIndexMap((prev) => ({
      ...prev,
      [postId]: ((prev[postId] || 0) + 1) % total,
    }));
  };

  const prevImage = (e, postId, total) => {
    e.stopPropagation();
    setCurrentImageIndexMap((prev) => ({
      ...prev,
      [postId]: ((prev[postId] || 0) - 1 + total) % total,
    }));
  };

  const handleFinalDelete = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    const loadingToast = toast.loading("Deleting your drop...");

    const targetId = deleteConfirm.id || deleteConfirm._id;

    try {
      const res = await API.delete(`/posts/delete-post/${targetId}`);
      if (res.status === 200 || res.data?.success || res.data?.statusCode === 200) {
        toast.update(loadingToast, {
          render: "Drop deleted successfully! 🗑️",
          type: "success",
          isLoading: false,
          autoClose: 2000,
        });

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

        setDeleteConfirm(null);
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

  const handleLike = async (postToLike) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const postId = postToLike.id || postToLike._id;

    const currentUserObj = {
      id: user?.id || user?._id,
      _id: user?.id || user?._id,
      hotdropId: user?.hotdropId,
      profilePicture: user?.profilePicture || user?.profileImageUrl,
    };

    try {
      const res = await API.post(`/posts/like-post/${postId}`);
      if (res.status === 200 || res.data?.statusCode === 200) {
        const payloadData = res.data?.data || res.data;
        const newLikeCount = payloadData?.likeCount ?? (postToLike.likeCount + (postToLike.liked ? -1 : 1));
        const newLikedState = payloadData?.liked ?? payloadData?.isLiked ?? !postToLike.liked;

        const updatePostFn = (p) => {
          const pId = p.id || p._id;
          if (pId === postId) {
            const existingLikes = p.likes || [];
            const isAlreadyInLikes = existingLikes.some(
              (l) => String(l.id || l._id || l) === String(user?.id || user?._id)
            );

            let updatedLikes = existingLikes;
            if (newLikedState && !isAlreadyInLikes) {
              updatedLikes = [currentUserObj, ...existingLikes];
            } else if (!newLikedState) {
              updatedLikes = existingLikes.filter(
                (l) => String(l.id || l._id || l) !== String(user?.id || user?._id)
              );
            }

            return {
              ...p,
              likeCount: newLikeCount,
              liked: newLikedState,
              likes: updatedLikes,
            };
          }
          return p;
        };

        useAuthStore.setState((state) => ({
          userPosts: (state.userPosts || []).map(updatePostFn),
          user: state.user
            ? {
                ...state.user,
                posts: (state.user.posts || []).map(updatePostFn),
              }
            : null,
        }));

        if (imagePost && (imagePost.id || imagePost._id) === postId) {
          setImagePost((prev) => ({
            ...prev,
            likeCount: newLikeCount,
            liked: newLikedState,
            likes: newLikedState
              ? [currentUserObj, ...(prev.likes || [])]
              : (prev.likes || []).filter((l) => String(l.id || l._id || l) !== String(user?.id || user?._id)),
          }));
        }

        showLikeToast(newLikedState);
      }
    } catch (error) {
      console.error("Like error:", error);
      toast.error("Failed to update like status");
    }
  };

  // --- DOUBLE TAP TO LIKE HANDLER ---
  const triggerDoubleTapLike = (post) => {
    const pId = post.id || post._id;
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const isLiked = post.liked ?? (post.likes?.some((l) => String(l.id || l._id || l) === String(user?.id || user?._id)));
    if (!isLiked) {
      handleLike(post);
    }

    setDoubleTapHeartMap((prev) => ({ ...prev, [pId]: true }));
    setTimeout(() => {
      setDoubleTapHeartMap((prev) => ({ ...prev, [pId]: false }));
    }, 800);
  };

  const handleImageClick = (e, post, imgIndex) => {
    e.preventDefault();
    const pId = post.id || post._id;
    const now = Date.now();
    const lastTap = lastTapTimeRef.current[pId] || 0;

    if (now - lastTap < 300) {
      // 💥 DOUBLE TAP TRIGGERED
      if (clickTimeoutRef.current[pId]) {
        clearTimeout(clickTimeoutRef.current[pId]);
        clickTimeoutRef.current[pId] = null;
      }
      triggerDoubleTapLike(post);
      lastTapTimeRef.current[pId] = 0;
    } else {
      // SINGLE TAP (Wait 280ms to differentiate single click vs double tap)
      lastTapTimeRef.current[pId] = now;
      clickTimeoutRef.current[pId] = setTimeout(() => {
        if (!user) {
          setShowAuthModal(true);
          return;
        }
        setHoveredPost(null);
        setImagePost(post);
        setModalIndex(imgIndex);
      }, 280);
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const targetPostId = commentPost?.id || commentPost?._id;
    const textToSubmit = commentText;

    try {
      const res = await API.post(`/posts/comment-to-post/${targetPostId}`, {
        text: textToSubmit,
      });

      showCommentToast("Comment added!");
      const rawComment = res.data?.data?.comment || res.data?.data || res.data;
      const newComment = {
        id: rawComment.id || rawComment._id || String(Date.now()),
        text: rawComment.text || rawComment.comment || textToSubmit,
        createdAt: rawComment.createdAt || new Date().toISOString(),
        user: (typeof rawComment.user === "object" && rawComment.user?.hotdropId ? rawComment.user : null) ||
              (typeof rawComment.creator === "object" && rawComment.creator?.hotdropId ? rawComment.creator : null) ||
              user,
      };

      const updatePostFn = (p) => {
        const pId = p.id || p._id;
        if (String(pId) === String(targetPostId)) {
          const updatedComments = [newComment, ...(p.comments || [])];
          return {
            ...p,
            comments: updatedComments,
            commentCount: updatedComments.length,
          };
        }
        return p;
      };

      useAuthStore.setState((state) => ({
        userPosts: (state.userPosts || []).map(updatePostFn),
        user: state.user
          ? {
              ...state.user,
              posts: (state.user.posts || []).map(updatePostFn),
            }
          : null,
      }));

      setCommentPost((prev) => {
        if (!prev) return null;
        const updatedComments = [newComment, ...(prev.comments || [])];
        return {
          ...prev,
          comments: updatedComments,
          commentCount: updatedComments.length,
        };
      });

      setImagePost((prev) => {
        if (!prev || String(prev.id || prev._id) !== String(targetPostId)) return prev;
        const updatedComments = [newComment, ...(prev.comments || [])];
        return {
          ...prev,
          comments: updatedComments,
          commentCount: updatedComments.length,
        };
      });

      setCommentText("");
    } catch (error) {
      console.error("Comment submit error:", error);
      showErrorToast("Failed to add comment");
    }
  };

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Share2 className="text-slate-300 mb-3" size={24} />
        <div className="text-slate-400 text-[12px] font-semibold uppercase tracking-wider">
          No Drops Yet
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-0.5 sm:px-1 md:px-2 py-2">
      {/* 🚀 EXACTLY 3 IMAGES PER ROW ON DESKTOP */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-2 w-full">
        {posts.map((post) => {
          const pId = post.id || post._id;
          const imgIndex = currentImageIndexMap[pId] || 0;

          const rawImages = post.imageUrls || post.images || [];
          const images = rawImages.map((img) =>
            typeof img === "string" ? img : img?.url || img
          );

          const projectUrl = post.projectUrl || post.projectLink;
          const isLinkDead = post.linkDead ?? post.isLinkDead ?? false;
          const creator = post.creator || post.user || ownerOverride || user;
          const creatorAvatar = creator?.profilePicture || creator?.profileImageUrl || dp;
          const creatorHandle = creator?.hotdropId || "user";
          const isLiked = post.liked ?? (post.likes?.some((l) => String(l.id || l._id || l) === String(user?.id || user?._id)));
          const likeCount = post.likeCount ?? post.likes?.length ?? 0;
          const commentCount = post.commentCount ?? post.comments?.length ?? 0;
          const isExpanded = !!expandedMap[pId];
          const isHeartActive = !!doubleTapHeartMap[pId];

          return (
            <div key={pId} className="w-full">
              {/* 💻 CLEAN LIGHT DESKTOP GRID CARD WITH HALF-SCREEN HOVER ZOOM */}
              <div
                className="hidden md:block relative bg-slate-50 rounded-2xl overflow-hidden cursor-pointer aspect-video group shadow-sm hover:shadow-lg transition-all duration-200 border border-slate-200/60 select-none"
                onClick={(e) => handleImageClick(e, post, imgIndex)}
                onMouseEnter={(e) => handleCardHover(e, post)}
                onMouseLeave={() => setHoveredPost(null)}
              >
                {images.length > 0 ? (
                  <img
                    src={images[imgIndex]}
                    className="w-full h-full object-contain p-0.5"
                    alt={post.title || "Drop"}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <Globe size={36} />
                    <span className="text-xs font-bold mt-2">No Screenshot</span>
                  </div>
                )}

                {/* DOUBLE TAP HEART POP ANIMATION */}
                {isHeartActive && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-in zoom-in-50 fade-out duration-700">
                    <Heart size={72} className="fill-rose-500 text-rose-500 drop-shadow-[0_10px_25px_rgba(244,63,94,0.7)] animate-pulse" />
                  </div>
                )}

                {/* CLEAN MINIMAL HOVER OVERLAY */}
                <div className="absolute inset-0 bg-black/35 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <div className="bg-white/95 text-slate-900 px-4 py-2 rounded-xl shadow-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-2">
                    <span>Click to view details</span>
                  </div>
                </div>

                {!user && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center">
                    <div className="bg-white/90 px-4 py-2 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase shadow-xl">
                      <Lock size={12} className="text-indigo-600" /> Login to view
                    </div>
                  </div>
                )}
              </div>

              {/* 📱 MOBILE CARD VIEW: INSTAGRAM-STYLE HEADER ABOVE IMAGE */}
              <div className="block md:hidden relative bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                {/* 📸 INSTAGRAM-STYLE HEADER ABOVE IMAGE */}
                <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-100 bg-white">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={creatorAvatar}
                      className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                      alt={creatorHandle}
                    />
                    <div className="flex flex-col">
                      <Link
                        to={`/user/userprofile/${creatorHandle}`}
                        className="text-xs font-extrabold text-slate-900 leading-none hover:text-blue-600"
                      >
                        @{creatorHandle}
                      </Link>
                      <span className="text-[9px] font-medium text-slate-400 mt-0.5">
                        {post.createdAt
                          ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
                          : "just now"}
                      </span>
                    </div>
                  </div>

                  {/* 3-DOT MENU ON RIGHT FOR DELETE */}
                  {!hideOptions && (
                    <div className="relative z-20">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpen(menuOpen === pId ? null : pId);
                        }}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition"
                      >
                        <MoreVertical size={18} />
                      </button>

                      {menuOpen === pId && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 mt-1 bg-white border border-slate-100 rounded-2xl shadow-xl p-1.5 z-30 min-w-[140px] animate-in zoom-in-95 duration-150"
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirm(post);
                              setMenuOpen(null);
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

                {/* IMAGE WITH DOUBLE-TAP TO LIKE */}
                <div
                  className="relative bg-slate-50 cursor-pointer flex items-center justify-center aspect-video overflow-hidden select-none"
                  onClick={(e) => handleImageClick(e, post, imgIndex)}
                >
                  <img
                    src={images?.[imgIndex]}
                    className="w-full h-full object-contain p-0.5"
                    alt="post"
                  />

                  {/* DOUBLE TAP HEART POP ANIMATION */}
                  {isHeartActive && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-in zoom-in-50 fade-out duration-700">
                      <Heart size={68} className="fill-rose-500 text-rose-500 drop-shadow-[0_10px_25px_rgba(244,63,94,0.7)] animate-pulse" />
                    </div>
                  )}

                  {!user && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                      <div className="bg-white/90 px-4 py-2 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase shadow-xl">
                        <Lock size={12} className="text-indigo-600" /> Login to access
                      </div>
                    </div>
                  )}

                  {/* IMAGE SLIDER BUTTONS & COMPACT BLACK BORDERED WHITE DOTS */}
                  {user && images.length > 1 && (
                    <>
                      <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none z-20">
                        <button
                          onClick={(e) => prevImage(e, pId, images.length)}
                          className="pointer-events-auto bg-black/60 hover:bg-black/80 text-white p-1 rounded-full border border-white/30 shadow-md backdrop-blur-sm transition-transform hover:scale-105 cursor-pointer"
                        >
                          <ChevronLeft size={14} />
                        </button>

                        <button
                          onClick={(e) => nextImage(e, pId, images.length)}
                          className="pointer-events-auto bg-black/60 hover:bg-black/80 text-white p-1 rounded-full border border-white/30 shadow-md backdrop-blur-sm transition-transform hover:scale-105 cursor-pointer"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>

                      {/* COMPACT WHITE DOTS WITH BLACK BORDER */}
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 pointer-events-none z-20">
                        {images.map((_, i) => (
                          <div
                            key={i}
                            className={`rounded-full border border-black/80 transition-all duration-200 ${
                              i === imgIndex
                                ? "w-2.5 h-2.5 bg-white shadow-sm scale-110"
                                : "w-1.5 h-1.5 bg-white/70"
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* CONTENT */}
                <div className="p-4 flex flex-col flex-1">
                  {/* TITLE */}
                  <div className="relative mb-3 group/title">
                    <h3 className="text-[13px] font-black uppercase tracking-[0.15em] text-slate-800 leading-none">
                      {post.title}
                    </h3>
                    <div className="h-[2px] w-8 bg-blue-600 mt-1.5 transition-all duration-300 group-hover/title:w-12" />
                  </div>

                  {/* PROJECT LINK */}
                  <div
                    onClick={(e) => {
                      e.preventDefault();
                      if (!user) {
                        setShowAuthModal(true);
                        return;
                      }
                      if (!isLinkDead && projectUrl) {
                        setPreviewUrl(projectUrl);
                      } else {
                        toast.error("This project link appears to be dead");
                      }
                    }}
                    className="group/link relative flex items-center justify-between p-[1px] rounded-xl mb-4 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                  >
                    {/* Border Glow Layer */}
                    <div
                      className={`absolute inset-0 rounded-xl opacity-10 group-hover/link:opacity-100 transition-opacity duration-500 bg-gradient-to-r ${
                        isLinkDead
                          ? "from-red-500 to-orange-500"
                          : "from-blue-500 via-cyan-400 to-emerald-400"
                      }`}
                    />

                    {/* Main Compact Body */}
                    <div className="relative w-full flex items-center justify-between bg-white/90 backdrop-blur-md border border-slate-200/50 rounded-[11px] px-3 py-1.5 shadow-sm">
                      <div className="flex items-center gap-2.5 truncate">
                        {/* Mini Icon Container */}
                        <div
                          className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-500 ${
                            isLinkDead
                              ? "bg-red-50 text-red-500"
                              : "bg-blue-50 text-blue-600 group-hover/link:bg-blue-600 group-hover/link:text-white"
                          }`}
                        >
                          <Globe size={13} strokeWidth={2.5} />
                        </div>

                        <div
                          className={`flex flex-col truncate transition-all duration-700 ${
                            !user ? "blur-[4px] select-none" : ""
                          }`}
                        >
                          <span className="text-[10px] font-bold text-slate-700 truncate tracking-tight group-hover/link:text-blue-700 transition-colors">
                            {user && projectUrl
                              ? projectUrl.replace("https://", "").replace("www.", "")
                              : "hidden-project-url-protected"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!user ? (
                          <div className="bg-indigo-600 text-white px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-md">
                            <Lock size={10} />
                            <span className="text-[9px] font-black uppercase tracking-tighter">Unlock</span>
                          </div>
                        ) : (
                          <div
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-all ${
                              isLinkDead
                                ? "bg-red-50 text-red-500"
                                : "bg-emerald-50 text-emerald-600 group-hover/link:bg-emerald-500 group-hover/link:text-white"
                            }`}
                          >
                            <span
                              className={`w-1 h-1 rounded-full ${
                                isLinkDead ? "bg-red-500" : "bg-emerald-500 group-hover/link:bg-white"
                              } animate-pulse`}
                            />
                            {isLinkDead ? "Dead" : "Live"}
                          </div>
                        )}

                        <ExternalLink
                          size={11}
                          className="text-slate-300 group-hover/link:text-blue-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* DESCRIPTION */}
                  <div className="relative group/desc">
                    <p className="text-[12px] text-slate-900 pb-1 font-medium leading-relaxed">
                      {post.description && post.description.length > maxLength && !isExpanded
                        ? `${post.description.slice(0, maxLength)}`
                        : post.description}

                      {post.description && post.description.length > maxLength && (
                        <button
                          onClick={(e) => toggleExpand(e, pId)}
                          className="ml-1 text-[11px] text-slate-400 hover:text-blue-600 font-bold transition-colors cursor-pointer inline-block"
                        >
                          {isExpanded ? "  ..Show Less" : "  ...Read More"}
                        </button>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center text-[9px] font-bold text-slate-400">
                    {post.createdAt ? (
                      <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                    ) : (
                      <span>just now</span>
                    )}
                  </div>

                  {/* FOOTER */}
                  <div className="flex justify-between items-center mt-auto border-t pt-3">
                    <div className="flex gap-5 items-center">
                      <div className="flex items-center gap-1">
                        <Heart
                          size={18}
                          onClick={() => handleLike(post)}
                          className={`cursor-pointer transition-colors active:scale-125 ${
                            isLiked ? "fill-red-500 text-red-500" : "text-slate-400"
                          }`}
                        />
                        <span
                          onClick={() => {
                            if (!user) return setShowAuthModal(true);
                            setLikePost(post);
                          }}
                          className="text-xs cursor-pointer font-semibold"
                        >
                          {likeCount}
                        </span>
                      </div>

                      <div
                        className="flex items-center gap-1 cursor-pointer"
                        onClick={() => {
                          if (!user) return setShowAuthModal(true);
                          setCommentPost(post);
                        }}
                      >
                        <MessageCircle size={18} className="text-slate-400" />
                        <span className="text-xs font-semibold">{commentCount}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (!user) return setShowAuthModal(true);
                        setSharePost(post);
                      }}
                      className="p-1"
                    >
                      <Share2 size={16} className="text-slate-400" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 🔍 DIRECTIONAL FLOATING IMAGE ZOOM PREVIEW ON HOVER */}
      <AnimatePresence>
        {hoveredPost && (
          <motion.div
            key="hover-zoom"
            initial={
              popoverPosition === "right"
                ? { opacity: 0, scale: 0.88, x: -60 }
                : popoverPosition === "left"
                ? { opacity: 0, scale: 0.88, x: 60 }
                : { opacity: 0, scale: 0.88, y: -40 }
            }
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={
              popoverPosition === "right"
                ? { opacity: 0, scale: 0.88, x: -60 }
                : popoverPosition === "left"
                ? { opacity: 0, scale: 0.88, x: 60 }
                : { opacity: 0, scale: 0.88, y: -40 }
            }
            transition={{ duration: 0.22, ease: "easeOut" }}
            className={`fixed pointer-events-none z-[500] flex items-center justify-center p-4 ${
              popoverPosition === "right"
                ? "right-6 top-1/2 -translate-y-1/2"
                : popoverPosition === "left"
                ? "left-6 top-1/2 -translate-y-1/2"
                : "inset-x-0 top-6 flex justify-center"
            }`}
          >
            <div className="relative w-[46vw] max-w-[760px] h-[50vh] bg-slate-950/92 backdrop-blur-2xl border border-slate-700/60 rounded-3xl overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.7)] flex flex-col items-center justify-center p-3">
              {(hoveredPost.imageUrls || hoveredPost.images || []).length > 0 ? (
                <img
                  src={
                    typeof (hoveredPost.imageUrls || hoveredPost.images)[0] === "string"
                      ? (hoveredPost.imageUrls || hoveredPost.images)[0]
                      : (hoveredPost.imageUrls || hoveredPost.images)[0]?.url
                  }
                  className="w-full h-full object-contain rounded-2xl"
                  alt={hoveredPost.title || "Zoom Preview"}
                />
              ) : (
                <div className="text-slate-400 font-bold text-xs">No Screenshot</div>
              )}

              
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 💥 IMPROVED SLEEK DELETE CONFIRMATION MODAL */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity"
            onClick={() => !isDeleting && setDeleteConfirm(null)}
          />
          <div className="relative w-full max-w-[320px] bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 border border-red-100 flex items-center justify-center mb-4 shadow-sm">
              <Trash2 size={26} strokeWidth={2.2} className="animate-bounce" />
            </div>
            <h4 className="text-base font-extrabold text-slate-900 mb-1">
              Delete Drop?
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              This drop will be permanently removed.
              <br />
              <span className="font-bold text-slate-800">
                "{deleteConfirm.title}"
              </span>
            </p>
            <div className="flex w-full gap-2.5">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleFinalDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 disabled:opacity-60 transition flex items-center justify-center gap-1.5 shadow-lg shadow-red-500/25 active:scale-95"
              >
                {isDeleting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <>
                    <Trash2 size={14} /> Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AUTH REQUIRED MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setShowAuthModal(false)}
          />
          <div className="relative bg-white w-full max-w-[300px] rounded-2xl p-6 shadow-xl text-center border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <ShieldCheck size={24} />
            </div>
            <h2 className="text-base font-bold text-slate-900 mb-1">Sign in required</h2>
            <p className="text-[12px] text-slate-500 mb-6">Please login to access this DROP.</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => navigate("/login")}
                className="w-full bg-indigo-600 text-white text-[13px] font-semibold py-2.5 rounded-lg hover:bg-indigo-700 transition-all"
              >
                Sign In
              </button>
              <button
                onClick={() => setShowAuthModal(false)}
                className="w-full bg-slate-50 text-slate-600 text-[13px] font-semibold py-2.5 rounded-lg hover:bg-slate-100"
              >
                Cancel
              </button>
            </div>
            <p className="mt-4 text-[11px] text-slate-400">
              New here?{" "}
              <Link to="/signup" className="text-indigo-600 font-bold hover:underline">
                Create account
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* IMAGE MODAL */}
      {imagePost && (
        <ImageModal
          post={imagePost}
          posts={posts}
          onNavigatePost={(nextPost) => setImagePost(nextPost)}
          modalIndex={modalIndex}
          setModalIndex={setModalIndex}
          onClose={() => setImagePost(null)}
          handleLike={handleLike}
          setLikePost={setLikePost}
          setCommentPost={setCommentPost}
          setSharePost={setSharePost}
          ownerOverride={ownerOverride}
        />
      )}

      {/* COMMENT MODAL */}
      {commentPost && (
        <CommentModal
          post={commentPost}
          commentText={commentText}
          setCommentText={setCommentText}
          setCommentPost={(upd) => {
            const updatedValue = typeof upd === "function" ? upd(commentPost) : upd;
            setCommentPost(updatedValue);
            if (updatedValue && imagePost && (imagePost.id || imagePost._id) === (updatedValue.id || updatedValue._id)) {
              setImagePost(updatedValue);
            }
          }}
          submitComment={submitComment}
          onClose={() => setCommentPost(null)}
        />
      )}

      {/* SHARE MODAL */}
      {sharePost && (
        <ShareModal post={sharePost} onClose={() => setSharePost(null)} />
      )}

      {/* LIKE MODAL */}
      {likePost && (
        <LikeModal post={likePost} onClose={() => setLikePost(null)} />
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

export default UserPost;