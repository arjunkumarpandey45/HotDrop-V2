import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import {
  Heart,
  MessageCircle,
  Share2,
  ChevronLeft,
  ChevronRight,
  Globe,
  ExternalLink,
  ArrowLeft,
  Clock,
  Lock,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import CommentModal from "./CommentModal";
import LikeModal from "./LikeModal";
import ShareModal from "./ShareModal";
import ImageModal from "./ImageModal";
import PreviewModal from "./PreviewModal";
import API from "../../api/Api";
import { showCommentToast, showErrorToast } from "../../toast/Toast";
import dp from "../../assets/dp.jpg";
import { AnimatePresence } from "framer-motion";

function FromShare() {
  const { postId } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [previewUrl, setPreviewUrl] = useState(null);
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [commentPost, setCommentPost] = useState(null);
  const [likePost, setLikePost] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [sharePost, setSharePost] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [imagePost, setImagePost] = useState(null);
  const [modalIndex, setModalIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  const maxLength = 100;

  useEffect(() => {
    const fetchSinglePost = async () => {
      try {
        setLoading(true);
        const shareUrl = postId;

        // 🎯 Official Backend Endpoint: GET /posts/share/{shareUrl}
        const res = await API.get(`/posts/share/${shareUrl}`);
        const payload = res.data?.data || res.data;
        const postData = payload?.post || payload;
        setPost(postData);
      } catch (error) {
        console.error("Fetch single post error:", error);
        setPost(null);
      } finally {
        setLoading(false);
      }
    };
    if (postId) fetchSinglePost();
  }, [postId]);

  const toggleExpand = (e) => {
    e.preventDefault();
    setIsExpanded(!isExpanded);
  };

  const handleLike = async (postToLike) => {
    if (!user) return setShowAuthModal(true);

    const targetId = postToLike.id || postToLike._id;

    try {
      const res = await API.post(`/posts/like/${targetId}`);
      if (res.status === 200 || res.data?.statusCode === 200) {
        const payloadData = res.data?.data || res.data;
        const newLikeCount = payloadData?.likeCount ?? (postToLike.likeCount + (postToLike.liked ? -1 : 1));
        const newLikedState = payloadData?.liked ?? payloadData?.isLiked ?? !postToLike.liked;

        setPost((prev) => ({
          ...prev,
          likeCount: newLikeCount,
          liked: newLikedState,
        }));

        toast.success(newLikedState ? "Drop liked! ❤️" : "Unliked");
      }
    } catch (error) {
      toast.error("Action failed");
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!user) return setShowAuthModal(true);
    if (!commentText.trim()) return;

    const targetId = post?.id || post?._id;
    const textToSubmit = commentText;

    try {
      const res = await API.post(`/posts/comment/${targetId}`, {
        text: textToSubmit,
      });
      const rawComment = res.data?.data?.comment || res.data?.data || res.data;
      const newComment = {
        id: rawComment.id || rawComment._id || String(Date.now()),
        text: rawComment.text || rawComment.comment || textToSubmit,
        createdAt: rawComment.createdAt || new Date().toISOString(),
        user: (typeof rawComment.user === "object" && rawComment.user?.hotdropId ? rawComment.user : null) ||
              (typeof rawComment.creator === "object" && rawComment.creator?.hotdropId ? rawComment.creator : null) ||
              user,
      };

      const updateFn = (prev) => {
        if (!prev) return null;
        const updatedComments = [newComment, ...(prev.comments || [])];
        return {
          ...prev,
          comments: updatedComments,
          commentCount: updatedComments.length,
        };
      };

      setPost(updateFn);
      setCommentPost(updateFn);
      setImagePost(updateFn);

      setCommentText("");
      showCommentToast("Comment added!");
    } catch (error) {
      console.error("Comment submit error in FromShare:", error);
      showErrorToast("Error adding comment");
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center font-black text-blue-600 tracking-widest uppercase animate-pulse text-sm">
        Loading Drop...
      </div>
    );
  }

  if (!post) {
    return (
      <div className="h-screen flex flex-col items-center justify-center font-bold text-slate-800 gap-2">
        <span className="text-xl">404 - Drop Not Found</span>
        <button onClick={() => navigate("/")} className="text-xs text-blue-600 hover:underline">
          Go to Home
        </button>
      </div>
    );
  }

  const rawImages = post.imageUrls || post.images || [];
  const images = rawImages.map((img) =>
    typeof img === "string" ? img : img?.url || img
  );
  const owner = post.creator || post.user || {};
  const ownerAvatar = owner.profilePicture || owner.profileImageUrl || dp;
  const projectUrl = post.projectUrl || post.projectLink;
  const isLinkDead = post.linkDead ?? post.isLinkDead ?? false;
  const isLiked = post.liked ?? (post.likes?.some((l) => String(l.id || l._id || l) === String(user?.id || user?._id)));
  const likeCount = post.likeCount ?? post.likes?.length ?? 0;
  const commentCount = post.commentCount ?? post.comments?.length ?? 0;

  return (
    <div className="min-h-screen bg-slate-50 pt-2.5 pb-6 px-3 flex flex-col items-center justify-start sm:justify-center">
      {/* UNIVERSAL COMPACT DETAILED CARD FOR BOTH MOBILE & DESKTOP */}
      <div className="w-full max-w-sm mx-auto space-y-2.5">
        {/* TOP BAR WITH BACK BUTTON & HOTDROP BRAND */}
        <div className="flex justify-between items-center px-1">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200/80 rounded-xl text-[11px] font-extrabold uppercase text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm cursor-pointer"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <div className="text-xs font-black tracking-widest uppercase select-none">
            <span className="text-orange-500">Hot</span>
            <span className="text-blue-600">Drop</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-3.5 border border-slate-200/80 shadow-2xl overflow-hidden flex flex-col">
          {/* PROFILE HEADER */}
          <div className="pb-3 flex items-center justify-between border-b border-slate-100 mb-3">
            <div
              className="flex items-center gap-2.5 cursor-pointer group"
              onClick={() => navigate(`/user/userprofile/${owner.hotdropId}`)}
            >
              <img
                src={ownerAvatar}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-100 group-hover:ring-blue-200 transition"
                alt="avatar"
              />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600">
                  @{owner.hotdropId || "user"}
                </span>
                <div className="flex items-center text-[9px] font-medium text-slate-400">
                  <Clock size={10} className="mr-1" />
                  {post.createdAt
                    ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
                    : "just now"}
                </div>
              </div>
            </div>

           
          </div>

          {/* IMAGE PREVIEW AREA */}
          <div
            className="relative bg-slate-50 border border-slate-200/70 group aspect-video w-full rounded-2xl flex items-center justify-center overflow-hidden cursor-pointer mb-3 shadow-inner"
            onClick={() => {
              setImagePost(post);
              setModalIndex(currentImageIndex);
            }}
          >
            {images.length > 0 ? (
              <img
                src={images[currentImageIndex]}
                className="w-full h-full object-contain p-1 transition-transform duration-300"
                alt="drop preview"
              />
            ) : (
              <div className="text-slate-400 text-xs font-semibold flex flex-col items-center">
                <Globe size={32} />
                <span className="mt-1">No Screenshot</span>
              </div>
            )}

            {images.length > 1 && (
              <>
                <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none z-20">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex((p) => (p - 1 + images.length) % images.length);
                    }}
                    className="pointer-events-auto bg-black/60 hover:bg-black/80 text-white p-1 rounded-full border border-white/30 shadow-md backdrop-blur-sm transition-transform hover:scale-105 cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex((p) => (p + 1) % images.length);
                    }}
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
                        i === currentImageIndex
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
          <div className="flex flex-col">
            <h3 className="text-base font-extrabold uppercase text-slate-900 mb-2 leading-snug">
              {post.title}
            </h3>

            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {post.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md"
                  >
                    <Tag size={10} />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* LINK SECTION */}
            <div
              onClick={() => {
                if (!isLinkDead && projectUrl) {
                  setPreviewUrl(projectUrl);
                } else {
                  toast.error("This project link appears to be dead");
                }
              }}
              className="group/link relative flex items-center justify-between p-[1px] rounded-xl mb-3 transition-all duration-300 hover:scale-[1.01] cursor-pointer"
            >
              <div
                className={`absolute inset-0 rounded-xl opacity-20 group-hover/link:opacity-100 transition-opacity duration-500 bg-gradient-to-r ${
                  isLinkDead
                    ? "from-red-500 to-orange-500"
                    : "from-blue-600 via-indigo-500 to-emerald-400"
                }`}
              />
              <div className="relative w-full flex items-center justify-between bg-white border border-slate-200/80 rounded-[11px] px-3.5 py-2.5 shadow-sm">
                <div className="flex items-center gap-2.5 truncate">
                  <div
                    className={`flex items-center justify-center w-7 h-7 rounded-lg transition-colors ${
                      isLinkDead
                        ? "bg-red-50 text-red-500"
                        : "bg-blue-50 text-blue-600 group-hover/link:bg-blue-600 group-hover/link:text-white"
                    }`}
                  >
                    <Globe size={14} strokeWidth={2.5} />
                  </div>
                  <span className="text-xs font-bold text-slate-700 truncate">
                    {projectUrl ? projectUrl.replace(/^https?:\/\//i, "").replace(/^www\./i, "") : "No Link"}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase ${
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

            {/* DESCRIPTION */}
            <p className="text-xs text-slate-600 leading-relaxed font-normal mb-4">
              {isExpanded ? post.description : `${post.description?.slice(0, maxLength)}`}

              {post.description && post.description.length > maxLength && (
                <button
                  onClick={toggleExpand}
                  className="ml-1 text-xs text-blue-600 hover:underline font-bold"
                >
                  {isExpanded ? " Show Less" : " ...Read More"}
                </button>
              )}
            </p>

            {/* ACTION BAR */}
            <div className="flex justify-between items-center border-t border-slate-100 pt-3">
              <div className="flex gap-6">
                <button
                  onClick={() => handleLike(post)}
                  className="flex items-center gap-2 group cursor-pointer"
                >
                  <Heart
                    size={20}
                    className={`transition-transform duration-200 group-hover:scale-110 ${
                      isLiked ? "fill-red-500 text-red-500" : "text-slate-400"
                    }`}
                  />
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!user) return setShowAuthModal(true);
                      setLikePost(post);
                    }}
                    className="text-xs font-bold text-slate-800 hover:text-blue-600"
                  >
                    {likeCount}
                  </span>
                </button>

                <button
                  onClick={() => (!user ? setShowAuthModal(true) : setCommentPost(post))}
                  className="flex items-center gap-2 group cursor-pointer"
                >
                  <MessageCircle
                    size={20}
                    className="text-slate-400 group-hover:text-blue-600 transition"
                  />
                  <span className="text-xs font-bold text-slate-800">{commentCount}</span>
                </button>
              </div>

              <button
                onClick={() => setSharePost(post)}
                className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition"
              >
                <Share2 size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AUTH REQUIRED MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowAuthModal(false)} />
          <div className="relative bg-white w-full max-w-xs rounded-2xl p-6 shadow-2xl text-center border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <ShieldCheck size={24} />
            </div>
            <h2 className="text-base font-bold text-slate-900 mb-1">Sign in required</h2>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Join the community to access and interact with this drop.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => navigate("/login")}
                className="w-full bg-blue-600 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-blue-700 transition shadow-md shadow-blue-500/20"
              >
                Sign In
              </button>
              <button
                onClick={() => setShowAuthModal(false)}
                className="w-full bg-slate-100 text-slate-600 text-xs font-bold py-2.5 rounded-xl hover:bg-slate-200 transition"
              >
                Cancel
              </button>
            </div>
            <p className="mt-4 text-[11px] text-slate-400 font-bold uppercase">
              New here?{" "}
              <Link to="/signup" className="text-blue-600 hover:underline">
                Create account
              </Link>
            </p>
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

      {/* IMAGE MODAL */}
      {imagePost && (
        <ImageModal
          post={post}
          modalIndex={modalIndex}
          setModalIndex={setModalIndex}
          handleLike={handleLike}
          onClose={() => setImagePost(null)}
          setLikePost={setLikePost}
          setCommentPost={setCommentPost}
          setSharePost={setSharePost}
        />
      )}

      {commentPost && (
        <CommentModal
          post={post}
          commentText={commentText}
          setCommentText={setCommentText}
          submitComment={submitComment}
          onClose={() => setCommentPost(null)}
          setCommentPost={(upd) => {
            const updatedValue = typeof upd === "function" ? upd(commentPost || post) : upd;
            setCommentPost(updatedValue);
            setPost(updatedValue);
            if (imagePost) setImagePost(updatedValue);
          }}
        />
      )}

      {sharePost && <ShareModal post={post} onClose={() => setSharePost(null)} />}
      {likePost && <LikeModal post={post} onClose={() => setLikePost(null)} />}
    </div>
  );
}

export default FromShare;