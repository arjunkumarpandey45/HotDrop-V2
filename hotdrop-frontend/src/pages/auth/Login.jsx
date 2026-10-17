import { useState } from "react";
import {
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../../store/useAuthStore";
import { showErrorToast, showSuccessToast } from "../../toast/Toast";
import SocialAuthButtons from "../../components/auth/SocialAuthButtons";

const Login = () => {
  const navigate = useNavigate();

  const { login, checkAuth } = useAuthStore();

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    try {
      setLoading(true);

      const result = await login(
        formData.identifier.trim(),
        formData.password
      );

      if (result.success) {
        if (typeof checkAuth === "function") {
          await checkAuth(true);
        }

        setTimeout(() => {
          showSuccessToast(
            "Welcome Back",
            result.username || result.hotdropId || "User"
          );
        }, 100);

        navigate("/", { replace: true });
      } else if (result.status !== 429) {
        showErrorToast(result.message || "Invalid credentials.");
      }
    } catch (error) {
      console.error("Login catch error:", error);
      if (error.response?.status !== 429) {
        showErrorToast("Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F8FAFC] font-sans selection:bg-blue-600/20 selection:text-blue-700 flex items-center justify-center px-4 py-8">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] opacity-70 pointer-events-none" />
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-200/50 blur-[130px] pointer-events-none" />
      <div className="absolute -right-32 top-1/4 h-96 w-96 rounded-full bg-cyan-200/40 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-indigo-200/40 blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm md:max-w-3xl lg:max-w-4xl">
        {/* Brand Header */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">
            <span className="text-orange-500">HOT</span>
            <span className="text-blue-600">DROP</span>
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-500 font-medium">
            Welcome back! Access your developer projects, deployments & analytics.
          </p>
        </div>

        {/* Auth Card */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-[28px] border border-white/80 bg-white/90 p-5 sm:p-7 md:p-8 shadow-[0_25px_70px_-15px_rgba(15,23,42,0.08),0_0_0_1px_rgba(226,232,240,0.6)] backdrop-blur-2xl"
        >
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/85 backdrop-blur-md"
              >
                <div className="relative flex items-center justify-center">
                  <div className="h-12 w-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
                </div>
                <p className="mt-3 text-xs font-semibold text-slate-700 animate-pulse">
                  Authenticating your credentials...
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-[1.1fr_auto_1fr] md:gap-7 items-stretch">
            {/* Left Side: Normal Sign In Form */}
            <div className="w-full flex flex-col justify-between">
              <div>
                <div className="mb-4">
                  <h2 className="text-sm font-extrabold text-slate-900">Account Sign In</h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">Enter your email or unique HotDrop ID</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3.5">
                  <div>
                    <label htmlFor="login-identifier" className="mb-1.5 ml-0.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Email Address or HotDrop ID
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        id="login-identifier"
                        type="text"
                        name="identifier"
                        value={formData.identifier}
                        onChange={handleChange}
                        required
                        placeholder="you@domain.com or dev_handle"
                        className="w-full rounded-xl border border-slate-200/90 bg-slate-50/70 py-2.5 pl-10 pr-4 text-xs sm:text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label htmlFor="login-password" className="ml-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Password
                      </label>
                      <Link
                        to="/auth/resend-email"
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        Verify Email
                      </Link>
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-slate-200/90 bg-slate-50/70 py-2.5 pl-10 pr-10 text-xs sm:text-sm text-slate-800 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    <div className="mt-1.5 flex justify-end">
                      <Link
                        to="/auth/forgot-password"
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        Forgot Password?
                      </Link>
                    </div>
                  </div>

                  <button
                    disabled={loading}
                    type="submit"
                    className={`group relative mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold text-xs uppercase tracking-wider text-white transition-all duration-300 ${
                      loading
                        ? "cursor-not-allowed bg-blue-400"
                        : "bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/35 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                    }`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Signing you in...
                      </>
                    ) : (
                      <>
                        Sign In with HotDrop
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Divider: Mobile horizontal, Desktop vertical */}
            <div className="my-5 flex items-center gap-3 md:hidden">
              <div className="h-px flex-1 bg-slate-200"></div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                OR CONTINUE WITH
              </span>
              <div className="h-px flex-1 bg-slate-200"></div>
            </div>

            <div className="hidden md:flex flex-col items-center justify-center self-stretch relative px-2">
              <div className="w-px h-full bg-gradient-to-b from-transparent via-slate-200 to-transparent"></div>
              <span className="absolute bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 rounded-full border border-slate-200 shadow-xs">
                OR
              </span>
            </div>

            {/* Right Side: GitHub and Google Social Auth Card */}
            <div className="w-full flex flex-col justify-between rounded-2xl border border-slate-100 bg-gradient-to-b from-slate-50/80 to-white/70 p-5 sm:p-6 shadow-xs">
              <div>
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100/80 flex items-center justify-center mb-3 shadow-2xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h2 className="text-sm font-extrabold text-slate-900">One-Click Access</h2>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Authenticate instantly with your developer accounts.
                </p>
              </div>

              <div className="my-5 w-full">
                <SocialAuthButtons mode="login" />
              </div>

              <div className="pt-3.5 border-t border-slate-200/70 space-y-2 text-[11px] text-slate-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Instant GitHub & Google OAuth login</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>No password memorization required</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card Footer */}
          <div className="mt-6 border-t border-slate-200/70 pt-4 text-center">
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              New to HotDrop?{" "}
              <Link
                to="/signup"
                className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                Create Account
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
