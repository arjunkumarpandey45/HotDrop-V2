import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  User,
  Lock,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  Flame,
} from "lucide-react";
import { motion } from "framer-motion";
import API from "../../api/Api";
import SocialAuthButtons from "../../components/auth/SocialAuthButtons";

export default function Signup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    hotdropId: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");
    setSuccess(false);

    try {
      const res = await API.post("/auth/signup", formData);

      const backendMessage =
        res.data?.message ||
        "Verification email has been sent successfully.";

      setSuccess(true);
      setMessage(backendMessage);

      const email = formData.email;

      setFormData({
        firstName: "",
        lastName: "",
        hotdropId: "",
        email: "",
        password: "",
      });

      setShowPassword(false);

      setTimeout(() => {
        navigate("/verify", {
          state: {
            email,
            message: backendMessage,
          },
        });
      }, 1800);
    } catch (err) {
      setSuccess(false);
      setMessage(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] md:min-h-screen overflow-hidden bg-[#F8FAFC] font-sans selection:bg-blue-600/20 selection:text-blue-700 flex items-center justify-center px-4 py-6 sm:py-8">
      {/* Decorative Subtle Background Glows */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:18px_18px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] opacity-60 pointer-events-none" />
      <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-blue-200/40 blur-[100px] pointer-events-none" />
      <div className="absolute -right-20 top-1/4 h-72 w-72 rounded-full bg-cyan-200/35 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-indigo-200/35 blur-[90px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm md:max-w-3xl lg:max-w-[840px]">
        {/* Brand Header */}
        <div className="mb-3.5 text-center">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50/90 border border-blue-100 text-blue-600 text-[11px] font-bold mb-1.5 shadow-2xs">
            <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
            <span>Join HotDrop</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 leading-tight">
            <span className="text-orange-500">HOT</span>
            <span className="text-blue-600">DROP</span>
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 font-medium">
            Create your developer profile and launch your projects to the world.
          </p>
        </div>

        {/* Compact Auth Card */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-5 sm:p-6 md:p-7 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.07)] backdrop-blur-xl"
        >
          {message && (
            <div
              className={`mb-3.5 flex items-center gap-2.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all duration-200 ${
                success
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-rose-200 bg-rose-50 text-rose-800"
              }`}
            >
              {success ? (
                <BadgeCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              )}
              <span>{message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-[1.1fr_auto_1fr] md:gap-6 items-stretch">
            {/* Left Side: Credentials Form */}
            <div className="w-full flex flex-col justify-between">
              <div>
                <div className="mb-3">
                  <h2 className="text-xs sm:text-sm font-extrabold text-slate-900">Account Credentials</h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">Fill in your basic information</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-2.5">
                  {/* Row 1: First Name & Last Name */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label htmlFor="signup-firstName" className="mb-1 ml-0.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        First Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                        <input
                          id="signup-firstName"
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          required
                          placeholder="John"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-1.5 pl-8 pr-2.5 text-xs sm:text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/15"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="signup-lastName" className="mb-1 ml-0.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Last Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                        <input
                          id="signup-lastName"
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          required
                          placeholder="Doe"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-1.5 pl-8 pr-2.5 text-xs sm:text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/15"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 2: HotDrop ID & Email Address */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label htmlFor="signup-hotdropId" className="mb-1 ml-0.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        HotDrop ID
                      </label>
                      <div className="relative">
                        <BadgeCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                        <input
                          id="signup-hotdropId"
                          type="text"
                          name="hotdropId"
                          value={formData.hotdropId}
                          onChange={handleChange}
                          required
                          placeholder="dev_handle"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-1.5 pl-8 pr-2.5 text-xs sm:text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/15"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="signup-email" className="mb-1 ml-0.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                        <input
                          id="signup-email"
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          placeholder="you@domain.com"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-1.5 pl-8 pr-2.5 text-xs sm:text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/15"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Password */}
                  <div>
                    <label htmlFor="signup-password" className="mb-1 ml-0.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                      <input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-1.5 pl-8 pr-8 text-xs sm:text-sm text-slate-800 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/15"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded cursor-pointer"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative mt-1 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 font-bold text-xs uppercase tracking-wider text-white transition-all duration-200 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Creating Account...</span>
                      </>
                    ) : (
                      <>
                        <span>Complete Registration</span>
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Divider: Mobile horizontal, Desktop vertical */}
            <div className="my-4 flex items-center gap-3 md:hidden">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                OR REGISTER WITH
              </span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="hidden md:flex flex-col items-center justify-center self-stretch relative px-1">
              <div className="w-px h-full bg-slate-200/90" />
              <span className="absolute bg-white px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-400 rounded-full border border-slate-200 shadow-2xs">
                OR
              </span>
            </div>

            {/* Right Side: GitHub and Google Social Auth Card */}
            <div className="w-full flex flex-col justify-between rounded-2xl border border-slate-200/70 bg-gradient-to-b from-slate-50/90 to-white/70 p-4 sm:p-5 shadow-2xs">
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shadow-2xs">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight">One-Click Register</h2>
                    <p className="text-[11px] text-slate-400 leading-tight">Fast-track developer registration</p>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                  Sign up in seconds using your GitHub or Google account.
                </p>
              </div>

              <div className="my-3.5 w-full">
                <SocialAuthButtons mode="signup" />
              </div>

              <div className="pt-3 border-t border-slate-200/70 space-y-1.5 text-[11px] text-slate-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Instant verified developer profile</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>No password setup required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Direct repository and project linking</span>
                </div>
              </div>
            </div>
          </div>

          {/* Compact Card Footer */}
          <div className="mt-4 border-t border-slate-100 pt-3 text-center">
            <p className="text-xs text-slate-500 font-medium">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                Login
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
