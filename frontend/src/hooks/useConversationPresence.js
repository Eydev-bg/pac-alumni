// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: frontend/src/hooks/useConversationPresence.js
// ═══════════════════════════════════════════════════════════
//
//  Joins the conversation's presence channel (see
//  Broadcast::presence('conversation-presence.{id}') in
//  routes/channels.php) to power two things in ConversationThread.jsx:
//
//    1. The other participant's online green dot — derived from whether
//       their uuid is currently a member of the presence channel.
//    2. The "((●)) Dave is responding…" typing indicator — a client
//       "whisper" event, sent peer-to-peer through Reverb with no
//       backend round trip, so it stays cheap and truly ephemeral
//       (nothing is persisted; a dropped connection just stops the dots).
//
//  Online status keeps a short grace period on disconnect (see
//  GRACE_MS below) so a brief network hiccup or tab-switch doesn't
//  instantly flash the dot to offline.
//
// ═══════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from "react";
import { getEcho } from "../config/echo";
import { useAuth } from "./useAuth";

/** How long to keep showing "online" after a presence .leaving event,
 * in case it's a brief reconnect rather than a real disconnect. */
const GRACE_MS = 8000;

/** How long the "responding…" indicator stays up after the last
 * whisper, in case the other person paused without an explicit stop. */
const TYPING_TIMEOUT_MS = 4000;

/**
 * @param {number|null} conversationId
 * @param {string|undefined} otherUuid  The other participant's uuid — used
 *                                      to filter presence members/whispers
 *                                      down to "just them" for a 1:1 thread.
 */
export function useConversationPresence(conversationId, otherUuid) {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const graceTimerRef = useRef(null);
  const typingTimerRef = useRef(null);
  const channelRef = useRef(null);

  useEffect(() => {
    setIsOnline(false);
    setIsTyping(false);
    if (!conversationId || !otherUuid) return;

    const echo = getEcho();
    if (!echo) return;

    const channel = echo.join(`conversation-presence.${conversationId}`);
    channelRef.current = channel;

    const clearGrace = () => {
      if (graceTimerRef.current) {
        clearTimeout(graceTimerRef.current);
        graceTimerRef.current = null;
      }
    };

    channel
      .here((members) => {
        clearGrace();
        setIsOnline(members.some((m) => m.uuid === otherUuid));
      })
      .joining((member) => {
        if (member.uuid !== otherUuid) return;
        clearGrace();
        setIsOnline(true);
      })
      .leaving((member) => {
        if (member.uuid !== otherUuid) return;
        // Grace period: don't flip to offline immediately — a page
        // refresh or brief network drop looks identical to actually leaving.
        clearGrace();
        graceTimerRef.current = setTimeout(() => {
          setIsOnline(false);
          graceTimerRef.current = null;
        }, GRACE_MS);
      })
      .listenForWhisper("typing", (payload) => {
        if (payload?.uuid !== otherUuid) return;
        setIsTyping(true);
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
          setIsTyping(false);
          typingTimerRef.current = null;
        }, TYPING_TIMEOUT_MS);
      })
      .listenForWhisper("stopped-typing", (payload) => {
        if (payload?.uuid !== otherUuid) return;
        if (typingTimerRef.current) {
          clearTimeout(typingTimerRef.current);
          typingTimerRef.current = null;
        }
        setIsTyping(false);
      });

    return () => {
      clearGrace();
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      echo.leave(`conversation-presence.${conversationId}`);
      channelRef.current = null;
    };
  }, [conversationId, otherUuid]);

  /** Call on every keystroke (already debounced by the caller). */
  const sendTyping = () => {
    channelRef.current?.whisper("typing", { uuid: user?.uuid });
  };

  /** Call when the input is cleared or the message is sent. */
  const sendStoppedTyping = () => {
    channelRef.current?.whisper("stopped-typing", { uuid: user?.uuid });
  };

  return { isOnline, isTyping, sendTyping, sendStoppedTyping };
}
