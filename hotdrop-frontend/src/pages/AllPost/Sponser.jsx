import React, { useState, useEffect } from "react";
import { 
  ExternalLink, 
  Sparkles, 
  Bot, 
  Cpu, 
  Zap, 
  CheckCircle2, 
  ChevronRight,
  ChevronLeft,
  Heart,
  Globe,
  Star
} from "lucide-react";

const SPONSORS = [
  {
    id: "openai",
    brand: "OpenAI",
    badge: "Official Ad Partner",
    badgeBg: "bg-emerald-100/80 text-emerald-800 border-emerald-300/80",
    gradient: "from-emerald-50/90 via-teal-50/40 to-white border-emerald-200/90",
    iconBg: "bg-emerald-500 text-white shadow-emerald-500/30",
    accentBtn: "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-600/20",
    title: "OpenAI GPT-4o & Sora 🤖",
    description: "Build next-gen multi-modal AI apps with vision, real-time speech & reasoning APIs.",
    ctaText: "Claim OpenAI API Credits",
    ctaUrl: "https://platform.openai.com",
    tag: "#OpenAI #GPT4o",
    rating: "4.9/5",
  },
  {
    id: "antigravity",
    brand: "Google Antigravity",
    badge: "Featured AI Partner",
    badgeBg: "bg-indigo-100/80 text-indigo-800 border-indigo-300/80",
    gradient: "from-indigo-50/90 via-purple-50/40 to-white border-indigo-200/90",
    iconBg: "bg-indigo-600 text-white shadow-indigo-600/30",
    accentBtn: "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-indigo-600/20",
    title: "Google Antigravity 2.0 🌌",
    description: "Autonomous agentic coding assistant & AI IDE built by Google DeepMind engineers.",
    ctaText: "Explore Antigravity",
    ctaUrl: "https://deepmind.google",
    tag: "#Antigravity #AGY",
    rating: "5.0/5",
  },
  {
    id: "grok",
    brand: "xAI / Grok",
    badge: "Sponsored Ad",
    badgeBg: "bg-amber-100/80 text-amber-900 border-amber-300/80",
    gradient: "from-amber-50/90 via-orange-50/40 to-white border-amber-200/90",
    iconBg: "bg-amber-500 text-white shadow-amber-500/30",
    accentBtn: "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-amber-600/20",
    title: "Grok 3 xAI Engine ⚡",
    description: "Unfiltered real-time search, cosmic reasoning & ultra-low latency inference API.",
    ctaText: "Access Grok API",
    ctaUrl: "https://x.ai",
    tag: "#xAI #Grok3",
    rating: "4.8/5",
  },
  {
    id: "meta",
    brand: "Meta AI",
    badge: "Official Partner",
    badgeBg: "bg-blue-100/80 text-blue-800 border-blue-300/80",
    gradient: "from-blue-50/90 via-cyan-50/40 to-white border-blue-200/90",
    iconBg: "bg-blue-600 text-white shadow-blue-600/30",
    accentBtn: "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-blue-600/20",
    title: "Meta Llama 3.3 Open AI 🦙",
    description: "Open source frontier AI models powering social experiences & developer platforms.",
    ctaText: "Download Llama 3.3",
    ctaUrl: "https://ai.meta.com",
    tag: "#MetaAI #Llama3",
    rating: "4.9/5",
  },
];

const Sponser = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-play timer for smooth individual carousel rotation
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % SPONSORS.length);
    }, 4500);

    return () => clearInterval(interval);
  }, [isPaused]);

  const activeSponsor = SPONSORS[activeIndex];

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % SPONSORS.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + SPONSORS.length) % SPONSORS.length);
  };

  return (
    <aside className="space-y-4 select-none">
      {/* SPONSOR HEADER SELECTOR TABS */}
      <div className="bg-white rounded-3xl p-3.5 border border-slate-200/80 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between px-1 pt-0.5 pb-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-500 fill-amber-500 animate-pulse" /> Official Ad Partners
          </span>
          <span className="text-[9px] font-extrabold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full uppercase">
            Sponsored
          </span>
        </div>

        {/* BRAND PILLS */}
        <div className="grid grid-cols-4 gap-1">
          {SPONSORS.map((s, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={s.id}
                onClick={() => setActiveIndex(idx)}
                className={`py-1.5 px-1 rounded-xl text-[10px] font-extrabold transition-all duration-300 flex flex-col items-center justify-center gap-0.5 cursor-pointer border ${
                  isActive
                    ? "bg-slate-900 text-white border-slate-900 shadow-md scale-[1.03]"
                    : "bg-slate-50 text-slate-600 border-slate-200/70 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <span className="truncate max-w-full">{s.brand.split(" ")[0]}</span>
                <div
                  className={`h-1 rounded-full transition-all ${
                    isActive ? "bg-blue-400 w-3" : "bg-transparent w-1"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* LIGHT-MODE AUTO-PLAY SPONSORED CAROUSEL CARD */}
      <div
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className={`relative overflow-hidden bg-gradient-to-br ${activeSponsor.gradient} rounded-3xl p-5 border shadow-md hover:shadow-xl transition-all duration-500 group`}
      >
        {/* Soft pastel backdrop glow */}
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-36 h-36 bg-blue-400/10 rounded-full blur-3xl group-hover:scale-125 transition-all duration-700" />

        {/* Top Badges & Controls */}
        <div className="flex items-center justify-between gap-2 mb-3 relative z-10">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider border shadow-sm ${activeSponsor.badgeBg}`}
            >
              {activeSponsor.badge}
            </span>
            <CheckCircle2 size={14} className="text-blue-600 fill-blue-100" />
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="p-1 rounded-lg bg-white/80 border border-slate-200/80 text-slate-500 hover:text-slate-900 hover:bg-white transition cursor-pointer shadow-sm"
              title="Previous Ad"
            >
              <ChevronLeft size={13} />
            </button>
            <button
              onClick={handleNext}
              className="p-1 rounded-lg bg-white/80 border border-slate-200/80 text-slate-500 hover:text-slate-900 hover:bg-white transition cursor-pointer shadow-sm"
              title="Next Ad"
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>

        {/* Ad Title */}
        <h3 className="text-sm font-black tracking-tight text-slate-900 mb-1.5 leading-snug relative z-10">
          {activeSponsor.title}
        </h3>

        {/* Ad Description */}
        <p className="text-[11.5px] text-slate-600 font-medium leading-relaxed mb-4 relative z-10">
          {activeSponsor.description}
        </p>

        {/* Ad Feature Box */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-3 border border-slate-200/80 mb-4 flex items-center justify-between relative z-10 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 ${activeSponsor.iconBg} rounded-xl flex items-center justify-center shadow-md`}>
              <Bot size={17} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black text-slate-900 leading-tight">
                {activeSponsor.brand} Cloud
              </span>
              <span className="text-[9px] font-bold text-slate-400 font-mono">
                Verified API Partner
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-lg text-[10px] font-black text-amber-700">
            <Star size={11} className="fill-amber-400 text-amber-400" />
            <span>{activeSponsor.rating}</span>
          </div>
        </div>

        {/* CTA Button */}
        <a
          href={activeSponsor.ctaUrl}
          target="_blank"
          rel="noreferrer"
          className={`relative z-10 w-full py-2.5 ${activeSponsor.accentBtn} text-xs font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer group/btn`}
        >
          <span>{activeSponsor.ctaText}</span>
          <ExternalLink size={13} className="group-hover/btn:translate-x-0.5 transition-transform" />
        </a>

        {/* CAROUSEL PROGRESS DOTS */}
        <div className="flex items-center justify-center gap-1.5 mt-3 relative z-10">
          {SPONSORS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`h-1 rounded-full transition-all duration-300 cursor-pointer ${
                idx === activeIndex ? "w-5 bg-slate-900" : "w-1.5 bg-slate-300 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>
      </div>

      {/* TECH PARTNERS OVERVIEW BOX */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <Cpu size={15} className="text-blue-600" /> AI Ad Network
          </h4>
          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase font-mono">
            ● 4 Active
          </span>
        </div>

        <div className="space-y-1.5">
          {SPONSORS.map((sp, idx) => (
            <div
              key={sp.id}
              onClick={() => setActiveIndex(idx)}
              className={`flex items-center justify-between p-2 rounded-2xl transition-all cursor-pointer ${
                idx === activeIndex
                  ? "bg-blue-50/80 border border-blue-200/80"
                  : "bg-slate-50 hover:bg-slate-100 border border-slate-100"
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    idx === activeIndex ? "bg-blue-600 animate-pulse" : "bg-slate-300"
                  }`}
                />
                <span className="text-xs font-bold text-slate-900">
                  {sp.brand}
                </span>
              </div>
              <span className="text-[9px] font-bold text-slate-400 font-mono">
                {sp.tag}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <div className="px-3 text-center text-slate-400 text-[10px] font-medium leading-relaxed space-y-1">
        <p className="flex items-center justify-center gap-1">
          Powered by <Heart size={11} className="text-red-500 fill-red-500" /> HotDrop Ad Network
        </p>
        <p>© 2026 HotDrop Inc. All rights reserved.</p>
      </div>
    </aside>
  );
};

export default Sponser;
