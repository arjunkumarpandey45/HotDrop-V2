import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "../api/Api";
import { 
  Globe, 
  Edit, 
  Loader2, 
  Award, 
  X, 
  Share2, 
  Mail, 
  UserPlus, 
  UserMinus,
  Calendar,
  CheckCircle2,
  Flame,
  ExternalLink,
  Users,
  AppWindowMac,
  AudioWaveform
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { showErrorToast, showProfileUpdatedToast } from "../toast/Toast";

import EmailModal from "./EmailModal";
import EditProfileModal from "./EditProfileModal";
import FollowersModal from "./FollowersModal";
import FollowingModal from "./FollowingModal";
import ShareProfileModal from "./ShareProfileModal";
import UserPost from "./post/UserPost";
import dp from "../assets/dp.jpg";

const Github = ({ size = 13, className = "" }) => (
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

const Linkedin = ({ size = 13, className = "" }) => (
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

const Leetcode = ({ size = 13, className = "" }) => (
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
            const postsRes = await axios.get(`/posts/get-user-post/${targetUserId}`);
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
            const followingRes = await axios.get(`/users/${myUserId}/get-all-following`);
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
      showErrorToast("Please login to follow user");
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
        `/users/update-profile/${userId}`,
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
      <div className="flex flex-col justify-center items-center h-80 gap-3">
        <Loader2 className="animate-spin text-blue-600" size={32} />
        <span className="text-xs font-black uppercase tracking-wider text-slate-400">Loading Creator Profile...</span>
      </div>
    );
  }

  if (!isOwnProfile && fetchError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] p-4 text-center">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm max-w-xs w-full space-y-3">
          <p className="text-slate-500 text-xs font-semibold">{fetchError}</p>
          <button
            onClick={() => navigate("/")}
            className="w-full py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition cursor-pointer"
          >
            Go to Feed
          </button>
        </div>
      </div>
    );
  }

  if (isOwnProfile && !loggedInUser && !isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] p-4 text-center">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm max-w-xs w-full space-y-3">
          <p className="text-slate-500 text-xs font-semibold">Please sign in to view profile</p>
          <Link
            to="/login"
            className="block w-full py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition text-center"
          >
            Login
          </Link>
        </div>
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
    : displayUser?.username || displayUser?.hotdropId || "HotDrop Creator";


  const formattedJoinedDate = displayUser?.createdAt
    ? new Date(displayUser.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "Recently";

  const creatorPosts = displayUser?.posts || [];

  const stats = [
    {
      label: "projects",
      count: displayUser?.postCount ?? creatorPosts.length ?? 0,
      action: null,
      icon: Flame,
      color: "text-orange-500 bg-orange-50"
    },
    {
      label: "followers",
      count: displayUser?.followerCount ?? displayUser?.followers?.length ?? 0,
      action: () => setShowFollowers(true),
      icon: Users,
      color: "text-blue-600 bg-blue-50"
    },
    {
      label: "following",
      count: displayUser?.followingCount ?? displayUser?.following?.length ?? 0,
      action: () => setShowFollowing(true),
      icon: UserCheckIcon,
      color: "text-indigo-600 bg-indigo-50"
    },
  ];

  return (
    <div className="w-full min-h-screen bg-[#f8fafc] px-2 sm:px-4 py-3 sm:py-5 select-none font-sans space-y-6">
      
      {/* 👤 1. USER PROFILE CARD (INDEPENDENT COMPACT CONTAINER: max-w-4xl) */}
      <div className="max-w-4xl mx-auto w-full">
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all overflow-hidden relative">
          
          {/* COMPACT VERCEL / DRIBBBLE STYLE GRADIENT BANNER */}
          <div className="h-20 sm:h-32 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 relative p-3 sm:p-4 flex justify-between items-start overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/30 via-indigo-500/10 to-transparent opacity-70" />
            <div className="absolute -right-16 -bottom-16 w-44 h-44 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* BRAND BADGE */}
            <div className="relative z-10 flex items-center gap-1.5 select-none">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-tight text-white flex items-center gap-1">
                <span className="text-orange-400">HOT</span>
                <span className="text-blue-400">DROP</span>
                  </span>
            </div>

            {/* SHARE BUTTON */}
            <div className="relative z-10">
              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 transition active:scale-95 cursor-pointer shadow-sm"
                title="Share Profile"
              >
                <Share2 size={13} />
                <span className="hidden sm:inline-block">Share</span>
              </button>
            </div>
          </div>

          {/* PROFILE DETAILS */}
          <div className="px-4 sm:px-6 pb-4 sm:pb-5 relative">
            
            {/* TOP ROW: AVATAR + DESKTOP ACTION BUTTONS */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-3 -mt-14 sm:-mt-18 mb-3">
              
              {/* AVATAR (MOBILE: 100-120px, DESKTOP: 140-160px) */}
              <div 
                className="relative shrink-0 cursor-pointer group z-20"
                onClick={() => setShowFullImage(true)}
                title="Click to view avatar full size"
              >
                <div className="absolute -inset-1 bg-gradient-to-tr from-orange-500 via-indigo-500 to-blue-600 rounded-full blur-md opacity-40 group-hover:opacity-80 transition duration-500 animate-pulse" />
                <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full p-1 bg-white ring-4 ring-white shadow-xl overflow-hidden group-hover:scale-105 transition duration-300">
                  <img
                    src={profileAvatar}
                    alt={fullName}
                    className="w-full h-full object-cover rounded-full group-hover:scale-110 transition duration-500"
                  />
                </div>
                <div className="absolute bottom-1 right-1 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white p-1 rounded-full shadow-lg border-2 border-white" title="Verified Creator">
                  <CheckCircle2 size={14} className="fill-white text-blue-600" />
                </div>
              </div>

              {/* 💻 DESKTOP ACTION BUTTONS (hidden on mobile) */}
              <div className="hidden sm:flex items-center gap-2">
                {isOwnProfile ? (
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 shadow-sm shadow-blue-500/20 transition hover:scale-[1.02] active:scale-95 cursor-pointer"
                  >
                    <Edit size={13} />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <button
                    onClick={handleFollowToggle}
                    disabled={followLoading}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition shadow-sm active:scale-95 cursor-pointer ${
                      isFollowing
                        ? "bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-600 border border-slate-200"
                        : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/20 hover:scale-[1.02]"
                    }`}
                  >
                    {followLoading ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : isFollowing ? (
                      <>
                        <UserMinus size={13} />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus size={13} />
                        <span>Follow Creator</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={() => setShowEmailModal(true)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white border border-blue-200/80 transition hover:scale-[1.02] active:scale-95 cursor-pointer shadow-2xs"
                >
                  <Mail size={13} />
                  <span>Contact</span>
                </button>
              </div>

            </div>

            {/* NAME, BIO & SOCIALS */}
            <div className="space-y-2 text-center sm:text-left">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
                  <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    {fullName}
                  </h1>
                  
                </div>

                <div  className="self-center sm:self-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[13px] font-black lowercase tracking-wider">
                  <span className="text-blue-600 lowercase">@{displayUser?.hotdropId || "hotdrop"}</span>
                  
                  
                </div>
              </div>

              {/* BIO */}
              {displayUser?.bio && (
                <p className="text-xs text-slate-600 leading-relaxed font-bold max-w-xl whitespace-pre-line">
                  {displayUser.bio}
                </p>
              )}

             
              
            </div>

            {/* BOTTOM ROW: DESKTOP STATS PILLS / MOBILE STATS PILLS & ACTION BUTTONS & LOCATION/JOINED */}
            <div className="pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5">
              
              {/* 💻 DESKTOP COMPACT STATS PILLS (hidden on mobile) */}
              <div className="hidden sm:grid grid-cols-3 gap-2 max-w-xs">
                {stats.map((stat, i) => (
                  <button
                    key={i}
                    onClick={stat.action}
                    disabled={!stat.action}
                    className={`flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-xl transition border ${
                      stat.action
                        ? "bg-slate-50 hover:bg-blue-50 border-slate-200/80 cursor-pointer active:scale-95"
                        : "bg-slate-50 border-slate-200/80 cursor-default"
                    }`}
                  >
                    <span className="text-xs font-black text-slate-900">{stat.count}</span>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase">{stat.label}</span>
                  </button>
                ))}
              </div>

              {/* 📱 MOBILE BLOCK: STATS PILLS JUST ABOVE EDIT PROFILE & CONTACT BUTTONS */}
              <div className="flex sm:hidden flex-col gap-2 w-full pt-1">
                
                {/* STATS PILLS (JUST ABOVE!) */}
                <div className="flex items-center justify-center gap-1.5 w-full">
                  {stats.map((stat, i) => (
                    <button
                      key={i}
                      onClick={stat.action}
                      disabled={!stat.action}
                      className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl border transition ${
                        stat.action
                          ? "bg-slate-50 hover:bg-blue-50 border-slate-200/80 cursor-pointer active:scale-95"
                          : "bg-slate-50 border-slate-200/80 cursor-default"
                      }`}
                    >
                      <span className="text-xs font-black text-slate-900 leading-none">{stat.count}</span>
                      <span className="text-[10px] font-extrabold uppercase text-slate-400">{stat.label}</span>
                    </button>
                  ))}
                </div>

                {/* EDIT PROFILE & CONTACT BUTTONS (JUST BELOW STATS PILLS!) */}
                <div className="flex items-center gap-2 w-full">
                  {isOwnProfile ? (
                    <button
                      onClick={() => setShowEditModal(true)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-sm active:scale-95 transition cursor-pointer"
                    >
                      <Edit size={13} />
                      <span>Edit Profile</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleFollowToggle}
                      disabled={followLoading}
                      className={`flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition shadow-sm active:scale-95 cursor-pointer ${
                        isFollowing
                          ? "bg-slate-100 text-slate-700 hover:bg-rose-50 border border-slate-200"
                          : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                      }`}
                    >
                      {followLoading ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : isFollowing ? (
                        <>
                          <UserMinus size={13} />
                          <span>Following</span>
                        </>
                      ) : (
                        <>
                          <UserPlus size={13} />
                          <span>Follow</span>
                        </>
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => setShowEmailModal(true)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-200/80 hover:bg-blue-100 transition active:scale-95 cursor-pointer"
                  >
                    <Mail size={13} />
                    <span>Contact</span>
                  </button>
                </div>

              </div>

              {/* 📍 RIGHT-SIDE BOTTOM LOCATION & JOINED DATE */}
              <div className="flex items-center justify-center sm:justify-end gap-2 text-xs font-bold text-slate-600 shrink-0 w-full sm:w-auto pt-1 sm:pt-0">
                <span className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/80">
                  📍 India
                </span>
                <span className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/80">
                  <Calendar size={13} className="text-blue-600" /> Joined {formattedJoinedDate}
                </span>
              </div>

            </div>

          </div>
        </div>
      </div>

      {/* 📦 2. USER PROJECT DROPS SECTION (INDEPENDENT FULL-WIDTH CONTAINER: max-w-7xl) */}
      <div className="max-w-7xl mx-auto w-full space-y-4">
        

        <UserPost
          postsOverride={displayUser?.posts}
          hideOptions={!isOwnProfile}
          ownerOverride={displayUser}
        />
      </div>

      {/* FULL IMAGE PREVIEW MODAL */}
      {showFullImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShowFullImage(false)}
        >
          <button
            onClick={() => setShowFullImage(false)}
            className="absolute top-6 right-6 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition cursor-pointer"
          >
            <X size={24} />
          </button>
          <img
            src={profileAvatar}
            className="max-w-full max-h-[85vh] rounded-3xl shadow-2xl object-contain ring-4 ring-white/20 animate-in zoom-in-95 duration-200"
            alt="Profile Preview"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* BACKEND INTEGRATION MODALS (PRESERVED 100%) */}
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
        onUnfollowSuccess={(targetUserId, isNowFollowing) => {
          useAuthStore.setState((prev) => {
            if (!prev.user) return prev;
            const currentCount =
              prev.user?.followingCount ?? prev.user?.following?.length ?? 0;
            return {
              user: {
                ...prev.user,
                followingCount: isNowFollowing === true
                  ? currentCount + 1
                  : Math.max(0, currentCount - 1),
              },
            };
          });
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

// Helper icon component for stats
function UserCheckIcon({ size = 14, className = "" }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <polyline points="16 11 18 13 22 9" />
    </svg>
  );
}

export default EditUserProfile;