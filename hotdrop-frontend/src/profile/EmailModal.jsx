import { useState } from "react";
import { Mail, Copy, Check, X } from "lucide-react";

function EmailModal({ isOpen, onClose, email }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (email) {
      navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-slate-100 animate-in zoom-in-95 duration-200 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
            <Mail size={24} />
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-800">Contact Email</h3>
            <p className="text-xs text-slate-500 mt-1">Get in touch directly via email</p>
          </div>

          <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700 truncate mr-2">
              {email || "No email provided"}
            </span>
            {email && (
              <button
                onClick={handleCopy}
                className="text-slate-500 hover:text-blue-600 p-1 rounded-md transition"
                title="Copy Email"
              >
                {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmailModal;