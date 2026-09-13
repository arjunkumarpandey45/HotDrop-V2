import { useEffect, useRef } from "react";
import { Bell, X, BellOff, Loader2 } from "lucide-react";
import { useNotificationStore } from "../../store/useNotificationStore";
import NotificationItem from "./NotificationItem";

const NotificationDropdown = ({ isOpen, onClose }) => {
  const dropdownRef = useRef(null);
  const {
    notifications,
    unreadCount,
    isLoading,
    markAllAsRead,
    fetchNotifications,
  } = useNotificationStore();

  useEffect(() => {
    if (isOpen) {
      fetchNotifications(0, 20);
    }
  }, [isOpen, fetchNotifications]);

  const handleCloseDropdown = () => {
    if (unreadCount > 0) {
      markAllAsRead();
    }
    if (onClose) onClose();
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        handleCloseDropdown();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, unreadCount]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-3 w-80 sm:w-96 rounded-3xl border border-slate-200/90 bg-white/98 p-3.5 shadow-2xl backdrop-blur-2xl z-[100] animate-in fade-in zoom-in-95 duration-150 origin-top-right select-none"
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Bell className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-tight text-slate-900 flex items-center gap-1.5">
              Notifications
              {unreadCount > 0 && (
                <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[9px] font-black text-white">
                  {unreadCount}
                </span>
              )}
            </h3>
          </div>
        </div>

        <button
          onClick={handleCloseDropdown}
          className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
          aria-label="Close notifications"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-2 max-h-[380px] overflow-y-auto space-y-1.5 pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {isLoading && notifications.length === 0 ? (
          <div className="py-8 text-center space-y-3">
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Loading alerts...
            </p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-10 text-center space-y-3 px-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 border border-slate-100">
              <BellOff className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase text-slate-800 tracking-tight">
                All caught up! ✨
              </h4>
              <p className="text-[11px] font-medium text-slate-400 mt-1 leading-relaxed">
                When developers like, comment on your project, or follow you, your alerts will show up here.
              </p>
            </div>
          </div>
        ) : (
          notifications.map((notif) => (
            <NotificationItem
              key={notif.id || `${notif.senderHotdropId}-${notif.createdAt}`}
              notification={notif}
              onClose={onClose}
            />
          ))
        )}
      </div>

      {notifications.length > 0 && (
        <div className="border-t border-slate-100 pt-2.5 mt-2 flex items-center justify-between px-2 text-[10px] font-bold text-slate-400">
         
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;