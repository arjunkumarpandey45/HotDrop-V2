import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Layers,
  Activity,
  Heart,
  MessageCircle,
  AlertTriangle,
  CheckCircle2,
  Plus,
  FileText,
  RefreshCw,
  ArrowLeft,
  Share2,
  Copy,
  Check,
  Globe,
  AlertCircle,
  X,
  Printer,
  ChevronRight,
  Code2,
  Cpu,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import API from "../../api/Api";
import { useAuthStore, useUIStore } from "../../store/useAuthStore";
import { toast } from "react-toastify";
import { showDashboardRefreshedToast } from "../../toast/Toast";
import dp from "../../assets/dp.jpg";

const TECH_META = {
  react: {
    bg: "bg-sky-50",
    text: "text-sky-700",
    border: "border-sky-200",
    bar: "bg-sky-500",
    accent: "#0ea5e9",
    displayName: "React",
  },
  spring: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    bar: "bg-emerald-500",
    accent: "#10b981",
    displayName: "Spring Boot",
  },
  springboot: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    bar: "bg-emerald-500",
    accent: "#10b981",
    displayName: "Spring Boot",
  },
  postgresql: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    bar: "bg-blue-500",
    accent: "#3b82f6",
    displayName: "PostgreSQL",
  },
  postgres: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    bar: "bg-blue-500",
    accent: "#3b82f6",
    displayName: "PostgreSQL",
  },
  docker: {
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
    bar: "bg-indigo-500",
    accent: "#6366f1",
    displayName: "Docker",
  },
  tailwindcss: {
    bg: "bg-teal-50",
    text: "text-teal-700",
    border: "border-teal-200",
    bar: "bg-teal-500",
    accent: "#14b8a6",
    displayName: "TailwindCSS",
  },
  tailwind: {
    bg: "bg-teal-50",
    text: "text-teal-700",
    border: "border-teal-200",
    bar: "bg-teal-500",
    accent: "#14b8a6",
    displayName: "TailwindCSS",
  },
  nodejs: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    bar: "bg-emerald-600",
    accent: "#059669",
    displayName: "Node.js",
  },
  node: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    bar: "bg-emerald-600",
    accent: "#059669",
    displayName: "Node.js",
  },
  python: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    bar: "bg-amber-500",
    accent: "#f59e0b",
    displayName: "Python",
  },
  nextjs: {
    bg: "bg-slate-100",
    text: "text-slate-800",
    border: "border-slate-300",
    bar: "bg-slate-600",
    accent: "#475569",
    displayName: "Next.js",
  },
  next: {
    bg: "bg-slate-100",
    text: "text-slate-800",
    border: "border-slate-300",
    bar: "bg-slate-600",
    accent: "#475569",
    displayName: "Next.js",
  },
  java: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    bar: "bg-orange-500",
    accent: "#f97316",
    displayName: "Java",
  },
  java21: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    bar: "bg-orange-500",
    accent: "#f97316",
    displayName: "Java 21",
  },
  typescript: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    bar: "bg-blue-500",
    accent: "#3b82f6",
    displayName: "TypeScript",
  },
  mongodb: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    bar: "bg-emerald-500",
    accent: "#10b981",
    displayName: "MongoDB",
  },
};

const FALLBACK_PALETTES = [
  {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    bar: "bg-blue-500",
    accent: "#3b82f6",
  },
  {
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
    bar: "bg-indigo-500",
    accent: "#6366f1",
  },
  {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    bar: "bg-emerald-500",
    accent: "#10b981",
  },
  {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    bar: "bg-orange-500",
    accent: "#f97316",
  },
  {
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-300",
    bar: "bg-slate-500",
    accent: "#64748b",
  },
];

const getTechStyle = (rawTech, index = 0) => {
  const normalizedKey = (rawTech || "").toLowerCase().replace(/[\s\-_.]/g, "");
  const found = TECH_META[normalizedKey];
  if (found) {
    return {
      ...found,
      displayName: found.displayName || rawTech,
    };
  }
  const fallback = FALLBACK_PALETTES[index % FALLBACK_PALETTES.length];
  const formatted = (rawTech || "")
    .split(/[\s_-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return {
    ...fallback,
    displayName: formatted || rawTech,
  };
};

function DeveloperAnalytics() {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuthStore();
  const { openCreatePost } = useUIStore();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [activeTechHover, setActiveTechHover] = useState(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const userAvatar =
    user?.profileImageUrl ||
    user?.profilePicture ||
    user?.avatar ||
    dp;

  const fetchStats = useCallback(async (showToast = false) => {
    try {
      if (showToast) setIsRefreshing(true);
      setError(null);

      const res = await API.get("/api/v1/developer/dashboard/stats");
      const payload = res.data?.data || res.data;

      if (payload) {
        setStats({
          totalDrops: Number(payload.totalDrops ?? 0),
          liveDrops: Number(payload.liveDrops ?? 0),
          deadDrops: Number(payload.deadDrops ?? 0),
          healthScorePercentage: Number(payload.healthScorePercentage ?? 0),
          totalLikesReceived: Number(payload.totalLikesReceived ?? 0),
          totalCommentReceived: Number(payload.totalCommentReceived ?? payload.totalCommentsReceived ?? 0),
          topTechnologies: payload.topTechnologies || {},
        });
      }
      if (showToast) {
        showDashboardRefreshedToast("Latest Data is here");
      }
    } catch (err) {
      console.error("Dashboard stats error:", err);
      const errMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to load analytics. Please check your connection.";
      setError(errMsg);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStats();
  }, [fetchStats]);

  const technologiesList = useMemo(() => {
    if (!stats?.topTechnologies) return [];
    const entries = Object.entries(stats.topTechnologies);
    const totalCount = entries.reduce((acc, [, count]) => acc + Number(count || 0), 0);

    return entries
      .map(([tech, count], index) => {
        const numCount = Number(count || 0);
        const percentage = totalCount > 0 ? ((numCount / totalCount) * 100).toFixed(1) : 0;
        const style = getTechStyle(tech, index);
        return {
          raw: tech,
          displayName: style.displayName,
          count: numCount,
          percentage: Number(percentage),
          style,
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [stats]);

  const healthScore = (stats?.totalDrops ?? 0) === 0 ? 0 : (stats?.healthScorePercentage ?? 0);
  const healthStatus = useMemo(() => {
    if ((stats?.totalDrops ?? 0) === 0) {
      return {
        label: "No Drops",
        color: "text-slate-500",
        bg: "bg-slate-100",
        border: "border-slate-200",
        stroke: "#cbd5e1",
        description: "Deploy projects to track link health",
      };
    }
    if (healthScore >= 80) {
      return {
        label: "Stable",
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        stroke: "#10b981",
        description: "Healthy uptime across live links",
      };
    }
    if (healthScore >= 50) {
      return {
        label: "Warning",
        color: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-200",
        stroke: "#f59e0b",
        description: "Some project URLs need attention",
      };
    }
    return {
      label: "Critical",
      color: "text-rose-600",
      bg: "bg-rose-50",
      border: "border-rose-200",
      stroke: "#f43f5e",
      description: "Multiple unreachable URLs detected",
    };
  }, [healthScore, stats?.totalDrops]);

  // Gauge calculations
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, healthScore)) / 100) * circumference;

 

  const handleCopySummary = () => {
    const handle = user?.hotdropId || user?.username || "developer";
    const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || `@${handle}`;
    const techStacks = technologiesList.map((t) => `${t.displayName} (${t.count})`).join(", ");

    const summaryText = `========================================
HOTDROP VERIFIED DEVELOPER SUMMARY
========================================
Developer: ${name} (@${handle})
Portfolio: ${window.location.origin}/user/userprofile/${handle}

PORTFOLIO TELEMETRY:
• System Health Score: ${healthScore}% (${healthStatus.label})
• Total Projects: ${stats?.totalDrops ?? 0}
• Live Deployments: ${stats?.liveDrops ?? 0}
• Down / Inactive Links: ${stats?.deadDrops ?? 0}
• Total Peer Likes: ${stats?.totalLikesReceived ?? 0}
• Community Comments: ${stats?.totalCommentReceived ?? 0}

CORE TECH STACK FOOTPRINT:
${techStacks || "Fullstack Software Engineering"}

MONITORING STATUS:
✓ Live Link Health Monitor: ACTIVE
✓ Verified on HotDrop Developer Launchpad
========================================`;

    navigator.clipboard.writeText(summaryText);
    setCopiedSummary(true);
    toast.success("Developer summary copied to clipboard!");
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-16 selection:bg-blue-600/20 selection:text-blue-700">
      {/* Top Navigation Bar - Matches HotDrop's Navbar styling */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 border border-slate-200/80 px-3 py-1.5 rounded-xl transition cursor-pointer"
              title="Back"
            >
              <ArrowLeft size={14} />
              
            </button>

            <Link to="/" className="flex items-center tracking-tighter select-none pl-1">
              <span className="text-xl font-black uppercase text-orange-500">HOT</span>
              <span className="text-xl font-black uppercase text-blue-600">DROP</span>
              <span className="ml-2 text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/80 hidden sm:inline-block">
                
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => fetchStats(true)}
              disabled={isRefreshing || loading}
              className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 border border-slate-200/80 rounded-xl transition cursor-pointer disabled:opacity-50"
              title="Refresh Stats"
            >
              <RefreshCw size={14} className={isRefreshing ? "animate-spin text-blue-600" : ""} />
            </button>

            
            {user && (
              <Link
                to={`/user/userprofile/${user?.hotdropId || user?.username}`}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200/80 border border-slate-200/80 pl-1.5 pr-3 py-1 rounded-full transition"
              >
                <img
                  src={userAvatar}
                  alt="Avatar"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = dp;
                  }}
                  className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-200"
                />
                <span className="text-xs font-bold text-slate-800">
                  @{user?.hotdropId || user?.username || "dev"}
                </span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
        {/* DASHBOARD HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5"
        >
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                Live Link Monitor Active
              </span>

             
            </div>

            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900">
              Developer Analytics
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              Real-time uptime verification, health rating, and technology for your HotDrop projects.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-1 md:pt-0">
            <button
              onClick={() => {
                if (!isLoggedIn) {
                  navigate("/signup");
                  return;
                }
                openCreatePost();
              }}
              className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-xl shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>Drop New Project</span>
            </button>

            <button
              onClick={() => setIsSummaryModalOpen(true)}
              className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-xl border border-slate-200/90 transition active:scale-95 cursor-pointer shadow-xs"
            >
              <FileText size={14} className="text-slate-600" />
              <span>Developer Summary</span>
            </button>
          </div>
        </motion.div>

        {/* LOADING SKELETON */}
        {loading && (
          <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-32 rounded-2xl bg-white border border-slate-200/80 shadow-xs"
                />
              ))}
            </div>
            <div className="h-24 rounded-2xl bg-white border border-slate-200/80 shadow-xs" />
            <div className="h-56 rounded-2xl bg-white border border-slate-200/80 shadow-xs" />
          </div>
        )}

        {/* ERROR STATE */}
        {!loading && error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-rose-200 bg-white p-6 text-center space-y-3 max-w-md mx-auto shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
              <AlertCircle size={20} />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Unable to Load Analytics</h3>
            <p className="text-xs text-rose-600 leading-relaxed">{error}</p>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => fetchStats(true)}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm"
              >
                Try Again
              </button>
              {!isLoggedIn && (
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  Log In
                </Link>
              )}
            </div>
          </motion.div>
        )}

        {/* DASHBOARD BODY */}
        {!loading && !error && stats && (
          <div className="space-y-6">
            {/* TOP METRIC CARDS GRID (5 Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {/* CARD 1: TOTAL*/}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.05 }}
                className="rounded-2xl bg-white border border-slate-200/80 p-4 sm:p-5 flex flex-col justify-between hover:shadow-sm hover:border-slate-300 transition-all shadow-xs"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                    Total Projects
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
                    <Layers size={16} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900 font-mono">
                      {stats.totalDrops}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">projects</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Verified project showcases
                  </p>
                </div>
              </motion.div>

              {/* CARD 2: SYSTEM HEALTH RATE */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.1 }}
                className="rounded-2xl bg-white border border-slate-200/80 p-4 sm:p-5 flex flex-col justify-between hover:shadow-sm hover:border-slate-300 transition-all shadow-xs"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                    Health Score
                  </span>
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${healthStatus.bg} ${healthStatus.color} ${healthStatus.border}`}
                  >
                    {healthStatus.label}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-3xl font-black text-slate-900 font-mono">
                      {healthScore}%
                    </span>
                    <p className="text-[11px] text-slate-500 line-clamp-1 font-medium">
                      {healthStatus.description}
                    </p>
                  </div>

                  {/* Circular Gauge */}
                  <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 76 76">
                      <circle
                        cx="38"
                        cy="38"
                        r={radius}
                        className="stroke-slate-100"
                        strokeWidth="5"
                        fill="transparent"
                      />
                      <circle
                        cx="38"
                        cy="38"
                        r={radius}
                        stroke={healthStatus.stroke}
                        strokeWidth="5"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-700 ease-out"
                      />
                    </svg>
                    <Activity
                      size={14}
                      className={`absolute inset-auto ${healthStatus.color}`}
                    />
                  </div>
                </div>
              </motion.div>

              {/* CARD 3: ACTIVE VS DEAD PROJECTS */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.15 }}
                className="rounded-2xl bg-white border border-slate-200/80 p-4 sm:p-5 flex flex-col justify-between hover:shadow-sm hover:border-slate-300 transition-all shadow-xs"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                    Deployment Uptime
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                    <Globe size={16} />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {stats.liveDrops} Live
                    </span>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                        stats.deadDrops > 0
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {stats.deadDrops > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      )}
                      {stats.deadDrops} Inactive
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden flex">
                    <div
                      style={{
                        width: stats.totalDrops > 0 ? `${(stats.liveDrops / stats.totalDrops) * 100}%` : "100%",
                      }}
                      className="bg-emerald-500 h-full transition-all duration-300"
                    />
                    <div
                      style={{
                        width: stats.totalDrops > 0 ? `${(stats.deadDrops / stats.totalDrops) * 100}%` : "0%",
                      }}
                      className="bg-rose-500 h-full transition-all duration-300"
                    />
                  </div>
                </div>
              </motion.div>

              {/* CARD 4: COMMUNITY LIKES */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.2 }}
                className="rounded-2xl bg-white border border-slate-200/80 p-4 sm:p-5 flex flex-col justify-between hover:shadow-sm hover:border-slate-300 transition-all shadow-xs"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                    Community Likes
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center">
                    <Heart size={16} className="fill-rose-500 text-rose-500" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900 font-mono">
                      {stats.totalLikesReceived}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">likes</span>
                  </div>

                  <p className="text-[11px] text-slate-500 font-medium">
                    Peer endorsements across projects
                  </p>
                </div>
              </motion.div>

              {/* CARD 5: COMMUNITY COMMENTS */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.25 }}
                className="rounded-2xl bg-white border border-slate-200/80 p-4 sm:p-5 flex flex-col justify-between hover:shadow-sm hover:border-slate-300 transition-all shadow-xs"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                    Community Comments
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
                    <MessageCircle size={16} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900 font-mono">
                      {stats.totalCommentReceived ?? 0}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">
                      {(stats.totalCommentReceived ?? 0) === 1 ? "comment" : "comments"}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 font-medium">
                    Peer discussions & community feedback
                  </p>
                </div>
              </motion.div>
            </div>

            {/* ACTIONABLE HEALTH ALERT BANNER */}
            {stats.totalDrops === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl bg-white border border-slate-200/80 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
                    <Activity size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>Ready to Monitor Your Projects</span>
                      <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full">
                        No Drops Yet
                      </span>
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                      Deploy and share your live project URLs on HotDrop to start automated uptime and link health monitoring.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (!isLoggedIn) {
                      navigate("/signup");
                      return;
                    }
                    openCreatePost();
                  }}
                  className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shrink-0 cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Plus size={14} />
                  <span>Drop First Project</span>
                </button>
              </motion.div>
            ) : stats.deadDrops > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl bg-rose-50/70 border border-rose-200 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-rose-950 flex items-center gap-2">
                      <span>Deployment Attention Required</span>
                      <span className="text-[10px] font-black uppercase bg-rose-100 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full">
                        {stats.deadDrops} {stats.deadDrops === 1 ? "Link Down" : "Links Down"}
                      </span>
                    </h4>
                    <p className="text-xs text-rose-700 leading-relaxed mt-0.5">
                      {stats.deadDrops} of your project URLs appear unreachable or timed out. Update your deployment links to maintain a 100% health score.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    navigate(`/user/userprofile/${user?.hotdropId || user?.username}`);
                  }}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shrink-0 cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <span>Review Projects</span>
                  <ChevronRight size={14} />
                </button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl bg-white border border-slate-200/80 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>All Deployments Operational</span>
                      <span className="text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                        Verified
                      </span>
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                      All your project deployment links are verified and passing automated HTTP uptime checks.
                    </p>
                  </div>
                </div>

                <span className="text-xs font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl font-bold">
                  100% Link Health
                </span>
              </motion.div>
            )}

            {/* TECH STACK FOOTPRINT (DYNAMIC INTERACTIVE SECTION) */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.25 }}
              className="rounded-2xl bg-white border border-slate-200/80 p-5 sm:p-6 space-y-5 shadow-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
                    <Code2 size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-wider">
                      Tech Stack
                    </h3>
                    <p className="text-xs text-slate-500">
                      Technologies and frameworks tagged across your verified project 
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200/80 px-3 py-1 rounded-xl shrink-0">
                  {technologiesList.length} {technologiesList.length === 1 ? "Technology" : "Technologies"} Tagged
                </span>
              </div>

              {technologiesList.length > 0 ? (
                <div className="space-y-5">
                  {/* Dynamic Horizontal Stacked Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">Stack Distribution</span>
                      <span className="text-[11px] font-mono">
                        {activeTechHover
                          ? `${activeTechHover.displayName}: ${activeTechHover.count} drop${activeTechHover.count > 1 ? "s" : ""} (${activeTechHover.percentage}%)`
                          : "Hover stack segment for details"}
                      </span>
                    </div>

                    <div className="w-full h-3.5 bg-slate-100 rounded-xl overflow-hidden p-0.5 border border-slate-200/80 flex gap-0.5">
                      {technologiesList.map((tech) => (
                        <div
                          key={tech.raw}
                          style={{ width: `${Math.max(tech.percentage, 3)}%` }}
                          onMouseEnter={() => setActiveTechHover(tech)}
                          onMouseLeave={() => setActiveTechHover(null)}
                          className={`${tech.style.bar} h-full rounded-sm transition-opacity hover:opacity-100 opacity-90 cursor-pointer`}
                          title={`${tech.displayName}: ${tech.count} (${tech.percentage}%)`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Chips & Badges Grid */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {technologiesList.map((tech) => (
                      <button
                        key={tech.raw}
                        onClick={() => navigate(`/search?q=${encodeURIComponent(tech.displayName || tech.raw)}`)}
                        onMouseEnter={() => setActiveTechHover(tech)}
                        onMouseLeave={() => setActiveTechHover(null)}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${tech.style.bg} ${tech.style.text} ${tech.style.border} hover:shadow-xs`}
                        title={`Search projects tagged with #${tech.displayName}`}
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tech.style.accent }} />
                        <span>{tech.displayName}</span>
                        <span className="px-1.5 py-0.2 rounded-md bg-white text-[10px] font-mono border border-slate-200 text-slate-700">
                          {tech.count}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {tech.percentage}%
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 space-y-2">
                  <Cpu size={28} className="mx-auto text-slate-400" />
                  <p className="text-xs font-semibold text-slate-600">No technologies registered yet</p>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    Add tags like React, Spring Boot, or Docker to your project to populate this footprint.
                  </p>
                </div>
              )}
            </motion.div>

            {/* DEVELOPER PROFILE METRICS */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.3 }}
              className="rounded-2xl bg-white border border-slate-200/80 p-5 sm:p-6 space-y-4 shadow-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-wider">
                    Developer Profile Metrics
                  </h3>
                  <p className="text-xs text-slate-500">
                    Verified indicators calculated from your HotDrop deployments.
                  </p>
                </div>

                
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    Deployment Health
                  </span>
                  <div className="text-lg font-black text-slate-900 font-mono">
                    {healthScore}%
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {stats.liveDrops} of {stats.totalDrops} links active
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    Tech Stack Diversity
                  </span>
                  <div className="text-lg font-black text-slate-900 font-mono">
                    {technologiesList.length} Frameworks
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Technologies tagged across your projects
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    Peer Recognition
                  </span>
                  <div className="text-lg font-black text-slate-900 font-mono">
                    {stats.totalLikesReceived} Total Likes
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {stats.totalDrops > 0
                      ? `${(stats.totalLikesReceived / stats.totalDrops).toFixed(1)} avg likes per project`
                      : "Peer feedback on your drops"}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    Community Discussions
                  </span>
                  <div className="text-lg font-black text-slate-900 font-mono">
                    {stats.totalCommentReceived ?? 0} Comments
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {stats.totalDrops > 0
                      ? `${((stats.totalCommentReceived ?? 0) / stats.totalDrops).toFixed(1)} avg comments per project`
                      : "Feedback and technical discussions"}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </main>

      {/* VERIFIED DEVELOPER SUMMARY MODAL */}
      <AnimatePresence>
        {isSummaryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-150">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl p-5 sm:p-6 shadow-2xl text-slate-800 space-y-5 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-wider">
                      Verified Developer Summary
                    </h3>
                    <p className="text-xs text-slate-500">
                      Concise summary of your HotDrop projects, uptime health, and technology stack.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSummaryModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 font-mono text-xs text-slate-800 space-y-2.5 leading-relaxed select-all">
                <p className="text-blue-600 font-bold">
                  {/* HOTDROP VERIFIED DEVELOPER SUMMARY */}
                </p>
                <p>
                  <strong>Developer:</strong> {[user?.firstName, user?.lastName].filter(Boolean).join(" ") || `@${user?.hotdropId || "developer"}`}
                </p>
                <p>
                  <strong>Portfolio URL:</strong> {window.location.origin}/user/userprofile/{user?.hotdropId || user?.username || "dev"}
                </p>
                <p>
                  <strong>System Health Score:</strong> {healthScore}% ({healthStatus.label})
                </p>
                <p>
                  <strong>Project Deployments:</strong> {stats?.liveDrops || 0} Live / {stats?.totalDrops || 0} Total ({stats?.deadDrops || 0} inactive)
                </p>
                <p>
                  <strong>Community Engagement:</strong> {stats?.totalLikesReceived || 0} Likes · {stats?.totalCommentReceived || 0} Comments
                </p>
                <p>
                  <strong>Core Technologies:</strong>{" "}
                  {technologiesList.map((t) => `${t.displayName} (${t.count})`).join(", ") || "Fullstack Software Engineering"}
                </p>
                <p className="text-[11px] text-emerald-600 pt-1 border-t border-slate-200">
                  ✓ Verified via HotDrop Automated Link Health Monitor
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-1 border-t border-slate-100">
                <button
                  onClick={handleCopySummary}
                  className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {copiedSummary ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  <span>{copiedSummary ? "Copied" : "Copy Summary"}</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-md shadow-blue-500/20 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Printer size={14} />
                  <span>Print / Save as PDF</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default DeveloperAnalytics;
