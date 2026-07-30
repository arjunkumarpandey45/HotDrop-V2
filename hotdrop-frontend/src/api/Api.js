import axios from "axios";

const URL = import.meta.env.VITE_BACKEND_URL;

const API = axios.create({
  baseURL: URL,
  withCredentials: true,
  timeout: 10000,
});

// Request Interceptor
API.interceptors.request.use(
  (config) => {
    console.log(
      `🚀 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`
    );
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
API.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // 💡 GUARD 1: Agar endpoint khud auth refresh ya login/signup ho, to retry loop me mat ghuso
    if (
      !originalRequest ||
      originalRequest.url?.includes("/auth/refresh") ||
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/signup")
    ) {
      return Promise.reject(error);
    }

    // 💡 GUARD 2: Agar Access token expire hua ho (401 status code)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        console.log("🔄 Access Token Expired. Refreshing...");

        // Cookie path parameters ke sath refresh endpoint call
        await API.post("/auth/refresh");

        console.log("✅ Token Refreshed Successfully");

        // Original request retry karo
        return API(originalRequest);
      } catch (refreshError) {
        console.warn("❌ Refresh Token Expired or Invalid");

        // 💡 FIX: Force window.location.href REPLACEMENT ki jagah safe state clear karo
        // Isse browser infinite reload loop se bach jata hai
        if (!window.location.pathname.startsWith("/login")) {
          window.location.replace("/login");
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default API;