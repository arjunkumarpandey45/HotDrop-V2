import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore, useUIStore } from "../../store/useAuthStore";
import { 
  Sparkles, 
  PlusCircle, 
  Flame, 
  TrendingUp, 
  Compass, 
  Bookmark, 
  Layers, 
  UserCheck, 
  LogIn
} from "lucide-react";
import dp from "../../assets/dp.jpg";

const Sidebar = () => {
  const { user, isLoggedIn } = useAuthStore();
  const { openCreatePost } = useUIStore();
  const navigate = useNavigate();

  const userAvatar =
    user?.profilePicture || user?.profileImageUrl || user?.avatar || dp;

  const trendingTags = [
    "FullStack",
    "React",
    "NextJS",
    "TailwindCSS",
    "NodeJS",
    "AI & ML",
    "Java",
    "OpenSource",
  ];

  return (
    <aside className="sticky top-24 space-y-6 select-none">
      {/* USER CARD / GUEST CTA */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow">
        {isLoggedIn && user ? (
          <div className="flex flex-col items-center text-center">
            <div className="relative group cursor-pointer" onClick={() => navigate(`/user/userprofile/${user.hotdropId}`)}>
              <img
                src={userAvatar}
                alt={user.hotdropId || "User"}
                className="w-20 h-20 rounded-2xl object-cover ring-4 ring-indigo-50 group-hover:ring-indigo-200 transition-all shadow-md"
              />
              <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-lg text-[9px] font-bold uppercase tracking-wider ring-2 ring-white">
                Live
              </span>
            </div>

            <h3 
              onClick={() => navigate(`/user/userprofile/${user.hotdropId}`)}
              className="mt-3 text-base font-black text-slate-900 hover:text-blue-600 transition-colors cursor-pointer"
            >
              {user.username || user.name || user.hotdropId}
            </h3>
            <p className="text-xs font-bold text-slate-400 lowercase">
              @{user.hotdropId}
            </p>

            <div className="w-full grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 text-center">
              <div className="bg-slate-50 rounded-xl p-2">
                <span className="block text-sm font-black text-slate-800">
                  {user.postCount || user.posts?.length || 0}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                  Drops
                </span>
              </div>
              <div className="bg-slate-50 rounded-xl p-2">
                <span className="block text-sm font-black text-slate-800">
                  {user.followers?.length || 0}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                  Followers
                </span>
              </div>
            </div>

            <button
              onClick={openCreatePost}
              className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black uppercase tracking-wider py-3 rounded-2xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
            >
              <PlusCircle size={16} /> Drop New Project
            </button>
          </div>
        ) : (
          <div className="text-center py-2">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Sparkles size={24} />
            </div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
              Join HotDrop
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 mb-4 leading-relaxed">
              Showcase your projects, get feedback & discover trending drops from top devs.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => navigate("/login")}
                className="w-full bg-blue-600 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <LogIn size={14} /> Sign In
              </button>
              <button
                onClick={() => navigate("/signup")}
                className="w-full bg-slate-100 text-slate-700 text-xs font-bold py-2.5 rounded-xl hover:bg-slate-200 transition-all cursor-pointer"
              >
                Create Account
              </button>
            </div>
          </div>
        )}
      </div>

      {/* QUICK NAVIGATION */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-sm">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-2">
          Navigation
        </h4>
        <nav className="space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-blue-50 text-blue-600 font-bold text-xs transition-colors"
          >
            <Flame size={18} /> Global Feed
          </Link>
          {isLoggedIn && (
            <Link
              to={`/user/userprofile/${user?.hotdropId}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-slate-50 text-slate-600 font-bold text-xs transition-colors"
            >
              <UserCheck size={18} /> My Profile
            </Link>
          )}
        </nav>
      </div>

      {/* TRENDING TECH TAGS */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3 text-slate-900">
          <TrendingUp size={16} className="text-orange-500" />
          <h4 className="text-xs font-black uppercase tracking-wider">
            Trending Tech
          </h4>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {trendingTags.map((tag) => (
            <span
              key={tag}
              className="bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 text-[10px] font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
