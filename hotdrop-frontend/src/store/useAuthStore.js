import { create } from "zustand";
import api from "../api/Api";
export const useUIStore = create((set) => ({
  isCreatePostOpen: false,
  openCreatePost: () => set({ isCreatePostOpen: true }),
  closeCreatePost: () => set({ isCreatePostOpen: false }),
}));
export const useAuthStore = create((set) => ({
  user: null,
  isLoggedIn: false,
  isCheckingAuth: false,

  updatePostCountLocally: () => {
    set((state) => ({
      user: state.user
        ? {
            ...state.user,
            postCount: (state.user.postCount || 0) + 1,
          }
        : null,
    }));
  },

  login: async (identifier, password) => {
    try {
      const hotdropIdOrEmail = identifier.trim();

      if (!hotdropIdOrEmail || !password) {
        return {
          success: false,
          message: "Please enter your Email/HotDrop ID and Password.",
        };
      }

      const res = await api.post("/auth/login", {
        hotdropIdOrEmail,
        password,
      });

      const user = res.data.data;

      set({
        user,
        isLoggedIn: true,
        isCheckingAuth: false,
      });

      return {
        success: true,
        ...user,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Login failed",
      };
    }
  },

  checkAuth: async () => {
    set({ isCheckingAuth: true });

    try {
      const res = await api.get("/users/me");

      const user = res.data.data.user ?? res.data.data;

      set({
        user,
        isLoggedIn: true,
        isCheckingAuth: false,
      });
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      set({
        user: null,
        isLoggedIn: false,
        isCheckingAuth: false,
      });
    }
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout Error:", error);
    } finally {
      set({
        user: null,
        isLoggedIn: false,
        isCheckingAuth: false,
      });
    }
  },
}));