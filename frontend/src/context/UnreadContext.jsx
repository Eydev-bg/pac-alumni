// ═══════════════════════════════════════════════════════════
//  FILE: frontend/src/context/UnreadContext.jsx
//  Single polling source for the Alumni unread counts
//  (messages, announcements, notifications). Consumed by the
//  Header bell and the AlumniLayout sidebar badges so each
//  count is fetched by exactly one background-aware interval.
// ═══════════════════════════════════════════════════════════

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import alumniApi from "../api/alumniApi";
import { useRealtimeNotifications } from "../hooks/useRealtimeNotifications";
import useVisibilityPolling from "../hooks/useVisibilityPolling";

const UnreadContext = createContext(null);

/**
 * Mounted once in AlumniLayout. Keeps the pre-existing cadences:
 * messages every 30s, announcements + notifications every 60s.
 */
export function UnreadProvider({ children }) {
  const [messages, setMessages] = useState(0);
  const [announcements, setAnnouncements] = useState(0);
  const [notifications, setNotifications] = useState(0);

  const fetchMessages = useCallback(() => {
    alumniApi
      .getMessagesUnreadCount()
      .then((res) => setMessages(res.data.data.unread_count))
      .catch((err) => {
        if (import.meta.env.DEV)
          console.error("Unread messages poll failed:", err);
      });
  }, []);

  const fetchAnnouncementsAndNotifications = useCallback(() => {
    alumniApi
      .getAnnouncementsUnreadCount()
      .then((res) => setAnnouncements(res.data.data.unread_count))
      .catch((err) => {
        if (import.meta.env.DEV)
          console.error("Unread announcements poll failed:", err);
      });
    alumniApi
      .getUnreadCount()
      .then((res) => setNotifications(res.data.data.count ?? 0))
      .catch((err) => {
        if (import.meta.env.DEV)
          console.error("Unread notifications poll failed:", err);
      });
  }, []);

  useVisibilityPolling(fetchMessages, 30000, { leading: true });
  useVisibilityPolling(fetchAnnouncementsAndNotifications, 60000, {
    leading: true,
  });

  // Optimistic bell update when a notification is opened/marked read.
  // Optimistic bell update when a notification is opened/marked read.
  const decrementNotifications = useCallback(() => {
    setNotifications((c) => Math.max(0, c - 1));
  }, []);

  // Real-time push: bump the count instantly when the backend broadcasts
  // a new notification, instead of waiting for the next 60s poll.
  useRealtimeNotifications(() => {
    setNotifications((c) => c + 1);
  });

  const value = useMemo(
    () => ({ messages, announcements, notifications, decrementNotifications }),
    [messages, announcements, notifications, decrementNotifications],
  );

  return (
    <UnreadContext.Provider value={value}>{children}</UnreadContext.Provider>
  );
}

/**
 * Returns the unread counts, or `null` when no provider is mounted
 * (e.g. the shared Header rendered inside the admin layout).
 */
export function useUnread() {
  return useContext(UnreadContext);
}
