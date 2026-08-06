import React from "react";
import { Link } from "react-router-dom";
import { useAuthStore, } from "../../store/useAuthStore";
import { 
  Sparkles, 
  Flame, 
  UserCheck, 
  Rocket,
  Globe,
  Zap,
  
  ShieldCheck
} from "lucide-react";

const Sidebar = () => {
  const { user, isLoggedIn } = useAuthStore();
 

  return (
    <aside className="space-y-4 select-none">
      
      

      {/* QUICK NAVIGATION */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-3.5 shadow-sm space-y-1">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-1">
          Navigation
        </h4>
        <nav className="space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-blue-50 text-blue-600 font-bold text-xs transition-colors"
          >
            <Flame size={18} /> Global Feed
          </Link>
          {isLoggedIn && user && (
            <Link
              to={`/user/userprofile/${user?.hotdropId}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-slate-50 text-slate-600 font-bold text-xs transition-colors"
            >
              <UserCheck size={18} /> My Profile
            </Link>
          )}
        </nav>
      </div>

      {/* HOTDROP PLATFORM BRANDING & MISSION SHOWCASE CARD */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-4.5 shadow-sm space-y-4">
        {/* BRAND BADGE */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <Rocket size={16} />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-tight text-slate-900 flex items-center gap-1">
                <span className="text-orange-500">HOT</span>
                <span className="text-blue-600">DROP</span>
              </h3>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                Dev Launchpad v2.0
              </span>
            </div>
          </div>
          <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        </div>

        {/* HERO MISSION STATEMENT */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 border border-slate-800 space-y-2 relative overflow-hidden">
          <div className="flex items-center gap-1.5 text-amber-400 text-[10px] font-black uppercase tracking-wider">
            <Sparkles size={12} /> Creator Ecosystem
          </div>
          <h4 className="text-xs font-extrabold text-white leading-snug">
            Where Developers Drop Live Projects, Get Instant Feedback & Connect. 🚀
          </h4>
          <p className="text-[11px] font-medium text-slate-300 leading-relaxed pt-0.5">
            HotDrop is the dedicated launchpad for engineers to showcase real-world fullstack apps, AI models & web products.
          </p>
        </div>

        {/* FEATURE HIGHLIGHTS LIST */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
              <Globe size={14} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-extrabold text-slate-800">Live Project Showcases</span>
              <span className="text-[10px] font-semibold text-slate-400 leading-normal">
                Share live URLs with automated link-status checks & screenshot previews.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
              <Zap size={14} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-extrabold text-slate-800">Instant Dev Feedback</span>
              <span className="text-[10px] font-semibold text-slate-400 leading-normal">
                Get real-time likes, comments, and tech stack discussions from fellow devs.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck size={14} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-extrabold text-slate-800">Verified Creator Profiles</span>
              <span className="text-[10px] font-semibold text-slate-400 leading-normal">
                Build your verified portfolio handle (@hotdropId) and showcase all your drops.
              </span>
            </div>
          </div>
        </div>

        {/* FOOTER MOTTO */}
        <div className="border-t border-slate-100 pt-3 text-center">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
            Built by Devs • For Devs ❤️
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
