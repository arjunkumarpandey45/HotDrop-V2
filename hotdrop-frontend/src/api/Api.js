import axios from "axios";

const URL = import.meta.env.VITE_BACKEND_URL;

const API = axios.create({
  baseURL: URL,
  withCredentials: true,
  timeout: 10000,
});


API.interceptors.request.use(
  (config) => {
    console.log(
      `🚀 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`
    );
    return config;
  },
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

  
    if (
      !originalRequest ||
      originalRequest.url?.includes("/auth/refresh") ||
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/signup") ||
      originalRequest.url?.includes("/users/me") // 👈 ADDED THIS: /users/me failing is normal for guests!
    ) {
      return Promise.reject(error);
    }

    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        console.log("🔄 Access Token Expired. Refreshing...");

       
        await API.post("/auth/refresh");

        console.log("✅ Token Refreshed Successfully");

   
        return API(originalRequest);
      } catch (refreshError) {
        console.warn("❌ Refresh Token Expired or Invalid");

        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default API;