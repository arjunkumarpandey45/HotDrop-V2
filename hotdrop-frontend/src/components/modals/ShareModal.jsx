import  { useEffect, useState } from "react";
import { X, Copy, Check, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { FaWhatsapp, FaXTwitter, FaLinkedin } from "react-icons/fa6";

function ShareModal({ post, onClose }) {
  const pId = post?.shareUrl || post?.id || post?._id;
  const postUrl = `${window.location.origin}/posts/share/${pId}`;

  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const copyLink = async () => {
    await navigator.clipboard.writeText(postUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const esc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <button
        type="button"
        aria-label="Close share modal"
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-md border-0 p-0"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
            onClose();
          }
        }}
      />
      <div className="relative z-10 bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-slate-100 p-6 animate-in zoom-in-95 duration-200">

        <div className="absolute top-4 left-5 text-[10px] font-black tracking-widest uppercase">
          <span className="text-orange-500">HOT</span>
          <span className="text-blue-600">DROP</span>
        </div>

        <div className="flex justify-between items-center mb-4 pt-3">
          <h2 className="font-extrabold text-slate-900 text-base tracking-tight">
            Share project
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="h-[2px] w-full bg-gradient-to-r from-orange-500 via-blue-500 to-emerald-400 mb-4 rounded-full" />

        <div className="border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-700 mb-4 truncate bg-slate-50 shadow-inner">
          {postUrl}
        </div>

        {!showQR ? (
          <div className="flex flex-col gap-2.5">

            <button
              type="button"
              onClick={copyLink}
              className="flex items-center justify-between border border-slate-200 rounded-xl px-4 py-2.5 hover:bg-slate-50 transition group"
            >
              <div className="flex items-center gap-3 text-xs font-bold text-slate-800">
                <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 group-hover:bg-blue-50 group-hover:text-blue-600 transition">
                  {copied ? (
                    <Check size={15} className="text-emerald-500" />
                  ) : (
                    <Copy size={15} />
                  )}
                </div>

                {copied ? "Copied to Clipboard!" : "Copy Share Link"}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setShowQR(true)}
              className="flex items-center gap-3 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 bg-white hover:bg-gradient-to-r hover:from-orange-50 hover:to-blue-50 hover:border-blue-200 transition shadow-sm"
            >
              <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                <QrCode size={15} />
              </div>
              <span>Scan QR Code</span>
            </button>

            <a
              href={`https://wa.me/?text=${encodeURIComponent(postUrl)}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 border border-slate-200 rounded-xl px-4 py-2.5 hover:bg-emerald-50 hover:border-emerald-200 transition"
            >
              <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <FaWhatsapp size={15} />
              </div>
              <span className="text-xs font-bold text-slate-800">Share on WhatsApp</span>
            </a>

            <a
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 border border-slate-200 rounded-xl px-4 py-2.5 hover:bg-sky-50 hover:border-sky-200 transition"
            >
              <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-sky-100 text-sky-600">
                <FaXTwitter size={15} />
              </div>
              <span className="text-xs font-bold text-slate-800">Share on X / Twitter</span>
            </a>

            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 border border-slate-200 rounded-xl px-4 py-2.5 hover:bg-blue-50 hover:border-blue-200 transition"
            >
              <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <FaLinkedin size={15} />
              </div>
              <span className="text-xs font-bold text-slate-800">Share on LinkedIn</span>
            </a>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="p-4 border border-slate-200 rounded-2xl bg-white shadow-sm">
              <QRCodeSVG value={postUrl} size={160} />
            </div>

            <span className="text-xs text-slate-500 font-medium">
              Scan QR code to open project
            </span>

            <button
              type="button"
              onClick={() => setShowQR(false)}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              ← Back to options
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ShareModal;
