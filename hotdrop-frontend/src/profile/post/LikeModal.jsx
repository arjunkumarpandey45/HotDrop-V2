import { X, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import dp from "../../assets/dp.jpg";

function LikeModal({ post, onClose }) {
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();

  const handleProfileClick = (hotdropId) => {
    if (!hotdropId) return;
    onClose();
    navigate(`/user/userprofile/${hotdropId}`);
  };

  const rawLikes = post?.likes || [];
  // Fallback: If rawLikes array is empty but post is liked by current user or has likeCount > 0, include currentUser
  const likesList =
    rawLikes.length > 0
      ? rawLikes
      : (post?.liked || (post?.likeCount || 0) > 0) && currentUser
      ? [currentUser]
      : [];

  const count = Math.max(post?.likeCount || 0, likesList.length);

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-[600] p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xs rounded-3xl overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
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
          {likesList.length > 0 ? (
            likesList.map((item, i) => {
              const likedUserObj = typeof item === "object" ? item.user || item : { id: item };
              const uId = likedUserObj.id || likedUserObj._id || i;
              const avatar = likedUserObj.profilePicture || likedUserObj.profileImageUrl || dp;
              const hotdropId = likedUserObj.hotdropId || likedUserObj.username || "user";

              return (
                <div
                  key={uId}
                  className="flex gap-3 items-center group cursor-pointer p-2 rounded-2xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100"
                  onClick={() => handleProfileClick(hotdropId)}
                >
                  <img
                    src={avatar}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 group-hover:ring-blue-200 transition-all"
                    alt={hotdropId}
                  />

                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                      @{hotdropId}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      View Profile
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