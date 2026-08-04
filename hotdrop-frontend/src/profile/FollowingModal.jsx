import { X, UserCheck, Loader2, UserMinus } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/Api";
import dp from "../assets/dp.jpg";
import { useAuthStore } from "../store/useAuthStore";

function FollowingModal({ isOpen, onClose, userId, onUnfollowSuccess }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const navigate = useNavigate();

  const { user: currentUser } = useAuthStore();
  const currentUserId = currentUser?.id || currentUser?._id || currentUser?.userId;

  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      fetchedRef.current = false;
      return;
    }

    if (!userId || userId === "undefined" || fetchedRef.current) return;

    const fetchFollowing = async () => {
      try {
        setLoading(true);
        fetchedRef.current = true;

        // 🎯 Fetch following list directly from GET /users/{userId}/following
        const res = await axios.get(`/users/${userId}/following`);
        const payload = res.data?.data || res.data;
        const listData = Array.isArray(payload)
          ? payload
          : payload?.following || payload?.users || payload?.list || [];

        setUsers(listData);
      } catch (err) {
        console.error("Failed to load following list:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowing();
  }, [isOpen, userId]);

  const handleUserClick = (targetHotdrop) => {
    if (!targetHotdrop) return;
    onClose();
    navigate(`/user/userprofile/${targetHotdrop}`);
  };

  const handleToggleFollow = async (targetUserId) => {
    if (!targetUserId || togglingId) return;

    const previousUsers = [...users];

    setUsers((prev) =>
      prev.filter((u) => {
        const uId = u.id || u.userId || u._id || u.targetUserId;
        return String(uId) !== String(targetUserId);
      })
    );

    try {
      setTogglingId(targetUserId);

      const res = await axios.post("/users/follow", {
        userIdToFollow: String(targetUserId),
        targetUserId: String(targetUserId),
        userId: String(targetUserId),
        id: String(targetUserId),
      });

      const resData = res.data?.data || res.data;
      const isStillFollowing =
        resData?.following !== undefined
          ? resData.following
          : resData?.isFollowing !== undefined
          ? resData.isFollowing
          : false;

      if (isStillFollowing === false && onUnfollowSuccess) {
        onUnfollowSuccess(targetUserId);
      }

      if (isStillFollowing === true) {
        setUsers(previousUsers);
      }
    } catch (err) {
      console.error("Unfollow error:", err.response?.data || err.message);
      setUsers(previousUsers);
    } finally {
      setTogglingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-sm sm:max-w-md rounded-2xl shadow-xl flex flex-col max-h-[75vh] overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800 tracking-tight">
              Following
            </h3>
            <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
              {users.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1">
          {loading ? (
            <div className="flex justify-center items-center py-12 text-slate-400">
              <Loader2 size={24} className="animate-spin text-blue-600" />
            </div>
          ) : users && users.length > 0 ? (
            users.map((u, i) => {
              const uId = u.id || u.userId || u._id || u.targetUserId;
              const avatar =
                u.profilePicture || u.profileImageUrl || u.avatar || dp;
              const name = u.firstName
                ? `${u.firstName} ${u.lastName || ""}`.trim()
                : u.username || u.hotdropId || "Creator";
              const userHandle = u.hotdropId || u.username;

              const isSelf =
                String(uId) === String(currentUserId) ||
                (userHandle && currentUser?.hotdropId && userHandle.toLowerCase() === currentUser.hotdropId.toLowerCase()) ||
                (userHandle && currentUser?.username && userHandle.toLowerCase() === currentUser.username.toLowerCase());

              return (
                <div
                  key={uId || i}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition"
                >
                  <div
                    onClick={() => handleUserClick(userHandle)}
                    className="flex items-center gap-2.5 min-w-0 pr-2 cursor-pointer group/user flex-1"
                  >
                    <img
                      src={avatar}
                      alt={name}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-slate-200 shrink-0 bg-slate-100 group-hover/user:opacity-80 transition"
                    />
                    <div className="min-w-0 flex flex-col">
                      <h4 className="text-xs font-bold text-slate-800 truncate leading-tight group-hover/user:text-blue-600 transition">
                        {name} {isSelf && "(You)"}
                      </h4>
                      <span className="text-[11px] text-slate-600 font-medium truncate mt-0.5 group-hover/user:text-blue-500 transition">
                        @{userHandle || "hotdrop"}
                      </span>
                    </div>
                  </div>

                  {!isSelf && (
                    <button
                      onClick={() => handleToggleFollow(uId)}
                      disabled={togglingId === uId}
                      className="shrink-0 px-2.5 py-1 rounded-md text-[11px] font-semibold transition active:scale-95 flex items-center gap-1 border bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 border-slate-200/60"
                    >
                      {togglingId === uId ? (
                        <Loader2
                          size={12}
                          className="animate-spin text-slate-500"
                        />
                      ) : (
                        <>
                          <UserMinus size={12} />
                          <span>Following</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <UserCheck size={32} className="mb-2 text-slate-300" />
              <p className="text-xs font-medium text-slate-500">
                Not following anyone yet
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FollowingModal;