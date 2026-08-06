import React from "react";
import { ExternalLink, ShieldCheck, Zap, Star, Code2, Heart } from "lucide-react";

const Sponser = () => {
  return (
    <aside className="sticky top-24 space-y-6 select-none">
      {/* FEATURED SPONSOR / PROJECT SHOWCASE */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 border border-slate-800 shadow-xl group">
        <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl group-hover:bg-blue-500/40 transition-all duration-700" />
        
        <div className="flex items-center gap-2 mb-3">
          <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider shadow-md">
            Featured Drop
          </span>
          <span className="text-[10px] text-slate-400 font-mono">#Sponsored</span>
        </div>

        <h3 className="text-sm font-black tracking-tight text-white mb-2 leading-snug">
          Build & Deploy Live Fullstack Apps in Seconds 🚀
        </h3>

        <p className="text-[11px] text-slate-300 font-medium leading-relaxed mb-4">
          HotDrop V2 features live interactive web app previews, real-time feedback & instant deployment share links.
        </p>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center">
              <Zap size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white">HotDrop Pro</span>
              <span className="text-[9px] text-slate-400">Developer Platform</span>
            </div>
          </div>
          <Star size={14} className="text-amber-400 fill-amber-400" />
        </div>

        <a
          href="https://github.com"
          target="_blank"
          rel="noreferrer"
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/30 cursor-pointer"
        >
          Explore Showcase <ExternalLink size={13} />
        </a>
      </div>

      {/* TOP CREATORS / TECH SHOWCASE */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <Code2 size={16} className="text-blue-600" /> Top Tech Stack
          </h4>
          <span className="text-[10px] font-bold text-blue-600 uppercase">2026 Edition</span>
        </div>

        <div className="space-y-3">
          {[
            { name: "React 19 & Next.js", label: "Frontend Standard", badge: "Hot 🔥" },
            { name: "Tailwind CSS v4", label: "Styling & UI", badge: "Fast ⚡" },
            { name: "Zustand & Axios", label: "State & API", badge: "Clean 💎" },
            { name: "Spring Boot / Node", label: "Backend API", badge: "Robust 🛡️" },
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 hover:bg-indigo-50/50 transition-colors"
            >
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-900 leading-tight">
                  {item.name}
                </span>
                <span className="text-[9px] font-medium text-slate-400">
                  {item.label}
                </span>
              </div>
              <span className="text-[9px] font-bold text-indigo-600 bg-indigo-100/70 px-2 py-0.5 rounded-lg">
                {item.badge}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <div className="px-3 text-center text-slate-400 text-[10px] font-medium leading-relaxed space-y-1">
        <p className="flex items-center justify-center gap-1">
          Made with <Heart size={11} className="text-red-500 fill-red-500" /> by HotDrop Team
        </p>
        <p>© 2026 HotDrop Inc. All rights reserved.</p>
      </div>
    </aside>
  );
};

export default Sponser;
