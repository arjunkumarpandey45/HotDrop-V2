import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Home, 
  Search, 
  Compass, 
  Clock 
} from "lucide-react";

function NotFoundPage() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  const quickTopics = ["React", "SpringBoot", "NextJS", "NodeJS", "TailwindCSS"];

  useEffect(() => {
    if (countdown <= 0) {
      navigate("/");
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, navigate]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex items-center justify-center p-4 relative overflow-hidden select-none font-sans">

      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-gradient-to-tr from-blue-200/40 via-indigo-100/30 to-blue-300/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-400/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-indigo-400/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md bg-blue-50/90 backdrop-blur-xl rounded-3xl border border-blue-200/90 shadow-[0_15px_40px_rgba(37,99,235,0.08)] p-5 sm:p-7 text-center space-y-4">

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-blue-200 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
          <span className="text-[11px] font-black uppercase tracking-widest text-slate-800 flex items-center gap-1">
            <span className="text-orange-500">HOT</span>
            <span className="text-blue-600">DROP</span>
          </span>
        </div>

        <div>
          <h1 className="text-5xl sm:text-7xl font-black tracking-tighter text-blue-600 leading-none drop-shadow-[0_4px_15px_rgba(37,99,235,0.15)]">
            404
          </h1>
        </div>

        <div className="space-y-1 max-w-xs mx-auto">
          <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight uppercase">
            Page Not Found
          </h2>
          <p className="text-xs text-slate-600 font-semibold leading-relaxed">
            The page or project you are looking for does not exist or was moved.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-blue-200/80 shadow-2xs text-[11px] font-black text-blue-600">
          <Clock size={13} className="animate-spin text-blue-600" />
          <span>Redirecting to Feed in <span className="text-orange-500 text-xs">{countdown}s</span>...</span>
        </div>

        <div className="pt-1 flex flex-col sm:flex-row items-center justify-center gap-2">
          <button
            onClick={() => navigate("/")}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <Home size={14} />
            <span>Go to Feed</span>
          </button>

          <button
            onClick={() => navigate("/search")}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white hover:bg-blue-100/60 text-slate-800 border border-blue-200/90 text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-95 cursor-pointer shadow-2xs"
          >
            <Search size={14} className="text-blue-600" />
            <span>Search Projects</span>
          </button>
        </div>

        <div className="pt-3 border-t border-blue-200/60 space-y-2">
          <div className="flex items-center justify-center gap-1 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
            <Compass size={12} className="text-blue-600" />
            <span>Explore Popular Topics</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {quickTopics.map((topic) => (
              <button
                key={topic}
                onClick={() => navigate(`/search?q=${encodeURIComponent(topic)}`)}
                className="px-2.5 py-0.5 rounded-lg bg-white hover:bg-blue-600 hover:text-white border border-blue-200/80 text-slate-700 text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
              >
                #{topic}
              </button>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}

export default NotFoundPage;
