import { toast } from "react-toastify";

// --- 🎯 BASE TOAST CONFIG ---
const toastConfig = {
  icon: false,
  closeButton: false,
  pauseOnHover: true,
  draggable: true,
};

// --- ❤️ LIKE TOAST ---
const showLikeToast = (isLiked = true) => {
  toast(
    <div className="flex items-center gap-3.5 px-4 py-3 font-sans">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg transition-transform duration-300 active:scale-125 ${
          isLiked
            ? "bg-gradient-to-tr from-rose-600 via-rose-500 to-pink-500 shadow-rose-500/30 ring-4 ring-rose-500/15"
            : "bg-slate-800 shadow-slate-900/20 ring-4 ring-slate-800/15"
        }`}
      >
        <svg className={`h-5 w-5 fill-current ${isLiked ? "animate-pulse" : ""}`} viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </div>
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-black uppercase tracking-wider text-slate-900">
            {isLiked ? "Drop Liked" : "Unliked"}
          </span>
          <span className="text-xs">{isLiked ? "❤️" : "💔"}</span>
        </div>
        <span className="text-[11px] font-semibold text-slate-500 truncate mt-0.5">
          {isLiked ? "Added to your liked drops" : "Removed from liked drops"}
        </span>
      </div>
    </div>,
    {
      ...toastConfig,
      className: `bg-white/95 backdrop-blur-xl border ${
        isLiked ? "border-rose-200/80" : "border-slate-200/80"
      } rounded-3xl shadow-2xl shadow-rose-900/10 p-0 min-h-[52px]`,
      autoClose: 1800,
    }
  );
};

// --- 💬 COMMENT ADDED TOAST ---
const showCommentToast = (msg = "Comment posted!") => {
  toast(
    <div className="flex items-center gap-3.5 px-4 py-3 font-sans">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-lg shadow-blue-500/30 ring-4 ring-blue-500/15">
        <svg className="h-5 w-5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.625m3.75 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12.375m3.75 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.75.75 0 01-1.018-.769 5.86 5.86 0 011.666-3.805C4.85 15.006 4.5 13.548 4.5 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
        </svg>
      </div>
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-black uppercase tracking-wider text-slate-900">Comment Added</span>
          <span className="text-xs">💬</span>
        </div>
        <span className="text-[11px] font-semibold text-slate-600 truncate mt-0.5">{msg}</span>
      </div>
    </div>,
    {
      ...toastConfig,
      className: "bg-white/95 backdrop-blur-xl border border-blue-200/80 rounded-3xl shadow-2xl shadow-blue-900/10 p-0 min-h-[52px]",
      autoClose: 2000,
    }
  );
};

// --- 🗑️ COMMENT DELETED TOAST ---
const showCommentDeletedToast = (msg = "Comment deleted.") => {
  toast(
    <div className="flex items-center gap-3.5 px-4 py-3 font-sans">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-600 via-red-500 to-pink-500 text-white shadow-lg shadow-rose-500/30 ring-4 ring-rose-500/15">
        <svg className="h-5 w-5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
      </div>
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-black uppercase tracking-wider text-slate-900">Comment Removed</span>
          <span className="text-xs">🗑️</span>
        </div>
        <span className="text-[11px] font-semibold text-slate-500 truncate mt-0.5">{msg}</span>
      </div>
    </div>,
    {
      ...toastConfig,
      className: "bg-white/95 backdrop-blur-xl border border-rose-200/80 rounded-3xl shadow-2xl shadow-rose-900/10 p-0 min-h-[52px]",
      autoClose: 2000,
    }
  );
};

// --- ✅ WELCOME / SUCCESS TOAST ---
const showSuccessToast = (msg) => {
  toast(
    <div className="flex items-center gap-3.5 px-4 py-3 font-sans">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-green-400 text-white shadow-lg shadow-emerald-500/30 ring-4 ring-emerald-500/15">
        <svg className="h-5 w-5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-black uppercase tracking-wider text-slate-900">Success</span>
          <span className="text-xs animate-bounce">✨</span>
        </div>
        <span className="text-[11px] font-semibold text-slate-600 mt-0.5 line-clamp-1">{msg}</span>
      </div>
    </div>,
    {
      ...toastConfig,
      className: "bg-white/95 backdrop-blur-xl border border-emerald-200/80 rounded-3xl shadow-2xl shadow-emerald-900/10 p-0 min-h-[56px]",
      autoClose: 2400,
    }
  );
};

// --- ❌ ACTION FAILED TOAST ---
const showErrorToast = (msg) => {
  toast(
    <div className="flex items-center gap-3.5 px-4 py-3 font-sans">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-600 via-red-500 to-orange-500 text-white shadow-lg shadow-red-500/30 ring-4 ring-red-500/15">
        <svg className="h-5 w-5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-black uppercase tracking-wider text-slate-900">Action Failed</span>
          <span className="text-xs">⚠️</span>
        </div>
        <span className="text-[11px] font-semibold text-rose-600 mt-0.5 line-clamp-1">{msg}</span>
      </div>
    </div>,
    {
      ...toastConfig,
      className: "bg-white/95 backdrop-blur-xl border border-rose-200/80 rounded-3xl shadow-2xl shadow-rose-900/10 p-0 min-h-[52px]",
      autoClose: 2800,
    }
  );
};

// --- 🚨 SIGNUP ERROR TOAST ---
const showErrorToastForSIgnup = (msg) => {
  toast(
    <div className="flex items-center gap-3.5 px-4 py-3 font-sans">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 text-white shadow-lg shadow-amber-500/30 ring-4 ring-amber-500/15">
        <svg className="h-5 w-5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-black uppercase tracking-wider text-slate-900">Attention Required</span>
          <span className="text-xs">⚡</span>
        </div>
        <span className="text-[11px] font-semibold text-amber-800 mt-0.5 line-clamp-1">{msg}</span>
      </div>
    </div>,
    {
      ...toastConfig,
      className: "bg-white/95 backdrop-blur-xl border border-amber-200/80 rounded-3xl shadow-2xl shadow-amber-900/10 p-0 min-h-[52px]",
      autoClose: 3000,
    }
  );
};

// --- 🎉 SIGNUP SUCCESS TOAST ---
const showSuccessToastForSignup = (msg) => {
  toast(
    <div className="flex items-center gap-3.5 px-4 py-3 font-sans">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 text-white shadow-lg shadow-blue-500/30 ring-4 ring-blue-500/15">
        <svg className="h-5 w-5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-black uppercase tracking-wider text-slate-900">Account Created</span>
          <span className="text-xs">🎉</span>
        </div>
        <span className="text-[11px] font-semibold text-slate-600 mt-0.5 line-clamp-1">{msg || "Welcome to HotDrop!"}</span>
      </div>
    </div>,
    {
      ...toastConfig,
      className: "bg-white/95 backdrop-blur-xl border border-blue-200/80 rounded-3xl shadow-2xl shadow-blue-900/10 p-0 min-h-[52px]",
      autoClose: 2800,
    }
  );
};

// --- 🚪 LOGOUT TOAST ---
const showSuccessToastForLogout = () => {
  toast(
    <div className="flex items-center gap-3.5 px-4 py-3 font-sans">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-700 text-white shadow-lg shadow-slate-900/30 ring-4 ring-slate-800/15">
        <svg className="h-5 w-5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12" />
        </svg>
      </div>
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-black uppercase tracking-wider text-slate-900">Logged Out</span>
          <span className="text-xs">✨</span>
        </div>
        <span className="text-[11px] font-semibold text-slate-500 mt-0.5">See you soon!</span>
      </div>
    </div>,
    {
      ...toastConfig,
      className: "bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-3xl shadow-2xl shadow-slate-900/10 p-0 min-h-[52px]",
      autoClose: 2200,
    }
  );
};

// --- 👤 PROFILE UPDATED TOAST ---
const showProfileUpdatedToast = (msg = "Profile updated.") => {
  toast(
    <div className="flex items-center gap-3.5 px-4 py-3 font-sans">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white shadow-lg shadow-indigo-500/30 ring-4 ring-indigo-500/15">
        <svg className="h-5 w-5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      </div>
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-black uppercase tracking-wider text-slate-900">Profile Sync</span>
          <span className="text-xs">✨</span>
        </div>
        <span className="text-[11px] font-semibold text-slate-600 mt-0.5 line-clamp-1">{msg}</span>
      </div>
    </div>,
    {
      ...toastConfig,
      className: "bg-white/95 backdrop-blur-xl border border-indigo-200/80 rounded-3xl shadow-2xl shadow-indigo-900/10 p-0 min-h-[52px]",
      autoClose: 2500,
    }
  );
};

// --- 🔥 DROP PROJECT SUCCESS TOAST ---
const showPostSuccessToast = (title) => {
  toast(
    <div className="flex items-center gap-3.5 px-4 py-3 font-sans">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-500 to-yellow-400 text-white shadow-lg shadow-orange-500/30 ring-4 ring-orange-500/15">
        <svg className="h-5 w-5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-black uppercase tracking-wider text-slate-900">Dropped</span>
          <span className="text-xs animate-pulse">🔥</span>
        </div>
        <span className="text-[11px] font-bold text-orange-600 mt-0.5 line-clamp-1">{title || "Build is live!"}</span>
      </div>
    </div>,
    {
      ...toastConfig,
      className: "bg-white/95 backdrop-blur-xl border border-orange-200/80 rounded-3xl shadow-2xl shadow-orange-900/10 p-0 min-h-[54px]",
      autoClose: 3200,
    }
  );
};

// --- ⚠️ DROP PROJECT ERROR TOAST ---
const showPostErrorToast = (errorMsg) => {
  toast(
    <div className="flex items-center gap-3.5 px-4 py-3 font-sans">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-red-600 via-rose-600 to-pink-500 text-white shadow-lg shadow-red-600/30 ring-4 ring-red-600/15">
        <svg className="h-5 w-5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008v.008H12v-.008zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-black uppercase tracking-wider text-slate-900">Drop Failed</span>
          <span className="text-xs">⚠️</span>
        </div>
        <span className="text-[11px] font-bold text-red-600 mt-0.5 line-clamp-1">{errorMsg || "Error occurred!"}</span>
      </div>
    </div>,
    {
      ...toastConfig,
      className: "bg-white/95 backdrop-blur-xl border border-red-200/80 rounded-3xl shadow-2xl shadow-red-900/10 p-0 min-h-[54px]",
      autoClose: 3500,
    }
  );
};

export {
  showLikeToast,
  showCommentToast,
  showCommentDeletedToast,
  showPostSuccessToast,
  showPostErrorToast,
  showProfileUpdatedToast,
  showSuccessToast,
  showErrorToast,
  showSuccessToastForSignup,
  showErrorToastForSIgnup,
  showSuccessToastForLogout,
};