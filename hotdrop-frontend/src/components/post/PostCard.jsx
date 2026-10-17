import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  Heart,
  MessageCircle,
  Share2,
  Clock,
  Globe,
  Lock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "react-toastify";
import { useAuthStore } from "../../store/useAuthStore";
import { showDeadLinkToast } from "../../toast/Toast";
import PostTags from "./PostTags";
import PostDescription from "./PostDescription";
import dp from "../../assets/dp.jpg";

const formatTime = (dateString) => {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch {
    return "recently";
  }
};

function PostCard({
  post,
  onLike,
  onImageClick,
  onComment,
  onShare,
  onViewLikes,
  onPreview,
  onRequireAuth,
  showHeaderShare = false,
}) {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [imgIndex, setImgIndex] = useState(0);
  const [isHeartActive, setIsHeartActive] = useState(false);

  const pId = post.id || post._id;
  const owner = post.creator || post.user || post.userResponseDto || {};
  const rawImages = post.imageUrls || post.images || [];
  const images = rawImages.map((img) => (typeof img === "string" ? { url: img } : img));
  const ownerAvatar = owner.profilePicture || owner.profileImageUrl || owner.avatar || dp;
  const ownerHandle = owner.hotdropId || owner.username || "user";
  const isLiked =
    post.liked ??
    (post.likes?.some((l) => String(l.id || l._id || l) === String(user?.id || user?._id)));
  const isLinkDead = post.isLinkDead ?? post.linkDead ?? false;
  const projectLink = post.projectLink || post.projectUrl;

  const likeCount = post.likeCount ?? post.likes?.length ?? 0;
  const commentCount = post.commentCount ?? post.comments?.length ?? 0;

  const handleShareClick = async () => {
    if (onShare) {
      onShare(post);
    } else {
      const postUrl = `${window.location.origin}/post/${pId}`;
      try {
        await navigator.clipboard?.writeText(postUrl);
        toast.success("Post link copied to clipboard!");
      } catch (err) {
        console.error("Failed to copy post link:", err);
        toast.error("Failed to copy link to clipboard");
      }
    }
  };

  const handleCardImageClick = () => {
    if (!user) {
      if (onRequireAuth) onRequireAuth();
      return;
    }
    if (onImageClick) {
      onImageClick(post, imgIndex);
    }
  };

  const triggerDoubleTap = () => {
    if (!user) {
      if (onRequireAuth) onRequireAuth();
      return;
    }
    if (!isLiked && onLike) {
      onLike(post);
    }
    setIsHeartActive(true);
    setTimeout(() => {
      setIsHeartActive(false);
    }, 800);
  };

  const handlePreviewClick = (e) => {
    e.preventDefault();
    if (!user) {
      if (onRequireAuth) onRequireAuth();
      return;
    }
    if (!isLinkDead && projectLink) {
      if (onPreview) {
        onPreview(projectLink);
      }
    } else {
      showDeadLinkToast("This project link is currently down or unreachable");
    }
  };

  const renderLikesCounter = () => {
    if (onViewLikes) {
      return (
        <button
          type="button"
          onClick={() => {
            if (!user && onRequireAuth) return onRequireAuth();
            onViewLikes(post);
          }}
          aria-label="View users who liked this post"
          className="text-xs font-black text-slate-800 hover:text-blue-600 transition-colors cursor-pointer bg-transparent border-0 p-0"
        >
          {likeCount}
        </button>
      );
    }

    return <span className="text-xs font-black text-slate-800">{likeCount}</span>;
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/70 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col group/card">
      {/* HEADER */}
      <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100/60">
        <button
          type="button"
          className="flex items-center gap-3 cursor-pointer group/user text-left bg-transparent border-0 p-0"
          onClick={() => navigate(`/user/userprofile/${ownerHandle}`)}
        >
          <img
            src={ownerAvatar}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 group-hover/user:ring-blue-500 transition-all shadow-sm"
            alt={ownerHandle}
          />
          <div className="flex flex-col">
            <span className="text-xs sm:text-[13px] font-black text-slate-900 lowercase leading-tight group-hover/user:text-blue-600 transition-colors">
              @{ownerHandle}
            </span>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 mt-0.5">
              <Clock size={11} /> {formatTime(post.createdAt)}
            </div>
          </div>
        </button>

        {showHeaderShare && (
          <button
            type="button"
            onClick={handleShareClick}
            className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-slate-50 transition-all cursor-pointer"
            title="Share Project"
          >
            <Share2 size={18} />
          </button>
        )}
      </div>

      {/* MEDIA AREA */}
      {images.length > 0 && (
        <div className="relative mx-2 sm:mx-4 mt-2 sm:mt-3 bg-slate-950 rounded-2xl aspect-[16/9] flex items-center justify-center overflow-hidden border border-slate-900 group/img w-[calc(100%-1rem)] sm:w-[calc(100%-2rem)]">
          <button
            type="button"
            aria-label="View media details"
            className="w-full h-full p-0 border-0 bg-transparent cursor-pointer flex items-center justify-center"
            onClick={handleCardImageClick}
            onDoubleClick={triggerDoubleTap}
          >
            <img
              src={images[imgIndex]?.url}
              className="w-full h-full object-contain transition-all duration-700 group-hover/img:scale-[1.02]"
              alt={post.title ? `${post.title} screenshot ${imgIndex + 1}` : "Post media preview"}
            />

            {isHeartActive && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-in zoom-in-50 fade-out duration-700">
                <Heart
                  size={80}
                  className="fill-rose-500 text-rose-500 drop-shadow-[0_10px_25px_rgba(244,63,94,0.8)] animate-pulse"
                />
              </div>
            )}

            {!user && (
              <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[3px] flex items-center justify-center">
                <div className="bg-white/95 px-4 py-2.5 rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-900 shadow-2xl">
                  <Lock size={14} className="text-blue-600" /> Sign In to View Image
                </div>
              </div>
            )}
          </button>

          {images.length > 1 && (
            <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none z-20">
              <button
                type="button"
                aria-label="Previous image"
                onClick={(e) => {
                  e.stopPropagation();
                  setImgIndex((prev) => (prev - 1 + images.length) % images.length);
                }}
                className="pointer-events-auto bg-slate-900/70 hover:bg-blue-600 text-white p-2 rounded-2xl transition-all shadow-md backdrop-blur-md cursor-pointer inline-flex items-center justify-center border-0"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                aria-label="Next image"
                onClick={(e) => {
                  e.stopPropagation();
                  setImgIndex((prev) => (prev + 1) % images.length);
                }}
                className="pointer-events-auto bg-slate-900/70 hover:bg-blue-600 text-white p-2 rounded-2xl transition-all shadow-md backdrop-blur-md cursor-pointer inline-flex items-center justify-center border-0"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}

          {images.length > 1 && (
            <div className="absolute bottom-3 flex gap-1.5">
              {images.map((img, idx) => (
                <div
                  key={`${img?.url || pId}-dot-${idx}`}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === imgIndex ? "w-5 bg-blue-500" : "w-1.5 bg-white/40"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* POST CONTENT BODY */}
      <div className="p-4 sm:p-5 flex flex-col">
        {/* TITLE & TAGS */}
        <div className="flex items-start justify-between gap-3 mb-3 flex-wrap sm:flex-nowrap">
          <h3 className="group/title text-sm sm:text-base font-black uppercase text-slate-900 tracking-tight leading-snug min-w-0 flex-1">
            {post.title}
            <div className="h-[2.5px] w-8 bg-blue-600 mt-1.5 transition-all duration-300 group-hover/title:w-16 shadow-[0_0_10px_rgba(37,99,235,0.5)]" />
          </h3>
          <PostTags tags={post.tags || post.tagsList || post.tag} postTitle={post.title} />
        </div>

        {projectLink && (
          <button
            type="button"
            aria-label="Preview project link"
            onClick={handlePreviewClick}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                handlePreviewClick(e);
              }
            }}
            className="group/link relative flex items-center justify-between p-[1px] rounded-2xl mb-3.5 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] cursor-pointer w-full text-left bg-transparent border-0"
          >
            <div
              className={`absolute inset-0 rounded-2xl opacity-20 group-hover/link:opacity-100 transition-opacity duration-500 bg-gradient-to-r ${
                isLinkDead
                  ? "from-red-500 to-orange-500"
                  : "from-blue-600 via-indigo-500 to-emerald-400"
              }`}
            />
            <div className="relative w-full flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-[15px] px-3.5 py-2.5 shadow-sm">
              <div className="flex items-center gap-3 truncate">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-300 ${
                    isLinkDead
                      ? "bg-red-100 text-red-500"
                      : "bg-blue-100 text-blue-600 group-hover/link:bg-blue-600 group-hover/link:text-white"
                  }`}
                >
                  <Globe size={15} strokeWidth={2.5} />
                </div>
                <div
                  className={`flex flex-col truncate transition-all ${
                    !user ? "blur-[4px] select-none" : ""
                  }`}
                >
                  <span className="text-xs font-bold text-slate-700 truncate tracking-tight group-hover/link:text-blue-600 transition-colors">
                    {user
                      ? projectLink?.replace("https://", "").replace("www.", "")
                      : "hidden-project-url-protected"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!user ? (
                  <div className="bg-blue-600 text-white px-3 py-1 rounded-xl flex items-center gap-1.5 shadow-sm">
                    <Lock size={11} />
                    <span className="text-[10px] font-black uppercase tracking-wider">Unlock</span>
                  </div>
                ) : (
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                      isLinkDead
                        ? "bg-red-100 text-red-600"
                        : "bg-emerald-100 text-emerald-700 group-hover/link:bg-emerald-500 group-hover/link:text-white"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isLinkDead ? "bg-red-500" : "bg-emerald-500 group-hover/link:bg-white"
                      } animate-pulse`}
                    />
                    {isLinkDead ? "Dead" : "Live"}
                  </div>
                )}
                <ExternalLink
                  size={13}
                  className="text-slate-400 group-hover/link:text-blue-600 transition-colors"
                />
              </div>
            </div>
          </button>
        )}

        <PostDescription description={post.description} />

        <div className="flex items-center gap-6 sm:gap-8 border-t border-slate-100 pt-3.5 mt-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onLike && onLike(post)}
              aria-label={isLiked ? "Unlike post" : "Like post"}
              className="flex items-center cursor-pointer group/like bg-transparent border-0 p-0"
            >
              <Heart
                size={22}
                className={`transition-all duration-300 ${
                  isLiked
                    ? "fill-red-500 text-red-500 scale-110"
                    : "text-slate-400 group-hover/like:text-red-500"
                }`}
              />
            </button>
            {renderLikesCounter()}
          </div>

          <button
            type="button"
            className="flex items-center gap-2 cursor-pointer group/comment bg-transparent border-0 p-0"
            onClick={() => {
              if (!user && onRequireAuth) return onRequireAuth();
              if (onComment) onComment(post);
            }}
          >
            <MessageCircle
              size={22}
              className="text-slate-400 group-hover/comment:text-blue-600 transition-colors"
            />
            <span className="text-xs font-black text-slate-800">{commentCount}</span>
          </button>

          <button
            type="button"
            className="flex items-center gap-2 cursor-pointer group/share ml-auto bg-transparent border-0 p-0"
            onClick={handleShareClick}
          >
            <Share2
              size={20}
              className="text-slate-400 group-hover/share:text-blue-600 transition-colors"
            />
            <span className="text-[11px] font-bold text-slate-500 group-hover/share:text-blue-600 hidden sm:inline">
              Share
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default PostCard;
