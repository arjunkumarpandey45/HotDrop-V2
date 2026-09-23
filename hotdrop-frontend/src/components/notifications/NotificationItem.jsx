import { useNavigate } from "react-router-dom";
import { Heart, MessageCircle, UserPlus, Sparkles, ChevronRight, AlertCircle, CheckCircle2 } from "lucide-react";
import dp from "../../assets/dp.jpg";
import { useNotificationStore } from "../../store/useNotificationStore";

const formatTimeAgo = (dateString) => {
  if (!dateString) return "just now";
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);
    if (diffSec < 60) return "just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d`;
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
    createdAt,
  } = notification;

  const isRead = Boolean(notification.isRead ?? notification.read ?? notification.is_read);

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
    } else if (
      normalizedType === "LIKE" ||
      normalizedType === "COMMENT" ||
      normalizedType === "PROJECT_DEAD" ||
      normalizedType === "PROJECT_LIVE"
    ) {
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
          <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-white ring-2 ring-white shadow-2xs">
            <Heart className="h-2.5 w-2.5 fill-current" />
          </div>
        );
      case "COMMENT":
        return (
          <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-white ring-2 ring-white shadow-2xs">
            <MessageCircle className="h-2.5 w-2.5 fill-current" />
          </div>
        );
      case "FOLLOW":
        return (
          <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white shadow-2xs">
            <UserPlus className="h-2.5 w-2.5" />
          </div>
        );
      case "PROJECT_DEAD":
        return (
          <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-white ring-2 ring-white shadow-2xs">
            <AlertCircle className="h-2.5 w-2.5 stroke-[2.5]" />
          </div>
        );
      case "PROJECT_LIVE":
        return (
          <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white ring-2 ring-white shadow-2xs">
            <CheckCircle2 className="h-2.5 w-2.5 stroke-[2.5]" />
          </div>
        );
      default:
        return (
          <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-white ring-2 ring-white shadow-2xs">
            <Sparkles className="h-2.5 w-2.5" />
          </div>
        );
    }
  };

  const renderActivityText = () => {
    const normalizedType = (type || "").toUpperCase();
    const handle = senderHotdropId || "developer";
    const time = formatTimeAgo(createdAt);

    if (normalizedType === "PROJECT_DEAD" || normalizedType === "PROJECT_LIVE") {
      return (
        <p className="text-xs text-slate-800 leading-snug">
          <span className="font-black text-slate-900">System Alert:</span>{" "}
          <span className="font-normal text-slate-600">{message}</span>{" "}
          <span className="text-[11px] text-slate-400 font-medium">{time}</span>
        </p>
      );
    }

    if (message) {
      return (
        <p className="text-xs text-slate-800 leading-snug">
          <span className="font-black text-slate-900">@{handle}</span>{" "}
          <span className="font-normal text-slate-600">{message}</span>{" "}
          <span className="text-[11px] text-slate-400 font-medium">{time}</span>
        </p>
      );
    }

    if (normalizedType === "LIKE") {
      return (
        <p className="text-xs text-slate-800 leading-snug">
          <span className="font-black text-slate-900">@{handle}</span>{" "}
          <span className="font-normal text-slate-600">liked your project.</span>{" "}
          <span className="text-[11px] text-slate-400 font-medium">{time}</span>
        </p>
      );
    }

    if (normalizedType === "COMMENT") {
      return (
        <p className="text-xs text-slate-800 leading-snug">
          <span className="font-black text-slate-900">@{handle}</span>{" "}
          <span className="font-normal text-slate-600">commented on your project.</span>{" "}
          <span className="text-[11px] text-slate-400 font-medium">{time}</span>
        </p>
      );
    }

    if (normalizedType === "FOLLOW") {
      return (
        <p className="text-xs text-slate-800 leading-snug">
          <span className="font-black text-slate-900">@{handle}</span>{" "}
          <span className="font-normal text-slate-600">started following you.</span>{" "}
          <span className="text-[11px] text-slate-400 font-medium">{time}</span>
        </p>
      );
    }

    return (
      <p className="text-xs text-slate-800 leading-snug">
        <span className="font-black text-slate-900">@{handle}</span>{" "}
        <span className="font-normal text-slate-600">interacted with your profile.</span>{" "}
        <span className="text-[11px] text-slate-400 font-medium">{time}</span>
      </p>
    );
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`w-full text-left group relative flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5 transition-all duration-150 cursor-pointer ${
        !isRead
          ? "bg-blue-50/50 hover:bg-blue-50/80"
          : "bg-white hover:bg-slate-50"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="relative shrink-0">
          <img
            src={senderProfilePicture || dp}
            alt={senderHotdropId || "user"}
            className="h-10 w-10 rounded-full object-cover ring-1 ring-slate-200 group-hover:ring-blue-400 transition"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = dp;
            }}
          />
          {renderBadgeIcon()}
        </div>

        <div className="min-w-0 flex-1">
          {renderActivityText()}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {!isRead ? (
          <span className="h-2 w-2 rounded-full bg-blue-600" />
        ) : (
          <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-600 transition" />
        )}
      </div>
    </button>
  );
};

export default NotificationItem;