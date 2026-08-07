// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: frontend/src/hooks/useRealtimeReadReceipts.js
// ═══════════════════════════════════════════════════════════
//
//  Subscribes to a conversation's private Echo channel (the same
//  conversation.{id} channel useRealtimeMessages uses) and invokes
//  `onRead` whenever the backend broadcasts a `messages.read` event
//  (see MessagesRead::broadcastAs(), dispatched from
//  MessageService::messages() when the other participant opens the
//  thread). Lets a sent bubble flip "Sent" -> "Read • 2:14 PM" live.
//
//  Kept as its own hook (rather than folded into useRealtimeMessages)
//  so each event type stays independently testable/wireable — the two
//  hooks simply both call echo.private() for the same channel name,
//  which Echo resolves to the same underlying subscription.
//
// ═══════════════════════════════════════════════════════════

import { useEffect, useRef } from "react";
import { getEcho } from "../config/echo";

/**
 * @param {number|null} conversationId
 * @param {Function}    onRead  Called with { conversation_id, reader_id,
 *                              message_ids, read_at }.
 */
export function useRealtimeReadReceipts(conversationId, onRead) {
  const callbackRef = useRef(onRead);
  callbackRef.current = onRead;

  useEffect(() => {
    if (!conversationId) return;

    const echo = getEcho();
    if (!echo) return;

    const channel = echo.private(`conversation.${conversationId}`);
    const handler = (payload) => callbackRef.current(payload);

    channel.listen(".messages.read", handler);

    return () => {
      channel.stopListening(".messages.read", handler);
      // Deliberately no echo.leave() here — useRealtimeMessages subscribes
      // to this same conversation.{id} channel for a different event and
      // may still be mounted. Only remove this hook's own listener.
    };
  }, [conversationId]);
}
