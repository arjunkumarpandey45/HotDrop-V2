import React, { useState, useEffect } from "react";
import { 
  ExternalLink, 
  Sparkles, 
  Bot, 
  Cpu, 
  CheckCircle2, 
  ChevronRight,
  ChevronLeft,
  Heart,
  Star
} from "lucide-react";

const SPONSORS = [
  {
    id: "openai",
    brand: "OpenAI",
    badge: "Official Ad Partner",
    badgeBg: "bg-blue-100 text-blue-800 border-blue-200",
    gradient: "from-blue-50 via-sky-50/50 to-white border-blue-200/90",
    iconBg: "bg-blue-600 text-white shadow-blue-500/30",
    accentBtn: "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/25",
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
    badgeBg: "bg-indigo-100 text-indigo-800 border-indigo-200",
    gradient: "from-indigo-50/90 via-blue-50/50 to-white border-indigo-200/90",
    iconBg: "bg-indigo-600 text-white shadow-indigo-500/30",
    accentBtn: "bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-700 hover:to-blue-700 text-white shadow-indigo-500/25",
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
    badgeBg: "bg-amber-100 text-amber-900 border-amber-200",
    gradient: "from-amber-50/80 via-blue-50/30 to-white border-amber-200/80",
    iconBg: "bg-amber-500 text-white shadow-amber-500/30",
    accentBtn: "bg-gradient-to-r from-amber-500 to-blue-600 hover:from-amber-600 hover:to-blue-700 text-white shadow-amber-500/25",
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
    badgeBg: "bg-sky-100 text-sky-800 border-sky-200",
    gradient: "from-sky-50/90 via-blue-50/40 to-white border-sky-200/90",
    iconBg: "bg-sky-600 text-white shadow-sky-500/30",
    accentBtn: "bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white shadow-sky-500/25",
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

        {/* BRAND PILLS - SLEEK LIGHT BLUE ACTIVE ACCENT */}
        <div className="grid grid-cols-4 gap-1">
          {SPONSORS.map((s, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={s.id}
                onClick={() => setActiveIndex(idx)}
                className={`py-1.5 px-1 rounded-xl text-[10px] font-extrabold transition-all duration-300 flex flex-col items-center justify-center gap-0.5 cursor-pointer border ${
                  isActive
                    ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/25 scale-[1.03]"
                    : "bg-slate-50 text-slate-600 border-slate-200/70 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                }`}
              >
                <span className="truncate max-w-full">{s.brand.split(" ")[0]}</span>
                <div
                  className={`h-1 rounded-full transition-all ${
                    isActive ? "bg-white w-3" : "bg-transparent w-1"
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
        className={`relative overflow-hidden bg-gradient-to-br ${activeSponsor.gradient} rounded-3xl p-5 border shadow-sm hover:shadow-lg transition-all duration-500 group`}
      >
        {/* Soft pastel backdrop glow */}
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-36 h-36 bg-blue-400/15 rounded-full blur-3xl group-hover:scale-125 transition-all duration-700" />

        {/* Top Badges & Controls */}
        <div className="flex items-center justify-between gap-2 mb-3 relative z-10">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider border shadow-2xs ${activeSponsor.badgeBg}`}
            >
              {activeSponsor.badge}
            </span>
            <CheckCircle2 size={14} className="text-blue-600 fill-blue-100" />
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="p-1 rounded-lg bg-white/90 border border-blue-100 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer shadow-2xs"
              title="Previous Ad"
            >
              <ChevronLeft size={13} />
            </button>
            <button
              onClick={handleNext}
              className="p-1 rounded-lg bg-white/90 border border-blue-100 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer shadow-2xs"
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
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-blue-100 mb-4 flex items-center justify-between relative z-10 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 ${activeSponsor.iconBg} rounded-xl flex items-center justify-center shadow-md`}>
              <Bot size={17} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black text-slate-900 leading-tight">
                {activeSponsor.brand} Cloud
              </span>
              <span className="text-[9px] font-bold text-blue-600 font-mono">
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
                idx === activeIndex ? "w-5 bg-blue-600" : "w-1.5 bg-blue-200 hover:bg-blue-400"
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
                  ? "bg-blue-50 text-blue-900 border border-blue-200 font-bold"
                  : "bg-slate-50 hover:bg-blue-50/50 text-slate-700 border border-slate-100"
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    idx === activeIndex ? "bg-blue-600 animate-pulse" : "bg-slate-300"
                  }`}
                />
                <span className="text-xs font-bold">
                  {sp.brand}
                </span>
              </div>
              <span className="text-[9px] font-bold text-blue-600 font-mono">
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
