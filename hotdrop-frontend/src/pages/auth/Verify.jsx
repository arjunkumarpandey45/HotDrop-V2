import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BadgeCheck, Mail, Sparkles } from "lucide-react";

export default function Verify() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const email = state?.email || "";
  const message = state?.message || "Verification email has been sent successfully.";

  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (countdown === 0) {
      navigate("/login");
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, navigate]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F8FAFC] px-4 py-8">
      <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-sky-200/50 blur-[120px]" />
      <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-indigo-200/50 blur-[120px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.88),_transparent_44%)]" />

      <div className="relative z-10 w-full max-w-[390px] animate-[fadeIn_.5s_ease]">
        <div className="mb-3 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 animate-pulse text-sky-600" />
            <span className="text-[9px] font-black uppercase tracking-[0.24em] text-slate-700">
              Verify Account
            </span>
          </div>

          <h1 className="mt-2 text-xl font-black text-slate-900 md:text-[1.8rem]">
            Check your inbox
          </h1>

          <p className="mt-1.5 text-[11px] text-slate-500 md:text-xs">
            We sent a verification link to continue.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-[1.4rem] border border-white/70 bg-white/90 p-4 shadow-[0_18px_55px_-20px_rgba(15,23,42,.18)] backdrop-blur-md md:p-5">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 via-cyan-400 to-indigo-500" />

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-100 to-emerald-200 shadow-inner">
            <BadgeCheck className="h-9 w-9 text-emerald-600" />
          </div>

          <p className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-center text-xs font-semibold text-emerald-700 md:text-sm">
            {message}
          </p>

          <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-xl bg-white p-1.5 shadow-sm">
                <Mail className="h-3.5 w-3.5 text-sky-600" />
              </div>

              <div>
                <p className="text-[9px] uppercase tracking-[0.22em] text-slate-400">
                  Verification Email Sent To
                </p>

                <p className="mt-1 break-all text-xs font-semibold text-slate-800 md:text-sm">
                  {email}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 rounded-2xl bg-amber-50 px-3 py-2 text-[11px] leading-5 text-amber-800 md:text-xs">
            📩 Please check your Inbox.
            <br />
            If you don't see the email, check your Spam or Promotions folder.
          </div>

          <p className="mt-4 text-center text-[11px] text-slate-500 md:text-xs">
            Redirecting to Login in{" "}
            <span className="font-bold text-sky-600">{countdown}</span>{" "}
            seconds...
          </p>
        </div>
      </div>
    </div>
  );
}
