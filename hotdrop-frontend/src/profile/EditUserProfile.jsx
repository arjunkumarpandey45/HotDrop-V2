import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "../api/Api";
import { Globe, Edit, Loader2, Award, X, Share2, Mail, UserPlus, UserMinus } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

import { showErrorToast, showProfileUpdatedToast } from "../toast/Toast";

import EmailModal from "./EmailModal";
import EditProfileModal from "./EditProfileModal";
import FollowersModal from "./FollowersModal";
import FollowingModal from "./FollowingModal";
import ShareProfileModal from "./ShareProfileModal";
import UserPost from "./post/UserPost";
import dp from "../assets/dp.jpg";

const Github = ({ size = 20, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const Linkedin = ({ size = 20, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const Leetcode = ({ size = 20, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M16.102 17.93l-2.697 2.607c-.466.467-1.111.662-1.823.662s-1.357-.195-1.824-.662l-4.332-4.363c-.467-.467-.702-1.15-.702-1.863 0-.713.235-1.357.702-1.824l4.319-4.38c.467-.467 1.125-.645 1.837-.645s1.357.178 1.823.645l2.697 2.607c.302.302.79.302 1.092 0 .302-.302.302-.79 0-1.092l-2.697-2.607c-.776-.776-1.823-1.125-2.915-1.125s-2.139.349-2.915 1.125l-4.319 4.38c-.776.776-1.192 1.823-1.192 2.915s.416 2.139 1.192 2.915l4.332 4.363c.776.776 1.823 1.125 2.915 1.125s2.139-.349 2.915-1.125l2.697-2.607c.302-.302.302-.79 0-1.092-.302-.302-.79-.302-1.092 0zM20.811 13.01H10.666c-.428 0-.776.348-.776.776s.348.776.776.776h10.145c.428 0 .776-.348.776-.776s-.348-.776-.776-.776zM13.627 2.213c-.302-.302-.79-.302-1.092 0L9.838 4.91c-.302.302-.302.79 0 1.092.302.302.79.302 1.092 0l2.697-2.697c.302-.302.79-.302 1.092 0z" />
  </svg>
);

const getEntityId = (obj) => {
  if (!obj) return "";
  if (typeof obj === "string" || typeof obj === "number") return String(obj);
  return String(obj.id || obj._id || obj.userId || obj.targetUserId || "");
};

const checkIsFollowing = (targetUserData, currentUserData) => {
  if (!targetUserData) return false;

  if (typeof targetUserData.isFollowing === "boolean") {
    return targetUserData.isFollowing;
  }
  if (typeof targetUserData.isFollowedByMe === "boolean") {
    return targetUserData.isFollowedByMe;
  }
  if (typeof targetUserData.isFollowed === "boolean") {
    return targetUserData.isFollowed;
  }
  if (typeof targetUserData.following === "boolean") {
    return targetUserData.following;
  }

  const myUserId = getEntityId(currentUserData);
  const targetUserId = getEntityId(targetUserData);

  if (myUserId && Array.isArray(targetUserData.followers)) {
    const found = targetUserData.followers.some(
      (f) => getEntityId(f) === myUserId
    );
    if (found) return true;
  }

  if (targetUserId && Array.isArray(currentUserData?.following)) {
    const found = currentUserData.following.some(
      (f) => getEntityId(f) === targetUserId
    );
    if (found) return true;
  }

  return false;
};

function EditUserProfile() {
  const { hotdropId } = useParams();
  const navigate = useNavigate();
  const loggedInUser = useAuthStore((state) => state.user);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const isCheckingAuth = useAuthStore((state) => state.isCheckingAuth);
  const setUser = useAuthStore((state) => state.setUser);

  const [searchedUser, setSearchedUser] = useState(null);
  const [fetchingUser, setFetchingUser] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const myUserId = getEntityId(loggedInUser);
  const searchedUserId = getEntityId(searchedUser);

  const isOwnProfile =
    !hotdropId ||
    (loggedInUser?.hotdropId &&
      hotdropId.toLowerCase() === loggedInUser.hotdropId.toLowerCase()) ||
    (loggedInUser?.username &&
      hotdropId.toLowerCase() === loggedInUser.username.toLowerCase()) ||
    (myUserId && searchedUserId && myUserId === searchedUserId);

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOwnProfile) {
      setSearchedUser(null);
      setFetchError(null);
      return;
    }

    if (!hotdropId) return;

    const fetchUserProfile = async () => {
      try {
        setFetchingUser(true);
        setFetchError(null);
        const res = await axios.get(`/users/search/${hotdropId}`);

        const payload = res.data?.data || res.data;
        let userData = null;

        if (Array.isArray(payload)) {
          userData =
            payload.find(
              (u) => u.hotdropId?.toLowerCase() === hotdropId.toLowerCase()
            ) || payload[0];
        } else if (payload?.user) {
          userData = {
            ...payload.user,
            posts: payload.posts || payload.user.posts || [],
          };
        } else {
          userData = payload;
        }

        if (!userData || (!userData.id && !userData._id && !userData.hotdropId)) {
          setFetchError("User profile not found");
          setSearchedUser(null);
          return;
        }

        const targetUserId = getEntityId(userData);
        if (targetUserId) {
          try {
            const postsRes = await axios.get(`/posts/user/${targetUserId}`);
            const postsPayload =
              postsRes.data?.data || postsRes.data?.posts || postsRes.data;
            const fetchedPosts = Array.isArray(postsPayload)
              ? postsPayload
              : Array.isArray(postsPayload?.posts)
              ? postsPayload.posts
              : null;

            if (fetchedPosts) {
              userData = {
                ...userData,
                posts: fetchedPosts,
                postCount: fetchedPosts.length,
              };
            }
          } catch (postsErr) {
            console.warn(
              `Failed to fetch posts from /posts/user/${targetUserId}:`,
              postsErr
            );
          }
        }

        setSearchedUser(userData);

        let initialFollowing = checkIsFollowing(userData, loggedInUser);

        const myUserId = getEntityId(loggedInUser);
        if (myUserId && targetUserId) {
          try {
            const followingRes = await axios.get(`/users/${myUserId}/following`);
            const followingList = Array.isArray(followingRes.data)
              ? followingRes.data
              : followingRes.data?.data || followingRes.data?.following || [];

            const isFoundInFollowing = followingList.some((u) => {
              const uId = getEntityId(u);
              const uHandle = (u.hotdropId || u.username || "").toLowerCase();
              return (
                (uId && uId === targetUserId) ||
                (uHandle && uHandle === (userData.hotdropId || hotdropId).toLowerCase())
              );
            });

            if (isFoundInFollowing) {
              initialFollowing = true;
            }
          } catch (followingErr) {
            console.warn("Could not verify following list:", followingErr);
          }
        }

        setIsFollowing(initialFollowing);
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
        setFetchError(err.response?.data?.message || "User profile not found");
        setSearchedUser(null);
      } finally {
        setFetchingUser(false);
      }
    };

    fetchUserProfile();
  }, [hotdropId, isOwnProfile, loggedInUser?.id, loggedInUser?._id]);

  const displayUser = isOwnProfile ? loggedInUser : searchedUser;

  const handleFollowToggle = async () => {
    if (!isLoggedIn) {
      showErrorToast("Please login to follow creators");
      return;
    }
    if (isOwnProfile) return;
    const targetUserId = getEntityId(displayUser);
    if (myUserId && targetUserId && myUserId === targetUserId) {
      showErrorToast("You cannot follow yourself");
      return;
    }
    if (!targetUserId || followLoading) return;

    try {
      setFollowLoading(true);

      const res = await axios.post("/users/follow", {
        userIdToFollow: String(targetUserId),
        targetUserId: String(targetUserId),
        userId: String(targetUserId),
        id: String(targetUserId),
      });

      const resData = res.data?.data || res.data;

      let newFollowingState;
      if (typeof resData?.following === "boolean") {
        newFollowingState = resData.following;
      } else if (typeof resData?.isFollowing === "boolean") {
        newFollowingState = resData.isFollowing;
      } else if (typeof resData?.isFollowed === "boolean") {
        newFollowingState = resData.isFollowed;
      } else {
        newFollowingState = !isFollowing;
      }

      setIsFollowing(newFollowingState);

      setSearchedUser((prev) => {
        if (!prev) return prev;
        const currentFollowersCount =
          prev.followerCount ?? prev.followers?.length ?? 0;
        const myUserId = getEntityId(loggedInUser);
        let updatedFollowers = Array.isArray(prev.followers)
          ? [...prev.followers]
          : [];

        if (newFollowingState) {
          if (myUserId && !updatedFollowers.some((f) => getEntityId(f) === myUserId)) {
            updatedFollowers.push(loggedInUser || myUserId);
          }
        } else {
          if (myUserId) {
            updatedFollowers = updatedFollowers.filter(
              (f) => getEntityId(f) !== myUserId
            );
          }
        }

        return {
          ...prev,
          isFollowing: newFollowingState,
          isFollowedByMe: newFollowingState,
          followers: updatedFollowers,
          followerCount: newFollowingState
            ? currentFollowersCount + 1
            : Math.max(0, currentFollowersCount - 1),
        };
      });

      useAuthStore.setState((state) => {
        if (!state.user) return state;
        const currentFollowingCount =
          state.user.followingCount ?? state.user.following?.length ?? 0;
        let myFollowingList = Array.isArray(state.user.following)
          ? [...state.user.following]
          : [];

        if (newFollowingState) {
          if (!myFollowingList.some((f) => getEntityId(f) === targetUserId)) {
            myFollowingList.push(displayUser || targetUserId);
          }
        } else {
          myFollowingList = myFollowingList.filter(
            (f) => getEntityId(f) !== targetUserId
          );
        }

        return {
          user: {
            ...state.user,
            following: myFollowingList,
            followingCount: newFollowingState
              ? currentFollowingCount + 1
              : Math.max(0, currentFollowingCount - 1),
          },
        };
      });
    } catch (err) {
      console.error("Follow error:", err);
      showErrorToast(
        err.response?.data?.message || "Failed to update follow status"
      );
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUpdate = async (formDataFromModal) => {
    try {
      setLoading(true);
      const userId = getEntityId(loggedInUser);

      const localUpdatedData = {};
      for (let [key, value] of formDataFromModal.entries()) {
        if (!(value instanceof File)) {
          localUpdatedData[key] = value;
        }
      }

      const res = await axios.put(
        `/users/update/${userId}`,
        formDataFromModal,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const serverData = res.data?.user || res.data?.data || res.data || {};

      const updatedUserObj = {
        ...loggedInUser,
        ...localUpdatedData,
        ...serverData,
        profileImageUrl:
          serverData.profileImageUrl ||
          serverData.profilePicture ||
          localUpdatedData.profileImageUrl ||
          loggedInUser?.profileImageUrl ||
          loggedInUser?.profilePicture,
        updatedAt: Date.now(),
      };

      if (setUser) {
        setUser(updatedUserObj);
      }

      showProfileUpdatedToast("Profile details updated!");
      setShowEditModal(false);
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  if (isCheckingAuth || (!isOwnProfile && fetchingUser)) {
    return (
      <div className="flex justify-center items-center h-60">
        <Loader2 className="animate-spin text-blue-600" size={28} />
      </div>
    );
  }

  if (!isOwnProfile && fetchError) {
    return (
      <div className="flex flex-col items-center justify-center h-60 gap-4">
        <p className="text-slate-500 text-sm font-medium">{fetchError}</p>
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
        >
          Go to Home
        </button>
      </div>
    );
  }

  if (isOwnProfile && !loggedInUser && !isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center h-60 gap-4">
        <p className="text-slate-500 text-sm font-medium">
          Please login to view profile
        </p>
        <Link
          to="/login"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
        >
          Login
        </Link>
      </div>
    );
  }

  const rawAvatar =
    displayUser?.profileImageUrl ||
    displayUser?.profilePicture ||
    displayUser?.avatar;

  const profileAvatar = rawAvatar
    ? `${rawAvatar}${
        rawAvatar.includes("?") ? "&" : "?"
      }t=${displayUser?.updatedAt || Date.now()}`
    : dp;

  const fullName = displayUser?.firstName
    ? `${displayUser.firstName} ${displayUser.lastName || ""}`.trim()
    : displayUser?.username || "HotDrop Creator";

  return (
    <div className="w-full flex flex-col items-center p-2 sm:px-2 sm:py-4 bg-white sm:bg-[#F9FAFB]">
      {/* 📱 MOBILE DESIGN */}
      <div className="block sm:hidden w-full max-w-lg bg-white border border-gray-200 rounded-2xl p-5 shadow-sm relative">
        {/* HEADER ROW */}
        <div className="flex justify-between items-center pb-3.5 mb-4 border-b border-gray-100 gap-2">
          <div className="flex items-center gap-2 select-none shrink-0">
            <div className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-black tracking-tight flex items-center">
              <span className="text-orange-500">HOT</span>
              <span className="text-blue-600">DROP</span>
            </span>
          </div>

          <span className="text-xs font-bold lowercase text-slate-600 px-2">
            @{displayUser?.hotdropId || "hotdrop"}
          </span>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setShowShareModal(true)}
              className="p-2 rounded-full text-white bg-emerald-500 hover:bg-emerald-600 transition"
              title="Share"
            >
              <Share2 size={14} />
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between gap-4">
          <div
            className="shrink-0 cursor-pointer group"
            onClick={() => setShowFullImage(true)}
          >
            <div className="w-16 h-16 rounded-full border border-gray-200 overflow-hidden bg-gray-50">
              <img
                src={profileAvatar}
                alt="Profile Avatar"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="flex-1 flex justify-around items-center text-center">
            {[
              {
                label: "posts",
                count: displayUser?.postCount ?? displayUser?.posts?.length ?? 0,
                action: null,
              },
              {
                label: "followers",
                count:
                  displayUser?.followerCount ??
                  displayUser?.followers?.length ??
                  0,
                action: () => setShowFollowers(true),
              },
              {
                label: "following",
                count:
                  displayUser?.followingCount ??
                  displayUser?.following?.length ??
                  0,
                action: () => setShowFollowing(true),
              },
            ].map((stat, i) => (
              <button
                key={i}
                onClick={stat.action}
                disabled={!stat.action}
                className="flex flex-col items-center"
              >
                <span className="text-base font-bold text-gray-900 leading-none">
                  {stat.count}
                </span>
                <span className="text-xs text-gray-500 font-medium mt-1">
                  {stat.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="mt-3.5 flex flex-col">
          <h1 className="text-sm font-bold text-gray-900 leading-tight">
            {fullName}
          </h1>

          <p className="text-xs text-gray-700 leading-relaxed font-normal whitespace-pre-line pt-1">
            {displayUser?.bio || "Digital Creator & Developer 🚀"}
          </p>
        </div>

        {/* Action Row: Follow/Edit + Contact */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
          {isOwnProfile ? (
            <button
              onClick={() => setShowEditModal(true)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition active:scale-95"
            >
              <Edit size={14} />
              <span>Edit Profile</span>
            </button>
          ) : (
            <button
              onClick={handleFollowToggle}
              disabled={followLoading}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition shadow-sm active:scale-95 ${
                isFollowing
                  ? "bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-600 border border-slate-200"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {followLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : isFollowing ? (
                <>
                  <UserMinus size={14} />
                  <span>Following</span>
                </>
              ) : (
                <>
                  <UserPlus size={14} />
                  <span>Follow</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={() => setShowEmailModal(true)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 transition active:scale-95"
          >
            <Mail size={14} />
            <span>Contact</span>
          </button>
        </div>
      </div>

      {/* 💻 DESKTOP DESIGN */}
      <div className="hidden sm:flex w-full max-w-full py-4 bg-white rounded-[2rem] shadow-[0_15px_35px_-10px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden relative flex-col">
        {/* HEADER ROW */}
        <div className="flex justify-between items-center px-8 py-3 border-b border-slate-50 bg-slate-50/30 shrink-0">
          <div className="flex items-center gap-2.5 select-none shrink-0">
            <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-extrabold tracking-widest uppercase flex items-center gap-0.5">
              <span className="text-orange-600">HOT</span>
              <span className="text-blue-600">DROP</span>
            </span>
          </div>

          <span className="text-sm font-bold lowercase text-slate-600 px-3">
            @{displayUser?.hotdropId || "hotdrop"}
          </span>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center justify-center p-2.5 rounded-full text-white bg-emerald-500 hover:bg-emerald-600 shadow-sm transition-all hover:scale-105"
              title="Share"
            >
              <Share2 size={14} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-8 flex flex-row items-start gap-8">
          <div
            className="relative shrink-0 cursor-pointer group"
            onClick={() => setShowFullImage(true)}
          >
            <div className="absolute -inset-1 bg-gradient-to-tr from-orange-500 to-blue-500 rounded-full blur-[1px] opacity-20 group-hover:opacity-40 transition"></div>
            <div className="relative w-28 h-28 rounded-full p-0.5 bg-white shadow-md overflow-hidden ring-1 ring-slate-100">
              <img
                src={profileAvatar}
                alt="Profile Avatar"
                className="w-full h-full object-cover rounded-full group-hover:scale-105 transition"
              />
            </div>
            <div className="absolute bottom-0 right-0 bg-white p-1.5 rounded-full shadow-sm border border-slate-100">
              <Award size={14} className="text-orange-500" />
            </div>
          </div>

          <div className="flex-1 text-left">
            <div className="flex flex-col mb-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-snug">
                {fullName}
              </h1>
            </div>

            {/* Stats Row */}
            <div className="flex gap-8 my-3">
              {[
                {
                  label: "posts",
                  count: displayUser?.postCount ?? displayUser?.posts?.length ?? 0,
                  action: null,
                },
                {
                  label: "followers",
                  count:
                    displayUser?.followerCount ??
                    displayUser?.followers?.length ??
                    0,
                  action: () => setShowFollowers(true),
                },
                {
                  label: "following",
                  count:
                    displayUser?.followingCount ??
                    displayUser?.following?.length ??
                    0,
                  action: () => setShowFollowing(true),
                },
              ].map((stat, i) => (
                <button
                  key={i}
                  onClick={stat.action}
                  disabled={!stat.action}
                  className={`flex items-baseline gap-1.5 ${
                    stat.action
                      ? "cursor-pointer hover:opacity-75"
                      : "cursor-default"
                  }`}
                >
                  <span className="text-base font-bold text-slate-900">
                    {stat.count}
                  </span>
                  <span className="text-xs font-medium lowercase text-slate-500">
                    {stat.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Bio */}
            <p className="text-slate-600 text-sm leading-relaxed font-normal mb-4 line-clamp-2">
              {displayUser?.bio || "Minimalist Creator | Tech Enthusiast 🚀"}
            </p>

            {/* Action Row: Follow/Edit + Contact + Share */}
            <div className="flex items-center gap-3 mt-5">
              {isOwnProfile ? (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition hover:scale-[1.02] active:scale-95"
                >
                  <Edit size={14} />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <button
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition shadow-sm hover:scale-[1.02] active:scale-95 ${
                    isFollowing
                      ? "bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-600 border border-slate-200"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {followLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : isFollowing ? (
                    <>
                      <UserMinus size={14} />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={14} />
                      <span>Follow</span>
                    </>
                  )}
                </button>
              )}

              <button
                onClick={() => setShowEmailModal(true)}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200/60 transition hover:scale-[1.02] active:scale-95"
              >
                <Mail size={14} />
                <span>Contact</span>
              </button>

              
            </div>
          </div>
        </div>
      </div>

      {/* 📦 USER POSTS SECTION */}
      <div className="w-full max-w-full mt-6 sm:mt-8">
        <UserPost
          postsOverride={displayUser?.posts}
          hideOptions={!isOwnProfile}
          ownerOverride={displayUser}
        />
      </div>

      {/* Full Image Modal */}
      {showFullImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md"
          onClick={() => setShowFullImage(false)}
        >
          <button
            onClick={() => setShowFullImage(false)}
            className="absolute top-6 right-6 text-white/70 hover:text-white p-2"
          >
            <X size={24} />
          </button>
          <img
            src={profileAvatar}
            className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain"
            alt="Profile Preview"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Modals */}
      {isOwnProfile && (
        <EditProfileModal
          key={showEditModal ? "open" : "closed"}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          user={displayUser}
          handleUpdate={handleUpdate}
          loading={loading}
        />
      )}

      <FollowersModal
        isOpen={showFollowers}
        onClose={() => setShowFollowers(false)}
        userId={getEntityId(displayUser)}
        onFollowStatusChange={(targetUserId, isNowFollowing) => {
          useAuthStore.setState((prev) => {
            if (!prev.user) return prev;
            const currentCount =
              prev.user?.followingCount ?? prev.user?.following?.length ?? 0;
            return {
              user: {
                ...prev.user,
                followingCount: isNowFollowing
                  ? currentCount + 1
                  : Math.max(0, currentCount - 1),
              },
            };
          });

          const pageUserId = getEntityId(displayUser);
          if (
            targetUserId &&
            pageUserId &&
            String(targetUserId) === String(pageUserId)
          ) {
            setIsFollowing(isNowFollowing);
            setSearchedUser((prev) => {
              if (!prev) return prev;
              const currentCount =
                prev.followerCount ?? prev.followers?.length ?? 0;
              return {
                ...prev,
                isFollowing: isNowFollowing,
                isFollowedByMe: isNowFollowing,
                followerCount: isNowFollowing
                  ? currentCount + 1
                  : Math.max(0, currentCount - 1),
              };
            });
          }
        }}
      />

      <FollowingModal
        isOpen={showFollowing}
        onClose={() => setShowFollowing(false)}
        userId={getEntityId(displayUser)}
        onUnfollowSuccess={(targetUserId) => {
          useAuthStore.setState((prev) => {
            if (!prev.user) return prev;
            const currentCount =
              prev.user?.followingCount ?? prev.user?.following?.length ?? 0;
            return {
              user: {
                ...prev.user,
                followingCount: Math.max(0, currentCount - 1),
              },
            };
          });

          const pageUserId = getEntityId(displayUser);
          if (
            targetUserId &&
            pageUserId &&
            String(targetUserId) === String(pageUserId)
          ) {
            setIsFollowing(false);
            setSearchedUser((prev) => {
              if (!prev) return prev;
              const currentCount =
                prev.followerCount ?? prev.followers?.length ?? 0;
              return {
                ...prev,
                isFollowing: false,
                isFollowedByMe: false,
                followerCount: Math.max(0, currentCount - 1),
              };
            });
          }
        }}
      />

      <EmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        user={displayUser}
        email={displayUser?.email}
      />

      <ShareProfileModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        user={displayUser}
      />
    </div>
  );
}

export default EditUserProfile;