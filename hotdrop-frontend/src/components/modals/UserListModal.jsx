import { X, UserCheck, Loader2, UserPlus } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../api/Api";
import dp from "../../assets/dp.jpg";
import { useAuthStore } from "../../store/useAuthStore";
import usePaginatedFetch from "../../hooks/usePaginatedFetch";
import LoadMoreTrigger from "../common/LoadMoreTrigger";

function UserListModal({
  isOpen,
  onClose,
  userId,
  type = "followers",
  initialList = [],
  onFollowStatusChange,
  onUnfollowSuccess,
}) {
  const [togglingId, setTogglingId] = useState(null);
  const [myFollowingIds, setMyFollowingIds] = useState(new Set());
  const navigate = useNavigate();

  const { user: currentUser } = useAuthStore();
  const currentUserId = currentUser?.id || currentUser?._id || currentUser?.userId;

  const isFollowingType = type === "following";

  // 1. Fetch current logged-in user's following list to track follow states
  useEffect(() => {
    if (!isOpen || !currentUserId || (isFollowingType && String(currentUserId) === String(userId))) return;

    let isMounted = true;
    const fetchMyFollowing = async () => {
      try {
        const res = await axios.get(`/users/${currentUserId}/get-all-following`, {
          params: { page: 0, size: 100 },
        });
        const payload = res.data?.data || res.data;
        const list = Array.isArray(payload)
          ? payload
          : payload?.content || payload?.following || payload?.users || [];

        if (isMounted) {
          const idSet = new Set();
          list.forEach((item) => {
            const itemID = String(item.id || item._id || item.userId || item);
            const itemHandle = (item.hotdropId || item.username || "").toLowerCase();
            if (itemID) idSet.add(itemID);
            if (itemHandle) idSet.add(itemHandle);
          });
          setMyFollowingIds(idSet);
        }
      } catch (err) {
        console.warn(`Could not fetch my following list in UserListModal (${type}):`, err);
      }
    };

    fetchMyFollowing();
    return () => {
      isMounted = false;
    };
  }, [isOpen, currentUserId, userId, isFollowingType, type]);

  // 2. Paginated Fetch with deduplication and infinite scroll
  const endpoint = isFollowingType
    ? `/users/${userId}/get-all-following`
    : `/users/${userId}/get-all-followers`;

  const {
    items: rawUsers,
    setItems: setUsers,
    loading,
    loadingMore,
    hasMore,
    totalElements,
    loadMore,
    sentinelRef,
    handleScroll,
  } = usePaginatedFetch({
    url: isOpen && userId && userId !== "undefined" ? endpoint : null,
    pageSize: 10,
    enabled: Boolean(isOpen && userId && userId !== "undefined"),
    initialItems: Array.isArray(initialList) ? initialList : [],
  });

  // 3. Annotate users with current follow status
  const users = useMemo(() => {
    const isOwnFollowingModal = isFollowingType && currentUserId && String(currentUserId) === String(userId);

    return rawUsers.map((rawItem) => {
      const u =
        typeof rawItem === "object" && rawItem !== null
          ? rawItem
          : { id: String(rawItem), hotdropId: String(rawItem) };
      const uId = String(u.id || u._id || u.userId || u.targetUserId || "");
      const uHandle = (u.hotdropId || u.username || "").toLowerCase();

      let isFollowing = false;
      if (isOwnFollowingModal) {
        isFollowing = u.isFollowing ?? u.following ?? true;
      } else if (typeof u.isFollowing === "boolean") {
        isFollowing = u.isFollowing;
      } else if (typeof u.following === "boolean") {
        isFollowing = u.following;
      } else if (typeof u.isFollowedByMe === "boolean") {
        isFollowing = u.isFollowedByMe;
      } else if (myFollowingIds.has(uId) || (uHandle && myFollowingIds.has(uHandle))) {
        isFollowing = true;
      }

      return {
        ...u,
        isFollowing,
        following: isFollowing,
        isFollowedByMe: isFollowing,
      };
    });
  }, [rawUsers, currentUserId, userId, myFollowingIds, isFollowingType]);

  const handleUserClick = (targetHotdrop) => {
    if (!targetHotdrop) return;
    onClose();
    navigate(`/user/userprofile/${targetHotdrop}`);
  };

  const handleToggleFollow = async (userObj) => {
    const rawId =
      typeof userObj === "object"
        ? userObj.id || userObj._id || userObj.userId || userObj.targetUserId
        : userObj;

    if (!rawId || togglingId) return;
    const targetUserId = String(rawId);

    const previousUsers = [...rawUsers];

    // Optimistic UI update
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
        const prevStatus =
          userObj.isFollowing ?? userObj.following ?? userObj.isFollowedByMe ?? false;
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

      // Keep myFollowingIds in sync
      setMyFollowingIds((prevSet) => {
        const nextSet = new Set(prevSet);
        if (isNowFollowing) {
          nextSet.add(targetUserId);
        } else {
          nextSet.delete(targetUserId);
        }
        return nextSet;
      });

      if (onFollowStatusChange) {
        onFollowStatusChange(targetUserId, isNowFollowing);
      }
      if (!isNowFollowing && onUnfollowSuccess) {
        onUnfollowSuccess(targetUserId);
      }
    } catch (err) {
      console.error(`Follow error in UserListModal (${type}):`, err);
      setUsers(previousUsers);
    } finally {
      setTogglingId(null);
    }
  };

  if (!isOpen) return null;

  const displayCount = totalElements || users.length;
  const titleText = isFollowingType ? "Following" : "Followers";
  const emptyText = isFollowingType ? "Not following anyone yet" : "No followers found";
  const loadMoreText = isFollowingType ? "Load More Following" : "Load More Followers";
  const ariaLabel = isFollowingType ? "Close following modal" : "Close followers modal";

  const renderFollowButtonContent = (isPending, isUserFollowing, isFollower) => {
    if (isPending) {
      return <Loader2 size={13} className="animate-spin" />;
    }
    if (isUserFollowing) {
      return (
        <>
          <UserCheck size={13} />
          <span>Following</span>
        </>
      );
    }
    if (isFollower) {
      return (
        <>
          <UserPlus size={13} />
          <span>Follow Back</span>
        </>
      );
    }
    return (
      <>
        <UserPlus size={13} />
        <span>Follow</span>
      </>
    );
  };

  const renderListContent = () => {
    if (loading && users.length === 0) {
      return (
        <div className="flex justify-center items-center py-10 text-slate-400">
          <Loader2 size={24} className="animate-spin text-blue-600" />
        </div>
      );
    }

    if (users.length > 0) {
      return (
        <>
          {users.map((u, i) => {
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
              (!isFollowingType && userId && currentUserId && String(userId) === String(currentUserId)) ||
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
                <button
                  type="button"
                  className="flex items-center gap-3 min-w-0 cursor-pointer flex-1 text-left"
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
                </button>

                {!isSelf && currentUserId && (
                  <button
                    type="button"
                    onClick={() => handleToggleFollow(u)}
                    disabled={isPending}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                      isUserFollowing
                        ? "bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-600 border border-slate-200"
                        : "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20"
                    }`}
                  >
                    {renderFollowButtonContent(isPending, isUserFollowing, isFollower)}
                  </button>
                )}
              </div>
            );
          })}

          {/* Infinite scroll sentinel and load more trigger */}
          <LoadMoreTrigger
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={loadMore}
            sentinelRef={sentinelRef}
            label={loadMoreText}
          />
        </>
      );
    }

    return (
      <div className="text-center py-10 text-slate-400 text-xs font-medium">
        {emptyText}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 animate-in fade-in duration-200 select-none">
      <button
        type="button"
        aria-label={ariaLabel}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-md border-0 p-0"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
            onClose();
          }
        }}
      />
      <div className="relative z-10 bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150 flex flex-col max-h-[80vh]">
        <div className="p-4 px-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-extrabold text-sm text-slate-900">
            {titleText} {displayCount > 0 ? `(${displayCount})` : ""}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 rounded-full transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div
          className="flex-1 overflow-y-auto p-3 space-y-1"
          onScroll={(e) => handleScroll(e.currentTarget)}
        >
          {renderListContent()}
        </div>
      </div>
    </div>
  );
}

export default UserListModal;
