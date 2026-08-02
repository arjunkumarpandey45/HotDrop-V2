import { toast } from "react-toastify";

// --- 🎯 COMPACT BASE CONFIG ---
const toastConfig = {
  icon: false,
  closeButton: false,
  pauseOnHover: true,
  draggable: true,
};

// --- ❤️ LIKE TOAST ---
const showLikeToast = (isLiked = true) => {
  toast(
    <div className="flex items-center gap-3 px-3.5 py-2 font-sans">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white shadow-md ${isLiked ? "bg-rose-500 shadow-rose-500/20" : "bg-slate-700 shadow-slate-900/10"}`}>
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-black uppercase tracking-wider text-slate-900">
          {isLiked ? "Drop Liked ❤️" : "Unliked"}
        </span>
        <span className="text-[11px] font-medium text-slate-500">
          {isLiked ? "Added to your liked drops" : "Removed from liked drops"}
        </span>
      </div>
    </div>,
    {
      ...toastConfig,
      className: `bg-white border ${isLiked ? "border-rose-200" : "border-slate-200"} rounded-2xl shadow-xl shadow-slate-900/10 p-0 min-h-[48px]`,
      autoClose: 1800,
    }
  );
};

// --- 💬 COMMENT TOAST ---
const showCommentToast = (msg = "Comment posted!") => {
  toast(
    <div className="flex items-center gap-3 px-3.5 py-2 font-sans">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
        <svg className="h-4 w-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.625m3.75 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12.375m3.75 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.75.75 0 01-1.018-.769 5.86 5.86 0 011.666-3.805C4.85 15.006 4.5 13.548 4.5 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
        </svg>
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-black uppercase tracking-wider text-slate-900">Comment Added 💬</span>
        <span className="text-[11px] font-medium text-slate-600 truncate">{msg}</span>
      </div>
    </div>,
    {
      ...toastConfig,
      className: "bg-white border border-blue-200 rounded-2xl shadow-xl shadow-slate-900/10 p-0 min-h-[48px]",
      autoClose: 2000,
    }
  );
};

// --- ✅ WELCOME / SUCCESS TOAST ---
const showSuccessToast = (msg) => {
  toast(
    <div className="relative flex items-center justify-between gap-3 overflow-hidden px-4 py-3 font-sans">
      <div className="absolute -left-4 -top-4 h-16 w-16 rounded-full bg-emerald-100 blur-xl"></div>
      
      <div className="flex items-center gap-3 min-w-0 z-10">
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20 ring-2 ring-emerald-400/20">
          <svg className="h-4 w-4 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div className="flex flex-col min-w-0">
          <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            Welcome Back <span className="inline-block animate-bounce">👋</span>
          </span>
          <span className="text-[11px] font-medium text-slate-600 mt-0.5 break-words line-clamp-2 leading-tight">
            {msg}
          </span>
        </div>
      </div>
    </div>,
    {
      ...toastConfig,
      className: "bg-white border border-emerald-200 rounded-2xl shadow-xl shadow-slate-900/10 p-0 min-h-[56px]",
      autoClose: 2400,
    }
  );
};

// --- ❌ ACTION FAILED TOAST ---
const showErrorToast = (msg) => {
  toast(
    <div className="flex items-center gap-3 px-3.5 py-2.5 font-sans">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500 text-white shadow-md shadow-rose-500/20">
        <svg className="h-4 w-4 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-black uppercase tracking-wider text-slate-900">Action Failed</span>
        <span className="text-xs font-semibold text-rose-600 mt-0.5 break-words line-clamp-2">{msg}</span>
      </div>
    </div>,
    {
      ...toastConfig,
      className: "bg-white border border-rose-200 rounded-2xl shadow-xl shadow-slate-900/10 p-0 min-h-[52px]",
      autoClose: 2800,
    }
  );
};

// --- 🚨 SIGNUP ERROR TOAST ---
const showErrorToastForSIgnup = (msg) => {
  toast(
    <div className="flex items-center gap-3 px-3.5 py-2.5 font-sans">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
        <svg className="h-4 w-4 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-black uppercase tracking-wider text-slate-900">Attention Required</span>
        <span className="text-xs font-semibold text-amber-700 mt-0.5 break-words line-clamp-2">{msg}</span>
      </div>
    </div>,
    {
      ...toastConfig,
      className: "bg-white border border-amber-200 rounded-2xl shadow-xl shadow-slate-900/10 p-0 min-h-[52px]",
      autoClose: 3000,
    }
  );
};

// --- 🎉 SIGNUP SUCCESS TOAST ---
const showSuccessToastForSignup = (msg) => {
  toast(
    <div className="flex items-center gap-3 px-3.5 py-2.5 font-sans">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
        <svg className="h-4 w-4 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-black uppercase tracking-wider text-slate-900">Account Created 🎉</span>
        <span className="text-xs font-semibold text-slate-600 mt-0.5 break-words line-clamp-2">{msg || "Welcome to HotDrop!"}</span>
      </div>
    </div>,
    {
      ...toastConfig,
      className: "bg-white border border-blue-200 rounded-2xl shadow-xl shadow-slate-900/10 p-0 min-h-[52px]",
      autoClose: 2800,
    }
  );
};

// --- 🚪 LOGOUT TOAST ---
const showSuccessToastForLogout = () => {
  toast(
    <div className="flex items-center gap-3 px-3.5 py-2.5 font-sans">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-100 shadow-md shadow-slate-900/10">
        <svg className="h-4 w-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12" />
        </svg>
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-black uppercase tracking-wider text-slate-900">Logged Out</span>
        <span className="text-xs font-medium text-slate-500 mt-0.5">See you soon! ✨</span>
      </div>
    </div>,
    {
      ...toastConfig,
      className: "bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-900/10 p-0 min-h-[52px]",
      autoClose: 2200,
    }
  );
};

// --- 👤 PROFILE UPDATED TOAST ---
const showProfileUpdatedToast = (msg = "Profile updated.") => {
  toast(
    <div className="flex items-center gap-3 px-3.5 py-2.5 font-sans">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
        <svg className="h-4 w-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-black uppercase tracking-wider text-slate-900">Profile Sync</span>
        <span className="text-xs font-medium text-slate-600 mt-0.5 break-words line-clamp-2">{msg}</span>
      </div>
    </div>,
    {
      ...toastConfig,
      className: "bg-white border border-indigo-200 rounded-2xl shadow-xl shadow-slate-900/10 p-0 min-h-[52px]",
      autoClose: 2500,
    }
  );
};

// --- 🔥 DROP PROJECT SUCCESS TOAST ---
const showPostSuccessToast = (title) => {
  toast(
    <div className="flex items-center gap-3 px-3.5 py-2.5 font-sans">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow-md shadow-orange-500/20">
        <svg className="h-4 w-4 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-xs font-black uppercase tracking-wider text-slate-900">Dropped</span>
          <span className="text-xs">🔥</span>
        </div>
        <span className="text-xs font-bold text-orange-600 mt-0.5 break-words line-clamp-2">{title || "Build is live!"}</span>
      </div>
    </div>,
    {
      ...toastConfig,
      className: "bg-white border border-orange-200 rounded-2xl shadow-xl shadow-slate-900/10 p-0 min-h-[54px]",
      autoClose: 3200,
    }
  );
};

// --- ⚠️ DROP PROJECT ERROR TOAST ---
const showPostErrorToast = (errorMsg) => {
  toast(
    <div className="flex items-center gap-3 px-3.5 py-2.5 font-sans">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-md shadow-red-600/20">
        <svg className="h-4 w-4 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008v.008H12v-.008zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-xs font-black uppercase tracking-wider text-slate-900">Drop Failed</span>
          <span className="text-xs">⚠️</span>
        </div>
        <span className="text-xs font-bold text-red-600 mt-0.5 break-words line-clamp-2">{errorMsg || "Error occurred!"}</span>
      </div>
    </div>,
    {
      ...toastConfig,
      className: "bg-white border border-red-200 rounded-2xl shadow-xl shadow-slate-900/10 p-0 min-h-[54px]",
      autoClose: 3500,
    }
  );
};

export {
  showLikeToast,
  showCommentToast,
  showPostSuccessToast,
  showPostErrorToast,
  showProfileUpdatedToast,
  showSuccessToast,
  showErrorToast,
  showSuccessToastForSignup,
  showErrorToastForSIgnup,
  showSuccessToastForLogout,
};