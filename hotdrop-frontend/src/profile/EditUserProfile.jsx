import { useState } from "react";
import axios from "../api/Api";
import { Globe, Edit, Loader2, Award, X, Share2, Mail } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

import { showErrorToast, showProfileUpdatedToast } from "../toast/Toast";

import EmailModal from "./EmailModal";
import EditProfileModal from "./EditProfileModal";
import FollowersModal from "./FollowersModal";
import FollowingModal from "./FollowingModal";
import ShareProfileModal from "./ShareProfileModal";
import dp from "../assets/dp.jpg";

const Github = ({ size = 18, className = "" }) => (
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

const Linkedin = ({ size = 18, className = "" }) => (
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

const Leetcode = ({ size = 18, className = "" }) => (
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

function EditUserProfile() {
  const user = useAuthStore((state) => state.user);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const isCheckingAuth = useAuthStore((state) => state.isCheckingAuth);
  const setUser = useAuthStore((state) => state.setUser);

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [loading, setLoading] = useState(false);

  if (isCheckingAuth) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="animate-spin text-blue-600" size={24} />
      </div>
    );
  }

  if (!user && !isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3">
        <p className="text-slate-500 text-xs font-medium">Please login to view profile</p>
        <a href="/login" className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold">
          Login
        </a>
      </div>
    );
  }

  const handleUpdate = async (formDataFromModal) => {
    try {
      setLoading(true);
      const userId = user?.id || user?.userId || user?._id;

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
        ...user,
        ...localUpdatedData,
        ...serverData,
        profileImageUrl:
          serverData.profileImageUrl ||
          serverData.profilePicture ||
          localUpdatedData.profileImageUrl ||
          user?.profileImageUrl ||
          user?.profilePicture,
        updatedAt: Date.now(),
      };

      if (setUser) {
        setUser(updatedUserObj);
      }

      // 🎯 Toast trigger
      showProfileUpdatedToast("Profile details updated!");
      setShowEditModal(false);
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const rawAvatar = user?.profileImageUrl || user?.profilePicture || user?.avatar;

  const profileAvatar = rawAvatar
    ? `${rawAvatar}${rawAvatar.includes("?") ? "&" : "?"}t=${user?.updatedAt || Date.now()}`
    : dp;

  const fullName = user?.firstName
    ? `${user.firstName} ${user.lastName || ""}`.trim()
    : user?.username || "HotDrop Creator";

  return (
    <div className="w-full flex justify-center p-2 sm:p-5 bg-white sm:bg-[#F9FAFB]">
      
      {/* 📱 MOBILE DESIGN */}
      <div className="block sm:hidden w-full max-w-md bg-white border border-gray-200 rounded-2xl p-4 shadow-sm relative">
        
        {/* HEADER ROW */}
        <div className="flex justify-between items-center pb-3 mb-3 border-b border-gray-100 gap-2">
          <div className="flex items-center gap-1.5 select-none shrink-0">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-black tracking-tight flex items-center">
              <span className="text-orange-500">HOT</span>
              <span className="text-blue-600">DROP</span>
            </span>
          </div>

          <span className="text-xs font-bold lowercase text-slate-600 px-2">
            @{user?.hotdropId || "hotdrop"}
          </span>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setShowEmailModal(true)}
              className="w-8 h-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center"
              title="Contact"
            >
              <Mail size={17} />
            </button>
            <button
              onClick={() => setShowShareModal(true)}
              className="p-1.5 rounded-full text-white bg-emerald-500 hover:bg-emerald-600 transition"
              title="Share"
            >
              <Share2 size={12} />
            </button>
            <button
              onClick={() => setShowEditModal(true)}
              className="p-1.5 rounded-full text-white bg-blue-600 hover:bg-blue-700 transition"
              title="Edit Profile"
            >
              <Edit size={12} />
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between gap-3">
          <div
            className="shrink-0 cursor-pointer group"
            onClick={() => setShowFullImage(true)}
          >
            <div className="w-14 h-14 rounded-full border border-gray-200 overflow-hidden bg-gray-50">
              <img
                src={profileAvatar}
                alt="Profile Avatar"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="flex-1 flex justify-around items-center text-center">
            {[
              { label: "posts", count: user?.postCount ?? 0, action: null },
              {
                label: "followers",
                count: user?.followerCount ?? user?.followers?.length ?? 0,
                action: () => setShowFollowers(true),
              },
              {
                label: "following",
                count: user?.followingCount ?? user?.following?.length ?? 0,
                action: () => setShowFollowing(true),
              },
            ].map((stat, i) => (
              <button
                key={i}
                onClick={stat.action}
                disabled={!stat.action}
                className="flex flex-col items-center"
              >
                <span className="text-sm font-bold text-gray-900 leading-none">
                  {stat.count}
                </span>
                <span className="text-[10px] text-gray-500 font-normal mt-0.5">
                  {stat.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="mt-2.5 flex flex-col">
          <h1 className="text-xs font-bold text-gray-900 leading-tight">
            {fullName}
          </h1>

          <p className="text-[11px] text-gray-700 leading-snug font-normal whitespace-pre-line pt-1">
            {user?.bio || "Digital Creator & Developer 🚀"}
          </p>
        </div>

        {/* Social Pills */}
        <div className="flex flex-wrap gap-1.5 mt-3 pt-2 border-t border-gray-100">
          {[
            { key: "github", val: user?.githubUrl || user?.github, Icon: Github, label: "GitHub" },
            { key: "linkedin", val: user?.linkedinUrl || user?.linkedin, Icon: Linkedin, label: "LinkedIn" },
            { key: "leetcode", val: user?.leetcodeUrl || user?.leetcode, Icon: Leetcode, label: "LeetCode" },
            { key: "portfolio", val: user?.portfolioUrl || user?.portfolio, Icon: Globe, label: "Portfolio" },
          ].map(({ key, val, Icon, label }) =>
            val ? (
              <a
                key={key}
                href={val.startsWith("http") ? val : `https://${val}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md text-[10px] font-medium"
              >
                <Icon size={11} />
                <span>{label}</span>
              </a>
            ) : null
          )}
        </div>
      </div>

      {/* 💻 DESKTOP DESIGN */}
      <div className="hidden sm:flex w-full max-w-4xl py-3 bg-white rounded-[1.75rem] shadow-[0_15px_35px_-10px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden relative flex-col">
        
        {/* HEADER ROW */}
        <div className="flex justify-between items-center px-6 py-2 border-b border-slate-50 bg-slate-50/30 shrink-0">
          <div className="flex items-center gap-2 select-none shrink-0">
            <div className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-extrabold tracking-widest uppercase flex items-center gap-0.5">
              <span className="text-orange-600">HOT</span>
              <span className="text-blue-600">DROP</span>
            </span>
          </div>

          <span className="text-xs font-bold lowercase text-slate-600 px-2">
            @{user?.hotdropId || "hotdrop"}
          </span>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowEmailModal(true)}
              className="w-8 h-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center"
              title="Contact"
            >
              <Mail size={17} />
            </button>
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center justify-center p-2 rounded-full text-white bg-emerald-500 hover:bg-emerald-600 shadow-sm transition-all hover:scale-105"
              title="Share"
            >
              <Share2 size={12} />
            </button>
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center justify-center p-2 rounded-full text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all hover:scale-105"
              title="Edit Profile"
            >
              <Edit size={12} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 flex flex-row items-start gap-6">
          <div
            className="relative shrink-0 cursor-pointer group"
            onClick={() => setShowFullImage(true)}
          >
            <div className="absolute -inset-1 bg-gradient-to-tr from-orange-500 to-blue-500 rounded-full blur-[1px] opacity-20 group-hover:opacity-40 transition"></div>
            <div className="relative w-24 h-24 rounded-full p-0.5 bg-white shadow-md overflow-hidden ring-1 ring-slate-100">
              <img
                src={profileAvatar}
                alt="Profile Avatar"
                className="w-full h-full object-cover rounded-full group-hover:scale-105 transition"
              />
            </div>
            <div className="absolute bottom-0 right-0 bg-white p-1 rounded-full shadow-sm border border-slate-100">
              <Award size={12} className="text-orange-500" />
            </div>
          </div>

          <div className="flex-1 text-left">
            <div className="flex flex-col mb-1.5">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-snug">
                {fullName}
              </h1>
            </div>

            {/* Stats Row */}
            <div className="flex gap-6 my-2">
              {[
                { label: "posts", count: user?.postCount ?? 0, action: null },
                {
                  label: "followers",
                  count: user?.followerCount ?? user?.followers?.length ?? 0,
                  action: () => setShowFollowers(true),
                },
                {
                  label: "following",
                  count: user?.followingCount ?? user?.following?.length ?? 0,
                  action: () => setShowFollowing(true),
                },
              ].map((stat, i) => (
                <button
                  key={i}
                  onClick={stat.action}
                  disabled={!stat.action}
                  className={`flex items-baseline gap-1 ${
                    stat.action ? "cursor-pointer hover:opacity-75" : "cursor-default"
                  }`}
                >
                  <span className="text-sm font-bold text-slate-900">
                    {stat.count}
                  </span>
                  <span className="text-[11px] font-medium lowercase text-slate-500">
                    {stat.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Bio */}
            <p className="text-slate-600 text-xs leading-relaxed font-normal mb-3 line-clamp-2">
              {user?.bio || "Minimalist Creator | Tech Enthusiast 🚀"}
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-2">
              {[
                { key: "github", val: user?.githubUrl || user?.github, Icon: Github, label: "GitHub" },
                { key: "linkedin", val: user?.linkedinUrl || user?.linkedin, Icon: Linkedin, label: "LinkedIn" },
                { key: "leetcode", val: user?.leetcodeUrl || user?.leetcode, Icon: Leetcode, label: "LeetCode" },
                { key: "portfolio", val: user?.portfolioUrl || user?.portfolio, Icon: Globe, label: "Portfolio" },
              ].map(({ key, val, Icon, label }) =>
                val ? (
                  <a
                    key={key}
                    href={val.startsWith("http") ? val : `https://${val}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-full bg-slate-50 border border-slate-100 text-slate-500 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition"
                    title={label}
                  >
                    <Icon size={14} />
                  </a>
                ) : null
              )}
            </div>

          </div>
        </div>
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
            <X size={22} />
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
      <EditProfileModal
        key={showEditModal ? "open" : "closed"}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        user={user}
        handleUpdate={handleUpdate}
        loading={loading}
      />

      <FollowersModal
        isOpen={showFollowers}
        onClose={() => setShowFollowers(false)}
        userId={user?.id || user?.userId || user?._id}
        onFollowStatusChange={(isNowFollowing) => {
          useAuthStore.setState((prev) => {
            const currentCount = prev.user?.followingCount ?? prev.user?.following?.length ?? 0;
            return {
              user: {
                ...prev.user,
                followingCount: isNowFollowing
                  ? currentCount + 1
                  : Math.max(0, currentCount - 1),
              },
            };
          });
        }}
      />

      <FollowingModal
        isOpen={showFollowing}
        onClose={() => setShowFollowing(false)}
        userId={user?.id || user?.userId || user?._id}
        onUnfollowSuccess={() => {
          useAuthStore.setState((prev) => {
            const currentCount = prev.user?.followingCount ?? prev.user?.following?.length ?? 0;
            return {
              user: {
                ...prev.user,
                followingCount: Math.max(0, currentCount - 1),
              },
            };
          });
        }}
      />

      <EmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        email={user?.email}
      />

      <ShareProfileModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        user={user}
      />
    </div>
  );
}

export default EditUserProfile;