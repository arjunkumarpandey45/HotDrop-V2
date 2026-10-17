/* eslint-disable react-refresh/only-export-components */
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { motion } from "framer-motion";

const AutoScrollingText = ({ text, className = "" }) => {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [scrollDistance, setScrollDistance] = useState(0);

  useEffect(() => {
    const measure = () => {
      if (containerRef.current && textRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const textWidth = textRef.current.scrollWidth;
        if (textWidth > containerWidth + 4) {
          setScrollDistance(textWidth - containerWidth + 14);
        } else {
          setScrollDistance(0);
        }
      }
    };

    measure();

    let observer;
    if (containerRef.current) {
      observer = new ResizeObserver(() => {
        measure();
      });
      observer.observe(containerRef.current);
    }

    return () => {
      if (observer) observer.disconnect();
    };
  }, [text]);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden whitespace-nowrap min-w-0"
    >
      {scrollDistance > 0 ? (
        <motion.div
          animate={{ x: [0, -scrollDistance, 0] }}
          transition={{
            duration: Math.max(3.5, scrollDistance / 22),
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
            repeatDelay: 1.2,
          }}
          className="inline-block whitespace-nowrap"
        >
          <span ref={textRef} className={`inline-block ${className}`}>
            {text}
          </span>
        </motion.div>
      ) : (
        <span ref={textRef} className={`inline-block truncate ${className}`}>
          {text}
        </span>
      )}
    </div>
  );
};

const toastConfig = {
  icon: false,
  closeButton: false,
  pauseOnHover: true,
  draggable: true,
};

const getAutoCloseDuration = (msg = "", base = 3000) => {
  if (!msg) return base;
  return Math.max(base, Math.min(7000, msg.length * 85));
};

const showLikeToast = (isLiked = true) => {
  const msg = isLiked ? "Added to your liked drops" : "Removed from liked drops";
  toast(
    <div className="relative flex items-center gap-3.5 pl-5 pr-4 py-3.5 font-sans overflow-hidden min-w-0 w-full">
      <div
        className={`absolute left-0 top-0 bottom-0 w-1.5 ${
          isLiked
            ? "bg-gradient-to-b from-rose-500 via-pink-500 to-red-500"
            : "bg-slate-700"
        }`}
      />
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg transition-all duration-300 ${
          isLiked
            ? "bg-gradient-to-tr from-rose-600 via-rose-500 to-pink-500 shadow-rose-500/40 ring-4 ring-rose-500/15"
            : "bg-slate-800 shadow-slate-900/20 ring-4 ring-slate-800/15"
        }`}
      >
        <svg
          aria-hidden="true"
          className={`h-5 w-5 fill-current ${isLiked ? "animate-pulse" : ""}`}
          viewBox="0 0 24 24"
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </div>
      <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-900">
            {isLiked ? "Drop Liked" : "Unliked"}
          </span>
          <span className="text-xs">{isLiked ? "❤️" : "💔"}</span>
        </div>
        <AutoScrollingText
          text={msg}
          className="text-[11px] font-semibold text-slate-500 mt-0.5"
        />
      </div>
    </div>,
    {
      ...toastConfig,
      className: `bg-white/95 backdrop-blur-xl border ${
        isLiked
          ? "border-rose-200/90 shadow-rose-900/10"
          : "border-slate-200/90 shadow-slate-900/10"
      } rounded-3xl shadow-2xl p-0 min-h-[54px]`,
      autoClose: 2000,
    }
  );
};

const showCommentToast = (msg = "Comment posted!") => {
  toast(
    <div className="relative flex items-center gap-3.5 pl-5 pr-4 py-3.5 font-sans overflow-hidden min-w-0 w-full">
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-blue-500 via-indigo-500 to-cyan-500" />
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-lg shadow-blue-500/40 ring-4 ring-blue-500/15">
        <svg aria-hidden="true" className="h-5 w-5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.625m3.75 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12.375m3.75 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.75.75 0 01-1.018-.769 5.86 5.86 0 011.666-3.805C4.85 15.006 4.5 13.548 4.5 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
        </svg>
      </div>
      <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-900">Comment Added</span>
          <span className="text-xs">💬</span>
        </div>
        <AutoScrollingText
          text={msg}
          className="text-[11px] font-semibold text-slate-600 mt-0.5"
        />
      </div>
    </div>,
    {
      ...toastConfig,
      className: "bg-white/95 backdrop-blur-xl border border-blue-200/90 rounded-3xl shadow-2xl shadow-blue-900/10 p-0 min-h-[54px]",
      autoClose: getAutoCloseDuration(msg, 2400),
    }
  );
};

const showCommentDeletedToast = (msg = "Comment deleted.") => {
  toast(
    <div className="relative flex items-center gap-3.5 pl-5 pr-4 py-3.5 font-sans overflow-hidden min-w-0 w-full">
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-rose-500 via-red-500 to-orange-500" />
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-600 via-red-500 to-pink-500 text-white shadow-lg shadow-rose-500/40 ring-4 ring-rose-500/15">
        <svg aria-hidden="true" className="h-5 w-5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
      </div>
      <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-900">Comment Removed</span>
          <span className="text-xs">🗑️</span>
        </div>
        <AutoScrollingText
          text={msg}
          className="text-[11px] font-semibold text-slate-500 mt-0.5"
        />
      </div>
    </div>,
    {
      ...toastConfig,
      className: "bg-white/95 backdrop-blur-xl border border-rose-200/90 rounded-3xl shadow-2xl shadow-rose-900/10 p-0 min-h-[54px]",
      autoClose: getAutoCloseDuration(msg, 2400),
    }
  );
};

const showSuccessToast = (msg = "Success!") => {
  toast(
    <div className="relative flex items-center gap-3.5 pl-5 pr-4 py-3.5 font-sans overflow-hidden min-w-0 w-full">
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-emerald-400 via-teal-500 to-green-500" />
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-green-400 text-white shadow-lg shadow-emerald-500/40 ring-4 ring-emerald-500/20">
        <svg aria-hidden="true" className="h-5 w-5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>
      <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700">Success</span>
          <span className="text-xs animate-bounce">✨</span>
        </div>
        <AutoScrollingText
          text={msg}
          className="text-xs font-bold text-slate-800 mt-0.5"
        />
      </div>
    </div>,
    {
      ...toastConfig,
      className: "bg-white/95 backdrop-blur-xl border border-emerald-300/80 rounded-3xl shadow-[0_20px_50px_rgba(16,185,129,0.18)] p-0 min-h-[58px]",
      autoClose: getAutoCloseDuration(msg, 3200),
    }
  );
};

let lastRateLimitToastTime = 0;

const showRateLimitToast = (msg = "Rate limit exceeded. Please wait before trying again.") => {
  lastRateLimitToastTime = Date.now();
  const textToShow =
    typeof msg === "string" && msg.trim()
      ? msg.trim()
      : msg?.message || msg?.error || "Rate limit exceeded. Please wait before trying again.";

  toast(
    <div className="relative flex items-center gap-3.5 pl-5 pr-4 py-3.5 font-sans overflow-hidden min-w-0 w-full">
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-amber-500 via-orange-500 to-rose-500" />
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/40 ring-4 ring-orange-500/20">
        <svg aria-hidden="true" className="h-5 w-5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-black uppercase tracking-wider text-amber-700">Too Many Requests</span>
          <span className="text-xs">⏳</span>
        </div>
        <AutoScrollingText
          text={textToShow}
          className="text-xs font-bold text-amber-950 mt-0.5"
        />
      </div>
    </div>,
    {
      ...toastConfig,
      toastId: "rate-limit-toast",
      className: "bg-white/95 backdrop-blur-xl border border-amber-300/90 rounded-3xl shadow-[0_20px_50px_rgba(245,158,11,0.18)] p-0 min-h-[58px]",
      autoClose: getAutoCloseDuration(textToShow, 4000),
    }
  );
};

const showErrorToast = (msg = "Action failed") => {
  if (Date.now() - lastRateLimitToastTime < 2000) {
    return;
  }
  toast(
    <div className="relative flex items-center gap-3.5 pl-5 pr-4 py-3.5 font-sans overflow-hidden min-w-0 w-full">
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-rose-500 via-red-500 to-amber-500" />
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-600 via-red-500 to-orange-500 text-white shadow-lg shadow-red-500/40 ring-4 ring-red-500/20">
        <svg aria-hidden="true" className="h-5 w-5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-black uppercase tracking-wider text-rose-600">Action Failed</span>
          <span className="text-xs animate-pulse">⚠️</span>
        </div>
        <AutoScrollingText
          text={msg}
          className="text-xs font-bold text-rose-900 mt-0.5"
        />
      </div>
    </div>,
    {
      ...toastConfig,
      className: "bg-white/95 backdrop-blur-xl border border-rose-300/90 rounded-3xl shadow-[0_20px_50px_rgba(225,29,72,0.18)] p-0 min-h-[58px]",
      autoClose: getAutoCloseDuration(msg, 3500),
    }
  );
};

const showErrorToastForSIgnup = (msg = "Attention required") => {
  toast(
    <div className="relative flex items-center gap-3.5 pl-5 pr-4 py-3.5 font-sans overflow-hidden min-w-0 w-full">
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-amber-400 via-orange-500 to-yellow-500" />
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 text-white shadow-lg shadow-amber-500/40 ring-4 ring-amber-500/20">
        <svg aria-hidden="true" className="h-5 w-5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-black uppercase tracking-wider text-amber-700">Attention Required</span>
          <span className="text-xs">⚡</span>
        </div>
        <AutoScrollingText
          text={msg}
          className="text-xs font-bold text-amber-900 mt-0.5"
        />
      </div>
    </div>,
    {
      ...toastConfig,
      className: "bg-white/95 backdrop-blur-xl border border-amber-300/90 rounded-3xl shadow-[0_20px_50px_rgba(245,158,11,0.18)] p-0 min-h-[58px]",
      autoClose: getAutoCloseDuration(msg, 3500),
    }
  );
};

const showSuccessToastForSignup = (msg = "Welcome to HotDrop!") => {
  const textToShow = msg;
  toast(
    <div className="relative flex items-center gap-3.5 pl-5 pr-4 py-3.5 font-sans overflow-hidden min-w-0 w-full">
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-blue-500 via-indigo-500 to-cyan-500" />
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 text-white shadow-lg shadow-blue-500/40 ring-4 ring-blue-500/20">
        <svg aria-hidden="true" className="h-5 w-5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>
      <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-black uppercase tracking-wider text-blue-700">Account Created</span>
          <span className="text-xs">🎉</span>
        </div>
        <AutoScrollingText
          text={textToShow}
          className="text-xs font-bold text-slate-800 mt-0.5"
        />
      </div>
    </div>,
    {
      ...toastConfig,
      className: "bg-white/95 backdrop-blur-xl border border-blue-300/90 rounded-3xl shadow-[0_20px_50px_rgba(37,99,235,0.18)] p-0 min-h-[58px]",
      autoClose: getAutoCloseDuration(textToShow, 3200),
    }
  );
};

const showSuccessToastForLogout = () => {
  const msg = "See you soon!";
  toast(
    <div className="relative flex items-center gap-3.5 pl-5 pr-4 py-3.5 font-sans overflow-hidden min-w-0 w-full">
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900" />
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-700 text-white shadow-lg shadow-slate-900/40 ring-4 ring-slate-800/20">
        <svg aria-hidden="true" className="h-5 w-5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12" />
        </svg>
      </div>
      <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-900">Logged Out</span>
          <span className="text-xs">✨</span>
        </div>
        <AutoScrollingText
          text={msg}
          className="text-xs font-semibold text-slate-600 mt-0.5"
        />
      </div>
    </div>,
    {
      ...toastConfig,
      className: "bg-white/95 backdrop-blur-xl border border-slate-300/90 rounded-3xl shadow-[0_20px_50px_rgba(15,23,42,0.18)] p-0 min-h-[56px]",
      autoClose: 2200,
    }
  );
};

const showProfileUpdatedToast = (msg = "Profile updated.") => {
  toast(
    <div className="relative flex items-center gap-3.5 pl-5 pr-4 py-3.5 font-sans overflow-hidden min-w-0 w-full">
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500" />
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white shadow-lg shadow-indigo-500/40 ring-4 ring-indigo-500/20">
        <svg aria-hidden="true" className="h-5 w-5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      </div>
      <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-black uppercase tracking-wider text-indigo-700">Profile Sync</span>
          <span className="text-xs">✨</span>
        </div>
        <AutoScrollingText
          text={msg}
          className="text-xs font-bold text-slate-800 mt-0.5"
        />
      </div>
    </div>,
    {
      ...toastConfig,
      className: "bg-white/95 backdrop-blur-xl border border-indigo-300/90 rounded-3xl shadow-[0_20px_50px_rgba(99,102,241,0.18)] p-0 min-h-[58px]",
      autoClose: getAutoCloseDuration(msg, 2800),
    }
  );
};

const showPostSuccessToast = (title = "Build is live!") => {
  const msg = title;
  toast(
    <div className="relative flex items-center gap-3.5 pl-5 pr-4 py-3.5 font-sans overflow-hidden min-w-0 w-full">
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-orange-500 via-amber-500 to-yellow-400" />
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-500 to-yellow-400 text-white shadow-lg shadow-orange-500/40 ring-4 ring-orange-500/20">
        <svg aria-hidden="true" className="h-5 w-5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>
      <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-black uppercase tracking-wider text-orange-700">Dropped</span>
          <span className="text-xs animate-pulse">🔥</span>
        </div>
        <AutoScrollingText
          text={msg}
          className="text-xs font-bold text-orange-900 mt-0.5"
        />
      </div>
    </div>,
    {
      ...toastConfig,
      className: "bg-white/95 backdrop-blur-xl border border-orange-300/90 rounded-3xl shadow-[0_20px_50px_rgba(249,115,22,0.18)] p-0 min-h-[58px]",
      autoClose: getAutoCloseDuration(msg, 3200),
    }
  );
};

const showPostErrorToast = (errorMsg = "Error occurred!") => {
  if (Date.now() - lastRateLimitToastTime < 2000) {
    return;
  }
  const msg = errorMsg;
  toast(
    <div className="relative flex items-center gap-3.5 pl-5 pr-4 py-3.5 font-sans overflow-hidden min-w-0 w-full">
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-red-600 via-rose-600 to-pink-500" />
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-red-600 via-rose-600 to-pink-500 text-white shadow-lg shadow-red-600/40 ring-4 ring-red-600/20">
        <svg aria-hidden="true" className="h-5 w-5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008v.008H12v-.008zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-black uppercase tracking-wider text-red-700">Drop Failed</span>
          <span className="text-xs">⚠️</span>
        </div>
        <AutoScrollingText
          text={msg}
          className="text-xs font-bold text-red-900 mt-0.5"
        />
      </div>
    </div>,
    {
      ...toastConfig,
      className: "bg-white/95 backdrop-blur-xl border border-red-300/90 rounded-3xl shadow-[0_20px_50px_rgba(239,68,68,0.18)] p-0 min-h-[58px]",
      autoClose: getAutoCloseDuration(msg, 3500),
    }
  );
};

const showProjectDeletedToast = (title = "Project Drop") => {
  const msg = `"${title}" permanently deleted`;
  toast(
    <div className="relative flex items-center gap-3.5 pl-5 pr-4 py-3.5 font-sans overflow-hidden min-w-0 w-full">
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-red-600 via-rose-600 to-orange-500" />
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-red-600 via-rose-600 to-orange-500 text-white shadow-lg shadow-red-500/40 ring-4 ring-red-500/20">
        <svg aria-hidden="true" className="h-5 w-5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
      </div>
      <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-black uppercase tracking-wider text-red-700">Project Removed</span>
          <span className="text-xs">🗑️</span>
        </div>
        <AutoScrollingText
          text={msg}
          className="text-xs font-semibold text-slate-700 mt-0.5"
        />
      </div>
    </div>,
    {
      ...toastConfig,
      className: "bg-white/95 backdrop-blur-xl border border-red-300/90 rounded-3xl shadow-[0_20px_50px_rgba(239,68,68,0.18)] p-0 min-h-[58px]",
      autoClose: getAutoCloseDuration(msg, 3000),
    }
  );
};

const showDashboardRefreshedToast = (msg = "Updated") => {
  toast(
    <div className="relative flex items-center gap-3.5 pl-5 pr-4 py-3.5 font-sans overflow-hidden min-w-0 w-full">
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-blue-500 via-indigo-500 to-cyan-400" />
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-lg shadow-blue-500/40 ring-4 ring-blue-500/20">
        <svg aria-hidden="true" className="h-5 w-5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
      </div>
      <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-black uppercase tracking-wider text-blue-700">Upadated</span>
          <span className="text-xs">⚡</span>
        </div>
        <AutoScrollingText
          text={msg}
          className="text-xs font-bold text-slate-800 mt-0.5"
        />
      </div>
    </div>,
    {
      ...toastConfig,
      toastId: "dashboard-refreshed-toast",
      className: "bg-white/95 backdrop-blur-xl border border-blue-300/90 rounded-3xl shadow-[0_20px_50px_rgba(37,99,235,0.18)] p-0 min-h-[58px]",
      autoClose: getAutoCloseDuration(msg, 2800),
    }
  );
};

const showDeadLinkToast = (msg = "This project link is currently down or unreachable") => {
  const textToShow =
    typeof msg === "string" && msg.trim()
      ? msg.trim()
      : "This project link is currently down or unreachable";

  toast(
    <div className="relative flex items-center gap-3.5 pl-5 pr-4 py-3.5 font-sans overflow-hidden min-w-0 w-full">
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-rose-500 via-red-600 to-amber-500" />
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-600 via-red-500 to-amber-500 text-white shadow-lg shadow-rose-500/40 ring-4 ring-rose-500/20">
        <svg aria-hidden="true" className="h-5 w-5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-black uppercase tracking-wider text-rose-700">Link Inactive</span>
          <span className="text-xs">🚫</span>
        </div>
        <AutoScrollingText
          text={textToShow}
          className="text-xs font-bold text-rose-950 mt-0.5"
        />
      </div>
    </div>,
    {
      ...toastConfig,
      toastId: "dead-link-toast",
      className: "bg-white/95 backdrop-blur-xl border border-rose-300/90 rounded-3xl shadow-[0_20px_50px_rgba(244,63,94,0.18)] p-0 min-h-[58px]",
      autoClose: getAutoCloseDuration(textToShow, 3400),
    }
  );
};

export {
  showLikeToast,
  showCommentToast,
  showCommentDeletedToast,
  showProjectDeletedToast,
  showPostSuccessToast,
  showPostErrorToast,
  showProfileUpdatedToast,
  showSuccessToast,
  showErrorToast,
  showRateLimitToast,
  showSuccessToastForSignup,
  showErrorToastForSIgnup,
  showSuccessToastForLogout,
  showDashboardRefreshedToast,
  showDeadLinkToast,
};