// ═══════════════════════════════════════════════════════════
//  FILE: frontend/src/pages/alumni/messages/ConversationThread.jsx
//  Phase 3.3 — Shared chat thread view (used by the inbox right
//  panel AND the standalone mobile conversation page).
// ═══════════════════════════════════════════════════════════

import { useCallback, useEffect, useRef, useState } from "react";
import alumniApi from "../../../api/alumniApi";
import useVisibilityPolling from "../../../hooks/useVisibilityPolling";
import { storageUrl } from "../../../utils/formatters";
import {
  HiOutlineArrowLeft,
  HiOutlinePaperAirplane,
  HiOutlineUserCircle,
} from "react-icons/hi2";

const NAVY = "#1a2e5a";
const GOLD = "#c8a84e";
const MAX_LEN = 1000;

/** Short, friendly bubble timestamp (e.g. "3:45 PM"). */
function bubbleTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Circle avatar with the first letter of the name. */
function Avatar({ name, picture, size = "w-10 h-10" }) {
  const letter = (name || "?").trim().charAt(0).toUpperCase();
  if (picture) {
    return (
      <img
        src={storageUrl(picture)}
        alt={name}
        className={`${size} rounded-full object-cover flex-shrink-0`}
      />
    );
  }
  return (
    <div
      className={`${size} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}
      style={{ background: NAVY }}
    >
      {letter}
    </div>
  );
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
  const [other, setOther] = useState(null);
  const [messages, setMessages] = useState([]);
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

  // Auto-scroll to the latest message when the list grows.
  useEffect(() => {
    scrollToBottom(loading ? "auto" : "smooth");
  }, [messages, loading, scrollToBottom]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = content.trim();
    if (!text || sending) return;

    setSending(true);
    setError("");
    try {
      const res = await alumniApi.sendMessage(conversationId, text);
      setMessages((prev) => [...prev, res.data.data]);
      setContent("");
      onActivityRef.current?.();
    } catch (err) {
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

  return (
    <div className="flex flex-col h-full bg-white">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white">
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
          <>
            <Avatar name={other.name} picture={other.profile_picture} size="w-9 h-9" />
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
          </>
        ) : (
          <div className="h-9 flex items-center text-sm text-slate-400">
            <HiOutlineUserCircle className="w-6 h-6 mr-2" /> Conversation
          </div>
        )}
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3 bg-slate-50">
        {loading ? (
          <p className="text-center text-sm text-slate-400 mt-6">Loading messages…</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-slate-400 mt-6">
            No messages yet. Say hello! 👋
          </p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.is_mine ? "justify-end" : "justify-start"}`}
            >
              <div className="max-w-[75%]">
                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    m.is_mine
                      ? "text-white rounded-br-md"
                      : "bg-white text-slate-700 border border-slate-200 rounded-bl-md"
                  }`}
                  style={m.is_mine ? { background: NAVY } : undefined}
                >
                  {m.content}
                </div>
                <p
                  className={`mt-1 text-[0.65rem] text-slate-400 ${
                    m.is_mine ? "text-right" : "text-left"
                  }`}
                >
                  {bubbleTime(m.created_at)}
                </p>
              </div>
            </div>
          ))
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
            className="flex-1 resize-none rounded-2xl border border-slate-300 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1a2e5a]/30 focus:border-[#1a2e5a] max-h-32"
          />
          <button
            type="submit"
            disabled={!content.trim() || sending}
            className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-white transition-opacity disabled:opacity-40"
            style={{ background: GOLD }}
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
