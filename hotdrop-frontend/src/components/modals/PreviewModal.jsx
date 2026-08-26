import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  X,
  Loader2,
  AlertCircle,
  ArrowUpRight,
  Zap,
} from "lucide-react";

const PreviewModal = ({ url, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [showFailSafe, setShowFailSafe] = useState(false);
  const isLoadedRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isLoadedRef.current) {
        setLoading(false);
        setShowFailSafe(true);
      }
    }, 6000);
    return () => clearTimeout(timer);
  }, [url]);

  const handleIframeLoad = () => {
    isLoadedRef.current = true;
    setLoading(false);
    setShowFailSafe(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 sm:p-4 lg:p-6">

        <motion.div
          initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
          animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
          exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
          className="absolute inset-0 bg-slate-950/85"
          onClick={onClose}
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full h-full max-w-[95%] bg-white shadow-2xl overflow-hidden flex flex-col sm:rounded-[2rem] border border-white/20 mx-auto"
        >

          <div className="flex items-center justify-between px-4 sm:px-6 py-2 border-b border-slate-100 bg-white/90 backdrop-blur-md z-[60]">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg">
                  <Globe
                    size={18}
                    className="animate-[spin_4s_linear_infinite]"
                  />
                </div>
              </div>
              <div className="flex flex-col truncate max-w-[100px] sm:max-w-md">
              <div className="flex items-center tracking-tighter">
  <span className="font-black text-xl text-orange-500 uppercase">
    Hot
  </span>
  <span className="font-black text-xl text-blue-600 uppercase">
    Drop
  </span>
</div>
                {" "}
                <span className="text-[10px] font-medium text-slate-400 truncate font-mono">
                  {url?.replace("https://", "")}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">

            <a
  href={url}
  target="_blank"
  rel="noreferrer"
  onClick={onClose}
  className="group relative flex items-center gap-1.5 px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-600 text-white rounded-xl text-[9px] sm:text-[10px] font-bold uppercase tracking-widest overflow-hidden transition-all duration-500 shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.6)] active:scale-95"
>

  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] transition-transform" />

  <span className="relative z-10 flex items-center gap-1.5 drop-shadow-sm">
    Visit Site
    <ArrowUpRight 
      size={15} 
      className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" 
    />
  </span>

  <div className="absolute inset-0 rounded-xl border border-white/20 group-hover:border-white/40 transition-colors" />
</a>
              <button
                onClick={onClose}
                className="p-2 hover:bg-red-50 text-slate-400  cursor-pointer hover:text-red-500 rounded-lg transition-all"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 bg-slate-100 relative flex justify-center items-center overflow-hidden p-1 sm:p-2">
            {showFailSafe && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="z-[100] absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-xl p-4"
              >
                <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 max-w-sm text-center">
                  <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                    <AlertCircle size={28} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2 uppercase tracking-tight">
                    Preview Restricted
                  </h3>
                  <p className="text-[11px] text-slate-500 mb-8 font-normal leading-relaxed">
                    This site prevents in-app preview. Use the Launch button to
                    view it.
                  </p>
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={onClose}
                    className="w-full py-4 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl flex items-center justify-center gap-2"
                  >
                    Open Website <Zap size={14} />
                  </a>
                </div>
              </motion.div>
            )}

            {loading && (
              <div className="absolute inset-0 z-[80] flex flex-col items-center justify-center bg-white">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-3" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Loading HotDrop...
                </p>
              </div>
            )}

            <div className="w-full h-full bg-white rounded-xl overflow-hidden shadow-inner relative">
              <iframe
                src={url}
                onLoad={handleIframeLoad}
                className={`w-full h-full border-none transition-all duration-700 ${
                  loading || showFailSafe
                    ? "opacity-0 scale-[0.98] blur-md"
                    : "opacity-100 scale-100 blur-0"
                }`}
                title="HotDrop Preview"
                sandbox="allow-scripts allow-same-origin allow-forms"
                style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
              />
            </div>
          </div>

          <div className="px-6 py-1 bg-white border-t border-slate-50 flex flex-col items-center justify-center gap-3">

            <p className="text-[10px] text-slate-600 font-medium text-center leading-relaxed">
              "Note : In case the preview is blank, or to experience the all functionality, use the{" "}
              <a
                href={url}
                target="_blank"
                className="text-blue-600 font-bold uppercase"
              >
                Visit Site
              </a>{" "}
              button."
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PreviewModal;
