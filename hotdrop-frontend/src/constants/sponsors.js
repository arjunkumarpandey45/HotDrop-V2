export const THEMES = {
  emerald: { bg: "bg-emerald-50/40 border-emerald-100", pill: "bg-emerald-100/80 text-emerald-800" },
  blue: { bg: "bg-blue-50/40 border-blue-100", pill: "bg-blue-100/80 text-blue-800" },
  amber: { bg: "bg-amber-50/40 border-amber-100", pill: "bg-amber-100/80 text-amber-900" },
  teal: { bg: "bg-teal-50/40 border-teal-100", pill: "bg-teal-100/80 text-teal-800" },
  sky: { bg: "bg-sky-50/40 border-sky-100", pill: "bg-sky-100/80 text-sky-800" },
  orange: { bg: "bg-orange-50/40 border-orange-100", pill: "bg-orange-100/80 text-orange-800" },
};

const makeSponsor = (id, name, badge, tag, title, description, ctaText, ctaUrl, theme, stats) => ({
  id, name, badge, tag, title, description, ctaText, ctaUrl, theme, stats
});

export const SPONSORS = [
  makeSponsor("chatgpt", "ChatGPT", "Official AI Partner", "OpenAI", "OpenAI GPT-4o & Reasoning", "Build next-gen multimodal apps with real-time speech, vision and frontier reasoning APIs.", "Explore ChatGPT", "https://chatgpt.com", "emerald", "GPT-4o API"),
  makeSponsor("gemini", "Google Gemini", "Featured AI Engine", "DeepMind", "Multimodal Gemini 2.0 Pro", "Frontier multimodal AI with 2M token context, real-time audio-video streaming & deep reasoning.", "Try Gemini AI", "https://gemini.google.com", "blue", "2M Context"),
  makeSponsor("grok", "xAI Grok", "Frontier AI Partner", "xAI", "Grok 3 Reasoning Engine", "Real-time search, cosmic reasoning & ultra-low latency inference API engineered by xAI.", "Access Grok", "https://x.ai", "amber", "Grok 3 API"),
  makeSponsor("perplexity", "Perplexity", "Search & Discovery", "Search", "Perplexity Sonar & Pro Search", "Conversational answer engine with verified web citations and real-time knowledge grounding.", "Search Perplexity", "https://www.perplexity.ai", "teal", "Sonar API"),
  makeSponsor("meta-ai", "Meta Llama", "Open Source AI", "Meta AI", "Meta Llama 3.3 Open Models", "Open-source frontier intelligence powering community innovation and developer applications.", "Explore Llama", "https://ai.meta.com", "sky", "Llama 3.3"),
  makeSponsor("claude", "Claude AI", "Reasoning & Coding", "Anthropic", "Claude 3.7 Sonnet & Thinking", "Hybrid reasoning architecture for complex code refactoring, system design, and computer use.", "Try Claude", "https://claude.ai", "orange", "Claude 3.7"),
];
