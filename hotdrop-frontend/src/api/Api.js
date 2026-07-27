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

    // Agar access token expire ho gaya
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;

      try {
        console.log("🔄 Access Token Expired. Refreshing...");

        // Refresh token cookie automatically jayegi
        await API.post("/auth/refresh");

        console.log("✅ Token Refreshed");

        // Original request dubara chalegi
        return API(originalRequest);
      } catch (refreshError) {
        console.log("❌ Refresh Token Expired");

        // Login page par bhej do
        window.location.href = "/login";

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default API;