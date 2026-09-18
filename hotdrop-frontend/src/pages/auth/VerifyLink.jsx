import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, BadgeCheck, Loader2, MailX, Sparkles, TriangleAlert } from "lucide-react";
import API from "../../api/Api";

export default function VerifyLink() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Verifying your email link...");

  useEffect(() => {
    let mounted = true;
    let redirectTimer;

    const verifyToken = async () => {
      if (!token) {
        if (!mounted) return;
        setStatus("error");
        setMessage("Verification token is missing.");
        return;
      }

      try {
        const res = await API.get(`/auth/verify-email?token=${encodeURIComponent(token)}`);
        if (!mounted) return;

        setStatus("success");
        setMessage(
          res.data?.message || "Email verified successfully. Redirecting to login..."
        );

        redirectTimer = setTimeout(() => {
          navigate("/login", { replace: true });
        }, 900);
      } catch (error) {
        if (!mounted) return;
        setStatus("error");
        setMessage(
          error.response?.data?.message ||
            error.response?.data?.error ||
            "Verification failed. The link may be expired or invalid."
        );
      }
    };

    verifyToken();

    return () => {
      mounted = false;
      if (redirectTimer) {
        clearTimeout(redirectTimer);
      }
    };
  }, [navigate, token]);

  const isLoading = status === "loading";
  const isSuccess = status === "success";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F8FAFC] px-4 py-8 font-sans">
      <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-sky-200/50 blur-[120px]" />
      <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-indigo-200/50 blur-[120px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.88),_transparent_44%)]" />

      <div className="relative z-10 w-full max-w-[390px] animate-[fadeIn_.5s_ease]">
        <div className="mb-3 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 animate-pulse text-sky-600" />
            <span className="text-[9px] font-black uppercase tracking-[0.24em] text-slate-700">
              Email Verification
            </span>
          </div>

          <h1 className="mt-2 text-xl font-black text-slate-900 md:text-[1.8rem]">
            {isSuccess ? "Email verified" : "Verifying link"}
          </h1>

          <p className="mt-1.5 text-[11px] text-slate-500 md:text-xs">
            {isSuccess
              ? "Your account is ready. Redirecting you to login."
              : "We are checking the token from your email."}
          </p>
        </div>

        <div className="relative overflow-hidden rounded-[1.4rem] border border-white/70 bg-white/90 p-4 shadow-[0_18px_55px_-20px_rgba(15,23,42,.18)] backdrop-blur-md md:p-5">
          <div
            className={`absolute inset-x-0 top-0 h-1 ${
              isSuccess
                ? "bg-gradient-to-r from-emerald-500 via-green-400 to-lime-500"
                : "bg-gradient-to-r from-sky-500 via-cyan-400 to-indigo-500"
            }`}
          />

          <div
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full shadow-inner ${
              isSuccess
                ? "bg-gradient-to-br from-emerald-100 to-green-200"
                : "bg-gradient-to-br from-sky-100 to-indigo-100"
            }`}
          >
            {isLoading ? (
              <Loader2 className="h-9 w-9 animate-spin text-sky-600" />
            ) : isSuccess ? (
              <BadgeCheck className="h-9 w-9 text-emerald-600" />
            ) : (
              <MailX className="h-9 w-9 text-rose-600" />
            )}
          </div>

          <p
            className={`mt-3 rounded-2xl border px-3 py-2 text-center text-xs font-semibold md:text-sm ${
              isSuccess
                ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                : status === "error"
                ? "border-rose-100 bg-rose-50 text-rose-700"
                : "border-sky-100 bg-sky-50 text-sky-700"
            }`}
          >
            {message}
          </p>

          {!token && (
            <div className="mt-3 rounded-2xl bg-amber-50 px-3 py-2 text-[11px] leading-5 text-amber-800 md:text-xs">
              <TriangleAlert className="mr-1 inline-block h-3.5 w-3.5" />
              No token was found in the URL.
            </div>
          )}

          {status !== "success" && (
            <div className="mt-4 space-y-2">
              <div className="grid gap-2.5 sm:grid-cols-2">
                <button
                  onClick={() => navigate("/login")}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-600 via-sky-500 to-indigo-600 py-2 text-xs font-bold text-white shadow-lg shadow-sky-200 transition hover:scale-[1.01] hover:shadow-xl md:text-sm"
                >
                  Go to Login
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 md:text-sm"
                >
                  <Loader2 className="h-3.5 w-3.5" />
                  Retry
                </button>
              </div>

              <button
                type="button"
                onClick={() => navigate("/auth/resend-email")}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50/80 py-2 text-xs font-semibold text-sky-700 transition hover:bg-sky-100 md:text-sm"
              >
                Request Fresh Verification Link
              </button>
            </div>
          )}

          <p className="mt-4 text-center text-[11px] text-slate-500 md:text-xs">
            {isLoading
              ? "Please wait while we verify your email."
              : "If the link is expired, request a fresh verification email."}
          </p>
        </div>
      </div>
    </div>
  );
}
