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
    <div className="flex items-center gap-2.5 px-2.5 py-1.5 font-sans">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-sm">
        <svg className="h-3.5 w-3.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div className="flex flex-col min-w-0 leading-none">
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-800">Welcome back 👋</span>
        <span className="text-[10px] font-medium text-slate-500 truncate max-w-[180px] mt-0.5">{msg}</span>
      </div>
    </div>,
    {
      ...toastConfig,
      className: "bg-white/95 backdrop-blur-md border border-emerald-100 rounded-xl shadow-lg p-0 min-h-[44px]",
      autoClose: 2200,
    }
  );
};

// --- ❌ ACTION FAILED TOAST ---
const showErrorToast = (msg) => {
  toast(
    <div className="flex items-center gap-2.5 px-2.5 py-1.5 font-sans">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-500 text-white shadow-sm">
        <svg className="h-3.5 w-3.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <div className="flex flex-col min-w-0 leading-none">
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-800">Action Failed</span>
        <span className="text-[10px] font-semibold text-rose-500 truncate max-w-[180px] mt-0.5">{msg}</span>
      </div>
    </div>,
    {
      ...toastConfig,
      className: "bg-white/95 backdrop-blur-md border border-rose-100 rounded-xl shadow-lg p-0 min-h-[44px]",
      autoClose: 2500,
    }
  );
};

// --- 🚨 SIGNUP ERROR TOAST ---
const showErrorToastForSIgnup = (msg) => {
  toast(
    <div className="flex items-center gap-2.5 px-2.5 py-1.5 font-sans">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white shadow-sm">
        <svg className="h-3.5 w-3.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <div className="flex flex-col min-w-0 leading-none">
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-800">Alert</span>
        <span className="text-[10px] font-semibold text-amber-600 truncate max-w-[180px] mt-0.5">{msg}</span>
      </div>
    </div>,
    {
      ...toastConfig,
      className: "bg-white/95 backdrop-blur-md border border-amber-100 rounded-xl shadow-lg p-0 min-h-[44px]",
      autoClose: 2500,
    }
  );
};

// --- 🎉 SIGNUP SUCCESS TOAST ---
const showSuccessToastForSignup = (msg) => {
  toast(
    <div className="flex items-center gap-2.5 px-2.5 py-1.5 font-sans">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
        <svg className="h-3.5 w-3.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div className="flex flex-col min-w-0 leading-none">
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-800">Account Created 🎉</span>
        <span className="text-[10px] font-semibold text-slate-500 truncate max-w-[180px] mt-0.5">{msg || "Welcome to HotDrop!"}</span>
      </div>
    </div>,
    {
      ...toastConfig,
      className: "bg-white/95 backdrop-blur-md border border-blue-100 rounded-xl shadow-lg p-0 min-h-[44px]",
      autoClose: 2500,
    }
  );
};

// --- 🚪 LOGOUT TOAST ---
const showSuccessToastForLogout = () => {
  toast(
    <div className="flex items-center gap-2.5 px-2.5 py-1.5 font-sans">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
        <svg className="h-3.5 w-3.5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12" />
        </svg>
      </div>
      <div className="flex flex-col min-w-0 leading-none">
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-800">Logged Out</span>
        <span className="text-[10px] font-medium text-slate-500 mt-0.5">See you soon! ✨</span>
      </div>
    </div>,
    {
      ...toastConfig,
      className: "bg-white/95 backdrop-blur-md border border-slate-100 rounded-xl shadow-lg p-0 min-h-[44px]",
      autoClose: 2000,
    }
  );
};

// --- 👤 PROFILE UPDATED TOAST ---
const showProfileUpdatedToast = (msg = "Profile updated.") => {
  toast(
    <div className="flex items-center gap-2.5 px-2.5 py-1.5 font-sans">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
        <svg className="h-3.5 w-3.5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      </div>
      <div className="flex flex-col min-w-0 leading-none">
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-800">Profile Sync</span>
        <span className="text-[10px] font-medium text-slate-500 truncate max-w-[180px] mt-0.5">{msg}</span>
      </div>
    </div>,
    {
      ...toastConfig,
      className: "bg-white/95 backdrop-blur-md border border-indigo-100 rounded-xl shadow-lg p-0 min-h-[44px]",
      autoClose: 2200,
    }
  );
};

// --- 🔥 DROP PROJECT SUCCESS TOAST ---
const showPostSuccessToast = (title) => {
  toast(
    <div className="flex items-center gap-2.5 px-2.5 py-1.5 font-sans">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
        <svg className="h-3.5 w-3.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>
      <div className="flex flex-col min-w-0 leading-none">
        <div className="flex items-center gap-1">
          <span className="text-[11px] font-black uppercase tracking-wide text-slate-900">Dropped</span>
          <span className="text-[10px]">🔥</span>
        </div>
        <span className="text-[10px] font-bold text-blue-600 truncate max-w-[160px] mt-0.5">{title || "Build is live!"}</span>
      </div>
    </div>,
    {
      ...toastConfig,
      className: "bg-white/95 backdrop-blur-md border border-blue-100 rounded-xl shadow-lg p-0 min-h-[46px]",
      autoClose: 3000,
    }
  );
};

// --- ⚠️ DROP PROJECT ERROR TOAST ---
const showPostErrorToast = (errorMsg) => {
  toast(
    <div className="flex items-center gap-2.5 px-2.5 py-1.5 font-sans">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-600 text-white shadow-sm">
        <svg className="h-3.5 w-3.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008v.008H12v-.008zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div className="flex flex-col min-w-0 leading-none">
        <div className="flex items-center gap-1">
          <span className="text-[11px] font-black uppercase tracking-wide text-slate-900">Failed</span>
          <span className="text-[10px]">⚠️</span>
        </div>
        <span className="text-[10px] font-bold text-rose-500 truncate max-w-[160px] mt-0.5">{errorMsg || "Error occurred!"}</span>
      </div>
    </div>,
    {
      ...toastConfig,
      className: "bg-white/95 backdrop-blur-md border border-rose-100 rounded-xl shadow-lg p-0 min-h-[46px]",
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