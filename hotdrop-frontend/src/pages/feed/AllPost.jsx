import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { Flame } from "lucide-react";
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
import LikeModal from "../../components/modals/LikeModal";
import ShareModal from "../../components/modals/ShareModal";
import ImageModal from "../../components/modals/ImageModal"; 
import PreviewModal from "../../components/modals/PreviewModal";
import API from "../../api/Api";
import { AnimatePresence } from "framer-motion";
import LoadMoreTrigger from "../../components/common/LoadMoreTrigger";

const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const randomBuffer = new Uint32Array(1);
    window.crypto.getRandomValues(randomBuffer);
    const j = randomBuffer[0] % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const shuffleInChunks = (array, chunkSize = 5) => {
  if (!Array.isArray(array) || array.length === 0) return [];
  const result = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize);
    result.push(...shuffleArray(chunk));
  }
  return result;
};

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
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const feedContainerRef = useRef(null);

  const handleFilterTopic = (tag) => {
    const cleanTag = tag.replace(/[^a-zA-Z0-9]/g, "");
    navigate(`/search?q=${encodeURIComponent(cleanTag)}`);
  };

  const [fetchingMore, setFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const isFetchingRef = useRef(false);
  const pageRef = useRef(0);
  const hasMoreRef = useRef(true);

  const fetchGlobalFeed = useCallback(async (pageNum = 0, search = "") => {
    // If requesting next page and no more items, strictly abort
    if (pageNum > 0 && !hasMoreRef.current) {
      isFetchingRef.current = false;
      return;
    }

    // Set lock synchronously before any async operations
    isFetchingRef.current = true;

    try {
      if (pageNum === 0) {
        setLoading(true);
      } else {
        setFetchingMore(true);
      }

      let fetchedPosts = [];
      let isLast = true;

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

      if (Array.isArray(fetchedPosts)) {
        const chunkShuffled = shuffleInChunks(fetchedPosts, 5);

        setPosts((prev) => {
          if (pageNum === 0) return chunkShuffled;

          const postMap = new Map(prev.map((p) => [p.id || p._id, p]));
          const uniqueNewPosts = chunkShuffled.filter((p) => {
            const key = p.id || p._id;
            return key && !postMap.has(key);
          });

          return [...prev, ...uniqueNewPosts];
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
      console.error("Fetch feed error:", error);
      // Suppress 429 rate-limit toast spam during background pagination
      if (error?.response?.status !== 429) {
        toast.error("Failed to load project feed.", {
          toastId: "feed-fetch-error",
        });
      }
    } finally {
      setLoading(false);
      setFetchingMore(false);
      if (pageNum === 0) {
        isFetchingRef.current = false;
      } else {
        setTimeout(() => {
          isFetchingRef.current = false;
        }, 250);
      }
    }
  }, []);

  const loadNextPage = useCallback(() => {
    if (isFetchingRef.current || !hasMoreRef.current || loading || fetchingMore) {
      return;
    }
    const nextPage = pageRef.current + 1;
    fetchGlobalFeed(nextPage);
  }, [loading, fetchingMore, fetchGlobalFeed]);

  useEffect(() => {
    pageRef.current = 0;
    hasMoreRef.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasMore(true);
    isFetchingRef.current = false;
    fetchGlobalFeed(0);
  }, [fetchGlobalFeed]);

  const [sentinelNode, setSentinelNode] = useState(null);

  // Observer sentinel for seamless infinite scrolling
  useEffect(() => {
    if (!sentinelNode || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingRef.current && hasMoreRef.current) {
          loadNextPage();
        }
      },
      {
        root: feedContainerRef.current || null,
        rootMargin: "350px 0px",
        threshold: 0,
      }
    );

    observer.observe(sentinelNode);

    return () => {
      observer.disconnect();
    };
  }, [sentinelNode, hasMore, loading, loadNextPage]);

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
      } else if (err.response?.status !== 429) {
        showErrorToast(err.response?.data?.message || "Action failed");
      }
    }
  };



  const submitComment = async (e, textOverride) => {
    e?.preventDefault?.();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] pt-20 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="hidden lg:block">
            <div className="bg-white rounded-3xl p-6 h-64 animate-pulse border border-slate-200" />
          </div>
          <div className="col-span-1 lg:col-span-2 space-y-6">
            <PostSkeleton count={3} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100dvh-9rem)] md:h-[calc(100dvh-4.25rem)] bg-[#f8fafc] px-2 sm:px-4 overflow-hidden">
      <div className="max-w-7xl mx-auto h-full grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8 items-start">

        <div className="hidden lg:block h-full overflow-y-auto pt-2 pb-6 pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <Sidebar />
        </div>

        <div 
          ref={feedContainerRef}
          onScroll={handleContainerScroll}
          className="col-span-1 lg:col-span-2 h-full overflow-y-auto pt-2 pb-6 space-y-6 sm:space-y-8 pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >

          <QuickTopicBar
            onOpenFilter={() => setShowFilterModal(true)}
            onSelectTopic={handleFilterTopic}
            className="bg-white rounded-3xl p-3 px-3.5 border border-slate-200/80 shadow-sm"
          />

          {loading ? (
            <PostSkeleton count={2} />
          ) : posts.length === 0 ? (

            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 shadow-sm space-y-4">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                <Flame size={32} />
              </div>
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">No project Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Be the first developer to project a live project on HotDrop today!
              </p>
            </div>
          ) : (

            posts.map((post) => (
              <PostCard
                key={post.id || post._id}
                post={post}
                onLike={handleLike}
                onImageClick={handleImageClick}
                onComment={setCommentPost}
                onShare={setSharePost}
                onViewLikes={setLikePost}
                onPreview={setPreviewUrl}
                onRequireAuth={() => setShowAuthModal(true)}
              />
            ))
          )}

          <LoadMoreTrigger
            hasMore={hasMore}
            loadingMore={fetchingMore}
            onLoadMore={loadNextPage}
            sentinelRef={setSentinelNode}
            mode="both"
            label="Load More Projects"
            showEndMessage={posts.length > 0}
            endMessage="You've reached the end of the feed"
          />

        </div>

        {/* RIGHT SPONSOR / TECH STACK PANEL (100% Independent Scroll Column) */}
        <div className="hidden lg:block h-full overflow-y-auto pt-2 pb-6 pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <Sponser />
        </div>

      </div>

      {/* AUTH REQUIRED POPUP MODAL */}
      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {/* TECH TOPICS FILTER POPUP MODAL */}
      <TechFilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onSelectTag={handleFilterTopic}
      />

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
