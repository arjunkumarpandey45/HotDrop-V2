import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, Loader2, Link2, ShieldCheck, ArrowRight } from "lucide-react";
import api from "../../api/Api";
import { useAuthStore } from "../../store/useAuthStore";
import { showErrorToast, showSuccessToast } from "../../toast/Toast";

const OAuth2Redirect = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const checkAuth = useAuthStore((state) => state.checkAuth);

  const code = searchParams.get("code");
  const action = searchParams.get("action");
  const provider = searchParams.get("provider");
  const email = searchParams.get("email");
  const token = searchParams.get("token");
  const error = searchParams.get("error");

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Completing secure authentication...");

  // Strict mode deduplication ref
  const exchangeAttempted = useRef(false);

  useEffect(() => {
    if (error) {
      let decodedError;
      try {
        decodedError = decodeURIComponent(error);
      } catch {
        decodedError = error;
      }
      showErrorToast(decodedError || "Authentication failed");
      navigate("/login", { replace: true });
      return;
    }

    if (code) {
      if (exchangeAttempted.current) return;
      exchangeAttempted.current = true;

      const exchangeOAuthCode = async () => {
        try {
          setLoadingMessage("Verifying authorization credentials...");
          const res = await api.post("/auth/oauth2/exchange", { code });
          const userData = res.data?.data || res.data;

          if (userData) {
            setUser(userData);
            if (typeof checkAuth === "function") {
              await checkAuth();
            }
            showSuccessToast("Welcome to HotDrop", userData.hotdropId || userData.username || "User");
            navigate("/", { replace: true });
          } else {
            throw new Error("No user profile received");
          }
        } catch (err) {
          console.error("OAuth exchange failed:", err);
          const msg =
            err.response?.data?.message ||
            err.response?.data?.error ||
            err.message ||
            "Authentication exchange failed.";
          showErrorToast(msg);
          navigate("/login", { replace: true });
        }
      };

      exchangeOAuthCode();
      return;
    }

    if (action !== "link_required" && !code && !error) {
      navigate("/login", { replace: true });
    }
  }, [code, action, error, navigate, setUser, checkAuth]);

  const handleLinkSubmit = async (e) => {
    e.preventDefault();
    if (submitting || !password.trim()) return;

    try {
      setSubmitting(true);
      const res = await api.post("/auth/oauth2/link", {
        token,
        password: password.trim(),
      });

      const userData = res.data?.data || res.data;
      if (userData) {
        setUser(userData);
        if (typeof checkAuth === "function") {
          await checkAuth();
        }
        showSuccessToast(
          "Account Linked Successfully",
          `Connected ${provider ? provider.toUpperCase() : "Social"} account to @${userData.hotdropId}`
        );
        navigate("/", { replace: true });
      } else {
        throw new Error("Unable to establish session");
      }
    } catch (err) {
      console.error("Account linking error:", err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Incorrect password. Failed to link account.";
      showErrorToast(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // If action is link_required, show password confirmation UI
  if (action === "link_required" && token) {
    const formattedProvider = provider
      ? provider.charAt(0).toUpperCase() + provider.slice(1).toLowerCase()
      : "OAuth Provider";

    return (
      <div className="relative min-h-screen overflow-hidden bg-slate-50 flex items-center justify-center px-4 py-8">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-200 blur-[120px] opacity-50"></div>
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-cyan-200 blur-[120px] opacity-40"></div>

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative z-10 w-full max-w-md"
        >
          <div className="mb-5 text-center">
            <h1 className="text-3xl font-black tracking-tight">
              <span className="text-orange-500">HOT</span>
              <span className="text-blue-600">DROP</span>
            </h1>
            <p className="mt-1 text-xs text-slate-500">Secure Account Association</p>
          </div>

          <div className="relative overflow-hidden rounded-[24px] border border-white/40 bg-white/85 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.08)] backdrop-blur-xl">
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-blue-50/80 border border-blue-100 text-blue-900 mb-5">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-200">
                <Link2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-sm">Link {formattedProvider} Account</div>
                <div className="text-xs text-blue-700 truncate">{email}</div>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              An existing HotDrop account was found for <strong>{email}</strong>. Enter your HotDrop password to verify ownership and connect your {formattedProvider} profile.
            </p>

            <form onSubmit={handleLinkSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  HotDrop Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your current password"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !password.trim()}
                className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 font-semibold text-white transition-all duration-300 ${
                  submitting || !password.trim()
                    ? "cursor-not-allowed bg-blue-400"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-200"
                }`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Linking Account...
                  </>
                ) : (
                  <>
                    Verify & Connect
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate("/login", { replace: true })}
                className="w-full py-2 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors text-center"
              >
                Cancel and return to login
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  // Loading state while code is being exchanged
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <ShieldCheck className="h-6 w-6 animate-pulse" />
          </div>
          <Loader2 className="h-14 w-14 absolute -top-1 -left-1 text-blue-600/30 animate-spin" />
        </div>
        <div className="text-center mt-2">
          <h2 className="text-sm font-bold text-slate-800">{loadingMessage}</h2>
          <p className="text-xs text-slate-500 mt-0.5">Please wait while HotDrop finalizes your session.</p>
        </div>
      </div>
    </div>
  );
};

export default OAuth2Redirect;
