import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Flame, Search, Plus, TrendingUp, User } from "lucide-react";
import { useAuthStore, useUIStore } from "../../store/useAuthStore";
import SearchModal from "../modals/SearchModal";
import dp from "../../assets/dp.jpg";

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuthStore();
  const { openCreatePost } = useUIStore();

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const isActive = (path) => location.pathname === path;
  const isProfileActive =
    user && (location.pathname === `/user/userprofile/${user?.hotdropId}` || location.pathname === "/profile/me");

  const handleCreateClick = (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      navigate("/signup");
      return;
    }
    openCreatePost();
    if (location.pathname !== "/") {
      navigate("/");
    }
  };

  const handleProfileClick = (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    navigate(`/user/userprofile/${user?.hotdropId || user?.username}`);
  };

  const userAvatar =
    user?.profileImageUrl ||
    user?.profilePicture ||
    user?.avatar ||
    dp;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-2xl border-t border-slate-200/90 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] px-3 py-1.5 pb-safe">
        <div className="relative mx-auto flex max-w-md items-center justify-around">

          <Link
            to="/"
            className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-2xl transition-all ${
              isActive("/")
                ? "text-blue-600 font-black scale-105"
                : "text-slate-500 font-semibold hover:text-slate-900"
            }`}
          >
            <div className="relative">
              <Flame
                className={`h-5 w-5 transition-transform ${
                  isActive("/") ? "stroke-[2.5] text-blue-600" : "text-slate-400"
                }`}
              />
              {isActive("/") && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-blue-600" />
              )}
            </div>
            <span className="text-[10px] tracking-tight">Feed</span>
          </Link>

          <button
            onClick={() => setIsSearchModalOpen(true)}
            className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-2xl transition-all cursor-pointer ${
              isActive("/search") && !location.search.includes("trending")
                ? "text-blue-600 font-black scale-105"
                : "text-slate-500 font-semibold hover:text-slate-900"
            }`}
          >
            <div className="relative">
              <Search
                className={`h-5 w-5 transition-transform ${
                  isActive("/search") && !location.search.includes("trending") ? "stroke-[2.5] text-blue-600" : "text-slate-400"
                }`}
              />
              {isActive("/search") && !location.search.includes("trending") && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-blue-600" />
              )}
            </div>
            <span className="text-[10px] tracking-tight">Search</span>
          </button>

          <div className="relative -top-4 flex items-center justify-center">
            <button
              onClick={handleCreateClick}
              className="group relative flex h-13 w-13 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 via-blue-500 to-indigo-600 text-white shadow-xl shadow-blue-500/40 ring-4 ring-white active:scale-95 transition-all duration-200 cursor-pointer"
              aria-label="Drop Project"
            >
              <Plus className="h-6 w-6 stroke-[3] transition-transform group-hover:rotate-90 duration-300" />
              <span className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>

          <Link
            to="/search?q=trending"
            className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-2xl transition-all ${
              isActive("/search") && location.search.includes("trending")
                ? "text-blue-600 font-black scale-105"
                : "text-slate-500 font-semibold hover:text-slate-900"
            }`}
          >
            <div className="relative">
              <TrendingUp
                className={`h-5 w-5 transition-transform ${
                  isActive("/search") && location.search.includes("trending")
                    ? "stroke-[2.5] text-blue-600"
                    : "text-slate-400"
                }`}
              />
              {isActive("/search") && location.search.includes("trending") && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-blue-600" />
              )}
            </div>
            <span className="text-[10px] tracking-tight">Trending</span>
          </Link>

          <button
            onClick={handleProfileClick}
            className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-2xl transition-all cursor-pointer ${
              isProfileActive
                ? "text-blue-600 font-black scale-105"
                : "text-slate-500 font-semibold hover:text-slate-900"
            }`}
          >
            <div className="relative">
              {isLoggedIn ? (
                <div
                  className={`h-5 w-5 rounded-full overflow-hidden ring-2 transition-all ${
                    isProfileActive ? "ring-blue-600" : "ring-slate-200"
                  }`}
                >
                  <img
                    src={userAvatar}
                    alt="Profile"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = dp;
                    }}
                  />
                </div>
              ) : (
                <User
                  className={`h-5 w-5 transition-transform ${
                    isProfileActive ? "stroke-[2.5] text-blue-600" : "text-slate-400"
                  }`}
                />
              )}
              {isProfileActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-blue-600" />
              )}
            </div>
            <span className="text-[10px] tracking-tight">
              {isLoggedIn ? "Me" : "Login"}
            </span>
          </button>

        </div>
      </div>

      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />
    </>
  );
};

export default BottomNav;