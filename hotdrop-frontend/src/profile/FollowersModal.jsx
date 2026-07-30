import { X, UserCheck, Loader2, UserMinus, UserPlus } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import axios from "../api/Api";
import dp from "../assets/dp.jpg";
import { useAuthStore } from "../store/useAuthStore";

function FollowersModal({ isOpen, onClose, userId, onFollowStatusChange }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  
  const { user: currentUser } = useAuthStore();
  const currentUserId = currentUser?.id || currentUser?._id || currentUser?.userId;

  
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      fetchedRef.current = false;
      return;
    }

    if (!userId || userId === "undefined" || fetchedRef.current) return;

    const fetchFollowers = async () => {
      try {
        setLoading(true);
        fetchedRef.current = true;
        const res = await axios.get(`/users/${userId}/followers`);

        const listData = Array.isArray(res.data)
          ? res.data
          : res.data?.data || res.data?.followers || [];

        setUsers(listData);
      } catch (err) {
        console.error("Failed to load followers list:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowers();
  }, [isOpen, userId]);

  const handleToggleFollow = async (targetUserId) => {
    if (!targetUserId || togglingId) return;

    const previousUsers = [...users];

    setUsers((prev) =>
      prev.map((u) => {
        const uId = u.id || u._id || u.userId || u.targetUserId;
        if (String(uId) === String(targetUserId)) {
          const currentStatus =
            u.isFollowing ?? u.following ?? u.isFollowedByMe ?? false;
          return {
            ...u,
            isFollowing: !currentStatus,
            following: !currentStatus,
            isFollowedByMe: !currentStatus,
          };
        }
        return u;
      })
    );

    try {
      setTogglingId(targetUserId);

      const res = await axios.post("/users/follow", {
        userIdToFollow: String(targetUserId),
      });

      const resData = res.data?.data || res.data;
      const isNowFollowing =
        resData?.following !== undefined
          ? resData.following
          : resData?.isFollowing;

      setUsers((prev) =>
        prev.map((u) => {
          const uId = u.id || u._id || u.userId || u.targetUserId;
          if (String(uId) === String(targetUserId)) {
            return {
              ...u,
              isFollowing: isNowFollowing,
              following: isNowFollowing,
              isFollowedByMe: isNowFollowing,
            };
          }
          return u;
        })
      );

      if (onFollowStatusChange) {
        onFollowStatusChange(isNowFollowing);
      }
    } catch (err) {
      console.error("Toggle follow failed inside Followers modal:", err);
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
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800 tracking-tight">
              Followers
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

        {/* User List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1">
          {loading ? (
            <div className="flex justify-center items-center py-12 text-slate-400">
              <Loader2 size={24} className="animate-spin text-blue-600" />
            </div>
          ) : users && users.length > 0 ? (
            users.map((u, i) => {
              const uId = u.id || u._id || u.userId || u.targetUserId;
              const avatar =
                u.profileImageUrl || u.profilePicture || u.avatar || dp;
              const name = u.firstName
                ? `${u.firstName} ${u.lastName || ""}`.trim()
                : u.username || u.hotdropId || "Creator";

             
              const isSelf = String(uId) === String(currentUserId);

      
              const isFollowingBack = Boolean(
                u.isFollowing ?? u.following ?? u.isFollowedByMe ?? false
              );

              return (
                <div
                  key={uId || i}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <img
                      src={avatar}
                      alt={name}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-slate-200 shrink-0 bg-slate-100"
                    />
                    <div className="min-w-0 flex flex-col">
                      <h4 className="text-xs font-bold text-slate-800 truncate leading-tight">
                        {name} {isSelf && "(You)"}
                      </h4>
                      <span className="text-[11px] text-blue-600 font-medium truncate mt-0.5">
                        @{u.hotdropId || u.username || "hotdrop"}
                      </span>
                    </div>
                  </div>

                  {/* Don't show follow button for self */}
                  {!isSelf && (
                    <button
                      onClick={() => handleToggleFollow(uId)}
                      disabled={togglingId === uId}
                      className={`shrink-0 px-2.5 py-1 rounded-md text-[11px] font-semibold transition active:scale-95 flex items-center gap-1 border ${
                        isFollowingBack
                          ? "bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 border-slate-200/60"
                          : "bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-sm"
                      }`}
                    >
                      {togglingId === uId ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : isFollowingBack ? (
                        <>
                          <UserMinus size={12} />
                          <span>Following</span>
                        </>
                      ) : (
                        <>
                          <UserPlus size={12} />
                          <span>Follow Back</span>
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
                No followers yet
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FollowersModal;