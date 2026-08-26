import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Flame, 
  Sparkles, 
  Globe, 
  Zap, 
  ShieldCheck, 
  Heart,
  Code2,
  Terminal
} from "lucide-react";

const POPULAR_TAGS = [
  "React",
  "SpringBoot",
  "NextJS",
  "TailwindCSS",
  "PostgreSQL",
  "Docker",
  "AI",
  "Python",
  "Java21",
  "TypeScript",
  "Cloudinary",
  "NodeJS"
];

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isHome = location.pathname === "/";

  return (
    <aside className="space-y-4 select-none pb-4">
      <div className="rounded-3xl border border-slate-200/80 bg-white p-3.5 shadow-sm space-y-1">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2.5 mb-1.5">
          Navigation
        </h4>
        <nav className="space-y-1">
          <Link
            to="/"
            className={`flex items-center justify-between px-3 py-2.5 rounded-2xl font-bold text-xs transition-colors ${
              isHome
                ? "bg-blue-50 text-blue-600 font-black shadow-2xs"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Flame size={17} className={isHome ? "text-blue-600 fill-blue-600/20" : "text-orange-500"} />
              <span>Global Feed</span>
            </div>
            
          </Link>
        </nav>
      </div>

      <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-black uppercase text-orange-500">HOT</span>
            <span className="text-sm font-black uppercase text-blue-600">DROP</span>
          </div>
          <span className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <Sparkles size={11} /> Dev Launchpad
          </span>
        </div>

        <p className="text-xs text-slate-600 font-medium leading-relaxed">
          The open platform engineered for developers to drop live projects, receive genuine peer feedback, and showcase verified portfolios.
        </p>

        <div className="space-y-2 pt-1 border-t border-slate-100">
          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
              <Globe size={14} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-black text-slate-900">Live URL Verification</span>
              <span className="text-[10px] text-slate-500 leading-normal font-medium">
                Automatic uptime checks & interactive live previews.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
              <Zap size={14} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-black text-slate-900">Instant Realtime Sync</span>
              <span className="text-[10px] text-slate-500 leading-normal font-medium">
                Live STOMP socket notifications for likes & comments.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck size={14} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-black text-slate-900">Verified Dev Handles</span>
              <span className="text-[10px] text-slate-500 leading-normal font-medium">
                Claim your unique @handle to showcase all drops.
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <Code2 size={15} className="text-blue-600" />
            Discover Tech Stacks
          </h4>
          <span className="text-[9px] font-bold text-slate-400 uppercase font-mono">
            Tags
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {POPULAR_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => navigate(`/search?q=${encodeURIComponent(tag)}`)}
              className="px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-600 text-[11px] font-bold border border-slate-100 hover:border-blue-200 transition cursor-pointer"
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200/80 bg-slate-50/80 p-3.5 text-center space-y-2">
        <div className="flex items-center justify-center gap-1.5 text-slate-900 text-xs font-black uppercase tracking-tight">
          <Terminal size={13} className="text-blue-600" />
          <span>HotDrop Dev Ecosystem</span>
        </div>
        <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
          Open space for builders to share code, architecture, and live projects.
        </p>
        <div className="border-t border-slate-200/60 pt-2">
          <p className="text-[10px] font-bold text-slate-400 flex items-center justify-center gap-1">
            Built by Devs • For Devs <Heart size={11} className="text-rose-500 fill-rose-500" />
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
