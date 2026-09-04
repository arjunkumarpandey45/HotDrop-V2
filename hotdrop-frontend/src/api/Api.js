import axios from "axios";
import { showRateLimitToast } from "../toast/Toast";

const URL = import.meta.env.VITE_BACKEND_URL;

const API = axios.create({
  baseURL: URL,
  withCredentials: true,
  timeout: 15000,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

API.interceptors.request.use(
  (config) => {
    console.log(
      `🚀 ${config.method?.toUpperCase()} ${config.baseURL || ""}${config.url}`
    );
    return config;
  },
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response) => response,

  async (error) => {
    // 1. Intercept 429 Too Many Requests (Rate Limiting)
    if (error.response?.status === 429) {
      const data = error.response.data;
      let backendMsg = null;

      if (typeof data === "string" && data.trim()) {
        backendMsg = data.trim();
      } else if (data && typeof data === "object") {
        backendMsg = data.message || data.error || data.msg;
      }

      if (!backendMsg) {
        backendMsg =
          error.response.statusText ||
          "Rate limit exceeded. Please wait before trying again.";
      }

      showRateLimitToast(backendMsg);
      return Promise.reject(error);
    }

    const originalRequest = error.config;

    if (
      !originalRequest ||
      originalRequest.url?.includes("/auth/refresh") ||
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/signup") ||
      originalRequest.url?.includes("/auth/logout") ||
      originalRequest.url?.includes("/auth/forgot-password") ||
      originalRequest.url?.includes("/auth/verify-otp") ||
      originalRequest.url?.includes("/posts/share") ||
      originalRequest.url?.includes("/posts/share-post") ||
      originalRequest.url?.includes("/posts/get-post-by-postId")
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => API(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log("🔄 Access Token Expired. Refreshing via /auth/refresh...");

        const refreshRes = await API.post("/auth/refresh");

        console.log("✅ Token Refreshed Successfully:", refreshRes.data?.message || "200 OK");
        processQueue(null, refreshRes);
        isRefreshing = false;

        return API(originalRequest);
      } catch (refreshError) {
        console.warn("❌ Refresh Token Expired or Invalid");
        processQueue(refreshError, null);
        isRefreshing = false;
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default API;