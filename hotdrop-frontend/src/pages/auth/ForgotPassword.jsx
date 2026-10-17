import { useState } from "react";
import {
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
  KeyRound,
  ArrowLeft,
  CheckCircle2,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../api/Api";
import { showErrorToast, showSuccessToast } from "../../toast/Toast";

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1); 
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const isPasswordMismatch =
    (confirmPassword.length > 0 || hasAttemptedSubmit) &&
    newPassword !== confirmPassword;

  const isPasswordMatch =
    confirmPassword.length > 0 &&
    newPassword.length > 0 &&
    newPassword === confirmPassword;

  let passwordInputClass = "border-slate-200 bg-slate-50 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100";
  let passwordLockClass = "text-slate-400";
  if (isPasswordMismatch) {
    passwordInputClass = "border-rose-500 bg-rose-50/70 text-rose-900 focus:border-rose-600 focus:ring-4 focus:ring-rose-100 placeholder-rose-300";
    passwordLockClass = "text-rose-500";
  } else if (isPasswordMatch) {
    passwordInputClass = "border-emerald-500 bg-emerald-50/50 text-emerald-900 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100";
    passwordLockClass = "text-emerald-500";
  }

  let submitButtonClass = "bg-gradient-to-r from-blue-600 to-indigo-600 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-200";
  if (loading) {
    submitButtonClass = "cursor-not-allowed bg-blue-400";
  } else if (isPasswordMismatch) {
    submitButtonClass = "bg-gradient-to-r from-rose-600 to-red-600 shadow-md shadow-rose-200 hover:-translate-y-0.5";
  }

  const handleSendOtp = async (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      showErrorToast("Please enter a valid email address.");
      return;
    }

    if (loading) return;

    try {
      setLoading(true);
      const res = await api.post("/auth/forgot-password", { email: trimmedEmail });
      showSuccessToast(res.data?.message || "OTP sent to your email!");
      setStep(2);
    } catch (error) {
      console.error("Forgot password error:", error);
      if (error.response?.status !== 429) {
        const errMsg =
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to send OTP. Please try again.";
        showErrorToast(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resending || loading) return;
    try {
      setResending(true);
      const res = await api.post("/auth/forgot-password", { email: email.trim() });
      showSuccessToast(res.data?.message || "OTP resent to your email!");
    } catch (error) {
      if (error.response?.status !== 429) {
        const errMsg =
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to resend OTP.";
        showErrorToast(errMsg);
      }
    } finally {
      setResending(false);
    }
  };

  const handleVerifyOtpAndReset = async (e) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);

    const trimmedOtp = otp.trim();
    if (!trimmedOtp) {
      showErrorToast("Please enter the OTP code.");
      return;
    }

    if (!newPassword) {
      showErrorToast("Please enter a new password.");
      return;
    }

    if (newPassword.length < 6) {
      showErrorToast("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      showErrorToast("Passwords do not match! Please check password fields.");
      return;
    }

    if (loading) return;

    try {
      setLoading(true);
      const payload = {
        email: email.trim(),
        otp: trimmedOtp,
        newPassword: newPassword,
      };

      const res = await api.post("/auth/verify-otp", payload);

      showSuccessToast(
        res.data?.message || "Password reset successfully! Please login."
      );
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Verify OTP error:", error);
      if (error.response?.status !== 429) {
        const errMsg =
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Invalid OTP or failed to reset password.";
        showErrorToast(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50">

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

          <div className="mb-4 text-center">
            <h1 className="mt-2 text-3xl font-black tracking-tight">
              <span className="text-orange-500">HOT</span>
              <span className="text-blue-600">DROP</span>
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              {step === 1 ? "Reset your account password" : "Enter OTP and set your new password"}
            </p>
          </div>

          <div className="relative overflow-hidden rounded-[24px] border border-white/40 bg-white/80 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.08)] backdrop-blur-xl">

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
                    {step === 1 ? "Sending OTP..." : "Resetting password..."}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {step === 1 ? (

              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label htmlFor="forgot-email" className="mb-1 ml-1 block text-[11px] font-semibold text-slate-700">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="forgot-email"
                      type="email"
                      name="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="example@mail.com"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.25 pl-10 pr-4 text-sm outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
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
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      Send OTP
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>
            ) : (

              <form onSubmit={handleVerifyOtpAndReset} className="space-y-3">

                <div className="flex items-center justify-between rounded-xl bg-blue-50/80 px-3 py-2 text-xs border border-blue-100">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                    <span className="truncate text-slate-700 font-medium">{email}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setHasAttemptedSubmit(false);
                    }}
                    className="text-[11px] font-bold text-blue-600 hover:underline shrink-0 ml-2"
                  >
                    Change
                  </button>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label htmlFor="forgot-otp" className="ml-1 text-[11px] font-semibold text-slate-700">
                      OTP Code
                    </label>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resending || loading}
                      className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline disabled:opacity-50"
                    >
                      {resending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <RotateCcw className="h-3 w-3" />
                      )}
                      Resend OTP
                    </button>
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="forgot-otp"
                      type="text"
                      name="otp"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                      placeholder="Enter 6-digit OTP"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.25 pl-10 pr-4 text-sm outline-none tracking-wider transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="forgot-newPassword" className="mb-1 ml-1 block text-[11px] font-semibold text-slate-700">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock
                      className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${passwordLockClass}`}
                    />
                    <input
                      id="forgot-newPassword"
                      type={showNewPassword ? "text" : "password"}
                      name="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className={`w-full rounded-xl border py-2.25 pl-10 pr-10 text-sm outline-none transition-all ${passwordInputClass}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="forgot-confirmPassword" className="mb-1 ml-1 block text-[11px] font-semibold text-slate-700">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock
                      className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${passwordLockClass}`}
                    />
                    <input
                      id="forgot-confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className={`w-full rounded-xl border py-2.25 pl-10 pr-10 text-sm outline-none transition-all ${passwordInputClass}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  <AnimatePresence>
                    {isPasswordMismatch && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-1 ml-1 flex items-center gap-1.5 text-[11px] font-bold text-rose-600"
                      >
                        <AlertCircle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                        <span>Passwords do not match!</span>
                      </motion.div>
                    )}

                    {isPasswordMatch && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-1 ml-1 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span>Passwords match</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  disabled={loading}
                  type="submit"
                  className={`group flex w-full items-center justify-center gap-2 rounded-xl py-2.5 font-semibold text-white transition-all duration-300 mt-2 ${submitButtonClass}`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Verifying & Resetting...
                    </>
                  ) : (
                    <>
                      Reset Password
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-[10px] uppercase tracking-wider text-slate-400">
                HotDrop
              </span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <p className="text-center text-sm text-slate-500">
              Remember your password?{" "}
              <Link
                to="/login"
                className="inline-flex items-center gap-1 font-bold text-blue-600 hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Login
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;
