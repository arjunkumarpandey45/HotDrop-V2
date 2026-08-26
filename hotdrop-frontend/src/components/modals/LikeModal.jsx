import { X, Heart, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../../api/Api";
import dp from "../../assets/dp.jpg";

function LikeModal({ post, onClose }) {
  const navigate = useNavigate();
  const [likesList, setLikesList] = useState(Array.isArray(post?.likes) ? post.likes : []);
  const [loading, setLoading] = useState(true);

  const postId = post?.id || post?._id;

  useEffect(() => {
    let isMounted = true;

    const fetchLikesFromApi = async () => {
      if (!postId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const res = await API.get(`/posts/${postId}/get-who-likes-post`);
        const payload = res.data?.data;
        const list = Array.isArray(payload)
          ? payload
          : payload?.likes || payload?.users || payload?.content || (Array.isArray(res.data) ? res.data : []);

        if (isMounted) {
          if ((!list || list.length === 0) && Array.isArray(post?.likes) && post.likes.length > 0) {
            setLikesList(post.likes);
          } else {
            setLikesList(list);
          }
        }
      } catch (err) {
        console.warn("Fetch likes error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLikesFromApi();

    return () => {
      isMounted = false;
    };
  }, [postId, post?.likes]);

  const handleProfileClick = (hotdropId) => {
    if (!hotdropId || hotdropId === "user") return;
    onClose();
    navigate(`/user/userprofile/${hotdropId}`);
  };

  const count = Math.max(post?.likeCount ?? 0, likesList.length);

  return (
    <div
      className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-[600] p-4 animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-xs rounded-3xl overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >

        <div className="p-4 px-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Heart size={18} className="text-rose-500 fill-rose-500" />
            <h3 className="font-extrabold text-sm text-slate-900">
              Likes ({count})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 rounded-full transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[350px] overflow-y-auto p-3 space-y-2">
          {loading && likesList.length === 0 ? (
            <div className="flex justify-center items-center py-8 text-slate-400">
              <Loader2 size={22} className="animate-spin text-blue-600" />
            </div>
          ) : likesList.length > 0 ? (
            likesList.map((item, i) => {
              const uId = item.id || item._id || i;
              const avatar = item.profilePicture || item.profileImageUrl || dp;
              const hotdropId = item.hotdropId || item.username || "user";
              const fullName = [item.firstName, item.lastName].filter(Boolean).join(" ");

              return (
                <div
                  key={uId}
                  className="flex gap-3 items-center group cursor-pointer p-2.5 rounded-2xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100"
                  onClick={() => handleProfileClick(hotdropId)}
                >
                  <img
                    src={avatar}
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-100 group-hover:ring-blue-200 transition-all shrink-0"
                    alt={hotdropId}
                  />

                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-xs font-extrabold text-slate-900 leading-tight truncate group-hover:text-blue-600 transition-colors">
                      @{hotdropId}
                    </span>
                    {fullName && (
                      <span className="text-[11px] font-medium text-slate-400 truncate">
                        {fullName}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs font-medium">
              No likes on this drop yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LikeModal;
