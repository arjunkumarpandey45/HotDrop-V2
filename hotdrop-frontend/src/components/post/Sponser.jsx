import { useState, useEffect } from "react";
import { 
  Sparkles, 
  ChevronRight,
  ChevronLeft,
  Bot,
  Layers,
  ArrowUpRight
} from "lucide-react";

const SPOTLIGHTS = [
  {
    id: "chatgpt",
    badge: "Official AI Partner",
    tag: "OpenAI",
    brand: "ChatGPT / OpenAI",
    title: "OpenAI GPT-4o & Reasoning",
    description: "Build next-gen multimodal apps with real-time speech, vision and frontier reasoning APIs.",
    ctaText: "Explore ChatGPT",
    ctaUrl: "https://chatgpt.com",
    bgTint: "bg-emerald-50/40 border-emerald-100",
    pillBg: "bg-emerald-100/80 text-emerald-800",
    stats: "GPT-4o API",
  },
  {
    id: "gemini",
    badge: "Featured AI Engine",
    tag: "Google DeepMind",
    brand: "Google Gemini",
    title: "Multimodal Gemini 2.0 Pro",
    description: "Frontier multimodal AI with 2M token context, real-time audio-video streaming & deep reasoning.",
    ctaText: "Try Gemini AI",
    ctaUrl: "https://gemini.google.com",
    bgTint: "bg-blue-50/40 border-blue-100",
    pillBg: "bg-blue-100/80 text-blue-800",
    stats: "2M Context",
  },
  {
    id: "grok",
    badge: "Frontier AI Partner",
    tag: "xAI",
    brand: "xAI / Grok",
    title: "Grok 3 Reasoning Engine",
    description: "Real-time search, cosmic reasoning & ultra-low latency inference API engineered by xAI.",
    ctaText: "Access Grok",
    ctaUrl: "https://x.ai",
    bgTint: "bg-amber-50/40 border-amber-100",
    pillBg: "bg-amber-100/80 text-amber-900",
    stats: "Grok 3 API",
  },
  {
    id: "perplexity",
    badge: "Search & Discovery",
    tag: "Perplexity",
    brand: "Perplexity AI",
    title: "Perplexity Sonar & Pro Search",
    description: "Conversational answer engine with verified web citations and real-time knowledge grounding.",
    ctaText: "Search Perplexity",
    ctaUrl: "https://www.perplexity.ai",
    bgTint: "bg-teal-50/40 border-teal-100",
    pillBg: "bg-teal-100/80 text-teal-800",
    stats: "Sonar API",
  },
  {
    id: "meta-ai",
    badge: "Open Source AI",
    tag: "Meta AI",
    brand: "Meta AI",
    title: "Meta Llama 3.3 Open Models",
    description: "Open-source frontier intelligence powering community innovation and developer applications.",
    ctaText: "Explore Llama",
    ctaUrl: "https://ai.meta.com",
    bgTint: "bg-sky-50/40 border-sky-100",
    pillBg: "bg-sky-100/80 text-sky-800",
    stats: "Llama 3.3",
  },
  {
    id: "claude",
    badge: "Reasoning & Coding",
    tag: "Anthropic",
    brand: "Claude AI",
    title: "Claude 3.7 Sonnet & Thinking",
    description: "Hybrid reasoning architecture for complex code refactoring, system design, and computer use.",
    ctaText: "Try Claude",
    ctaUrl: "https://claude.ai",
    bgTint: "bg-orange-50/40 border-orange-100",
    pillBg: "bg-orange-100/80 text-orange-800",
    stats: "Claude 3.7",
  },
];

const AI_PLATFORMS = [
  { name: "ChatGPT", tag: "OpenAI", color: "text-emerald-700 bg-emerald-50 border-emerald-100" },
  { name: "Google Gemini", tag: "DeepMind", color: "text-blue-700 bg-blue-50 border-blue-100" },
  { name: "xAI Grok", tag: "xAI", color: "text-amber-700 bg-amber-50 border-amber-100" },
  { name: "Perplexity", tag: "Search", color: "text-teal-700 bg-teal-50 border-teal-100" },
  { name: "Meta Llama", tag: "Meta AI", color: "text-sky-700 bg-sky-50 border-sky-100" },
  { name: "Claude AI", tag: "Anthropic", color: "text-orange-700 bg-orange-50 border-orange-100" },
];

const Sponser = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SPOTLIGHTS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isHovered]);

  const current = SPOTLIGHTS[currentIndex];

  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % SPOTLIGHTS.length);
  const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + SPOTLIGHTS.length) % SPOTLIGHTS.length);

  return (
    <aside className="space-y-4 select-none">
      
      <div 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/90 shadow-sm p-4.5 transition-all duration-300 hover:shadow-md"
      >
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Sparkles size={13} className="fill-blue-600/20" />
            </span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block leading-none">
                AI Spotlight
              </span>
              <span className="text-xs font-black text-slate-900 tracking-tight">
                {current.badge}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
              aria-label="Previous Spotlight"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
              aria-label="Next Spotlight"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <div className={`rounded-2xl border p-3.5 mb-3.5 transition-colors duration-500 ${current.bgTint}`}>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${current.pillBg}`}>
              {current.tag}
            </span>
            <span className="text-[10px] font-mono font-bold text-slate-500">
              {current.stats}
            </span>
          </div>

          <h4 className="text-sm font-black text-slate-900 leading-snug mb-1">
            {current.title}
          </h4>
          
          <p className="text-[11.5px] text-slate-600 leading-relaxed font-medium">
            {current.description}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 pt-0.5">
          <div className="flex items-center gap-1.5">
            {SPOTLIGHTS.map((_, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === currentIndex ? "w-5 bg-blue-600" : "w-1.5 bg-slate-200 hover:bg-slate-300"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          <a
            href={current.ctaUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-[11px] font-extrabold tracking-tight transition-colors duration-200 shadow-sm"
          >
            <span>{current.ctaText}</span>
            <ArrowUpRight size={13} strokeWidth={2.5} />
          </a>
        </div>
      </div>

      <div className="rounded-3xl bg-white border border-slate-200/90 shadow-sm p-4.5 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <Bot size={15} className="text-blue-600" />
            Featured AI Partners
          </h4>
          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
            Frontier
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {AI_PLATFORMS.map((item, idx) => (
            <button
              type="button"
              key={item.name}
              onClick={() => setCurrentIndex(idx)}
              className={`flex flex-col justify-center p-2 rounded-xl border transition-all cursor-pointer group text-left ${
                idx === currentIndex
                  ? "bg-blue-50/80 border-blue-300 shadow-2xs"
                  : "bg-slate-50 border-slate-100 hover:border-blue-200 hover:bg-blue-50/40"
              }`}
            >
              <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                {item.name}
              </span>
              <span className="text-[10px] font-medium text-slate-400">
                {item.tag}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-2 text-center text-slate-400 text-[10px] font-medium space-y-1">
        <div className="flex items-center justify-center gap-1.5 text-slate-400 font-semibold">
          <Layers size={11} className="text-blue-500" />
          <span>HotDrop AI Ecosystem Showcase</span>
        </div>
        <p className="text-[9.5px]">© 2026 HotDrop. Open Platform for Developers.</p>
      </div>

    </aside>
  );
};

export default Sponser;
