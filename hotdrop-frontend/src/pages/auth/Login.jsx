import { useState } from "react";
import {
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../../store/useAuthStore";
import { showErrorToast, showSuccessToast } from "../../toast/Toast";

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
      } else {
        showErrorToast(result.message || "Invalid credentials.");
      }
    } catch (error) {
      console.error("Login catch error:", error);
      showErrorToast("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50">

      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-200 blur-[120px] opacity-50"></div>
      <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-cyan-200 blur-[120px] opacity-40"></div>
      <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-indigo-200 blur-[100px] opacity-40"></div>

      <div className="flex min-h-screen items-center justify-center px-4 py-3">
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
              Welcome back. Login to continue.
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
                    <div className="h-12 w-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
                  </div>
                  <p className="mt-3 text-xs font-semibold text-slate-700 animate-pulse">
                    Authenticating...
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-3">

              <div>
                <label className="mb-1 ml-1 block text-[11px] font-semibold text-slate-700">
                  Email Address or HotDrop ID
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="identifier"
                    value={formData.identifier}
                    onChange={handleChange}
                    required
                    placeholder="example@mail.com"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.25 pl-10 pr-4 text-sm outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="ml-1 text-[11px] font-semibold text-slate-700">
                    Password
                  </label>
                  <Link
                    to="/auth/forgot-password"
                    className="text-[11px] font-semibold text-blue-600 hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>

                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.25 pl-10 pr-10 text-sm outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
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
                    Signing you in...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200"></div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400">
                HotDrop
              </span>
              <div className="h-px flex-1 bg-slate-200"></div>
            </div>

            <p className="text-center text-sm text-slate-500">
              New to HotDrop?{" "}
              <Link
                to="/signup"
                className="font-bold text-blue-600 hover:underline"
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
