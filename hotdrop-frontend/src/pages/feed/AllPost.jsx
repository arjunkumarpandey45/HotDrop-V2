import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Globe, 
  ExternalLink, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Lock, 
  ShieldCheck, 
  Sparkles,
  Flame,
  X,
  SlidersHorizontal,
  Boxes,
  Search
} from "lucide-react";
import Sidebar from "../../components/layout/Sidebar";
import Sponser from "../../components/post/Sponser";
import PostDescription from "../../components/post/PostDescription";
import PostTags from "../../components/post/PostTags";
import { toast } from "react-toastify";
import { showLikeToast, showCommentToast, showErrorToast } from "../../toast/Toast";
import CommentModal from "../../components/modals/CommentModal";
import LikeModal from "../../components/modals/LikeModal";
import ShareModal from "../../components/modals/ShareModal";
import ImageModal from "../../components/modals/ImageModal"; 
import PreviewModal from "../../components/modals/PreviewModal";
import API from "../../api/Api";
import dp from "../../assets/dp.jpg";
import { AnimatePresence } from "framer-motion";

function AllPost() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [previewUrl, setPreviewUrl] = useState(null);
  const [posts, setPosts] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [commentPost, setCommentPost] = useState(null);
  const [likePost, setLikePost] = useState(null);
  const [sharePost, setSharePost] = useState(null);
  const [imagePost, setImagePost] = useState(null);
  const [modalIndex, setModalIndex] = useState(0);
  const [currentImage, setCurrentImage] = useState({});
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [doubleTapHeartMap, setDoubleTapHeartMap] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const feedContainerRef = useRef(null);

  const quickTopics = [
    "React", "NextJS", "MERN", "SpringBoot", "NodeJS", "TailwindCSS", "AI", "Python", "Java", "PostgreSQL"
  ];

  const allFilterCategories = [
    {
      id: "frontend",
      category: "⚡ Frontend & Fullstack",
      tags: ["React 19", "NextJS", "MERN", "TailwindCSS", "VueJS", "Angular", "TypeScript", "Svelte"]
    },
    {
      id: "backend",
      category: "🛡️ Backend & Frameworks",
      tags: ["SpringBoot", "NodeJS", "Express", "Django", "FastAPI", "Java 21", "Python", "Go", "GraphQL"]
    },
    {
      id: "database",
      category: "🗄️ Database & Cloud",
      tags: ["PostgreSQL", "MongoDB", "Redis", "Supabase", "Docker", "AWS", "Firebase"]
    },
    {
      id: "ai",
      category: "🤖 AI & Emerging Tech",
      tags: ["OpenAI API", "LangChain", "PyTorch", "Agentic AI", "WebSockets", "Web3"]
    }
  ];

  const handleFilterTopic = (tag) => {
    const cleanTag = tag.replace(/[^a-zA-Z0-9]/g, "");
    navigate(`/search?q=${encodeURIComponent(cleanTag)}`);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // States for Infinite Scroll (Spring Boot 0-indexed page)
  const [fetchingMore, setFetchingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // 1. DATA FETCHING MATCHING BACKEND /posts/feed CONTRACT
  const fetchGlobalFeed = useCallback(async (pageNum = 0, search = "") => {
    try {
      if (pageNum === 0) setLoading(true);
      else setFetchingMore(true);

      let fetchedPosts = [];
      let isLast = true;

      // GET /posts/feed?page=0&size=10&sortBy=created_at&direction=DESC&search=...
      const res = await API.get("/posts/feed", {
        params: {
          page: pageNum,
          size: 10,
          sortBy: "created_at",
          direction: "DESC",
          ...(search.trim() ? { search: search.trim() } : {}),
        },
      });

      const payload = res.data?.data || res.data;
      fetchedPosts = payload?.posts || (Array.isArray(payload) ? payload : []);
      isLast = payload?.isLastPage ?? (payload?.last ?? (fetchedPosts.length < 10));

      if (Array.isArray(fetchedPosts)) {
        setPosts((prev) => {
          if (pageNum === 0) return fetchedPosts;

          // Deduplicate using a Map, preserving insertion order
          const postMap = new Map(prev.map((p) => [(p.id || p._id), p]));
          fetchedPosts.forEach((p) => {
            const key = p.id || p._id;
            if (key && !postMap.has(key)) {
              postMap.set(key, p);
            }
          });

          return Array.from(postMap.values());
        });

        setHasMore(!isLast);
      } else {
        if (pageNum === 0) setPosts([]);
        setHasMore(false);
      }
    } catch (error) {
      console.error("Fetch feed error:", error);
      toast.error("Failed to load drops feed.");
    } finally {
      setLoading(false);
      setFetchingMore(false);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    fetchGlobalFeed(0, searchQuery);
  }, [fetchGlobalFeed, searchQuery]);

  // 2. SCROLL LISTENER (Infinite Scroll Logic - 250px trigger)
  useEffect(() => {
    const container = feedContainerRef.current;

    const handleScroll = () => {
      let shouldFetch = false;

      if (container) {
        const { scrollTop, scrollHeight, clientHeight } = container;
        if (scrollTop + clientHeight >= scrollHeight - 250) {
          shouldFetch = true;
        }
      }

      const winScrollHeight = document.documentElement.scrollHeight;
      const winCurrentHeight = window.innerHeight + document.documentElement.scrollTop;
      if (winCurrentHeight >= winScrollHeight - 250) {
        shouldFetch = true;
      }

      if (shouldFetch && hasMore && !loading && !fetchingMore) {
        setPage((prevPage) => {
          const nextPage = prevPage + 1;
          fetchGlobalFeed(nextPage, searchQuery);
          return nextPage;
        });
      }
    };

    window.addEventListener("scroll", handleScroll);
    if (container) container.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (container) container.removeEventListener("scroll", handleScroll);
    };
  }, [hasMore, loading, fetchingMore, fetchGlobalFeed, searchQuery]);

  const formatTime = (dateString) => {
    if (!dateString) return "just now";
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);

    if (diffSeconds < 60) return "just now";
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // 3. LIKE LOGIC (POST /posts/like-post/{postId})
  const handleLike = async (postToLike) => {
    if (!user) return setShowAuthModal(true);

    const postId = postToLike.id || postToLike._id;
    if (!postId) return;

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
          if (String(pId) === String(postId)) {
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

        setPosts((prev) => prev.map(updatePostFn));

        if (imagePost && String(imagePost.id || imagePost._id) === String(postId)) {
          setImagePost((prev) => (prev ? updatePostFn(prev) : null));
        }

        if (likePost && String(likePost.id || likePost._id) === String(postId)) {
          setLikePost((prev) => (prev ? updatePostFn(prev) : null));
        }

        showLikeToast(newLikedState);
      }
    } catch (err) {
      console.error("Like error:", err);
      if (err.response?.status === 401) {
        setShowAuthModal(true);
      } else {
        toast.error(err.response?.data?.message || "Action failed");
      }
    }
  };

  // Double Tap Heart Trigger
  const triggerDoubleTap = (post) => {
    if (!user) return setShowAuthModal(true);
    const pId = post.id || post._id;
    const isLiked = post.liked ?? (post.likes?.some((l) => String(l.id || l._id || l) === String(user.id || user?._id)));

    if (!isLiked) {
      handleLike(post);
    }

    setDoubleTapHeartMap((prev) => ({ ...prev, [pId]: true }));
    setTimeout(() => {
      setDoubleTapHeartMap((prev) => ({ ...prev, [pId]: false }));
    }, 800);
  };

  // 4. COMMENT LOGIC (POST /posts/comment-to-post/{postId})
  const submitComment = async (e, textOverride) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!user) return setShowAuthModal(true);

    const finalCommentText = (textOverride || commentText || "").trim();
    if (!finalCommentText || !commentPost) return;

    const targetPostId = commentPost.id || commentPost._id;

    try {
      const res = await API.post(`/posts/comment-to-post/${targetPostId}`, { text: finalCommentText });
      
      showCommentToast(finalCommentText ? `"${finalCommentText}"` : "Comment added!");
      const newPopulatedComment = res.data?.data || res.data;

      const updatedPostObj = { 
        ...commentPost, 
        comments: [newPopulatedComment, ...(commentPost.comments || [])], 
        commentCount: (commentPost.commentCount || commentPost.comments?.length || 0) + 1 
      };

      setPosts((prevPosts) => prevPosts.map((p) => 
        String(p.id || p._id) === String(targetPostId) ? updatedPostObj : p
      ));

      setCommentPost(updatedPostObj);

      if (imagePost && (imagePost.id || imagePost._id) === targetPostId) {
        setImagePost(updatedPostObj);
      }

      setCommentText(""); 
    } catch (error) {
      console.error("Comment error:", error);
      showErrorToast("Failed to post comment");
    }
  };

  const handleImageClick = (post, index) => {
    if (!user) return setShowAuthModal(true);
    setImagePost(post);
    setModalIndex(index);
  };

  // Initial Shimmer Loader
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] pt-20 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="hidden lg:block">
            <div className="bg-white rounded-3xl p-6 h-64 animate-pulse border border-slate-200" />
          </div>
          <div className="col-span-1 lg:col-span-2 space-y-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm animate-pulse space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-200 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3 bg-slate-200 rounded w-1/3" />
                    <div className="h-2 bg-slate-200 rounded w-1/4" />
                  </div>
                </div>
                <div className="w-full aspect-[16/9] bg-slate-200 rounded-2xl" />
                <div className="h-4 bg-slate-200 rounded w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4.25rem)] bg-[#f8fafc] px-2 sm:px-4 overflow-hidden">
      <div className="max-w-7xl mx-auto h-full grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8 items-start">
        
        {/* LEFT SIDEBAR (100% Independent Scroll Column) */}
        <div className="hidden lg:block h-full overflow-y-auto pt-2 pb-6 pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <Sidebar />
        </div>

        {/* CENTER FEED CONTENT (100% Independent Scroll Column) */}
        <div className="col-span-1 lg:col-span-2 h-full overflow-y-auto pt-2 pb-6 space-y-6 sm:space-y-8 pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          
          {/* TOP FILTER & QUICK TOPICS BAR */}
          <div className="bg-white rounded-3xl p-3 px-3.5 border border-slate-200/80 shadow-sm flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-0.5 flex-1 min-w-0">
              <button
                type="button"
                onClick={() => setShowFilterModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider shrink-0 shadow-md shadow-blue-500/20 transition cursor-pointer"
              >
                <SlidersHorizontal size={14} />
                <span>Filter</span>
              </button>

              <div className="h-4 w-[1px] bg-slate-200 shrink-0" />

              {quickTopics.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => handleFilterTopic(topic)}
                  className="px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-700 text-[11px] font-extrabold whitespace-nowrap transition cursor-pointer shrink-0 border border-slate-200/70"
                >
                  #{topic}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowFilterModal(true)}
              className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-blue-600 hover:text-white transition cursor-pointer shrink-0"
              title="All Tech Topics Filter"
            >
              <Boxes size={16} />
            </button>
          </div>

          {/* LOADING SHIMMER */}
          {loading ? (
            <div className="space-y-6">
              {[1, 2].map((n) => (
                <div key={n} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm animate-pulse space-y-4">
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
          ) : posts.length === 0 ? (
            /* EMPTY FEED STATE */
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 shadow-sm space-y-4">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                <Flame size={32} />
              </div>
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">No Drops Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Be the first developer to drop a live project on HotDrop today!
              </p>
            </div>
          ) : (
            /* POSTS LIST */
            posts.map((post) => {
              const pId = post.id || post._id;
              const imgIndex = currentImage[pId] || 0;
              const owner = post.user || post.creator || post.userResponseDto || {};
              const rawImages = post.images || post.imageUrls || [];
              const images = rawImages.map((img) => typeof img === "string" ? { url: img } : img);
              const ownerAvatar = owner.profilePicture || owner.profileImageUrl || owner.avatar || dp;
              const ownerHandle = owner.hotdropId || owner.username || "user";
              const isLiked = post.liked ?? (post.likes?.some((l) => String(l.id || l._id || l) === String(user?.id || user?._id)));
              const isHeartActive = !!doubleTapHeartMap[pId];
              const isLinkDead = post.isLinkDead ?? post.linkDead ?? false;
              const projectLink = post.projectLink || post.projectUrl;

              return (
                <div
                  key={pId}
                  className="bg-white rounded-3xl border border-slate-200/70 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col group/card"
                >
                  {/* HEADER */}
                  <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100/60">
                    <div 
                      className="flex items-center gap-3 cursor-pointer group/user"
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
                    </div>
                  </div>

                  {/* POST IMAGE AREA */}
                  {images.length > 0 && (
                    <div 
                      className="relative mx-2 sm:mx-4 mt-2 sm:mt-3 bg-slate-950 rounded-2xl aspect-[16/9] flex items-center justify-center overflow-hidden border border-slate-900 cursor-pointer group/img"
                      onClick={() => handleImageClick(post, imgIndex)}
                      onDoubleClick={() => triggerDoubleTap(post)}
                    >
                      <img 
                        src={images[imgIndex]?.url} 
                        className="w-full h-full object-contain transition-all duration-700 group-hover/img:scale-[1.02]" 
                        alt={post.title || "Post media"} 
                      />

                      {/* DOUBLE TAP HEART POP */}
                      {isHeartActive && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-in zoom-in-50 fade-out duration-700">
                          <Heart size={80} className="fill-rose-500 text-rose-500 drop-shadow-[0_10px_25px_rgba(244,63,94,0.8)] animate-pulse" />
                        </div>
                      )}

                      {/* GUEST LOCK OVERLAY */}
                      {!user && (
                        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[3px] flex items-center justify-center">
                          <div className="bg-white/95 px-4 py-2.5 rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-900 shadow-2xl">
                            <Lock size={14} className="text-blue-600" /> Sign In to View Image
                          </div>
                        </div>
                      )}

                      {/* CAROUSEL ARROWS */}
                      {images.length > 1 && (
                        <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none">
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setCurrentImage(prev => ({ ...prev, [pId]: (imgIndex - 1 + images.length) % images.length }));
                            }} 
                            className="pointer-events-auto bg-slate-900/70 hover:bg-blue-600 text-white p-2 rounded-2xl transition-all shadow-md backdrop-blur-md cursor-pointer"
                          >
                            <ChevronLeft size={18} />
                          </button>
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setCurrentImage(prev => ({ ...prev, [pId]: (imgIndex + 1) % images.length }));
                            }} 
                            className="pointer-events-auto bg-slate-900/70 hover:bg-blue-600 text-white p-2 rounded-2xl transition-all shadow-md backdrop-blur-md cursor-pointer"
                          >
                            <ChevronRight size={18} />
                          </button>
                        </div>
                      )}

                      {/* CAROUSEL DOTS */}
                      {images.length > 1 && (
                        <div className="absolute bottom-3 flex gap-1.5">
                          {images.map((_, idx) => (
                            <div 
                              key={idx} 
                              className={`h-1.5 rounded-full transition-all ${idx === imgIndex ? "w-5 bg-blue-500" : "w-1.5 bg-white/40"}`} 
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

                    {/* PROJECT LINK BANNER */}
                    {projectLink && (
                      <div 
                        onClick={(e) => {
                          e.preventDefault();
                          if (!user) {
                            setShowAuthModal(true);
                            return;
                          }
                          if (!isLinkDead) {
                            setPreviewUrl(projectLink);
                          } else {
                            toast.error("This project link appears to be dead");
                          }
                        }}     
                        className="group/link relative flex items-center justify-between p-[1px] rounded-2xl mb-3.5 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                      >
                        <div className={`absolute inset-0 rounded-2xl opacity-20 group-hover/link:opacity-100 transition-opacity duration-500 bg-gradient-to-r ${isLinkDead ? "from-red-500 to-orange-500" : "from-blue-600 via-indigo-500 to-emerald-400"}`} /> 
                        <div className="relative w-full flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-[15px] px-3.5 py-2.5 shadow-sm">
                          <div className="flex items-center gap-3 truncate">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-300 ${isLinkDead ? "bg-red-100 text-red-500" : "bg-blue-100 text-blue-600 group-hover/link:bg-blue-600 group-hover/link:text-white"}`}>
                              <Globe size={15} strokeWidth={2.5} />
                            </div>
                            <div className={`flex flex-col truncate transition-all ${!user ? "blur-[4px] select-none" : ""}`}>
                              <span className="text-xs font-bold text-slate-700 truncate tracking-tight group-hover/link:text-blue-600 transition-colors">
                                {user ? projectLink?.replace("https://", "").replace("www.", "") : "hidden-project-url-protected"}
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
                              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${isLinkDead ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-700 group-hover/link:bg-emerald-500 group-hover/link:text-white"}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isLinkDead ? "bg-red-500" : "bg-emerald-500 group-hover/link:bg-white"} animate-pulse`} />
                                {isLinkDead ? "Dead" : "Live"}
                              </div>
                            )}
                            <ExternalLink size={13} className="text-slate-400 group-hover/link:text-blue-600 transition-colors" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* DESCRIPTION */}
                    <PostDescription description={post.description} />

                    {/* INTERACTIONS BAR */}
                    <div className="flex items-center gap-6 sm:gap-8 border-t border-slate-100 pt-3.5 mt-1">
                      
                      {/* LIKE BUTTON */}
                      <div className="flex items-center gap-2 cursor-pointer group/like" onClick={() => handleLike(post)}>
                        <Heart 
                          size={22} 
                          className={`transition-all duration-300 ${isLiked ? "fill-red-500 text-red-500 scale-110" : "text-slate-400 group-hover/like:text-red-500"}`} 
                        />
                        <span 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!user) return setShowAuthModal(true);
                            setLikePost(post);
                          }} 
                          className="text-xs font-black text-slate-800 hover:text-blue-600 transition-colors"
                        >
                          {post.likeCount ?? post.likes?.length ?? 0}
                        </span>
                      </div>

                      {/* COMMENT BUTTON */}
                      <div 
                        className="flex items-center gap-2 cursor-pointer group/comment" 
                        onClick={() => { 
                          if (!user) return setShowAuthModal(true); 
                          setCommentPost(post); 
                        }}
                      >
                        <MessageCircle size={22} className="text-slate-400 group-hover/comment:text-blue-600 transition-colors" />
                        <span className="text-xs font-black text-slate-800">
                          {post.commentCount ?? post.comments?.length ?? 0}
                        </span>
                      </div>

                      {/* SHARE BUTTON */}
                      <div 
                        className="flex items-center gap-2 cursor-pointer group/share ml-auto" 
                        onClick={() => setSharePost(post)}
                      >
                        <Share2 size={20} className="text-slate-400 group-hover/share:text-blue-600 transition-colors" />
                        <span className="text-[11px] font-bold text-slate-500 group-hover/share:text-blue-600 hidden sm:inline">Share</span>
                      </div>

                    </div>

                  </div>
                </div>
              );
            })
          )}

          {/* INFINITE SCROLL BOTTOM FETCHING LOADER */}
          {fetchingMore && (
            <div className="py-8 text-center flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="font-black text-blue-600 text-[10px] uppercase tracking-widest animate-pulse">
                Fetching more drops...
              </span>
            </div>
          )}

          {/* END OF FEED INDICATOR */}
          {!hasMore && posts.length > 0 && (
            <div className="py-12 text-center text-slate-400">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2 text-slate-400">
                <Sparkles size={18} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em]">You've reached the end of the feed</p>
            </div>
          )}

        </div>

        {/* RIGHT SPONSOR / TECH STACK PANEL (100% Independent Scroll Column) */}
        <div className="hidden lg:block h-full overflow-y-auto pt-2 pb-6 pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <Sponser />
        </div>

      </div>

      {/* AUTH REQUIRED POPUP MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowAuthModal(false)} />
          <div className="relative bg-white w-full max-w-[320px] rounded-3xl p-6 shadow-2xl text-center border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShieldCheck size={26} />
            </div>
            <h2 className="text-base font-black text-slate-900 mb-1 uppercase tracking-tight">Sign In Required</h2>
            <p className="text-xs text-slate-500 mb-6 font-medium leading-relaxed">Please log in to like, comment & unlock project link previews on HotDrop.</p>
            <div className="flex flex-col gap-2.5">
              <button 
                onClick={() => navigate("/login")} 
                className="w-full bg-blue-600 text-white text-xs font-black uppercase tracking-wider py-3 rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 cursor-pointer"
              >
                Sign In
              </button>
              <button 
                onClick={() => setShowAuthModal(false)} 
                className="w-full bg-slate-100 text-slate-600 text-xs font-bold py-2.5 rounded-2xl hover:bg-slate-200 transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
            <p className="mt-4 text-[11px] text-slate-400 font-medium">
              New here? <Link to="/signup" className="text-blue-600 font-bold hover:underline">Create account</Link>
            </p>
          </div>
        </div>
      )}

      {/* TECH TOPICS FILTER POPUP MODAL */}
      {showFilterModal && (
        <div 
          className="fixed inset-0 z-[9999] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200 select-none"
          onClick={() => setShowFilterModal(false)}
        >
          <div 
            className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 px-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/60">
              <div className="flex items-center gap-2 text-slate-900">
                <Boxes size={18} className="text-blue-600" />
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">
                  Filter Drops by Tech Stack
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFilterModal(false)}
                className="p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 rounded-full transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white flex items-center justify-between gap-3 shadow-sm">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-amber-300 text-[10px] font-black uppercase">
                  <Sparkles size={12} /> HotDrop Stack Filter
                </div>
                <p className="text-xs font-bold text-blue-100">
                  Select any tech stack to discover matching live project drops! 🚀
                </p>
              </div>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 max-h-[60vh]">
              {allFilterCategories.map((cat) => (
                <div key={cat.id} className="space-y-2">
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-tight block">
                    {cat.category}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {cat.tags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          setShowFilterModal(false);
                          handleFilterTopic(tag);
                        }}
                        className="bg-slate-50 hover:bg-blue-600 hover:text-white border border-slate-200/80 text-slate-800 text-xs font-extrabold px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODALS SYNCED WITH POSTS STATE */}
      <AnimatePresence>
        {previewUrl && (
          <PreviewModal key={previewUrl} url={previewUrl} onClose={() => setPreviewUrl(null)} />
        )}
      </AnimatePresence>

      {imagePost && (
        <ImageModal 
          post={imagePost} 
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
          post={commentPost} 
          commentText={commentText} 
          setCommentText={setCommentText} 
          submitComment={submitComment} 
          onClose={() => setCommentPost(null)} 
          setCommentPost={(upd) => {
            setCommentPost((prevPost) => {
              const nextVal = typeof upd === "function" ? upd(prevPost) : upd;
              if (!nextVal) return null;
              const updId = nextVal.id || nextVal._id;
              setPosts((prevPosts) =>
                prevPosts.map((p) => ((p.id || p._id) === updId ? nextVal : p))
              );
              if (imagePost && (imagePost.id || imagePost._id) === updId) {
                setImagePost(nextVal);
              }
              return nextVal;
            });
          }} 
        />
      )}

      {sharePost && <ShareModal post={sharePost} onClose={() => setSharePost(null)} />}
      {likePost && <LikeModal post={likePost} onClose={() => setLikePost(null)} />}

    </div>
  );
}

export default AllPost;
