import { toast } from "react-toastify";

// --- ✅ SLIM SUCCESS TOAST ---
const showSuccessToast = (msg) => {
  toast(
    <div className="flex items-center gap-3 py-1.5 px-1 font-sans">

      {/* Icon */}
      <div className="flex-shrink-0 bg-blue-600 p-2 rounded-lg">
        <svg
          className="w-4 h-4 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      {/* Text */}
      <div className="flex flex-col leading-tight">
        <h4 className="text-[13px] font-semibold text-slate-900">
          Welcome back 😊
        </h4>
        <p className="text-[11px] text-slate-500 font-medium">
          {msg}
        </p>
      </div>
    </div>,
    {
      icon: false,
      className:
        "bg-white border border-slate-100 rounded-xl shadow-lg p-0 min-h-[52px]",
      autoClose: 2200,
      closeButton: false,
    }
  );
};


// --- ❌ SLIM ERROR TOAST ---
const showErrorToast = (msg) => {
  toast(
    <div className="flex items-center gap-3 py-1.5 px-1 font-sans">

      <div className="flex-shrink-0 bg-red-500 p-2 rounded-lg">
        <svg
          className="w-4 h-4 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </div>

      <div className="flex flex-col leading-tight">
        <h4 className="text-[13px] font-semibold text-slate-900">
          Action Failed
        </h4>
        <p className="text-[11px] text-red-500 font-medium">
          {msg}
        </p>
      </div>
    </div>,
    {
      icon: false,
      className:
        "bg-white border border-red-50 rounded-xl shadow-lg p-0 min-h-[52px]",
      autoClose: 2500,
      closeButton: false,
    }
  );
};


const showErrorToastForSIgnup = (msg) => {
  toast(
    <div className="flex items-center gap-3 py-1.5 px-1 font-sans">

      <div className="flex-shrink-0 bg-red-500 p-2 rounded-lg">
        <svg
          className="w-4 h-4 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg> 
      </div>

      <div className="flex flex-col leading-tight">
        <h4 className="text-[13px] font-semibold text-slate-900">
          Action Failed
        </h4>
        <p className="text-[11px] text-red-500 font-medium">
          {msg}
        </p>
      </div>
    </div>,
    {
      icon: false,
      className:
        "bg-white border border-red-50 rounded-xl shadow-lg p-0 min-h-[52px]",
      autoClose: 2500,
      closeButton: false,
    }
  );
};

const showSuccessToastForSignup = (msg) => {
  toast(
    <div className="flex items-center gap-3 py-1.5 px-1 font-sans">

      {/* Icon */}
      <div className="flex-shrink-0 bg-blue-600 p-2 rounded-lg">
        <svg
          className="w-4 h-4 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      {/* Text */}
      <div className="flex flex-col leading-tight">
       
        <h4 className="text-[11px] text-black font-medium">
          {msg}
        </h4>
      </div>
    </div>,
    {
      icon: false,
      className:
        "bg-white border border-slate-100 rounded-xl shadow-lg p-0 min-h-[52px]",
      autoClose: 2200,
      closeButton: false,
    }
  );
};

const showSuccessToastForLogout= () => {
  toast(
    <div className="flex items-center gap-3 py-1.5 px-1 font-sans">

      {/* Icon */}
      <div className="flex-shrink-0 bg-blue-600 p-2 rounded-lg">
        <svg
          className="w-4 h-4 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      {/* Text */}
      <div className="flex flex-col leading-tight">
        
        <h4 className="text-[11px] text-black font-medium">
        Successfully Logout ✅
        </h4>
        
      </div>
    </div>,
    {
      icon: false,
      className:
        "bg-white border border-slate-100 rounded-xl shadow-lg p-0 min-h-[52px]",
      autoClose: 2200,
      closeButton: false,
    }
  );
};
const showProfileUpdatedToast = (msg = "Your profile has been updated successfully.") => {
  toast(
    <div className="flex items-center gap-3 py-1.5 px-1">

      {/* Icon */}
      <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg shadow-md">
        <svg
          className="w-4 h-4 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      {/* Text */}
      <div className="flex flex-col leading-tight">
        
        <h4 className="text-[11px] text-slate-500 font-medium">
          {msg}
        </h4>
      </div>
    </div>,
    {
      icon: false,
      className:
        "bg-white border border-slate-100 rounded-xl shadow-lg p-0 min-h-[52px]",
      autoClose: 2200,
      closeButton: false,
    }
  );
};
 const showPostSuccessToast = (title) => {
  toast(
    <div className="flex items-center gap-4 py-2 px-1 font-sans">
      {/* Animated Success Icon Container */}
      <div className="flex-shrink-0 relative">
        <div className="absolute inset-0 bg-blue-500 rounded-lg blur-md opacity-40 animate-pulse"></div>
        <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 p-2.5 rounded-lg shadow-inner">
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      </div>

      {/* Text Content */}
      <div className="flex flex-col gap-0.5 overflow-hidden">
        <h4 className="text-[13px] font-black text-slate-900 tracking-tight flex items-center gap-1.5 uppercase">
          Project Dropped! 🔥
        </h4>
        <p className="text-[11px] text-slate-500 font-bold truncate max-w-[180px]">
           {title || "Your masterpiece is live!"}
        </p>
      </div>

      {/* Decorative Sparkle (Optional) */}
      <div className="ml-auto text-lg">✨</div>
    </div>,
    {
      icon: false,
      className: "bg-white border border-blue-50 rounded-2xl shadow-[0_10px_40px_-10px_rgba(37,99,235,0.15)] p-0 min-h-[64px] overflow-hidden",
      autoClose: 3000,
      closeButton: false,
      pauseOnHover: false,
    }
  );
};
 const showPostErrorToast = (errorMsg) => {
  toast(
    <div className="flex items-center gap-4 py-2 px-1 font-sans">
      {/* Animated Error Icon Container */}
      <div className="flex-shrink-0 relative">
        {/* Soft Red Glow */}
        <div className="absolute inset-0 bg-red-500 rounded-lg blur-md opacity-30 animate-pulse"></div>
        <div className="relative bg-gradient-to-br from-red-500 to-rose-700 p-2.5 rounded-lg shadow-inner">
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
      </div>

      {/* Text Content */}
      <div className="flex flex-col gap-0.5 overflow-hidden">
        <h4 className="text-[13px] font-black text-slate-900 tracking-tight flex items-center gap-1.5 uppercase">
          Drop Failed! ⚠️
        </h4>
        <p className="text-[10px] text-red-500 font-bold truncate max-w-[180px]">
           {errorMsg || "Connection interrupted"}
        </p>
      </div>
    </div>,
    {
      icon: false,
      className: "bg-white border-l-4 border-l-red-500 border-y border-r border-slate-100 rounded-2xl shadow-[0_10px_40px_-10px_rgba(239,68,68,0.15)] p-0 min-h-[64px] overflow-hidden",
      autoClose: 4000,
      closeButton: false,
    }
  );
};export {
  showPostSuccessToast,   
  showPostErrorToast,      
  showProfileUpdatedToast, 
  showSuccessToast,       
  showErrorToast,          
  showSuccessToastForSignup,
  showErrorToastForSIgnup, 
  showSuccessToastForLogout
};