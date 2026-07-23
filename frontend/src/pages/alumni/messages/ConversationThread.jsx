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
// Shared avatar (person-icon fallback) — single source of truth for the header
// and the per-group message avatars.
import { Avatar } from "../../../components/alumni/ui";
import {
  HiOutlineArrowLeft,
  HiOutlinePaperAirplane,
  HiOutlineUserCircle,
} from "react-icons/hi2";

const MAX_LEN = 1000;

/** Short, friendly bubble timestamp (e.g. "3:45 PM"). */
function bubbleTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Renders a single conversation's messages with an input bar.
 *
 * @param {number}   conversationId  Conversation to display.
 * @param {Function} [onBack]        If provided, shows a back button (mobile).
 * @param {Function} [onActivity]    Called after load/send so the parent inbox
 *                                   can refresh ordering + unread badges.
 */
export default function ConversationThread({ conversationId, onBack, onActivity }) {
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
  // catches up immediately on return.
  useVisibilityPolling(() => load(false), 30000, {
    enabled: !!conversationId,
  });

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
        setError("You're sending messages too quickly. Please try again later.");
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
            title={other?.name ? `View ${other.name}'s profile` : "View profile"}
            className="flex items-center gap-3 min-w-0 flex-1 text-left rounded-xl px-1 -mx-1 py-0.5 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <Avatar src={other.profile_picture} name={other.name} size="sm" />
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-slate-900 truncate">
                {other.name}
              </h2>
              {(other.course_code || other.graduation_year) && (
                <p className="text-[0.7rem] text-slate-400 truncate">
                  {[other.course_code, other.graduation_year]
                    .filter(Boolean)
                    .join(" • ")}
                </p>
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
          <p className="text-center text-sm text-slate-400 mt-6">Loading messages…</p>
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
                    {own && m._status === "sending"
                      ? "Sending…"
                      : own && m._status === "failed"
                        ? <span className="text-red-500">Failed to send</span>
                        : bubbleTime(m.created_at)}
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
            onChange={(e) => setContent(e.target.value.slice(0, MAX_LEN))}
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
