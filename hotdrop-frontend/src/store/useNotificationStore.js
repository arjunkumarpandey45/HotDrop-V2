import { create } from "zustand";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client/dist/sockjs.min.js";
import API from "../api/Api";

let stompClient = null;
let pollTimer = null;

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  isDropdownOpen: false,
  hasFetched: false,

  setIsDropdownOpen: (isOpen) => set({ isDropdownOpen: isOpen }),
  toggleDropdown: () => set((state) => ({ isDropdownOpen: !state.isDropdownOpen })),

  fetchNotifications: async (page = 0, size = 20) => {
    try {
      set({ isLoading: true });
      const res = await API.get("/notifications", {
        params: { page, size },
      });

      const payload = res.data?.data || res.data;
      const list = payload?.content || payload?.notifications || (Array.isArray(payload) ? payload : []);

      set((state) => {
        if (page === 0) {
          return {
            notifications: list,
            isLoading: false,
            hasFetched: true,
          };
        }
        const map = new Map(state.notifications.map((n) => [n.id, n]));
        list.forEach((n) => map.set(n.id, n));
        return {
          notifications: Array.from(map.values()),
          isLoading: false,
          hasFetched: true,
        };
      });
    } catch (error) {
      console.warn("Could not fetch notifications:", error?.message);
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const res = await API.get("/notifications/unread-count");
      const payload = res.data?.data || res.data;
      const count = typeof payload === "number" ? payload : payload?.unreadCount || 0;
      set({ unreadCount: Math.max(0, count) });
    } catch (error) {
      console.warn("Could not fetch unread count:", error?.message);
    }
  },

  markAsRead: async (notificationId) => {
    if (!notificationId) return;

    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === notificationId ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));

    try {
      await API.put(`/notifications/${notificationId}/read`);
    } catch (error) {
      console.warn("Failed to mark notification as read on server:", error?.message);
    }
  },

  markAllAsRead: async () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));

    try {
      await API.put("/notifications/mark-all-read");
    } catch (error) {
      console.warn("Failed to mark all as read on server:", error?.message);
    }
  },

  addNotification: (notification) => {
    if (!notification) return;

    set((state) => {
      const exists = state.notifications.some((n) => n.id === notification.id);
      if (exists) return state;

      return {
        notifications: [notification, ...state.notifications],
        unreadCount: state.unreadCount + (notification.isRead ? 0 : 1),
      };
    });
  },

  initSocket: (user) => {
    if (!user || !user.hotdropId) return;

    get().fetchUnreadCount();
    get().fetchNotifications(0, 20);

    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(() => {
      get().fetchUnreadCount();
    }, 30000);

    if (stompClient && stompClient.connected) return;

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";
      const socketUrl = backendUrl.endsWith("/") ? `${backendUrl}ws` : `${backendUrl}/ws`;

      const client = new Client({
        webSocketFactory: () => new SockJS(socketUrl),
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        debug: (str) => {
          if (import.meta.env.DEV) {
            console.log("📡 [STOMP]:", str);
          }
        },
        onConnect: () => {
          client.subscribe("/user/queue/notifications", (message) => {
            try {
              const body = JSON.parse(message.body);
              get().addNotification(body);
            } catch (err) {
              console.error("Failed to parse realtime notification payload:", err);
            }
          });

          client.subscribe(`/user/${user.hotdropId}/queue/notifications`, (message) => {
            try {
              const body = JSON.parse(message.body);
              get().addNotification(body);
            } catch (err) {
              console.error("Failed to parse realtime notification payload:", err);
            }
          });
        },
        onStompError: (frame) => {
          console.warn("STOMP error:", frame.headers?.["message"]);
        },
        onWebSocketError: (event) => {
          console.warn("WebSocket error:", event);
        },
      });

      client.activate();
      stompClient = client;
    } catch (err) {
      console.warn("WebSocket setup failed, falling back to polling:", err?.message);
    }
  },

  disconnectSocket: () => {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    if (stompClient) {
      try {
        stompClient.deactivate();
      } catch (err) {
        console.warn("Error deactivating stomp client:", err);
      }
      stompClient = null;
    }
  },
}));