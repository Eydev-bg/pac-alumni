// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: frontend/src/hooks/useRealtimeNotifications.js
// ═══════════════════════════════════════════════════════════
//
//  Subscribes to the current user's private Echo channel and invokes
//  `onNotification` with the raw notification payload whenever the
//  backend broadcasts a `notification.created` event. Handles
//  subscribe/unsubscribe across login state and user changes.
//
// ═══════════════════════════════════════════════════════════

import { useEffect, useRef } from "react";
import { useAuth } from "./useAuth";
import { getEcho } from "../config/echo";

export function useRealtimeNotifications(onNotification) {
  const { user } = useAuth();
  const callbackRef = useRef(onNotification);
  callbackRef.current = onNotification;

  useEffect(() => {
    if (!user?.uuid) return;

    const echo = getEcho();
    if (!echo) return;

    const channel = echo.private(`user.${user.uuid}`);
    const handler = (payload) => callbackRef.current(payload);

    channel.listen(".notification.created", handler);

    return () => {
      channel.stopListening(".notification.created", handler);
      echo.leave(`user.${user.uuid}`);
    };
  }, [user?.uuid]);
}
