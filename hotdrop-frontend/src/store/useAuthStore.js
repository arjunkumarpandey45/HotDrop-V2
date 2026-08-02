import { create } from "zustand";
import api from "../api/Api";

// --- 🎨 UI STORE ---
export const useUIStore = create((set) => ({
  isCreatePostOpen: false,
  openCreatePost: () => set({ isCreatePostOpen: true }),
  closeCreatePost: () => set({ isCreatePostOpen: false }),
}));

// --- 🔐 AUTH STORE ---
export const useAuthStore = create((set, get) => ({
  user: null,
  userPosts: [],
  isLoggedIn: false,
  isCheckingAuth: true, // Initial app load state

  // Helper Setter for updating partial user profile data
  setUser: (updatedUser) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updatedUser } : updatedUser,
    })),

  // --- 🔄 LOCAL COUNTER UPDATE ---
  updatePostCountLocally: (newPost = null) => {
    set((state) => {
      const updatedPosts = newPost ? [newPost, ...(state.userPosts || [])] : (state.userPosts || []);
      return {
        user: state.user
          ? {
              ...state.user,
              postCount: (state.user.postCount || 0) + 1,
              posts: updatedPosts,
            }
          : null,
        userPosts: updatedPosts,
      };
    });
  },

  // --- 🔑 LOGIN ACTION ---
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

      const payload = res.data?.data || res.data;
      const userData = payload?.user || payload;
      const postsData = payload?.posts || userData?.posts || [];

      const fullUserObj = userData ? { ...userData, posts: postsData } : null;

      // 🎯 Set state directly and stay logged in
      set({
        user: fullUserObj,
        userPosts: postsData,
        isLoggedIn: true,
        isCheckingAuth: false,
      });

      return {
        success: true,
        ...userData,
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

  // --- 🛡️ CHECK AUTH ACTION ---
  checkAuth: async () => {
    const currentPath = window.location.pathname;

    // 💡 GUARD 1: Prevent loop on auth pages
    if (currentPath.startsWith("/login") || currentPath.startsWith("/signup")) {
      set({ user: null, userPosts: [], isLoggedIn: false, isCheckingAuth: false });
      return;
    }

    // 💡 GUARD 2: If user is already authenticated in store, don't re-fetch
    if (get().isLoggedIn && get().user) {
      set({ isCheckingAuth: false });
      return;
    }

    set({ isCheckingAuth: true });

    try {
      const res = await api.get("/users/me");

      const payload = res.data?.data || res.data;
      const userData = payload?.user || payload;
      const postsData = payload?.posts || userData?.posts || [];

      if (userData && (userData.id || userData._id || userData.hotdropId)) {
        const fullUserObj = { ...userData, posts: postsData };
        set({
          user: fullUserObj,
          userPosts: postsData,
          isLoggedIn: true,
          isCheckingAuth: false,
        });
      } else {
        throw new Error("Invalid User Payload received");
      }
    } catch (error) {
      console.warn("Auth check failed, falling back to guest mode:", error?.message);
      set({
        user: null,
        userPosts: [],
        isLoggedIn: false,
        isCheckingAuth: false,
      });
    }
  },

  // --- 🚪 LOGOUT ACTION ---
  logout: async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout Error:", error);
    } finally {
      set({
        user: null,
        userPosts: [],
        isLoggedIn: false,
        isCheckingAuth: false,
      });
    }
  },
}));