// ═══════════════════════════════════════════════════════════
//  FILE: frontend/src/context/AdminUnreadContext.jsx
//  Single source of truth for the Admin notification badge.
//  Mirrors UnreadContext (the alumni equivalent) so both the
//  Header bell and NotificationsPage read/write the same count
//  instead of Header keeping its own local, disconnected state.
// ═══════════════════════════════════════════════════════════

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import adminApi from "../api/adminApi";
import { useAuth } from "../hooks/useAuth";
import { useRealtimeNotifications } from "../hooks/useRealtimeNotifications";
import { useToast } from "../hooks/useToast";

const AdminUnreadContext = createContext(null);

/**
 * Mounted once in AdminLayout. Polls the admin notification count every
 * 60s, bumps it instantly on realtime push, and exposes decrement/refetch
 * so any admin page (e.g. NotificationsPage) can keep the bell badge in
 * sync the moment it marks something read.
 */
export function AdminUnreadProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const [notifications, setNotifications] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (user?.role !== "admin") return;
    try {
      const res = await adminApi.getUnreadCount();
      setNotifications(res.data.data.count ?? 0);
    } catch {
      // silently ignore — count stays at previous value
    }
  }, [user?.role]);

  useEffect(() => {
    if (user?.role !== "admin") return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [user?.role, fetchUnreadCount]);

  // Real-time push: bump the count instantly when the backend broadcasts
  // a new notification, instead of waiting for the next 60s poll.
  useRealtimeNotifications((payload) => {
    if (user?.role === "admin") {
      setNotifications((c) => c + 1);
      toast.info(payload.title || "New notification");
    }
  });

  // Optimistic bell update when a notification is marked read.
  const decrementNotifications = useCallback((by = 1) => {
    setNotifications((c) => Math.max(0, c - by));
  }, []);

  const value = useMemo(
    () => ({
      notifications,
      decrementNotifications,
      refetchNotifications: fetchUnreadCount,
    }),
    [notifications, decrementNotifications, fetchUnreadCount],
  );

  return (
    <AdminUnreadContext.Provider value={value}>
      {children}
    </AdminUnreadContext.Provider>
  );
}

/**
 * Returns the admin unread count, or `null` when no provider is mounted.
 */
export function useAdminUnread() {
  return useContext(AdminUnreadContext);
}
