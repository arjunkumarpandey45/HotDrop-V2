import { useState } from "react";
import { Share2, Copy, Check, X } from "lucide-react";

function ShareProfileModal({ isOpen, onClose, user }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const profileUrl = `${window.location.origin}/profile/${user?.hotdropId || user?.username || ""}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <button
        type="button"
        aria-label="Close share profile modal"
        className="fixed inset-0 bg-black/50 backdrop-blur-sm border-0 p-0"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
            onClose();
          }
        }}
      />
      <div className="relative z-10 bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-slate-100 animate-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center">
            <Share2 size={24} />
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-800">Share Profile</h3>
            <p className="text-xs text-slate-500 mt-1">Copy profile link to share with others</p>
          </div>

          <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600 truncate mr-2">
              {profileUrl}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-800 transition"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-green-400" /> Copied
                </>
              ) : (
                <>
                  <Copy size={14} /> Copy
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShareProfileModal;
