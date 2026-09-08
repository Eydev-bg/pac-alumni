// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: frontend/src/hooks/useRealtimeMessageUnsent.js
// ═══════════════════════════════════════════════════════════
//
//  Subscribes to a conversation's private Echo channel and invokes
//  `onUnsent` with { conversation_id, message_id, unsent_at } whenever
//  the backend broadcasts `message.unsent` (see MessageUnsent::broadcastAs()),
//  so the OTHER participant's open thread swaps the bubble for the
//  "This message was unsent." placeholder without waiting for the poll.
//
//  Same shape as useRealtimeMessages / useRealtimeReadReceipts, and the
//  same caveat: this conversation.{id} channel is shared by all three
//  hooks, so cleanup here removes only THIS hook's listener and
//  deliberately does not echo.leave() the channel — ConversationThread.jsx
//  owns the channel's actual lifecycle.
//
// ═══════════════════════════════════════════════════════════

import { useEffect, useRef } from "react";
import { getEcho } from "../config/echo";

/**
 * @param {number|null} conversationId  Conversation to listen on. Pass null
 *                                      to skip subscribing.
 * @param {Function}    onUnsent        Called with the raw payload.
 */
export function useRealtimeMessageUnsent(conversationId, onUnsent) {
  const callbackRef = useRef(onUnsent);
  callbackRef.current = onUnsent;

  useEffect(() => {
    if (!conversationId) return;

    const echo = getEcho();
    if (!echo) return;

    const channel = echo.private(`conversation.${conversationId}`);
    const handler = (payload) => callbackRef.current(payload);

    channel.listen(".message.unsent", handler);

    return () => {
      channel.stopListening(".message.unsent", handler);
    };
  }, [conversationId]);
}
