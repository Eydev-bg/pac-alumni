// ═══════════════════════════════════════════════════════════
//  FILE: frontend/src/pages/alumni/messages/AlumniInboxPage.jsx
//  Phase 3.3 — Two-panel inbox (conversation list + thread).
// ═══════════════════════════════════════════════════════════

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import alumniApi from "../../../api/alumniApi";
import useModalA11y from "../../../hooks/useModalA11y";
import useVisibilityPolling from "../../../hooks/useVisibilityPolling";
import { timeAgo, storageUrl } from "../../../utils/formatters";
import ConversationThread from "./ConversationThread";
import SkeletonCard from "../../../components/common/SkeletonCard";
import EmptyState from "../../../components/common/EmptyState";
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlinePencilSquare,
  HiOutlineMagnifyingGlass,
  HiOutlineXMark,
} from "react-icons/hi2";

const NAVY = "#1a2e5a";

/** Circle avatar with the first letter of the name. */
function Avatar({ name, picture, size = "w-11 h-11" }) {
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

const DESKTOP_QUERY = "(min-width: 1024px)";

export default function AlumniInboxPage() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [showCompose, setShowCompose] = useState(false);

  // 5B: reactive breakpoint — matches Tailwind's lg, and updates on
  // resize instead of being read once per click.
  const [isDesktop, setIsDesktop] = useState(
    () => window.matchMedia(DESKTOP_QUERY).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const onChange = (e) => setIsDesktop(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const load = useCallback((showSpinner = false) => {
    if (showSpinner) setLoading(true);
    alumniApi
      .getConversations()
      .then((res) => setConversations(res.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load(true);
  }, [load]);

  // Auto-refresh the conversation list every 30 seconds — paused while the
  // tab is hidden, catches up immediately on return.
  useVisibilityPolling(() => load(false), 30000);

  // Desktop opens the thread in the right panel; mobile navigates to the
  // standalone full-screen conversation page.
  const openConversation = useCallback(
    (id) => {
      if (!isDesktop) {
        navigate(`/alumni/messages/${id}`);
      } else {
        setSelectedId(id);
      }
    },
    [navigate, isDesktop],
  );

  // If a thread is open in the desktop panel when the viewport drops
  // below the breakpoint, hand it off to the standalone mobile page.
  useEffect(() => {
    if (!isDesktop && selectedId) {
      navigate(`/alumni/messages/${selectedId}`);
    }
  }, [isDesktop, selectedId, navigate]);

  const handleStarted = (conversation) => {
    setShowCompose(false);
    load(false);
    openConversation(conversation.id);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* ━━━━ Header ━━━━ */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-white"
            style={{ background: NAVY }}
          >
            <HiOutlineChatBubbleLeftRight className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Messages</h1>
            <p className="text-sm text-slate-500">Connect with fellow PAC alumni</p>
          </div>
        </div>
        <button
          onClick={() => setShowCompose(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium transition-opacity hover:opacity-90"
          style={{ background: "#c8a84e" }}
        >
          <HiOutlinePencilSquare className="w-4 h-4" />
          <span className="hidden sm:inline">New Message</span>
        </button>
      </div>

      {/* ━━━━ Two-panel layout ━━━━ */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex h-[calc(100dvh-220px)] min-h-[320px]">
          {/* ── Left: conversation list ── */}
          <div className="w-full lg:w-[360px] lg:border-r border-slate-200 flex flex-col">
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <SkeletonCard variant="conversation" count={5} />
              ) : conversations.length === 0 ? (
                <EmptyState
                  bare
                  icon={HiOutlineChatBubbleLeftRight}
                  title="No conversations yet"
                  message="Start a chat with a fellow alumnus."
                />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {conversations.map((c) => {
                    const isActive = c.id === selectedId;
                    const preview = c.last_message
                      ? `${c.last_message.is_mine ? "You: " : ""}${c.last_message.content}`
                      : "No messages yet";
                    return (
                      <li key={c.id}>
                        <button
                          onClick={() => openConversation(c.id)}
                          className={`w-full text-left flex items-center gap-3 px-4 py-3 transition-colors ${
                            isActive ? "bg-[#1a2e5a]/[0.06]" : "hover:bg-slate-50"
                          }`}
                        >
                          <Avatar
                            name={c.other_participant?.name}
                            picture={c.other_participant?.profile_picture}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`text-sm truncate ${
                                  c.unread_count > 0
                                    ? "font-bold text-slate-900"
                                    : "font-semibold text-slate-700"
                                }`}
                              >
                                {c.other_participant?.name}
                              </span>
                              {c.last_message_at && (
                                <span className="text-[0.65rem] text-slate-400 flex-shrink-0">
                                  {timeAgo(c.last_message_at)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between gap-2 mt-0.5">
                              <span
                                className={`text-xs truncate ${
                                  c.unread_count > 0
                                    ? "text-slate-700 font-medium"
                                    : "text-slate-400"
                                }`}
                              >
                                {preview}
                              </span>
                              {c.unread_count > 0 && (
                                <span
                                  className="flex-shrink-0 w-2.5 h-2.5 rounded-full"
                                  style={{ background: "#3b82f6" }}
                                  title={`${c.unread_count} unread`}
                                />
                              )}
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* ── Right: selected thread (desktop only) ── */}
          <div className="hidden lg:flex flex-1 flex-col">
            {selectedId ? (
              <ConversationThread
                conversationId={selectedId}
                onActivity={() => load(false)}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50">
                <HiOutlineChatBubbleLeftRight className="w-12 h-12 text-slate-300" />
                <p className="mt-3 text-sm font-medium text-slate-600">
                  Select a conversation
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Choose a conversation from the list to start chatting.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showCompose && (
        <NewMessageModal
          onClose={() => setShowCompose(false)}
          onStarted={handleStarted}
        />
      )}
    </div>
  );
}

/** Modal to search alumni and start (or reopen) a conversation. */
function NewMessageModal({ onClose, onStarted }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef(null);

  // Debounced recipient search.
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      alumniApi
        .searchMessageRecipients(search)
        .then((res) => setResults(res.data.data ?? []))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const start = async (recipient) => {
    if (starting) return;
    setStarting(true);
    setError("");
    try {
      const res = await alumniApi.startConversation(recipient.uuid);
      onStarted(res.data.data);
    } catch (err) {
      setError(err?.response?.data?.message || "Could not start conversation.");
      setStarting(false);
    }
  };

  const panelRef = useModalA11y(onClose);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 py-16">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-message-modal-title"
        tabIndex={-1}
        className="relative bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden focus:outline-none"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h3 id="new-message-modal-title" className="text-base font-bold text-slate-900">
            New Message
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1a2e5a]/30 transition-colors"
          >
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="relative">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              autoFocus
              aria-label="Search alumni by name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search alumni by name…"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e5a]/30 focus:border-[#1a2e5a]"
            />
          </div>

          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

          <div className="mt-3 max-h-72 overflow-y-auto">
            {loading ? (
              <p className="py-6 text-center text-sm text-slate-400">Searching…</p>
            ) : results.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">
                {search ? "No alumni found." : "Type a name to search."}
              </p>
            ) : (
              <ul className="space-y-1">
                {results.map((r) => (
                  <li key={r.uuid}>
                    <button
                      onClick={() => start(r)}
                      disabled={starting}
                      className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-50 transition-colors text-left disabled:opacity-50"
                    >
                      <Avatar name={r.name} picture={r.profile_picture} size="w-9 h-9" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {r.name}
                        </p>
                        {(r.course_code || r.graduation_year) && (
                          <p className="text-[0.7rem] text-slate-400 truncate">
                            {[r.course_code, r.graduation_year]
                              .filter(Boolean)
                              .join(" • ")}
                          </p>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
