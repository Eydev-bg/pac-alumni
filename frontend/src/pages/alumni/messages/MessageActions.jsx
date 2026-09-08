// ═══════════════════════════════════════════════════════════
//  FILE: frontend/src/pages/alumni/messages/MessageActions.jsx
//  The per-bubble delete menu and its destructive confirm step.
//
//  Both render as one overlay that is a bottom sheet on a phone (thumb
//  reach, full-width rows, safe-area padding) and a small centred card
//  from `sm:` up. Anchoring to the bubble was deliberately avoided — a
//  popover next to a right-aligned bubble is what overflows narrow
//  screens, and a fixed overlay also makes "close on outside tap" and
//  focus trapping trivial. Same backdrop/Escape/scroll-lock conventions
//  as ImageLightbox.
// ═══════════════════════════════════════════════════════════

import { useEffect, useRef } from "react";
import {
  HiOutlineEyeSlash,
  HiOutlineNoSymbol,
  HiOutlineExclamationTriangle,
} from "react-icons/hi2";

/**
 * Shared shell: backdrop + responsive panel, Escape to close, focus moved
 * into the panel on open and body scroll locked while it's up.
 */
function Overlay({ label, onClose, children }) {
  const panelRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Move focus into the panel so Tab stays here and screen readers
    // announce the dialog rather than staying on the bubble behind it.
    const id = requestAnimationFrame(() => panelRef.current?.focus());
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      cancelAnimationFrame(id);
    };
  }, [onClose]);

  // Panel is a floating sheet on a phone (thumb reach, safe-area aware) and a
  // small centred card from `sm:` up. Its width is capped so the overlay can
  // never be the thing that makes a narrow screen scroll sideways.
  return (
    <div
      className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center p-2 sm:p-4 bg-black/40 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[26rem] sm:w-[22rem] mb-[env(safe-area-inset-bottom)] sm:mb-0 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 outline-none overflow-hidden"
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Messenger's two delete options. "Unsend" is only rendered when the
 * message is the viewer's own — the backend enforces the same rule with a
 * 403, this just keeps the option out of sight.
 */
export function MessageActionSheet({
  canUnsend,
  onRemoveForMe,
  onUnsend,
  onClose,
}) {
  return (
    <Overlay label="Message options" onClose={onClose}>
      <div className="p-2">
        <button
          type="button"
          onClick={onRemoveForMe}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-slate-100 dark:focus:bg-slate-700 focus:outline-none transition-colors"
        >
          <HiOutlineEyeSlash className="w-5 h-5 flex-shrink-0 text-slate-400" />
          <span className="min-w-0">
            <span className="block">Remove for you</span>
            <span className="block text-[0.7rem] font-normal text-slate-400">
              Hidden from your chat only
            </span>
          </span>
        </button>

        {canUnsend && (
          <button
            type="button"
            onClick={onUnsend}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 focus:bg-red-50 dark:focus:bg-red-500/10 focus:outline-none transition-colors"
          >
            <HiOutlineNoSymbol className="w-5 h-5 flex-shrink-0" />
            <span className="min-w-0">
              <span className="block">Unsend</span>
              <span className="block text-[0.7rem] font-normal text-red-400/80">
                Removed for everyone
              </span>
            </span>
          </button>
        )}
      </div>

      <div className="px-2 pb-2 sm:pb-2">
        <button
          type="button"
          onClick={onClose}
          className="w-full px-4 py-3 rounded-xl text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-slate-100 dark:focus:bg-slate-700 focus:outline-none transition-colors"
        >
          Cancel
        </button>
      </div>
    </Overlay>
  );
}

/** Destructive confirm shown before an unsend actually fires. */
export function ConfirmUnsendDialog({ onConfirm, onCancel, busy }) {
  return (
    <Overlay label="Unsend message" onClose={busy ? () => {} : onCancel}>
      <div className="p-5">
        <span className="w-11 h-11 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-3">
          <HiOutlineExclamationTriangle className="w-6 h-6 text-red-500" />
        </span>
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
          Unsend this message?
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          It will be removed for everyone in this chat. Any attached photo or
          file is deleted too. This can&rsquo;t be undone.
        </p>

        <div className="mt-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-slate-100 dark:focus:bg-slate-700 focus:outline-none transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 focus:bg-red-700 focus:outline-none transition-colors disabled:opacity-60"
          >
            {busy ? "Unsending…" : "Unsend"}
          </button>
        </div>
      </div>
    </Overlay>
  );
}
