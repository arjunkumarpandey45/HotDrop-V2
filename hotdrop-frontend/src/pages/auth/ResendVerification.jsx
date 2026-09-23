import { useState, useEffect } from "react";
import {
  Mail,
  ArrowRight,
  ArrowLeft,
  Loader2,
  RotateCcw,
  BadgeCheck,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../api/Api";
import { showErrorToast, showSuccessToast } from "../../toast/Toast";

const ResendVerification = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isAlreadyVerified, setIsAlreadyVerified] = useState(false);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      showErrorToast("Please enter your registered email address.");
      return;
    }

    if (loading) return;

    try {
      setLoading(true);
      setIsAlreadyVerified(false);

      const res = await API.post("/auth/resend-email", { email: trimmedEmail });

      const successMsg =
        (typeof res.data === "string" ? res.data : res.data?.message) ||
        "Verification link sent to your email!";

      showSuccessToast(successMsg);
      setIsSuccess(true);
      setCountdown(60); // 60s cooldown before allowing resend
    } catch (error) {
      console.error("Resend email error:", error);

      if (error.response?.status !== 429) {
        const errorMsg =
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to send verification link.";

        if (errorMsg.toLowerCase().includes("already verified")) {
          setIsAlreadyVerified(true);
          showErrorToast("Your email is already verified! You can log in directly.");
        } else if (errorMsg.toLowerCase().includes("not registered")) {
          showErrorToast("This email is not registered with HotDrop.");
        } else {
          showErrorToast(errorMsg);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50">
      {/* Background blur shapes */}
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-200 blur-[120px] opacity-50" />
      <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-cyan-200 blur-[120px] opacity-40" />
      <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-indigo-200 blur-[100px] opacity-40" />

      <div className="flex min-h-screen items-center justify-center px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative z-10 w-full max-w-sm"
        >
          {/* Header */}
          <div className="mb-4 text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-white/80 px-3 py-1 shadow-sm backdrop-blur-sm mb-2">
              
              <span className="text-[10px] font-bold tracking-wider text-slate-700 uppercase">
                Email Verification
              </span>
            </div>

            <h1 className="text-3xl font-black tracking-tight">
              <span className="text-orange-500">HOT</span>
              <span className="text-blue-600">DROP</span>
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              {isSuccess
                ? "Verification email has been dispatched"
                : "Enter your email to receive a new verification link"}
            </p>
          </div>

          {/* Card */}
          <div className="relative overflow-hidden rounded-[24px] border border-white/40 bg-white/80 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.08)] backdrop-blur-xl">
            {/* Loading Overlay */}
            <AnimatePresence>
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/80 backdrop-blur-md"
                >
                  <div className="relative flex items-center justify-center">
                    <div className="h-12 w-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
                  </div>
                  <p className="mt-3 text-xs font-semibold text-slate-700 animate-pulse">
                    Sending verification link...
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {!isSuccess ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {isAlreadyVerified && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs text-emerald-800">
                    <div className="flex items-center gap-2 font-semibold">
                      <BadgeCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                      Email Already Verified!
                    </div>
                    <p className="mt-1 text-[11px] text-emerald-700">
                      Your account is active. You can log in directly without reverification.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate("/login")}
                      className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 underline hover:text-emerald-900"
                    >
                      Go to Login <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                )}

                <div>
                  <label htmlFor="resend-email" className="mb-1 ml-1 block text-[11px] font-semibold text-slate-700">
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="resend-email"
                      type="email"
                      name="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (isAlreadyVerified) setIsAlreadyVerified(false);
                      }}
                      required
                      placeholder="example@mail.com"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.25 pl-10 pr-4 text-sm outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                  <p className="mt-1.5 ml-1 text-[11px] text-slate-400 leading-tight">
                    We will send a fresh verification link to activate your HotDrop account.
                  </p>
                </div>

                <button
                  disabled={loading}
                  type="submit"
                  className={`group flex w-full items-center justify-center gap-2 rounded-xl py-2.5 font-semibold text-white transition-all duration-300 ${
                    loading
                      ? "cursor-not-allowed bg-blue-400"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-200"
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Sending link...
                    </>
                  ) : (
                    <>
                      Send Verification Link
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-3.5">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 shadow-inner">
                  <BadgeCheck className="h-8 w-8 text-emerald-600" />
                </div>

                <div className="text-center">
                  <h3 className="text-sm font-bold text-slate-800">
                    Verification Link Sent!
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Please check your email inbox to verify your account.
                  </p>
                </div>

                <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3">
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 rounded-lg bg-white p-1 shadow-sm">
                      <Mail className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                        Sent To
                      </p>
                      <p className="mt-0.5 break-all text-xs font-semibold text-slate-800">
                        {email}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-amber-50 border border-amber-200/60 p-2.5 text-[11px] leading-relaxed text-amber-800">
                  <span className="font-semibold">Important:</span> If you do not see the email in your inbox, please check your <span className="font-semibold">Spam</span> or <span className="font-semibold">Promotions</span> folder.
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleSubmit()}
                    disabled={loading || countdown > 0}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {countdown > 0 ? (
                      <>
                        <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
                        Resend in {countdown}s
                      </>
                    ) : (
                      <>
                        <RotateCcw className="h-3.5 w-3.5 text-blue-600" />
                        Resend Verification Link
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsSuccess(false);
                      setCountdown(0);
                    }}
                    className="w-full text-center text-[11px] font-semibold text-blue-600 hover:underline"
                  >
                    Use a different email address
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-200 transition hover:-translate-y-0.5"
                  >
                    Back to Login
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-[10px] uppercase tracking-wider text-slate-400">
                HotDrop
              </span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="space-y-1.5 text-center text-xs text-slate-500">
              <p>
                Already verified?{" "}
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 font-bold text-blue-600 hover:underline"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Login
                </Link>
              </p>
              <p>
                New to HotDrop?{" "}
                <Link
                  to="/signup"
                  className="font-bold text-blue-600 hover:underline"
                >
                  Create Account
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ResendVerification;
