import { useState } from "react";
import { Mail, Copy, Check, X, Globe, ExternalLink } from "lucide-react";

const GithubIcon = ({ size = 18, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const LinkedinIcon = ({ size = 18, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const LeetcodeIcon = ({ size = 18, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M16.102 17.93l-2.697 2.607c-.466.467-1.111.662-1.823.662s-1.357-.195-1.824-.662l-4.332-4.363c-.467-.467-.702-1.15-.702-1.863 0-.713.235-1.357.702-1.824l4.319-4.38c.467-.467 1.125-.645 1.837-.645s1.357.178 1.823.645l2.697 2.607c.302.302.79.302 1.092 0 .302-.302.302-.79 0-1.092l-2.697-2.607c-.776-.776-1.823-1.125-2.915-1.125s-2.139.349-2.915 1.125l-4.319 4.38c-.776.776-1.192 1.823-1.192 2.915s.416 2.139 1.192 2.915l4.332 4.363c.776.776 1.823 1.125 2.915 1.125s2.139-.349 2.915-1.125l2.697-2.607c.302-.302.302-.79 0-1.092-.302-.302-.79-.302-1.092 0zM20.811 13.01H10.666c-.428 0-.776.348-.776.776s.348.776.776.776h10.145c.428 0 .776-.348.776-.776s-.348-.776-.776-.776zM13.627 2.213c-.302-.302-.79-.302-1.092 0L9.838 4.91c-.302.302-.302.79 0 1.092.302.302.79.302 1.092 0l2.697-2.697c.302-.302.79-.302 1.092 0z" />
  </svg>
);

function EmailModal({ isOpen, onClose, user, email: directEmail }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const email = user?.email || directEmail;

  const socialLinks = [
    {
      key: "github",
      val: user?.githubUrl || user?.github,
      Icon: GithubIcon,
      label: "GitHub",
    },
    {
      key: "linkedin",
      val: user?.linkedinUrl || user?.linkedin,
      Icon: LinkedinIcon,
      label: "LinkedIn",
    },
    {
      key: "leetcode",
      val: user?.leetcodeUrl || user?.leetcode,
      Icon: LeetcodeIcon,
      label: "LeetCode",
    },
    {
      key: "portfolio",
      val: user?.portfolioUrl || user?.portfolio,
      Icon: Globe,
      label: "Portfolio",
    },
  ].filter((item) => Boolean(item.val));

  const handleCopy = () => {
    if (email) {
      navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-slate-100 animate-in zoom-in-95 duration-200 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition p-1 rounded-lg hover:bg-slate-100"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
            <Mail size={22} />
          </div>

          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              Contact & Links
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Connect with @{user?.hotdropId || "creator"}
            </p>
          </div>

          {/* Email Card */}
          {email ? (
            <div className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <Mail size={16} className="text-blue-600 shrink-0" />
                <span className="text-xs font-semibold text-slate-700 truncate">
                  {email}
                </span>
              </div>
              <button
                onClick={handleCopy}
                className="text-slate-500 hover:text-blue-600 p-1.5 rounded-lg hover:bg-white shadow-xs transition shrink-0"
                title="Copy Email"
              >
                {copied ? (
                  <Check size={16} className="text-emerald-600" />
                ) : (
                  <Copy size={16} />
                )}
              </button>
            </div>
          ) : null}

          {/* Social Links List */}
          {socialLinks.length > 0 && (
            <div className="w-full space-y-2 pt-1 border-t border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-left mb-1.5">
                Social Profiles & Links
              </p>
              {socialLinks.map(({ key, val, Icon, label }) => {
                const href = val.startsWith("http") ? val : `https://${val}`;
                return (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-blue-50/60 border border-slate-200/70 hover:border-blue-200 rounded-xl text-xs font-semibold text-slate-700 hover:text-blue-600 transition group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg bg-white shadow-xs text-slate-600 group-hover:text-blue-600">
                        <Icon size={16} />
                      </div>
                      <span className="truncate">{label}</span>
                    </div>
                    <ExternalLink
                      size={14}
                      className="text-slate-400 group-hover:text-blue-600 transition shrink-0"
                    />
                  </a>
                );
              })}
            </div>
          )}

          {!email && socialLinks.length === 0 && (
            <div className="py-4 text-xs font-medium text-slate-400">
              No contact details provided
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EmailModal;