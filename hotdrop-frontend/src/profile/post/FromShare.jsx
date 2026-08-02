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
import { toast } from "react-toastify";
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
        // Try getting post by shareUrl or postId
        let res;
        try {
          res = await API.get(`/posts/share/${postId}`);
        } catch {
          res = await API.get(`/posts/${postId}`);
        }

        const postData = res.data?.data || res.data;
        setPost(postData);
      // eslint-disable-next-line no-unused-vars
      } catch (error) {
        toast.error("Drop not found!");
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
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      toast.error("Action failed");
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!user) return setShowAuthModal(true);
    if (!commentText.trim()) return;

    const targetId = post?.id || post?._id;

    try {
      const res = await API.post(`/posts/comment/${targetId}`, {
        text: commentText,
      });
      const newComment = res.data?.data || res.data;

      setPost((prev) => ({
        ...prev,
        comments: [newComment, ...(prev.comments || [])],
        commentCount: (prev.commentCount || 0) + 1,
      }));

      setCommentText("");
      toast.success("Comment added!");
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      toast.error("Error adding comment");
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
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      {/* BRANDING TOP RIGHT DESKTOP */}
      <div className="hidden lg:block fixed top-6 right-8 z-50">
        <span className="font-black text-xl text-orange-500 uppercase">Hot</span>
        <span className="font-black text-xl text-blue-600 uppercase">Drop</span>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* LEFT SIDE BACK BUTTON DESKTOP */}
        <div className="hidden lg:block">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-xs font-bold uppercase text-slate-400 hover:text-blue-600 transition-all"
          >
            <ArrowLeft size={16} /> Back
          </button>
        </div>

        {/* MAIN COLUMN */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          <div className="lg:hidden flex justify-between items-center mb-2">
            <button
              onClick={() => navigate(-1)}
              className="p-2 bg-white rounded-full shadow-sm text-slate-600 hover:bg-slate-100"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="text-sm font-black tracking-widest uppercase">
              <span className="text-orange-500">Hot</span>
              <span className="text-blue-600">Drop</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xl overflow-hidden flex flex-col">
            {/* PROFILE HEADER */}
            <div className="pb-4 flex items-center justify-between border-b border-slate-100 mb-4">
              <div
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => navigate(`/user/userprofile/${owner.hotdropId}`)}
              >
                <img
                  src={ownerAvatar}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 group-hover:ring-blue-200 transition"
                  alt="avatar"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600">
                    @{owner.hotdropId || "user"}
                  </span>
                  <div className="flex items-center text-[10px] font-medium text-slate-400">
                    <Clock size={10} className="mr-1" />
                    {post.createdAt
                      ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
                      : "just now"}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSharePost(post)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
              >
                <Share2 size={18} />
              </button>
            </div>

            {/* IMAGE PREVIEW AREA */}
            <div
              className="relative bg-slate-950 group h-64 rounded-2xl flex items-center justify-center overflow-hidden cursor-pointer mb-5"
              onClick={() => {
                if (!user) return setShowAuthModal(true);
                setImagePost(post);
                setModalIndex(currentImageIndex);
              }}
            >
              {images.length > 0 ? (
                <img
                  src={images[currentImageIndex]}
                  className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                    !user ? "blur-sm opacity-60" : ""
                  }`}
                  alt="drop preview"
                />
              ) : (
                <div className="text-slate-400 text-xs font-semibold flex flex-col items-center">
                  <Globe size={32} />
                  <span className="mt-1">No Screenshot</span>
                </div>
              )}

              {!user && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white/90 px-4 py-2 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase text-slate-900 shadow-xl">
                    <Lock size={12} className="text-blue-600" /> Exclusive Drop
                  </div>
                </div>
              )}

              {user && images.length > 1 && (
                <>
                  <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 flex justify-between">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex((p) => (p - 1 + images.length) % images.length);
                      }}
                      className="bg-black/50 text-white p-2 rounded-xl backdrop-blur-md hover:bg-black/80"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex((p) => (p + 1) % images.length);
                      }}
                      className="bg-black/50 text-white p-2 rounded-xl backdrop-blur-md hover:bg-black/80"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                    {images.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 rounded-full transition-all ${
                          i === currentImageIndex ? "w-4 bg-white" : "w-1.5 bg-white/40"
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
                <div className="flex flex-wrap gap-1.5 mb-4">
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
                  if (!user) {
                    setShowAuthModal(true);
                  } else if (!isLinkDead && projectUrl) {
                    setPreviewUrl(projectUrl);
                  } else {
                    toast.error("This project link appears to be dead");
                  }
                }}
                className="group/link relative flex items-center justify-between p-[1px] rounded-xl mb-4 transition-all duration-300 hover:scale-[1.01] cursor-pointer"
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
                      {user && projectUrl
                        ? projectUrl.replace(/^https?:\/\//i, "").replace(/^www\./i, "")
                        : "protected-project-url"}
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
              <p className="text-xs text-slate-600 leading-relaxed font-normal mb-5">
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
              <div className="flex justify-between items-center border-t border-slate-100 pt-4">
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
          setCommentPost={setPost}
        />
      )}

      {sharePost && <ShareModal post={post} onClose={() => setSharePost(null)} />}
      {likePost && <LikeModal post={post} onClose={() => setLikePost(null)} />}
    </div>
  );
}

export default FromShare;