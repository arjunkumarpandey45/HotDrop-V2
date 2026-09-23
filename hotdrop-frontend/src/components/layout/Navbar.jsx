import { useEffect, useRef, useState } from "react";
import {
  Search,
  User,
  LogOut,
  Plus,
  Menu,
  X,
  Notebook,
  UserPlus,
  ArrowRight,
  Globe,
  Bell,
  Settings,
  BarChart3,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import API from "../../api/Api";
import dp from "../../assets/dp.jpg";
import { useAuthStore, useUIStore } from "../../store/useAuthStore";
import { useNotificationStore } from "../../store/useNotificationStore";
import { showSuccessToastForLogout } from "../../toast/Toast";
import SearchModal from "../modals/SearchModal";
import NotificationDropdown from "../notifications/NotificationDropdown";

const Navbar = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isDesktopNotificationOpen, setIsDesktopNotificationOpen] = useState(false);
  const [isMobileNotificationOpen, setIsMobileNotificationOpen] = useState(false);
  const [isMobileSettingsOpen, setIsMobileSettingsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchMode, setSearchMode] = useState("users");

  const desktopSearchRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const desktopNotificationRef = useRef(null);

  const { user, isLoggedIn, logout, checkAuth } = useAuthStore();
  const { openCreatePost } = useUIStore();
  const {
    unreadCount,
    initSocket,
    disconnectSocket,
    markAllAsRead,
  } = useNotificationStore();

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkAuth(true);
  }, []);

  useEffect(() => {
    if (isLoggedIn && user) {
      initSocket(user);
    } else {
      disconnectSocket();
    }

    return () => {
      disconnectSocket();
    };
  }, [isLoggedIn, user?.hotdropId]);

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
    const q = searchQuery.trim().replace(/^@/, "");
    if (!q) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        if (searchMode === "projects") {
          const res = await API.get("/posts/feed", {
            params: { page: 0, size: 5, search: q, sortBy: "created_at", direction: "DESC" },
          });
          const payload = res.data?.data || res.data;
          const postList = payload?.posts || (Array.isArray(payload) ? payload : []);
          setSuggestions(postList.slice(0, 5));
          setShowSuggestions(true);
        } else {
          let userList = [];
          try {
            const res = await API.get(`/users/suggestions/${encodeURIComponent(q)}`);
            userList = res.data?.data || res.data;
          } catch {
            try {
              const res2 = await API.get(`/users/search/${encodeURIComponent(q)}`);
              userList = res2.data?.data || res2.data;
            } catch {
              userList = [];
            }
          }

          const arr = Array.isArray(userList)
            ? userList
            : userList?.hotdropId
            ? [userList]
            : [];

          setSuggestions(arr.slice(0, 5));
          setShowSuggestions(true);
        }
      } catch (err) {
        console.error("Search error", err);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 150);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchMode]);

  const handleSuggestionClick = (value, mode = searchMode) => {
    const clean = (value || "").replace(/^@/, "").trim();
    if (!clean) return;

    if (mode === "users") {
      navigate(`/user/userprofile/${clean}`);
    } else {
      navigate(`/search?q=${encodeURIComponent(clean)}`);
    }

    setSearchQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    setIsMobileSearchOpen(false);
  };

  const handleSearch = (e) => {
    if (e.key === "Enter" && searchQuery.trim() !== "") {
      const clean = searchQuery.trim().replace(/^@/, "");
      if (searchMode === "users") {
        navigate(`/user/userprofile/${clean}`);
      } else {
        navigate(`/search?q=${encodeURIComponent(clean)}`);
      }
      setSearchQuery("");
      setSuggestions([]);
      setShowSuggestions(false);
      setIsMobileSearchOpen(false);
    }
  };

  const handleCreateClick = () => {
    if (!isLoggedIn) {
      navigate("/signup");
      return;
    }
    openCreatePost();
    if (location.pathname !== "/") {
      navigate("/");
    }
  };

  const closeAllPopups = () => {
    if (isDesktopNotificationOpen || isMobileNotificationOpen) {
      if (unreadCount > 0) {
        markAllAsRead();
      }
    }
    setIsProfileOpen(false);
    setIsSidebarOpen(false);
    setIsLoginPromptOpen(false);
    setShowSuggestions(false);
    setIsDesktopNotificationOpen(false);
    setIsMobileNotificationOpen(false);
    setIsMobileSettingsOpen(false);
  };

  const handleNotificationButtonClick = (isMobile = false) => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    const isCurrentlyOpen = isDesktopNotificationOpen || isMobileNotificationOpen;
    if (isCurrentlyOpen) {
      if (unreadCount > 0) {
        markAllAsRead();
      }
      setIsDesktopNotificationOpen(false);
      setIsMobileNotificationOpen(false);
    } else {
      const isMobileView = typeof window !== "undefined" && window.innerWidth < 768;
      if (isMobile || isMobileView) {
        setIsMobileNotificationOpen(true);
        setIsDesktopNotificationOpen(false);
      } else {
        setIsDesktopNotificationOpen(true);
        setIsMobileNotificationOpen(false);
      }
    }
    setIsProfileOpen(false);
    setIsMobileSettingsOpen(false);
  };

  const handleLogout = async () => {
    try {
      logout();
      disconnectSocket();
      setTimeout(() => {
        showSuccessToastForLogout();
      }, 500);
      setIsProfileOpen(false);
      navigate("/login");
    } catch {
      console.error("Logout failed");
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const isActive = (path) => location.pathname === path;

  return (
    <header className={`fixed left-0 right-0 top-0 z-50 px-3 sm:px-4 transition-all duration-300 ${scrolled ? "pt-2" : "pt-3 sm:pt-4"}`}>
      {(isProfileOpen || isSidebarOpen || isLoginPromptOpen || showSuggestions || isMobileNotificationOpen || isDesktopNotificationOpen || isMobileSettingsOpen) && (
        <button
          type="button"
          tabIndex={0}
          aria-label="Close menu overlays"
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-md transition-all duration-300 animate-in fade-in cursor-pointer border-0 p-0"
          onClick={closeAllPopups}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
              closeAllPopups();
            }
          }}
        />
      )}

      <div className="relative z-50 mx-auto flex max-w-7xl items-center justify-between gap-2 sm:gap-3">
        {isMobileSearchOpen ? (
          <div className="flex w-full items-center gap-1.5 rounded-2xl border border-slate-200/90 bg-white/95 p-1.5 shadow-2xl backdrop-blur-2xl md:hidden animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsMobileSearchOpen(false)}
              className="rounded-xl p-1.5 text-slate-500 hover:bg-slate-100 transition shrink-0"
              aria-label="Close search"
            >
              <X className="h-5 w-5" />
            </button>

            <select
              value={searchMode}
              onChange={(e) => setSearchMode(e.target.value)}
              className="bg-slate-100 text-slate-800 font-black text-[10px] uppercase px-2 py-2 rounded-xl border border-slate-200/80 outline-none cursor-pointer shrink-0"
            >
              <option value="projects">Projects</option>
              <option value="users">Users</option>
            </select>

            <div className="relative flex-1 min-w-0" ref={mobileSearchRef}>
              <input
                type="text"
                placeholder={searchMode === "users" ? "Search users..." : "Search projects..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                onFocus={() => {
                  if (searchQuery.trim()) setShowSuggestions(true);
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-white transition"
              />

              {showSuggestions && (
                <div className="absolute left-0 right-0 top-full z-[100] mt-2.5 max-h-[300px] overflow-y-auto rounded-2xl border border-slate-100 bg-white p-1.5 shadow-2xl">
                  {suggestions.length > 0 ? (
                    searchMode === "projects" ? (
                      suggestions.map((p, index) => {
                        const pTitle = p.title || "Project ";
                        const pOwner = p.creator || p.user || {};
                        const pHandle = pOwner.hotdropId || pOwner.username || "dev";
                        const rawImages = p.imageUrls || p.images || [];
                        const firstImg = rawImages.length > 0
                          ? (typeof rawImages[0] === "string" ? rawImages[0] : rawImages[0]?.url)
                          : null;

                        return (
                          <button
                            key={p.id || p._id || index}
                            type="button"
                            onClick={() => handleSuggestionClick(pTitle, "projects")}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-blue-50/80 cursor-pointer"
                          >
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 overflow-hidden bg-slate-100 border border-slate-200 shadow-2xs">
                              {firstImg ? (
                                <img src={firstImg} alt={pTitle} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                  <Globe size={14} />
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="truncate text-xs font-black uppercase text-slate-900">{pTitle}</span>
                              <span className="truncate text-[10px] text-slate-400 font-semibold">by @{pHandle}</span>
                            </div>
                            <ArrowRight size={14} className="text-slate-400 shrink-0" />
                          </button>
                        );
                      })
                    ) : (
                      suggestions.map((s, index) => (
                        <button
                          key={s._id || s.id || index}
                          type="button"
                          onClick={() => handleSuggestionClick(s.hotdropId || s.username, "users")}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-blue-50/70 cursor-pointer"
                        >
                          <img
                            src={s.profilePicture || s.profileImageUrl || s.avatar || dp}
                            alt={s.hotdropId}
                            className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
                          />
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="truncate text-xs font-bold text-slate-900">@{s.hotdropId || s.username}</span>
                            <span className="truncate text-[10px] text-slate-400 font-medium">{[s.firstName, s.lastName].filter(Boolean).join(" ")}</span>
                          </div>
                          <ArrowRight size={14} className="text-slate-400 shrink-0" />
                        </button>
                      ))
                    )
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSuggestionClick(searchQuery, searchMode)}
                      className="flex w-full items-center justify-between px-3 py-2.5 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition cursor-pointer"
                    >
                      <span>{searchMode === "users" ? `Go to profile @${searchQuery.replace(/^@/, "")}` : `Searchs for "$ drop{searchQuery}"`}</span>
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/90 p-1.5 px-3 shadow-lg shadow-slate-200/50 backdrop-blur-xl">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                aria-label="Open Navigation"
              >
                <Menu className="h-5 w-5" />
              </button>

              <Link to="/" className="flex items-center px-1 tracking-tighter transition active:scale-95">
                <span className="text-xl sm:text-2xl font-black uppercase text-orange-500">HOT</span>
                <span className="text-xl sm:text-2xl font-black uppercase text-blue-600">DROP</span>
              </Link>
            </div>

            <div className="hidden flex-1 max-w-lg md:flex justify-center">
              <button 
                type="button"
                onClick={() => setIsSearchModalOpen(true)}
                className="w-full relative cursor-pointer group text-left bg-transparent border-0 p-0"
              >
                <div className="relative flex items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white/90 p-2 px-3.5 shadow-lg shadow-slate-200/50 backdrop-blur-xl transition-all group-hover:border-blue-400 group-hover:bg-white">
                  <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition shrink-0" />
                  <span className="flex-1 text-xs font-semibold text-slate-400 select-none group-hover:text-slate-600 transition">
                    Search Users by HotDrop ID or project ...
                  </span>
                  <span className="text-[10px] font-mono font-extrabold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200/80 hidden sm:inline-block shadow-2xs">
                    ⌘K / Search
                  </span>
                </div>
              </button>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 rounded-2xl border border-slate-200/80 bg-white/90 p-1.5 shadow-lg shadow-slate-200/50 backdrop-blur-xl">
              <button
                onClick={handleCreateClick}
                className="group relative hidden md:flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                <Plus className="h-4 w-4 stroke-[3]" />
                <span className="hidden lg:inline">Drop Project</span>
              </button>

              <div className="relative" ref={desktopNotificationRef}>
                <button
                  onClick={() => handleNotificationButtonClick(false)}
                  className={`relative rounded-xl p-2 transition cursor-pointer ${
                    isDesktopNotificationOpen || isMobileNotificationOpen
                      ? "bg-blue-50 text-blue-600"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white shadow-sm ring-2 ring-white animate-pulse">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                <NotificationDropdown
                  isOpen={isDesktopNotificationOpen}
                  onClose={() => setIsDesktopNotificationOpen(false)}
                />
              </div>

              {isMobileNotificationOpen && (
                <div className="fixed inset-x-3 top-16 z-50 md:hidden">
                  <NotificationDropdown
                    isOpen={isMobileNotificationOpen}
                    onClose={() => setIsMobileNotificationOpen(false)}
                  />
                </div>
              )}

              <div className="relative md:hidden">
                <button
                  onClick={() => {
                    setIsMobileSettingsOpen((prev) => !prev);
                    setIsMobileNotificationOpen(false);
                    setIsDesktopNotificationOpen(false);
                  }}
                  className={`rounded-xl p-2 transition cursor-pointer ${
                    isMobileSettingsOpen
                      ? "bg-blue-50 text-blue-600"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                  aria-label="Settings"
                >
                  <Settings className="h-5 w-5" />
                </button>

                {isMobileSettingsOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl border border-slate-100 bg-white p-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 z-50">
                    {isLoggedIn ? (
                      <>
                        <div className="px-3 py-2 border-b border-slate-100 mb-1">
                          <p className="text-xs font-black text-slate-900 lowercase truncate">
                            @{user?.hotdropId || user?.username}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium truncate">
                            {user?.email}
                          </p>
                        </div>

                        

                        <Link
                          to={`/user/userprofile/${user?.hotdropId || user?.username}`}
                          onClick={() => setIsMobileSettingsOpen(false)}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <User className="h-4 w-4 text-blue-600" /> My Profile
                        </Link>
<Link
                          to="/analytics"
                          onClick={() => setIsMobileSettingsOpen(false)}
                          className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors group"
                        >
                          <div className="flex items-center gap-2.5">
                            <BarChart3 className="h-4 w-4 text-indigo-600 group-hover:scale-110 transition-transform" />
                            <span>Analytics</span>
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200/80 px-1.5 py-0.5 rounded-md">
                            Live
                          </span>
                        </Link>
                        <button
                          onClick={() => {
                            setIsMobileSettingsOpen(false);
                            handleLogout();
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 cursor-pointer"
                        >
                          <LogOut className="h-4 w-4" /> Logout
                        </button>
                      </>
                    ) : (
                      <div className="space-y-1 p-1">
                        <Link
                          to="/login"
                          onClick={() => setIsMobileSettingsOpen(false)}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                        >
                          <User className="h-4 w-4 text-blue-600" /> Log In
                        </Link>
                        <Link
                          to="/signup"
                          onClick={() => setIsMobileSettingsOpen(false)}
                          className="flex w-full items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700"
                        >
                          <UserPlus className="h-4 w-4" /> Join
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="hidden md:block">
                {!isLoggedIn ? (
                  <Link
                    to="/signup"
                    className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span className="hidden sm:inline">Join</span>
                  </Link>
                ) : (
                  <div className="relative">
                    <button
                      onClick={() => {
                        setIsProfileOpen((prev) => !prev);
                        setIsDesktopNotificationOpen(false);
                        setIsMobileNotificationOpen(false);
                      }}
                      className="flex items-center gap-1 rounded-full p-0.5 hover:bg-slate-100 transition cursor-pointer"
                    >
                      <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-slate-100 border border-slate-200 shrink-0 ring-2 ring-slate-100 hover:ring-blue-400 transition">
                        <img
                          src={userAvatar}
                          alt="Profile"
                          className="h-full w-full object-cover rounded-full"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = dp;
                          }}
                        />
                      </div>
                    </button>

                    {isProfileOpen && (
                      <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl border border-slate-100 bg-white p-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 z-50">
                        <div className="px-3 py-2 border-b border-slate-100 mb-1">
                          <p className="text-xs font-black text-slate-900 lowercase truncate">
                            @{user?.hotdropId || user?.username}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium truncate">
                            {user?.email}
                          </p>
                        </div>

                        

                        <Link
                          to={`/user/userprofile/${user?.hotdropId || user?.username}`}
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                        >
                          <User className="h-4 w-4 text-blue-600" /> My Profile
                        </Link>
<Link
                          to="/analytics"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors group"
                        >
                          <div className="flex items-center gap-2.5">
                            <BarChart3 className="h-4 w-4 text-indigo-600 group-hover:scale-110 transition-transform" />
                            <span>Analytics</span>
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200/80 px-1.5 py-0.5 rounded-md">
                            Live
                          </span>
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 cursor-pointer"
                        >
                          <LogOut className="h-4 w-4" /> Logout
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl transition-transform duration-300 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full p-4">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black uppercase text-orange-500">HOT</span>
              <span className="text-lg font-black uppercase text-blue-600">DROP</span>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="space-y-1.5 mt-4 flex-1">
            <Link
              to="/"
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition ${
                isActive("/") ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Notebook className="h-5 w-5" /> Global Feed
            </Link>

           
          </nav>
        </div>
      </aside>

      {isLoginPromptOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsLoginPromptOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="mb-1 text-xl font-bold text-slate-900">Sign in required</h3>
            <p className="mb-6 text-xs text-slate-500 leading-relaxed">
              Please sign in to search and view user profiles.
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

      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        initialMode={searchMode}
      />
    </header>
  );
};

export default Navbar;