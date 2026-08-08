// ═══════════════════════════════════════════════════════════
//  FILE: frontend/src/pages/alumni/messages/ConversationThread.jsx
//  Phase 3.3 — Shared chat thread view (used by the inbox right
//  panel AND the standalone mobile conversation page).
// ═══════════════════════════════════════════════════════════

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import alumniApi from "../../../api/alumniApi";
import { useAuth } from "../../../hooks/useAuth";
import useVisibilityPolling from "../../../hooks/useVisibilityPolling";
import { useRealtimeMessages } from "../../../hooks/useRealtimeMessages";
import { useRealtimeReadReceipts } from "../../../hooks/useRealtimeReadReceipts";
import { useConversationTyping } from "../../../hooks/useConversationTyping";
import { getEcho } from "../../../config/echo";
// Shared avatar (person-icon fallback) — single source of truth for the header
// and the per-group message avatars.
import { Avatar } from "../../../components/alumni/ui";
import {
  HiOutlineArrowLeft,
  HiOutlinePaperAirplane,
  HiOutlineUserCircle,
} from "react-icons/hi2";

const MAX_LEN = 1000;
// How often (ms) a "typing" whisper is sent while the user keeps typing —
// not on every keystroke, just enough to keep the other side's 4s
// TYPING_TIMEOUT_MS (see useConversationTyping) topped up.
const TYPING_WHISPER_INTERVAL_MS = 2000;

/** Short, friendly bubble timestamp (e.g. "3:45 PM"). */
function bubbleTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** "Read • 2:14 PM" label for a read own-message; null while unread. */
function readLabel(m) {
  if (!m.is_read || !m.read_at) return null;
  return `Read • ${bubbleTime(m.read_at)}`;
}

/** How recent counts as "available" — matches the backend's
 * TrackLastActive throttle window with a little slack for polling gaps. */
const AVAILABLE_WINDOW_MS = 2 * 60 * 1000;

/**
 * Simple online-status label derived from `last_active_at` — no presence
 * channel, just "was this person recently active" (see
 * app/Http/Middleware/TrackLastActive.php). Returns null if there's no
 * timestamp yet (e.g. they've never loaded a page since this shipped).
 */
function onlineStatusLabel(lastActiveAt) {
  if (!lastActiveAt) return null;
  const diffMs = Date.now() - new Date(lastActiveAt).getTime();
  if (diffMs < 0) return "🟢 Available";
  if (diffMs < AVAILABLE_WINDOW_MS) return "🟢 Available";

  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `Active ${mins} minute${mins === 1 ? "" : "s"} ago`;

  const hours = Math.round(mins / 60);
  if (hours < 24) return `Active ${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.round(hours / 24);
  return `Active ${days} day${days === 1 ? "" : "s"} ago`;
}

/**
 * Renders a single conversation's messages with an input bar.
 *
 * @param {number}   conversationId  Conversation to display.
 * @param {Function} [onBack]        If provided, shows a back button (mobile).
 * @param {Function} [onActivity]    Called after load/send so the parent inbox
 *                                   can refresh ordering + unread badges.
 */
export default function ConversationThread({
  conversationId,
  onBack,
  onActivity,
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [other, setOther] = useState(null);
  const [messages, setMessages] = useState([]);
  const [pending, setPending] = useState([]); // optimistic msgs awaiting the server
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const bottomRef = useRef(null);
  const onActivityRef = useRef(onActivity);
  onActivityRef.current = onActivity;

  const scrollToBottom = useCallback((behavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior });
  }, []);

  // Prefer the server's is_mine flag, but fall back to comparing the sender's
  // uuid to the current user's — so a message the viewer sent always renders on
  // the right even if a refetch returns an inconsistent flag.
  const isOwnMessage = (m) =>
    typeof m.is_mine === "boolean"
      ? m.is_mine
      : String(m.sender?.uuid ?? "") === String(user?.uuid ?? "");

  const load = useCallback(
    (showSpinner = false) => {
      if (!conversationId) return;
      if (showSpinner) setLoading(true);
      alumniApi
        .getMessages(conversationId)
        .then((res) => {
          const data = res.data.data;
          setOther(data.conversation?.other_participant ?? null);
          setMessages(data.messages ?? []);
          // Opening a thread marks it read on the server — refresh badges.
          onActivityRef.current?.();
        })
        .catch(() => setError("Failed to load this conversation."))
        .finally(() => setLoading(false));
    },
    [conversationId],
  );

  // Initial load + reload whenever the selected conversation changes.
  useEffect(() => {
    setLoading(true);
    setError("");
    load(true);
  }, [conversationId, load]);

  // Auto-refresh every 30 seconds — paused while the tab is hidden,
  // catches up immediately on return. Kept as a fallback safety net
  // alongside the realtime listener below (covers reconnect gaps).
  useVisibilityPolling(() => load(false), 30000, {
    enabled: !!conversationId,
  });

  // Real-time: append the other participant's message the instant it's
  // broadcast, instead of waiting for the next 30s poll. Our own sent
  // messages already land via handleSend's optimistic flow, so skip them
  // here to avoid a duplicate bubble.
  useRealtimeMessages(conversationId, (payload) => {
    if (String(payload.sender?.uuid ?? "") === String(user?.uuid ?? "")) {
      return;
    }
    setMessages((prev) =>
      prev.some((m) => m.id === payload.id) ? prev : [...prev, payload],
    );
    // The other party's message just arrived while this thread is open.
    // getMessages() is also what marks it read server-side (see
    // MessageService::messages()) — silent reload reconciles our locally
    // appended bubble with the server copy and clears the unread flag,
    // then refreshes the inbox list/badges via onActivity.
    load(false);
  });

  // Real-time: flip our own sent bubbles from "Sent" to "Read • 2:14 PM"
  // the instant the other participant opens the thread and reads them.
  useRealtimeReadReceipts(conversationId, (payload) => {
    const ids = new Set(payload.message_ids ?? []);
    if (ids.size === 0) return;
    setMessages((prev) =>
      prev.map((m) =>
        ids.has(m.id) ? { ...m, is_read: true, read_at: payload.read_at } : m,
      ),
    );
  });

  // useRealtimeMessages and useRealtimeReadReceipts both listen on the same
  // conversation.{id} private channel but (deliberately) don't leave() it on
  // their own cleanup, since either could unmount while the other is still
  // active. This effect owns the channel's actual lifecycle: subscribe once
  // per conversation, leave once when the thread closes or switches.
  useEffect(() => {
    if (!conversationId) return;
    const echo = getEcho();
    if (!echo) return;
    echo.private(`conversation.${conversationId}`);
    return () => {
      echo.leave(`conversation.${conversationId}`);
    };
  }, [conversationId]);

  // Real-time typing indicator ("responding…") via whisper on the private
  // conversation channel — see useConversationTyping's docblock for why
  // there's no presence channel involved.
  const { isTyping, sendTyping, sendStoppedTyping } = useConversationTyping(
    conversationId,
    other?.uuid,
  );

  // Simple online status, derived from the other participant's
  // last_active_at (refreshed on every load()/poll — no live socket
  // needed for this, a couple of minutes of staleness is fine for
  // "recently active").
  const onlineLabel = onlineStatusLabel(other?.last_active_at);
  const isOnline = onlineLabel === "🟢 Available";

  // Throttle outgoing "typing" whispers — send at most once per
  // TYPING_WHISPER_INTERVAL_MS while the user keeps typing, not on every
  // keystroke.
  const lastTypingSentRef = useRef(0);
  const handleContentChange = (e) => {
    const value = e.target.value.slice(0, MAX_LEN);
    setContent(value);

    if (!value.trim()) {
      sendStoppedTyping();
      return;
    }
    const now = Date.now();
    if (now - lastTypingSentRef.current >= TYPING_WHISPER_INTERVAL_MS) {
      lastTypingSentRef.current = now;
      sendTyping();
    }
  };

  // Auto-scroll to the latest message when the list grows (including when an
  // optimistic bubble is added to `pending`).
  useEffect(() => {
    scrollToBottom(loading ? "auto" : "smooth");
  }, [messages, pending, loading, scrollToBottom]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = content.trim();
    if (!text || sending) return;

    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      content: text,
      is_mine: true, // always mine — this is the local user's message
      created_at: new Date().toISOString(),
      _status: "sending", // "sending" | "failed"
    };

    setPending((prev) => [...prev, optimistic]);
    setContent(""); // clear input immediately (Messenger behaviour)
    sendStoppedTyping();
    setSending(true);
    setError("");

    try {
      const res = await alumniApi.sendMessage(conversationId, text);
      const saved = res.data.data;
      // Remove the optimistic copy and append the server message (de-duped).
      setPending((prev) => prev.filter((p) => p.id !== tempId));
      setMessages((prev) =>
        prev.some((x) => x.id === saved.id) ? prev : [...prev, saved],
      );
      onActivityRef.current?.();
    } catch (err) {
      // Mark the optimistic bubble as failed so it stays visible on the right.
      setPending((prev) =>
        prev.map((p) => (p.id === tempId ? { ...p, _status: "failed" } : p)),
      );
      if (err?.response?.status === 429) {
        setError(
          "You're sending messages too quickly. Please try again later.",
        );
      } else {
        setError(
          err?.response?.data?.message || "Failed to send. Please try again.",
        );
      }
    } finally {
      setSending(false);
    }
  };

  // Pending (optimistic) bubbles always render after the confirmed messages.
  const allMessages = [...messages, ...pending];

  return (
    <div className="flex flex-col h-full min-h-0 bg-white">
      {/* ── Header ── */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white">
        {onBack && (
          <button
            onClick={onBack}
            className="p-1.5 -ml-1.5 rounded-full text-slate-500 hover:bg-slate-100 transition-colors"
            aria-label="Back"
          >
            <HiOutlineArrowLeft className="w-5 h-5" />
          </button>
        )}
        {other ? (
          <button
            type="button"
            onClick={() =>
              other?.uuid && navigate(`/alumni/directory/${other.uuid}`)
            }
            title={
              other?.name ? `View ${other.name}'s profile` : "View profile"
            }
            className="flex items-center gap-3 min-w-0 flex-1 text-left rounded-xl px-1 -mx-1 py-0.5 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <span className="relative flex-shrink-0">
              <Avatar src={other.profile_picture} name={other.name} size="sm" />
              {isOnline && (
                <span
                  className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 ring-2 ring-white"
                  aria-label="Online"
                  title="Online"
                />
              )}
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-slate-900 truncate">
                {other.name}
              </h2>
              {isTyping ? (
                <p className="text-[0.7rem] text-blue-600 font-medium truncate flex items-center gap-1">
                  <span className="inline-flex gap-0.5" aria-hidden="true">
                    <span className="w-1 h-1 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.2s]" />
                    <span className="w-1 h-1 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.1s]" />
                    <span className="w-1 h-1 rounded-full bg-blue-600 animate-bounce" />
                  </span>
                  {other.name?.split(" ")[0] || "They"} is responding…
                </p>
              ) : isOnline ? (
                // Online is already shown by the green dot on the avatar —
                // no need to repeat it as text here too.
                (other.course_code || other.graduation_year) && (
                  <p className="text-[0.7rem] text-slate-400 truncate">
                    {[other.course_code, other.graduation_year]
                      .filter(Boolean)
                      .join(" • ")}
                  </p>
                )
              ) : onlineLabel ? (
                <p className="text-[0.7rem] text-slate-400 truncate">
                  {onlineLabel}
                </p>
              ) : (
                (other.course_code || other.graduation_year) && (
                  <p className="text-[0.7rem] text-slate-400 truncate">
                    {[other.course_code, other.graduation_year]
                      .filter(Boolean)
                      .join(" • ")}
                  </p>
                )
              )}
            </div>
          </button>
        ) : (
          <div className="h-9 flex items-center text-sm text-slate-400">
            <HiOutlineUserCircle className="w-6 h-6 mr-2" /> Conversation
          </div>
        )}
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-5 space-y-3 bg-slate-50">
        {loading ? (
          <p className="text-center text-sm text-slate-400 mt-6">
            Loading messages…
          </p>
        ) : allMessages.length === 0 ? (
          <p className="text-center text-sm text-slate-400 mt-6">
            No messages yet. Say hello! 👋
          </p>
        ) : (
          allMessages.map((m, i) => {
            const own = isOwnMessage(m);
            // A message is the LAST of its group when the next message is from a
            // different sender (or there is no next message).
            const next = allMessages[i + 1];
            const isLastOfGroup = !next || isOwnMessage(next) !== own;
            // Sent/Read status only makes sense on the very last message in
            // the whole thread (Messenger-style) — showing it on every own
            // bubble would be noisy and redundant.
            const isLastOverall = i === allMessages.length - 1;
            return (
              <div
                key={m.id}
                className={`flex items-end gap-2 ${
                  own ? "justify-end" : "justify-start"
                }`}
              >
                {!own &&
                  (isLastOfGroup ? (
                    <button
                      type="button"
                      onClick={() =>
                        other?.uuid &&
                        navigate(`/alumni/directory/${other.uuid}`)
                      }
                      title={
                        other?.name
                          ? `View ${other.name}'s profile`
                          : "View profile"
                      }
                      className="flex-shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    >
                      <Avatar
                        src={other?.profile_picture}
                        name={other?.name}
                        size="xs"
                      />
                    </button>
                  ) : (
                    // Spacer so grouped bubbles stay aligned with the avatar row.
                    <span className="w-7 flex-shrink-0" aria-hidden="true" />
                  ))}
                <div className="max-w-[75%]">
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                      own
                        ? "bg-blue-600 text-white rounded-br-md"
                        : "bg-white text-slate-700 border border-slate-200 rounded-bl-md"
                    } ${m._status === "sending" ? "opacity-70" : ""}`}
                  >
                    {m.content}
                  </div>
                  <p
                    className={`mt-1 text-[0.65rem] text-slate-400 ${
                      own ? "text-right" : "text-left"
                    }`}
                  >
                    {own && m._status === "sending" ? (
                      "Sending…"
                    ) : own && m._status === "failed" ? (
                      <span className="text-red-500">Failed to send</span>
                    ) : own && isLastOverall ? (
                      (readLabel(m) ?? "Sent")
                    ) : (
                      bubbleTime(m.created_at)
                    )}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ── */}
      <div className="border-t border-slate-200 bg-white px-3 py-3">
        {error && (
          <p className="px-1 pb-2 text-[0.72rem] text-red-600">{error}</p>
        )}
        <form onSubmit={handleSend} className="flex items-end gap-2">
          <textarea
            value={content}
            onChange={handleContentChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
            rows={1}
            placeholder="Type a message…"
            className="flex-1 resize-none rounded-2xl border border-slate-300 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30 focus:border-[#2563eb] max-h-32"
          />
          <button
            type="submit"
            disabled={!content.trim() || sending}
            className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-white bg-blue-600 transition-opacity disabled:opacity-40"
            aria-label="Send"
          >
            <HiOutlinePaperAirplane className="w-5 h-5" />
          </button>
        </form>
        <p className="px-1 pt-1 text-right text-[0.62rem] text-slate-300">
          {content.length}/{MAX_LEN}
        </p>
      </div>
    </div>
  );
}
