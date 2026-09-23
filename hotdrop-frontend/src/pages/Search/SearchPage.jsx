import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { 
  Search,  
  Sparkles,
  Tag,
  ArrowLeft
} from "lucide-react";
import Sidebar from "../../components/layout/Sidebar";
import Sponser from "../../components/post/Sponser";
import PostCard from "../../components/post/PostCard";
import PostSkeleton from "../../components/common/PostSkeleton";
import QuickTopicBar from "../../components/common/QuickTopicBar";
import AuthRequiredModal from "../../components/modals/AuthRequiredModal";
import TechFilterModal from "../../components/modals/TechFilterModal";
import { toast } from "react-toastify";
import { showLikeToast, showCommentToast, showErrorToast } from "../../toast/Toast";
import CommentModal from "../../components/modals/CommentModal";
import ImageModal from "../../components/modals/ImageModal"; 
import PreviewModal from "../../components/modals/PreviewModal";
import SearchModal from "../../components/modals/SearchModal";
import API from "../../api/Api";
import { AnimatePresence } from "framer-motion";
import LoadMoreTrigger from "../../components/common/LoadMoreTrigger";

function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || searchParams.get("query") || "";

  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState(query);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [posts, setPosts] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [commentPost, setCommentPost] = useState(null);
  const [imagePost, setImagePost] = useState(null);
  const [modalIndex, setModalIndex] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const handleFilterTopic = (tag) => {
    const cleanTag = tag.replace(/[^a-zA-Z0-9]/g, "");
    setSearchInput(cleanTag);
    navigate(`/search?q=${encodeURIComponent(cleanTag)}`);
  };

  const [fetchingMore, setFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const searchContainerRef = useRef(null);
  const isFetchingRef = useRef(false);
  const pageRef = useRef(0);
  const hasMoreRef = useRef(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearchInput(query);
  }, [query]);

  const fetchSearchResults = useCallback(async (pageNum = 0, q = "") => {
    if (!q.trim()) {
      setPosts([]);
      setLoading(false);
      setHasMore(false);
      hasMoreRef.current = false;
      isFetchingRef.current = false;
      return;
    }

    // If requesting next page and no more items, strictly abort
    if (pageNum > 0 && !hasMoreRef.current) {
      isFetchingRef.current = false;
      return;
    }

    // Set lock synchronously before any async operations
    isFetchingRef.current = true;

    try {
      if (pageNum === 0) setLoading(true);
      else setFetchingMore(true);

      let fetchedPosts = [];
      let isLast = true;

      try {
        const res = await API.get("/posts/feed", {
          params: {
            page: pageNum,
            size: 10,
            sortBy: "created_at",
            direction: "DESC",
            search: q.trim(),
          },
        });

        const payload = res.data?.data || res.data;
        fetchedPosts = payload?.posts || (Array.isArray(payload) ? payload : []);
        isLast =
          typeof payload?.isLastPage === "boolean"
            ? payload.isLastPage
            : typeof payload?.lastPage === "boolean"
            ? payload.lastPage
            : typeof payload?.last === "boolean"
            ? payload.last
            : payload?.pageNumber !== undefined && payload?.totalPages !== undefined
            ? payload.pageNumber >= payload.totalPages - 1
            : fetchedPosts.length < 10;
      } catch (feedErr) {
        console.warn("Fallback to /post/getallposts for search...", feedErr?.message);
        const fallbackRes = await API.get(`/post/getallposts?page=${pageNum + 1}&limit=10`);
        const payload = fallbackRes.data?.data || fallbackRes.data;
        const rawList = payload?.posts || (Array.isArray(payload) ? payload : []);

        const lowerQ = q.toLowerCase();
        fetchedPosts = rawList.filter((p) => {
          const titleMatch = (p.title || "").toLowerCase().includes(lowerQ);
          const descMatch = (p.description || "").toLowerCase().includes(lowerQ);
          const tagMatch = Array.isArray(p.tags) && p.tags.some((t) => t.toLowerCase().includes(lowerQ));
          return titleMatch || descMatch || tagMatch;
        });

        isLast = !(payload?.hasMore ?? (fetchedPosts.length >= 10));
      }

      if (Array.isArray(fetchedPosts)) {
        setPosts((prev) => {
          if (pageNum === 0) return fetchedPosts;

          const postMap = new Map(prev.map((p) => [p.id || p._id, p]));
          fetchedPosts.forEach((p) => {
            const key = p.id || p._id;
            if (key && !postMap.has(key)) {
              postMap.set(key, p);
            }
          });

          return Array.from(postMap.values());
        });

        const nextHasMore = !isLast;
        setHasMore(nextHasMore);
        hasMoreRef.current = nextHasMore;
        pageRef.current = pageNum;
      } else {
        if (pageNum === 0) setPosts([]);
        setHasMore(false);
        hasMoreRef.current = false;
      }
    } catch (error) {
      console.error("Search fetch error:", error);
      // Suppress 429 rate-limit toast spam during background pagination
      if (error?.response?.status !== 429) {
        toast.error("Failed to load search results.", {
          toastId: "search-fetch-error",
        });
      }
    } finally {
      setLoading(false);
      setFetchingMore(false);
      isFetchingRef.current = false;
    }
  }, []);

  const loadNextPage = useCallback(() => {
    if (isFetchingRef.current || !hasMoreRef.current || loading || fetchingMore || !query) {
      return;
    }
    // Lock synchronously immediately
    isFetchingRef.current = true;
    const nextPage = pageRef.current + 1;
    fetchSearchResults(nextPage, query);
  }, [loading, fetchingMore, fetchSearchResults, query]);

  useEffect(() => {
    pageRef.current = 0;
    hasMoreRef.current = true;
     
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasMore(true);
    isFetchingRef.current = false;
    fetchSearchResults(0, query);
  }, [query, fetchSearchResults]);

  const [sentinelNode, setSentinelNode] = useState(null);

  // Observer sentinel for seamless infinite scrolling
  useEffect(() => {
    if (!sentinelNode || !hasMore || loading || fetchingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingRef.current && hasMoreRef.current) {
          loadNextPage();
        }
      },
      {
        root: searchContainerRef.current || null,
        rootMargin: "350px 0px",
        threshold: 0,
      }
    );

    observer.observe(sentinelNode);

    return () => {
      observer.disconnect();
    };
  }, [sentinelNode, hasMore, loading, fetchingMore, loadNextPage]);

  // Container onScroll listener
  const handleContainerScroll = useCallback(
    (e) => {
      const el = e.currentTarget;
      if (!el || isFetchingRef.current || !hasMoreRef.current || fetchingMore || loading) return;

      const { scrollTop, scrollHeight, clientHeight } = el;
      if (scrollTop + clientHeight >= scrollHeight - 350) {
        loadNextPage();
      }
    },
    [loadNextPage, fetchingMore, loading]
  );

  // Window onScroll listener as fallback for window/body-level scrolling
  useEffect(() => {
    const handleWindowScroll = () => {
      if (isFetchingRef.current || !hasMoreRef.current || fetchingMore || loading || !query) return;
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      if (scrollY + windowHeight >= docHeight - 350) {
        loadNextPage();
      }
    };

    window.addEventListener("scroll", handleWindowScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleWindowScroll);
  }, [loadNextPage, fetchingMore, loading, query]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchParams({ q: searchInput.trim() });
    }
  };



  const handleLike = async (postToLike) => {
    if (!user) return setShowAuthModal(true);

    const postId = postToLike.id || postToLike._id;
    if (!postId) return;

    const currentUserObj = { 
      _id: user._id || user.id, 
      id: user._id || user.id,
      hotdropId: user.hotdropId, 
      username: user.username, 
      profilePicture: user.profilePicture || user.profileImageUrl 
    };

    try {
      const res = await API.post(`/posts/like-post/${postId}`);

      if (res.status === 200 || res.data?.statusCode === 200) {
        const payloadData = res.data?.data || res.data;
        const isLiked = payloadData?.liked ?? payloadData?.isLiked ?? !postToLike.liked;

        const updateFn = (prev) => prev.map((p) => {
          const pId = p.id || p._id;
          if (String(pId) === String(postId)) {
            const filtered = (p.likes || []).filter((l) => String(l.id || l._id || l) !== String(user.id || user._id));
            const updatedLikes = isLiked ? [currentUserObj, ...filtered] : filtered;
            const newLikeCount = typeof payloadData?.likeCount === "number"
              ? payloadData.likeCount
              : Math.max(0, (p.likeCount ?? 0) + (isLiked ? 1 : -1));

            return { 
              ...p, 
              likes: updatedLikes, 
              likeCount: newLikeCount,
              liked: isLiked
            };
          }
          return p;
        });

        setPosts(updateFn);

        if (imagePost && String(imagePost.id || imagePost._id) === String(postId)) {
          setImagePost((prev) => (prev ? updateFn(prev) : null));
        }

        showLikeToast(isLiked);
      }
    } catch (err) { 
      console.error("Like error on SearchPage:", err);
      if (err.response?.status === 401) {
        setShowAuthModal(true);
      } else if (err.response?.status !== 429) {
        showErrorToast(err.response?.data?.message || "Action failed"); 
      }
    }
  };



  const submitComment = async (e) => {
    e.preventDefault();
    if (!user) return setShowAuthModal(true);
    if (!commentText.trim() || !commentPost) return;

    const targetPostId = commentPost.id || commentPost._id;

    try {
      const res = await API.post(`/posts/comment-to-post/${targetPostId}`, { text: commentText });

      showCommentToast(commentText ? `"${commentText}"` : "Comment added!");
      const newPopulatedComment = res.data?.data || res.data;

      const updatedPostObj = { 
        ...commentPost, 
        comments: [newPopulatedComment, ...(commentPost.comments || [])], 
        commentCount: (commentPost.commentCount || commentPost.comments?.length || 0) + 1 
      };

      setPosts((prevPosts) => prevPosts.map((p) => 
        (p.id || p._id) === targetPostId ? updatedPostObj : p
      ));

      setCommentPost(updatedPostObj);

      if (imagePost && (imagePost.id || imagePost._id) === targetPostId) {
        setImagePost(updatedPostObj);
      }

      setCommentText(""); 

    } catch (error) {
      if (error.response?.status !== 429) {
        showErrorToast(error.response?.data?.message || "Failed to post comment");
      }
    }
  };

  const handleImageClick = (post, index) => {
    if (!user) return setShowAuthModal(true);
    setImagePost(post);
    setModalIndex(index);
  };

  const popularTags = ["React", "NextJS", "TailwindCSS", "NodeJS", "FullStack", "AI"];

  return (
    <div className="h-[calc(100dvh-9rem)] md:h-[calc(100dvh-4.25rem)] bg-[#f8fafc] px-2 sm:px-4 overflow-hidden">
      <div className="max-w-7xl mx-auto h-full grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8 items-start">

        <div className="hidden lg:block h-full overflow-y-auto pt-2 pb-6 pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <Sidebar />
        </div>

        <div 
          ref={searchContainerRef}
          onScroll={handleContainerScroll}
          className="col-span-1 lg:col-span-2 h-full overflow-y-auto pt-2 pb-6 space-y-6 sm:space-y-8 pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >

          <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => navigate("/")} 
                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft size={16} /> Back to Global Feed
              </button>

            </div>

            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search project by title, keywords or #tags..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onFocus={() => setIsSearchModalOpen(true)}
                onClick={() => setIsSearchModalOpen(true)}
                className="w-full bg-slate-50 border border-slate-200/90 rounded-2xl pl-10 pr-24 py-3 text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition cursor-pointer"
              />
              <button
                type="submit"
                onClick={() => setIsSearchModalOpen(true)}
                className="absolute right-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-500/20 cursor-pointer"
              >
                Search
              </button>
            </form>

            <QuickTopicBar
              onOpenFilter={() => setShowFilterModal(true)}
              onSelectTopic={handleFilterTopic}
              className="pt-2 border-t border-slate-100"
            />

            {query && (
              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <Tag size={14} className="text-blue-600" />
                  <span className="text-xs font-extrabold text-slate-900">
                    Results for <span className="text-blue-600">"{query}"</span>
                  </span>
                </div>
                <span className="text-[11px] font-bold text-slate-400">
                  {loading ? "Searching..." : `${posts.length} projects found`}
                </span>
              </div>
            )}
          </div>

          {loading ? (
            <PostSkeleton count={2} />
          ) : !query.trim() ? (

            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 shadow-sm space-y-4">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                <Search size={32} />
              </div>
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Search Project </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Enter any title keyword or tech stack tag above to discover matching projects.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <span className="text-[11px] font-bold text-slate-400 mr-1">Popular Tags:</span>
                {popularTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSearchParams({ q: tag })}
                    className="bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 text-[11px] font-bold px-3 py-1 rounded-xl transition cursor-pointer"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          ) : posts.length === 0 ? (

            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 shadow-sm space-y-4">
              <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto">
                <Sparkles size={32} />
              </div>
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                No Project Matching "{query}"
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                We couldn't find any project  matching your title or tag search. Try searching for popular tech keywords.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                {popularTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSearchParams({ q: tag })}
                    className="bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 text-[11px] font-bold px-3 py-1 rounded-xl transition cursor-pointer"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* SEARCH POSTS LIST */
            posts.map((post) => (
              <PostCard
                key={post.id || post._id}
                post={post}
                onLike={handleLike}
                onImageClick={handleImageClick}
                onComment={setCommentPost}
                onPreview={setPreviewUrl}
                onRequireAuth={() => setShowAuthModal(true)}
                showHeaderShare={true}
              />
            ))
          )}

          <LoadMoreTrigger
            hasMore={hasMore}
            loadingMore={fetchingMore}
            onLoadMore={loadNextPage}
            sentinelRef={setSentinelNode}
            mode="auto"
            label="Load More Projects"
            showEndMessage={posts.length > 0}
            endMessage="You've reached the end of search results"
          />

        </div>

        {/* RIGHT SPONSOR (100% Independent Scroll Column) */}
        <div className="hidden lg:block h-full overflow-y-auto pt-2 pb-6 pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <Sponser />
        </div>

      </div>

      {/* AUTH REQUIRED MODAL */}
      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {/* MODALS */}
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
          setCommentPost={setCommentPost} 
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

      {/* TECH TOPICS FILTER POPUP MODAL */}
      <TechFilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onSelectTag={handleFilterTopic}
      />

      {/* LIVE SEARCH & SUGGESTIONS MODAL */}
      <SearchModal 
        isOpen={isSearchModalOpen} 
        onClose={() => setIsSearchModalOpen(false)} 
        initialMode="projects" 
      />

    </div>
  );
}

export default SearchPage;
