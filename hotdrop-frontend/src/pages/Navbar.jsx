import { useEffect, useRef, useState } from "react";
import {
  Search,
  User,
  LogOut,
  Plus,
  Menu,
  X,
  Info,
  Mail,
  LayoutGrid,
  Notebook,
  UserPlus,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import API from "../api/Api";
import dp from "../assets/dp.jpg";
import { useAuthStore, useUIStore } from "../store/useAuthStore";
import { showSuccessToastForLogout } from "../toast/Toast";

const Navbar = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const desktopSearchRef = useRef(null);
  const mobileSearchRef = useRef(null);

  const { user, isLoggedIn, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
const { checkAuth } = useAuthStore();

  useEffect(() => {
    
    checkAuth(true);
  }, []);

  const userAvatar =
    user?.profileImageUrl ||
    user?.profilePicture ||
    user?.avatar ||
    dp;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!showSuggestions) return;

      const desktopEl = desktopSearchRef.current;
      const mobileEl = mobileSearchRef.current;

      if (desktopEl?.contains(e.target)) return;
      if (mobileEl?.contains(e.target)) return;

      setShowSuggestions(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSuggestions]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length < 1) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        const { data } = await API.get(`/user/search?q=${searchQuery}`);
        setSuggestions(Array.isArray(data) ? data : []);
        setShowSuggestions(true);
      } catch (err) {
        console.error("Search error", err);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 250);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSuggestionClick = (hotdropId) => {
    if (!isLoggedIn) {
      setIsLoginPromptOpen(true);
      setIsMobileSearchOpen(false);
      return;
    }

    navigate(`/user/userprofile/${hotdropId}`);
    setSearchQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    setIsMobileSearchOpen(false);
  };

  const handleSearch = (e) => {
    if (e.key === "Enter" && searchQuery.trim() !== "") {
      if (!isLoggedIn) {
        setIsLoginPromptOpen(true);
        setIsMobileSearchOpen(false);
        return;
      }

      navigate(`/user/userprofile/${searchQuery}`);
      setSearchQuery("");
      setSuggestions([]);
      setShowSuggestions(false);
      setIsMobileSearchOpen(false);
    }
  };

  const { openCreatePost } = useUIStore();

  const handleCreateClick = () => {
    if (!isLoggedIn) {
      navigate("/signup");
      return;
    }
    openCreatePost();
    navigate("/");
  };

  const handleLogout = async () => {
    try {
      logout();
      
      
      
     setTimeout(() => {
      showSuccessToastForLogout();
     }, 500);
     setIsProfileOpen(false);
     navigate("/login")
    } catch {
      console.error("Logout failed");
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className={`fixed left-0 right-0 top-0 z-50 px-3 sm:px-4 transition-all duration-300 ${scrolled ? "pt-2" : "pt-3 sm:pt-4"}`}>
      {(isProfileOpen || isSidebarOpen || isLoginPromptOpen || showSuggestions) && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => {
            setIsProfileOpen(false);
            setIsSidebarOpen(false);
            setIsLoginPromptOpen(false);
            setShowSuggestions(false);
          }}
        />
      )}

      {/* Dock Structure Container */}
      <div className="relative z-50 mx-auto flex max-w-7xl items-center justify-between gap-2 sm:gap-3">
        {/* MOBILE FULL-WIDTH SEARCH BAR */}
        {isMobileSearchOpen ? (
          <div className="flex w-full items-center gap-2 rounded-2xl border border-slate-200/90 bg-white/95 p-2 shadow-2xl backdrop-blur-2xl md:hidden animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsMobileSearchOpen(false)}
              className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 transition shrink-0"
              aria-label="Close search"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="relative flex-1" ref={mobileSearchRef}>
              <input
                autoFocus
                type="text"
                placeholder="Search HotDrop ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 pl-3 pr-4 text-sm font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition"
              />

              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-50 mt-2.5 overflow-hidden rounded-2xl border border-slate-100 bg-white p-1.5 shadow-2xl">
                  {suggestions.map((s) => (
                    <button
                      key={s._id || s.id}
                      onClick={() => handleSuggestionClick(s.hotdropId)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-blue-50/70"
                    >
                      <img
                        src={s.profileImageUrl || s.profilePicture || s.avatar || dp}
                        alt={s.hotdropId}
                        className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-200"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="truncate text-sm font-semibold text-slate-900">@{s.hotdropId}</span>
                        <span className="truncate text-[10px] uppercase text-slate-400 font-medium">{s.username}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* BLOCK 1: Left Brand Pill */}
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/90 p-1.5 px-3 shadow-lg shadow-slate-200/50 backdrop-blur-xl">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Open Navigation"
              >
                <Menu className="h-5 w-5" />
              </button>

              <Link to="/" className="flex items-center px-1 tracking-tighter transition active:scale-95">
                <span className="text-xl sm:text-2xl font-black uppercase text-orange-500">HOT</span>
                <span className="text-xl sm:text-2xl font-black uppercase text-blue-600">DROP</span>
              </Link>
            </div>

            {/* BLOCK 2: Center Search Dock (Desktop) */}
            <div className="hidden flex-1 max-w-lg md:flex justify-center" ref={desktopSearchRef}>
              <div className="relative w-full">
                <div className="relative flex items-center rounded-2xl border border-slate-200/80 bg-white/90 p-1.5 shadow-lg shadow-slate-200/50 backdrop-blur-xl transition-within:border-blue-500 transition-within:ring-4 transition-within:ring-blue-100">
                  <input
                    type="text"
                    placeholder="Search creators by HotDrop ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearch}
                    className="w-full bg-transparent px-3 py-1.5 text-sm font-medium text-slate-800 placeholder-slate-400 outline-none"
                  />
                </div>

                {/* Suggestions Floating Card */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-3 overflow-hidden rounded-2xl border border-slate-100 bg-white p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 mb-1">
                      Matching Profiles
                    </div>
                    <div className="space-y-1">
                      {suggestions.map((s) => (
                        <button
                          key={s._id || s.id}
                          onClick={() => handleSuggestionClick(s.hotdropId)}
                          className="group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-blue-50"
                        >
                          <img
                            src={s.profileImageUrl || s.profilePicture || s.avatar || dp}
                            alt={s.hotdropId}
                            className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-200"
                          />
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="truncate text-sm font-semibold text-slate-900 group-hover:text-blue-600">@{s.hotdropId}</span>
                            <span className="truncate text-[10px] uppercase font-medium text-slate-400">{s.username}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* BLOCK 3: Right Actions Dock */}
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/90 p-1.5 shadow-lg shadow-slate-200/50 backdrop-blur-xl">
              <button
                onClick={() => setIsMobileSearchOpen(true)}
                className="rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 md:hidden"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>

              <button
                onClick={handleCreateClick}
                className="group relative flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 px-3 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] sm:px-4 sm:py-2.5 sm:text-sm"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Drop Project</span>
              </button>

              {!isLoggedIn ? (
                <Link
                  to="/signup"
                  className="flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-slate-800 sm:text-sm"
                >
                  <UserPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">Join</span>
                </Link>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen((prev) => !prev)}
                    className="flex items-center gap-1 rounded-xl p-1 hover:bg-slate-100 transition"
                  >
                    {/* 🎯 Profile Picture Fix */}
                    <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-slate-100 border border-slate-200 shrink-0">
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
                    <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${isProfileOpen ? "rotate-180" : ""}`} />
                  </button>

                  {/* Profile Dropdown Card */}
                  {isProfileOpen && (
                    <div className="absolute right-0 z-50 mt-3 w-52 overflow-hidden rounded-2xl border border-slate-100 bg-white p-1.5 shadow-2xl">
                      <div className="mb-1 border-b border-slate-100 px-3 py-2 flex items-center gap-2.5">
                        <img
                          src={userAvatar}
                          alt="Avatar"
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        />
                        <div className="min-w-0 flex flex-col">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Signed in as</p>
                          <p className="truncate text-sm font-bold text-slate-900">@{user?.hotdropId || "dev"}</p>
                        </div>
                      </div>

                      <Link
                        to="/profile/me"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-blue-50 hover:text-blue-600"
                      >
                        <User className="h-4 w-4" /> Profile
                      </Link>

                      <div className="my-1 h-px bg-slate-100" />

                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-red-500 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Slide-out Navigation Drawer */}
      <aside className={`fixed left-0 top-0 z-[60] h-full w-72 bg-white shadow-2xl transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-full flex-col p-6">
          <div className="mb-8 flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center tracking-tighter">
              <span className="text-2xl font-black uppercase text-orange-500">HOT</span>
              <span className="text-2xl font-black uppercase text-blue-600">DROP</span>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-1.5">
            <Link
              to="/"
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition ${
                isActive("/") ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="h-5 w-5" /> Explore Feed
            </Link>

            <Link
              to="/about"
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition ${
                isActive("/about") ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Info className="h-5 w-5" /> About
            </Link>

            <Link
              to="/contact"
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition ${
                isActive("/contact") ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Mail className="h-5 w-5" /> Contact us
            </Link>

            <Link
              to="/notice"
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition ${
                isActive("/notice") ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Notebook className="h-5 w-5" /> Notice
            </Link>
          </nav>
        </div>
      </aside>

      {/* Login Prompt Dialog */}
      {isLoginPromptOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsLoginPromptOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Sparkles className="h-7 w-7" />
            </div>

            <h3 className="mb-1 text-xl font-bold text-slate-900">Sign in to search</h3>
            <p className="mb-6 text-xs text-slate-500 leading-relaxed">
              You need to be logged in to search for other HotDrop creators and view their profiles.
            </p>

            <div className="flex gap-2.5">
              <button
                onClick={() => setIsLoginPromptOpen(false)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsLoginPromptOpen(false);
                  navigate("/signup");
                }}
                className="flex-1 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700"
              >
                Join Now
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;