import { useState } from "react";
import axios from "../api/Api";
import { Globe, Edit, Loader2, X, Share2, Code2, Mail } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { showErrorToast, showProfileUpdatedToast } from "../toast/Toast";
import EmailModal from "./EmailModal";
import EditProfileModal from "./EditProfileModal";
import FollowersModal from "./FollowersModal";
import FollowingModal from "./FollowingModal";
import ShareProfileModal from "./ShareProfileModal";
import dp from "../assets/dp.jpg";

// Custom SVG Icons
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

function EditUserProfile() {
  const user = useAuthStore((state) => state.user);
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

  if (!user) {
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
      const userId = user.id || user.userId || user._id;

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
          user?.profileImageUrl ||
          user?.profilePicture,
        updatedAt: Date.now(),
      };

      if (setUser) {
        setUser(updatedUserObj);
      }
      useAuthStore.setState({ user: updatedUserObj });

      showProfileUpdatedToast();
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

  const fullName = user.firstName
    ? `${user.firstName} ${user.lastName || ""}`.trim()
    : user.username || "HotDrop Creator";

  return (
    <div className="w-full flex justify-center bg-white p-2 sm:p-4">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm relative">
        
        {/* BRANDING */}
        <div className="absolute top-3.5 right-4 select-none">
          <span className="text-sm font-black tracking-tight flex items-center">
            <span className="text-orange-500">HOT</span>
            <span className="text-blue-600">DROP</span>
          </span>
        </div>

        {/* Top Header Row (Avatar + Stats) */}
        <div className="flex items-center justify-between gap-4 pr-16">
          <div
            className="shrink-0 cursor-pointer group"
            onClick={() => setShowFullImage(true)}
          >
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full border border-gray-200 overflow-hidden bg-gray-50">
              <img
                src={profileAvatar}
                alt="Profile Avatar"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
              />
            </div>
          </div>

          <div className="flex-1 flex justify-around items-center text-center">
            {[
              {
                label: "posts",
                count: user?.postCount ?? 0,
                action: null,
              },
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
                className={`flex flex-col items-center ${
                  stat.action
                    ? "cursor-pointer hover:opacity-75 transition"
                    : "cursor-default"
                }`}
              >
                <span className="text-sm sm:text-base font-bold text-gray-900 leading-none">
                  {stat.count}
                </span>
                <span className="text-[11px] text-gray-500 font-normal mt-0.5">
                  {stat.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* User Details */}
        <div className="mt-3 flex flex-col">
          <h1 className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">
            {fullName}
          </h1>
          
          <span className="text-[11px] text-gray-500 font-medium tracking-tight mt-0.5">
            @{user?.hotdropId || "hotdrop"}
          </span>

          <p className="text-xs text-gray-700 leading-snug font-normal whitespace-pre-line pt-1">
            {user?.bio || "Digital Creator & Developer 🚀"}
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="grid grid-cols-3 gap-1.5 mt-3">
          <button
            onClick={() => setShowEditModal(true)}
            className="py-1 px-2 bg-gray-100 hover:bg-gray-200 text-gray-900 text-xs font-semibold rounded-md transition active:scale-95 flex items-center justify-center gap-1"
          >
            <Edit size={12} />
            <span>Edit Profile</span>
          </button>

          <button
            onClick={() => setShowShareModal(true)}
            className="py-1 px-2 bg-gray-100 hover:bg-gray-200 text-gray-900 text-xs font-semibold rounded-md transition active:scale-95 flex items-center justify-center gap-1"
          >
            <Share2 size={12} />
            <span>Share</span>
          </button>

          <button
            onClick={() => setShowEmailModal(true)}
            className="py-1 px-2 bg-gray-100 hover:bg-gray-200 text-gray-900 text-xs font-semibold rounded-md transition active:scale-95 flex items-center justify-center gap-1"
          >
            <Mail size={12} />
            <span>Contact</span>
          </button>
        </div>

        {/* Developer Social Links */}
        <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-gray-100">
          {[
            {
              key: "github",
              val: user?.githubUrl || user?.github,
              Icon: Github,
              label: "GitHub",
            },
            {
              key: "linkedin",
              val: user?.linkedinUrl || user?.linkedin,
              Icon: Linkedin,
              label: "LinkedIn",
            },
            {
              key: "leetcode",
              val: user?.leetcodeUrl || user?.leetcode,
              Icon: Code2,
              label: "LeetCode",
            },
            {
              key: "portfolio",
              val: user?.portfolioUrl || user?.portfolio,
              Icon: Globe,
              label: "Portfolio",
            },
          ].map(({ key, val, Icon, label }) =>
            val ? (
              <a
                key={key}
                href={val.startsWith("http") ? val : `https://${val}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md text-[11px] font-medium transition active:scale-95"
              >
                <Icon size={12} />
                <span>{label}</span>
              </a>
            ) : null
          )}
        </div>

      </div>

      {/* Full Image Modal */}
      {showFullImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowFullImage(false)}
        >
          <button
            onClick={() => setShowFullImage(false)}
            className="absolute top-6 right-6 text-white p-2"
          >
            <X size={20} />
          </button>
          <img
            src={profileAvatar}
            className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl object-contain"
            alt="Profile Preview"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Embedded Modals with Dynamic Callbacks */}
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