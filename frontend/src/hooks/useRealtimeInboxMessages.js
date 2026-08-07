// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: frontend/src/hooks/useRealtimeInboxMessages.js
// ═══════════════════════════════════════════════════════════
//
//  Subscribes to the current user's private `user.{uuid}` channel for
//  `message.created` events (see MessageSent::broadcastOn() — the second
//  channel it broadcasts on, alongside conversation.{id}). This is what
//  drives the inbox list (AlumniInboxPage.jsx): resorting by latest
//  activity and bumping the unread dot even when the relevant thread
//  isn't open.
//
//  Deliberately a SEPARATE channel/hook from useRealtimeNotifications,
//  even though both ride a `user.{uuid}` private channel — notifications
//  and messages are broadcast as distinct event names (`notification.created`
//  vs `message.created`) so each concern stays independently wireable.
//
// ═══════════════════════════════════════════════════════════

import { useEffect, useRef } from "react";
import { useAuth } from "./useAuth";
import { getEcho } from "../config/echo";

export function useRealtimeInboxMessages(onMessage) {
  const { user } = useAuth();
  const callbackRef = useRef(onMessage);
  callbackRef.current = onMessage;

  useEffect(() => {
    if (!user?.uuid) return;

    const echo = getEcho();
    if (!echo) return;

    const channel = echo.private(`user.${user.uuid}`);
    const handler = (payload) => callbackRef.current(payload);

    channel.listen(".message.created", handler);

    return () => {
      channel.stopListening(".message.created", handler);
      // Deliberately no echo.leave() here: useRealtimeNotifications also
      // subscribes to this same `user.{uuid}` channel (for a different
      // event) and may still be active elsewhere in the tree. Only remove
      // this hook's own listener; let whichever hook subscribed last /
      // unmounts last own the channel's lifecycle.
    };
  }, [user?.uuid]);
}
