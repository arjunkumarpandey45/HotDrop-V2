import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Eye,
  EyeOff,
  Loader2,
  Mail,

  User,
  AlertCircle,
} from "lucide-react";
import API from "../api/Api";
import { Slide, ToastContainer } from "react-toastify";

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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F8FAFC] px-4  font-sans">
 <ToastContainer
        position="top-center"
        autoClose={1500}
        hideProgressBar
          style={{ zIndex: 999999 }} 
        transition={Slide}
        closeButton={false}
      />
      <div className="absolute left-0 top-0 h-80 w-80 rounded-full bg-sky-200/40 blur-[120px]" />
      <div className="absolute right-0 bottom-0 h-80 w-80 rounded-full bg-indigo-200/40 blur-[120px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.9),_transparent_45%)]" />

      <div className="relative z-10 w-full max-w-[430px] animate-[fadeIn_.5s_ease]">

        <div className="mb-4 text-center md:mb-5">

          

          <h1 className="mt-3 text-2xl font-black text-slate-900 md:text-[2rem]">
            Create your account
          </h1>

          <p className="mt-2 text-xs text-slate-500 md:text-sm">
            Start your journey with HotDrop.
          </p>

        </div>

        <div className="rounded-[1.5rem] border border-white/70 bg-white/90 p-5 shadow-[0_25px_80px_-20px_rgba(15,23,42,.18)] backdrop-blur-md md:p-6">

          {message && (
            <div
              className={`mb-4 flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-sm font-semibold transition-all duration-500 ${
                success
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {success ? (
                <BadgeCheck className="h-5 w-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
              )}

              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">

            <div className="grid gap-3.5 sm:grid-cols-2">

              <div>

                <label className="mb-1.5 ml-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  First Name
                </label>

                <div className="relative">

                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />

                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    placeholder="John"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2 pl-11 pr-4 outline-none transition focus:border-sky-500 focus:bg-white"
                  />

                </div>

              </div>

              <div>

                <label className="mb-1.5 ml-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  Last Name
                </label>

                <div className="relative">

                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />

                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    placeholder="Doe"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2 pl-11 pr-4 outline-none transition focus:border-sky-500 focus:bg-white"
                  />

                </div>

              </div>

            </div>

            <div>
              <label className="mb-1.5 ml-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                HotDrop ID
              </label>

              <div className="relative">
                <BadgeCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />

                <input
                  type="text"
                  name="hotdropId"
                  value={formData.hotdropId}
                  onChange={handleChange}
                  required
                  placeholder="hotdropId"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2 pl-11 pr-4 outline-none transition focus:border-sky-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 ml-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                Email Address
              </label>

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="name@example.com"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2 pl-11 pr-4 outline-none transition focus:border-sky-500 focus:bg-white"
                />
              </div>

              <p className="mt-2 ml-1 text-xs text-slate-400">
                We'll send a verification email to this address.
              </p>
            </div>

            <div>
              <label className="mb-1.5 ml-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2 pl-4 pr-12 outline-none transition focus:border-sky-500 focus:bg-white"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-sky-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group mt-1.5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-600 via-sky-500 to-indigo-600 px-5 py-2.5 text-xs font-black uppercase tracking-[0.16em] text-white shadow-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Complete Registration

                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 border-t border-slate-200  text-center">
            <span className="text-xs text-slate-500">
              Already have an account?
            </span>

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="ml-2 font-bold text-sky-600 transition hover:text-sky-700 hover:underline"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}