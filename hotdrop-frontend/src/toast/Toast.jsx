import { toast } from "react-toastify";

// --- 🎯 COMPACT BASE CONFIG ---
const toastConfig = {
  icon: false,
  closeButton: false,
  pauseOnHover: true,
  draggable: true,
};

// --- ✅ WELCOME / SUCCESS TOAST ---
const showSuccessToast = (msg) => {
  toast(
    <div className="relative flex items-center justify-between gap-3 overflow-hidden px-4 py-3 font-sans">
      {/* Background Subtle Light Glow Effect */}
      <div className="absolute -left-4 -top-4 h-16 w-16 rounded-full bg-emerald-100 blur-xl"></div>
      
      <div className="flex items-center gap-3 min-w-0 z-10">
        {/* Icon with Ring Effect */}
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20 ring-2 ring-emerald-400/20">
          <svg className="h-4 w-4 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Text Content */}
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
  showPostSuccessToast,
  showPostErrorToast,
  showProfileUpdatedToast,
  showSuccessToast,
  showErrorToast,
  showSuccessToastForSignup,
  showErrorToastForSIgnup,
  showSuccessToastForLogout,
};