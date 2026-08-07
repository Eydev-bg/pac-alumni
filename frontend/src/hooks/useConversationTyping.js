// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: frontend/src/hooks/useConversationTyping.js
// ═══════════════════════════════════════════════════════════
//
//  "Dave is responding…" typing indicator, built on the PRIVATE
//  conversation.{id} channel (the one already used for message delivery
//  and read receipts) via Pusher/Reverb client "whisper" events —
//  peer-to-peer through the WebSocket server, no backend round trip, no
//  DB write. No presence channel involved (see routes/channels.php for
//  why presence channels were dropped for this app).
//
// ═══════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from "react";
import { getEcho } from "../config/echo";
import { useAuth } from "./useAuth";

/** How long the "responding…" indicator stays up after the last
 * whisper, in case the other person paused without an explicit stop. */
const TYPING_TIMEOUT_MS = 4000;

/**
 * @param {number|null} conversationId
 * @param {string|undefined} otherUuid  Other participant's uuid, used to
 *                                      filter whispers in a 1:1 thread.
 */
export function useConversationTyping(conversationId, otherUuid) {
  const { user } = useAuth();
  const [isTyping, setIsTyping] = useState(false);
  const typingTimerRef = useRef(null);
  const channelRef = useRef(null);

  useEffect(() => {
    setIsTyping(false);
    if (!conversationId) return;

    const echo = getEcho();
    if (!echo) return;

    const channel = echo.private(`conversation.${conversationId}`);
    channelRef.current = channel;

    const onTyping = (payload) => {
      if (payload?.uuid !== otherUuid) return;
      setIsTyping(true);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        setIsTyping(false);
        typingTimerRef.current = null;
      }, TYPING_TIMEOUT_MS);
    };

    const onStoppedTyping = (payload) => {
      if (payload?.uuid !== otherUuid) return;
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = null;
      }
      setIsTyping(false);
    };

    channel.listenForWhisper("typing", onTyping);
    channel.listenForWhisper("stopped-typing", onStoppedTyping);

    return () => {
      channel.stopListeningForWhisper("typing", onTyping);
      channel.stopListeningForWhisper("stopped-typing", onStoppedTyping);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      channelRef.current = null;
      // Deliberately no echo.leave() — this is the same conversation.{id}
      // channel useRealtimeMessages/useRealtimeReadReceipts also listen on;
      // ConversationThread.jsx owns that channel's actual lifecycle.
    };
  }, [conversationId, otherUuid]);

  /** Call on every keystroke (already throttled by the caller). */
  const sendTyping = () => {
    channelRef.current?.whisper("typing", { uuid: user?.uuid });
  };

  /** Call when the input is cleared or the message is sent. */
  const sendStoppedTyping = () => {
    channelRef.current?.whisper("stopped-typing", { uuid: user?.uuid });
  };

  return { isTyping, sendTyping, sendStoppedTyping };
}
