import { X, UserCheck, Loader2, UserPlus } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../api/Api";
import dp from "../../assets/dp.jpg";
import { useAuthStore } from "../../store/useAuthStore";

function FollowingModal({ isOpen, onClose, userId, followingList, onFollowStatusChange, onUnfollowSuccess }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const navigate = useNavigate();

  const { user: currentUser } = useAuthStore();
  const currentUserId = currentUser?.id || currentUser?._id || currentUser?.userId;

  useEffect(() => {
    if (!isOpen || !userId || userId === "undefined") {
      setUsers([]);
      return;
    }

    let isMounted = true;

    const fetchFollowing = async () => {
      try {
        setLoading(true);

        let listData = [];
        try {
          // 1. Fetch following list for target profile directly from GET /users/{userId}/get-all-following
          const res = await axios.get(`/users/${userId}/get-all-following`);
          const payload = res.data?.data || res.data;
          listData = Array.isArray(payload)
            ? payload
            : payload?.following || payload?.users || payload?.list || payload?.content || payload?.data || [];
        } catch (err) {
          console.warn("Could not fetch following from API, using fallback if available:", err);
        }

        // Fallback to followingList prop if listData is empty
        if ((!listData || listData.length === 0) && Array.isArray(followingList) && followingList.length > 0) {
          listData = followingList;
        }

        // 2. Fetch logged in user's following list to know who currentUser is following
        let myFollowingIds = new Set();
        if (currentUserId) {
          try {
            const myFollowingRes = await axios.get(`/users/${currentUserId}/get-all-following`);
            const myPayload = myFollowingRes.data?.data || myFollowingRes.data;
            const myFollowingList = Array.isArray(myPayload)
              ? myPayload
              : myPayload?.following || myPayload?.users || [];

            myFollowingList.forEach((item) => {
              const itemID = String(item.id || item._id || item.userId || item);
              const itemHandle = (item.hotdropId || item.username || "").toLowerCase();
              if (itemID) myFollowingIds.add(itemID);
              if (itemHandle) myFollowingIds.add(itemHandle);
            });
          } catch (myFollowErr) {
            console.warn("Could not fetch my following list in FollowingModal:", myFollowErr);
          }
        }

        if (!isMounted) return;

        const annotatedUsers = listData.map((rawItem) => {
          const u = typeof rawItem === "object" && rawItem !== null ? rawItem : { id: String(rawItem), hotdropId: String(rawItem) };
          const uId = String(u.id || u._id || u.userId || u.targetUserId || "");
          const uHandle = (u.hotdropId || u.username || "").toLowerCase();

          let isFollowing = true;
          if (currentUserId && String(currentUserId) !== String(userId)) {
            isFollowing = myFollowingIds.has(uId) || (uHandle && myFollowingIds.has(uHandle));
          }

          return {
            ...u,
            isFollowing,
            following: isFollowing,
            isFollowedByMe: isFollowing,
          };
        });

        setUsers(annotatedUsers);
      } catch (err) {
        console.error("Failed to load following list:", err);
        if (isMounted) setUsers([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchFollowing();

    return () => {
      isMounted = false;
    };
  }, [isOpen, userId, currentUserId, followingList]);

  const handleUserClick = (targetHotdrop) => {
    if (!targetHotdrop) return;
    onClose();
    navigate(`/user/userprofile/${targetHotdrop}`);
  };

  const handleToggleFollow = async (userObj) => {
    const rawId = typeof userObj === "object"
      ? (userObj.id || userObj._id || userObj.userId || userObj.targetUserId)
      : userObj;

    if (!rawId || togglingId) return;
    const targetUserId = String(rawId);

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
        userIdToFollow: targetUserId,
        targetUserId: targetUserId,
        userId: targetUserId,
        id: targetUserId,
      });

      const resData = res.data?.data || res.data;
      let isNowFollowing;
      if (typeof resData?.following === "boolean") {
        isNowFollowing = resData.following;
      } else if (typeof resData?.isFollowing === "boolean") {
        isNowFollowing = resData.isFollowing;
      } else if (typeof resData?.isFollowed === "boolean") {
        isNowFollowing = resData.isFollowed;
      } else {
        const prevStatus = userObj.isFollowing ?? userObj.following ?? userObj.isFollowedByMe ?? false;
        isNowFollowing = !prevStatus;
      }

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
        onFollowStatusChange(targetUserId, isNowFollowing);
      }
    } catch (err) {
      console.error("Follow error in FollowingModal:", err);
      setUsers(previousUsers);
    } finally {
      setTogglingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[500] flex items-center justify-center p-4 animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150 flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 px-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-extrabold text-sm text-slate-900">Following</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 rounded-full transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* User List Container */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {loading ? (
            <div className="flex justify-center items-center py-10 text-slate-400">
              <Loader2 size={24} className="animate-spin text-blue-600" />
            </div>
          ) : users.length > 0 ? (
            users.map((u, i) => {
              const uId = u.id || u._id || u.userId || u.targetUserId || i;
              const hotdropId = u.hotdropId || u.username || "user";
              const avatar = u.profilePicture || u.profileImageUrl || dp;
              const name = u.firstName
                ? `${u.firstName} ${u.lastName || ""}`.trim()
                : u.username || "";

              const isSelf = String(uId) === String(currentUserId);
              const isUserFollowing =
                u.isFollowing ?? u.following ?? u.isFollowedByMe ?? false;
              const isFollower =
                u.isFollower ||
                u.isFollowingMe ||
                u.followsMe ||
                false;
              const isPending = String(togglingId) === String(uId);

              return (
                <div
                  key={uId}
                  className="flex items-center justify-between p-2.5 px-3 rounded-2xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100 group"
                >
                  <div
                    className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                    onClick={() => handleUserClick(hotdropId)}
                  >
                    <img
                      src={avatar}
                      alt={hotdropId}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0 group-hover:scale-105 transition"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition">
                        @{hotdropId}
                      </span>
                      {name && (
                        <span className="text-[11px] font-medium text-slate-400 truncate">
                          {name}
                        </span>
                      )}
                    </div>
                  </div>

                  {!isSelf && currentUserId && (
                    <button
                      onClick={() => handleToggleFollow(u)}
                      disabled={isPending}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                        isUserFollowing
                          ? "bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-600 border border-slate-200"
                          : "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20"
                      }`}
                    >
                      {isPending ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : isUserFollowing ? (
                        <>
                          <UserCheck size={13} />
                          <span>Following</span>
                        </>
                      ) : isFollower ? (
                        <>
                          <UserPlus size={13} />
                          <span>Follow Back</span>
                        </>
                      ) : (
                        <>
                          <UserPlus size={13} />
                          <span>Follow</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 text-slate-400 text-xs font-medium">
              Not following anyone yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FollowingModal;
