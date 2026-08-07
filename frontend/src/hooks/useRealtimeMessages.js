// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: frontend/src/hooks/useRealtimeMessages.js
// ═══════════════════════════════════════════════════════════
//
//  Subscribes to a conversation's private Echo channel and invokes
//  `onMessage` with the raw message payload whenever the backend
//  broadcasts a `message.created` event (see MessageSent::broadcastAs()).
//  Handles subscribe/unsubscribe across conversation changes, same shape
//  as useRealtimeNotifications but scoped to one conversation at a time.
//
//  NOTE: this conversation.{id} channel is also used by
//  useRealtimeReadReceipts (a different event on the same channel), so
//  cleanup here only removes THIS hook's own listener — it deliberately
//  does not echo.leave() the channel, which would tear down the other
//  hook's subscription too if both are mounted (as they are together in
//  ConversationThread.jsx).
//
// ═══════════════════════════════════════════════════════════

import { useEffect, useRef } from "react";
import { getEcho } from "../config/echo";

/**
 * @param {number|null} conversationId  Conversation to listen on. Pass null
 *                                      to skip subscribing (e.g. no thread open).
 * @param {Function}    onMessage       Called with the raw message payload.
 */
export function useRealtimeMessages(conversationId, onMessage) {
  const callbackRef = useRef(onMessage);
  callbackRef.current = onMessage;

  useEffect(() => {
    if (!conversationId) return;

    const echo = getEcho();
    if (!echo) return;

    const channel = echo.private(`conversation.${conversationId}`);
    const handler = (payload) => callbackRef.current(payload);

    channel.listen(".message.created", handler);

    return () => {
      channel.stopListening(".message.created", handler);
    };
  }, [conversationId]);
}
