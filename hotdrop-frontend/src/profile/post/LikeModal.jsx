import { X, Heart, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../../api/Api";
import dp from "../../assets/dp.jpg";

function LikeModal({ post, onClose }) {
  const navigate = useNavigate();
  const [likesList, setLikesList] = useState([]);
  const [loading, setLoading] = useState(true);

  const postId = post?.id || post?._id;

  useEffect(() => {
    let isMounted = true;

    const fetchLikesFromApi = async () => {
      if (!postId) {
        if (isMounted) {
          setLikesList(Array.isArray(post?.likes) ? post.likes : []);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);

        // 🎯 Primary endpoint: GET /posts/{postId}/likes
        const res = await API.get(`/posts/${postId}/likes`);
        const payload = res.data?.data || res.data;
        const likesData = Array.isArray(payload)
          ? payload
          : payload?.likes || payload?.likedUsers || payload?.users || [];

        // Populate any items if needed
        const resolvedUsers = await Promise.all(
          likesData.map(async (item) => {
            if (!item) return null;
            if (
              typeof item === "object" &&
              (item.hotdropId || item.user?.hotdropId || item.username)
            ) {
              return item.user || item;
            }
            const userIdStr =
              typeof item === "string" ? item : item?.id || item?._id;
            if (!userIdStr) return typeof item === "object" ? item : null;

            try {
              const uRes = await API.get(`/users/${userIdStr}`).catch(() =>
                API.get(`/users/search/${userIdStr}`)
              );
              const uPayload = uRes.data?.data || uRes.data;
              const uObj = Array.isArray(uPayload)
                ? uPayload[0]
                : uPayload?.user || uPayload;
              return uObj || (typeof item === "object" ? item : null);
            } catch {
              return typeof item === "object" ? item : null;
            }
          })
        );

        const cleanList = resolvedUsers.filter(Boolean);

        if (isMounted) {
          setLikesList(cleanList);
        }
      } catch (err) {
        console.warn(`Failed to fetch likes from /posts/${postId}/likes:`, err);

        // Fallback: If /posts/{postId}/likes endpoint fails, check post.likes or /posts/share/{postId}
        let fallbackLikes = Array.isArray(post?.likes) ? post.likes : [];
        if (fallbackLikes.length === 0 && (post?.shareUrl || postId)) {
          try {
            const shareRes = await API.get(
              `/posts/share/${post?.shareUrl || postId}`
            );
            const sharePayload = shareRes.data?.data || shareRes.data;
            const fullPost = sharePayload?.post || sharePayload;
            fallbackLikes = fullPost?.likes || fullPost?.likedUsers || [];
          } catch (shareErr) {
            console.warn("Share fallback failed:", shareErr);
          }
        }

        const fallbackResolved = await Promise.all(
          fallbackLikes.map(async (item) => {
            if (!item) return null;
            if (
              typeof item === "object" &&
              (item.hotdropId || item.user?.hotdropId || item.username)
            ) {
              return item.user || item;
            }
            const userIdStr =
              typeof item === "string" ? item : item?.id || item?._id;
            if (!userIdStr) return typeof item === "object" ? item : null;

            try {
              const uRes = await API.get(`/users/search/${userIdStr}`);
              const uPayload = uRes.data?.data || uRes.data;
              const uObj = Array.isArray(uPayload)
                ? uPayload[0]
                : uPayload?.user || uPayload;
              return uObj || (typeof item === "object" ? item : null);
            } catch {
              return typeof item === "object" ? item : null;
            }
          })
        );

        if (isMounted) {
          setLikesList(fallbackResolved.filter(Boolean));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchLikesFromApi();

    return () => {
      isMounted = false;
    };
  }, [postId, post?.shareUrl]);

  const handleProfileClick = (hotdropId) => {
    if (!hotdropId || hotdropId === "user") return;
    onClose();
    navigate(`/user/userprofile/${hotdropId}`);
  };

  const count = Math.max(post?.likeCount || 0, likesList.length);

  return (
    <div
      className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-[600] p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-xs rounded-3xl overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="p-4 px-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Heart size={18} className="text-rose-500 fill-rose-500" />
            <h3 className="font-extrabold text-sm text-slate-900">
              Likes ({count})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 rounded-full transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* LIKES LIST */}
        <div className="max-h-[350px] overflow-y-auto p-3 space-y-2">
          {loading ? (
            <div className="flex justify-center items-center py-8 text-slate-400">
              <Loader2 size={22} className="animate-spin text-blue-600" />
            </div>
          ) : likesList.length > 0 ? (
            likesList.map((item, i) => {
              const likedUserObj =
                typeof item === "object" ? item.user || item : { id: item };
              const uId = likedUserObj.id || likedUserObj._id || i;
              const avatar =
                likedUserObj.profilePicture ||
                likedUserObj.profileImageUrl ||
                likedUserObj.avatar ||
                dp;
              const name = likedUserObj.firstName
                ? `${likedUserObj.firstName} ${likedUserObj.lastName || ""}`.trim()
                : null;
              const hotdropId =
                likedUserObj.hotdropId || likedUserObj.username || "user";

              return (
                <div
                  key={uId}
                  className="flex gap-3 items-center group cursor-pointer p-2 rounded-2xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100"
                  onClick={() => handleProfileClick(hotdropId)}
                >
                  <img
                    src={avatar}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 group-hover:ring-blue-200 transition-all shrink-0"
                    alt={hotdropId}
                  />

                  <div className="flex flex-col min-w-0 flex-1">
                    {name && (
                      <span className="text-xs font-bold text-slate-900 leading-tight truncate group-hover:text-blue-600 transition-colors">
                        {name}
                      </span>
                    )}
                    <span className="text-[11px] font-semibold text-slate-500 truncate">
                      @{hotdropId}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs font-medium">
              No likes details available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LikeModal;