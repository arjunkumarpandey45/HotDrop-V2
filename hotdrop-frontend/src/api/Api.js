import axios from "axios";

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
    const originalRequest = error.config;

    // Do NOT attempt token refresh on login, signup, refresh, logout, or public share endpoints
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

        // Retry original request
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