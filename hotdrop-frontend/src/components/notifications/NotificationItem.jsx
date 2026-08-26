import { useNavigate } from "react-router-dom";
import { Heart, MessageCircle, UserPlus, Sparkles } from "lucide-react";
import dp from "../../assets/dp.jpg";
import { useNotificationStore } from "../../store/useNotificationStore";

const formatTimeAgo = (dateString) => {
  if (!dateString) return "just now";
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);
    if (diffSec < 60) return "just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "just now";
  }
};

const NotificationItem = ({ notification, onClose }) => {
  const navigate = useNavigate();
  const markAsRead = useNotificationStore((state) => state.markAsRead);

  const {
    id,
    senderHotdropId,
    senderProfilePicture,
    message,
    type,
    referenceId,
    shareUrl,
    isRead,
    createdAt,
  } = notification;

  const handleClick = (e) => {
    e.stopPropagation();
    if (!isRead) {
      markAsRead(id);
    }

    if (onClose) onClose();

    const normalizedType = (type || "").toUpperCase();
    if (normalizedType === "FOLLOW") {
      if (senderHotdropId) {
        navigate(`/user/userprofile/${senderHotdropId}`);
      }
    } else if (normalizedType === "LIKE" || normalizedType === "COMMENT") {
      const targetSlug = shareUrl || referenceId;
      if (targetSlug) {
        navigate(`/posts/share/${targetSlug}`);
      } else if (senderHotdropId) {
        navigate(`/user/userprofile/${senderHotdropId}`);
      }
    } else if (senderHotdropId) {
      navigate(`/user/userprofile/${senderHotdropId}`);
    }
  };

  const renderBadgeIcon = () => {
    const normalizedType = (type || "").toUpperCase();
    switch (normalizedType) {
      case "LIKE":
        return (
          <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 text-white shadow-sm ring-2 ring-white">
            <Heart className="h-2.5 w-2.5 fill-current" />
          </div>
        );
      case "COMMENT":
        return (
          <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-sm ring-2 ring-white">
            <MessageCircle className="h-2.5 w-2.5" />
          </div>
        );
      case "FOLLOW":
        return (
          <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-sm ring-2 ring-white">
            <UserPlus className="h-2.5 w-2.5" />
          </div>
        );
      default:
        return (
          <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-white shadow-sm ring-2 ring-white">
            <Sparkles className="h-2.5 w-2.5" />
          </div>
        );
    }
  };

  const renderMessage = () => {
    const normalizedType = (type || "").toUpperCase();
    if (message) {
      return (
        <p className="text-xs text-slate-700 font-medium leading-snug line-clamp-2">
          {message}
        </p>
      );
    }

    if (normalizedType === "LIKE") {
      return (
        <p className="text-xs text-slate-700 font-medium leading-snug">
          <span className="font-bold text-slate-900">@{senderHotdropId}</span> liked your project drop 🔥
        </p>
      );
    }
    if (normalizedType === "COMMENT") {
      return (
        <p className="text-xs text-slate-700 font-medium leading-snug">
          <span className="font-bold text-slate-900">@{senderHotdropId}</span> left a comment on your drop
        </p>
      );
    }
    if (normalizedType === "FOLLOW") {
      return (
        <p className="text-xs text-slate-700 font-medium leading-snug">
          <span className="font-bold text-slate-900">@{senderHotdropId}</span> started following you ✨
        </p>
      );
    }

    return (
      <p className="text-xs text-slate-700 font-medium leading-snug">
        New activity from <span className="font-bold text-slate-900">@{senderHotdropId}</span>
      </p>
    );
  };

  return (
    <div
      onClick={handleClick}
      className={`group relative flex items-start gap-3 rounded-2xl p-3 transition-all duration-200 cursor-pointer ${
        !isRead
          ? "bg-blue-50/60 hover:bg-blue-100/60 border border-blue-100/80 shadow-2xs"
          : "bg-white hover:bg-slate-50 border border-transparent"
      }`}
    >
      <div className="relative shrink-0 mt-0.5">
        <img
          src={senderProfilePicture || dp}
          alt={senderHotdropId || "user"}
          className="h-10 w-10 rounded-full object-cover ring-2 ring-slate-100 group-hover:ring-blue-400 transition"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = dp;
          }}
        />
        {renderBadgeIcon()}
      </div>

      <div className="flex flex-1 flex-col min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <span className="text-[11px] font-black lowercase text-slate-900 truncate">
            @{senderHotdropId || "dev"}
          </span>
          <span className="text-[10px] font-semibold text-slate-400 shrink-0">
            {formatTimeAgo(createdAt)}
          </span>
        </div>

        {renderMessage()}
      </div>

      {!isRead && (
        <div className="flex items-center self-center shrink-0">
          <span className="h-2 w-2 rounded-full bg-blue-600 ring-2 ring-blue-200 animate-pulse" />
        </div>
      )}
    </div>
  );
};

export default NotificationItem;