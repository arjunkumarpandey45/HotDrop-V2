import { useState } from "react";

import { ArrowRight, BadgeCheck, Eye, EyeOff, Loader2, Mail, Sparkles, User } from "lucide-react";
import API from "../api/Api";

export default function Signup() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    hotdropId: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
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

    try {
      const res = await API.post("/auth/signup", formData);
      setMessage(res.data?.message || "Verification email sent.");
      setFormData({
        firstName: "",
        lastName: "",
        hotdropId: "",
        email: "",
        password: "",
      });
      setShowPassword(false);
    } catch (err) {
      setMessage(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F8FAFC] px-4 py-8 font-sans flex items-center justify-center">
      <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-sky-100/70 blur-[110px]" />
      <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-indigo-100/70 blur-[110px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.85),_transparent_45%)]" />

      <div className="relative z-10 w-full max-w-[560px]">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
            <Sparkles className="h-4 w-4 text-sky-600" />
            <span className="text-xs font-black uppercase tracking-[0.22em] text-slate-700">Join HotDrop</span>
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Create your new account
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Same fields, cleaner layout, faster sign up.
          </p>
        </div>

        <div className="rounded-[2.25rem] border border-white/70 bg-white/90 p-6 shadow-[0_20px_60px_-18px_rgba(15,23,42,0.18)] backdrop-blur-md sm:p-8">
          {message && (
            <div className="mb-5 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-800">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 ml-1 block text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                  First Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Enter first name"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 ml-1 block text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                  Last Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Enter last name"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1.5 ml-1 block text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                HotDrop ID
              </label>
              <div className="relative">
                <BadgeCheck className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  name="hotdropId"
                  value={formData.hotdropId}
                  onChange={handleChange}
                  placeholder="Your unique HotDrop ID"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 ml-1 block text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@company.com"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white"
                  required
                />
              </div>
              <p className="mt-1.5 ml-1 text-[11px] font-medium text-slate-400">
                Use the email address you want linked to this account.
              </p>
            </div>

            <div>
              <label className="mb-1.5 ml-1 block text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-3 pl-4 pr-12 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-sky-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 py-3.5 text-xs font-black uppercase tracking-[0.22em] text-white shadow-lg shadow-sky-100 transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70 active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Account
                </>
              ) : (
                <>
                  Complete Registration
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <button type="button" className="font-bold text-sky-600 hover:underline">
              Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}