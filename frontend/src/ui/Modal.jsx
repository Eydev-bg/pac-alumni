import { useEffect, useRef, useCallback, useState, useId } from "react";
import { createPortal } from "react-dom";
import { HiOutlineXMark } from "react-icons/hi2";
import { cn } from "../utils/formatters";

/**
 * Modal — shared accessible modal shell.
 *
 * One foundation for every admin overlay (replaces the hand-rolled
 * `fixed inset-0` modals). Provides:
 *   - React portal into `document.body` (escapes stacking/overflow contexts)
 *   - backdrop + click-to-close, body scroll-lock, ESC-to-close
 *   - focus trap (queried live, so dynamically-added focusables are included)
 *     + focus restoration to the previously-focused element on close
 *   - enter/leave fade+scale transitions with unmount-after-exit
 *   - a dark navy panel matching the admin shell (the shared default)
 *   - a scrollable body with a fixed header + optional fixed footer
 *   - proper ARIA (role="dialog", aria-modal, aria-labelledby/describedby)
 *   - an optional loading overlay that blocks close while a submit is in flight
 *   - prefers-reduced-motion support (skips the transitions)
 *
 * Props:
 *   open:            boolean
 *   onClose:         (reason?: "backdrop" | "escape" | "closeButton") => void
 *   title:           optional header title (renders a header row + close button)
 *   footer:          optional node rendered in a fixed footer region
 *   size:            'sm' | 'md' | 'lg' | 'xl'  (default 'md')
 *   closeOnBackdrop: default true
 *   loading:         when true, shows a spinner overlay and blocks all closes
 *   initialFocusRef: optional ref to focus on open (else first focusable)
 *   describedBy:     optional id for aria-describedby (defaults to the body id)
 *   panelClassName:  escape hatch to override the default dark panel styling
 */
const SIZES = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

// Keep in sync with the transition duration below (ms) so the panel unmounts
// only after the leave animation has finished playing.
const EXIT_MS = 200;

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function usePrefersReducedMotion() {
  const [reduced] = useState(
    () =>
      typeof window !== "undefined" &&
      !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
  );
  return reduced;
}

export default function Modal({
  open,
  onClose,
  title,
  footer,
  size = "md",
  closeOnBackdrop = true,
  loading = false,
  initialFocusRef,
  describedBy,
  panelClassName,
  children,
}) {
  const panelRef = useRef(null);
  const restoreFocusRef = useRef(null);
  const reducedMotion = usePrefersReducedMotion();

  const titleId = useId();
  const bodyId = useId();

  // `mounted` keeps the panel in the DOM through the leave animation;
  // `visible` toggles the enter/leave transition classes.
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  const getFocusable = useCallback(
    () => Array.from(panelRef.current?.querySelectorAll(FOCUSABLE) || []),
    [],
  );

  // Close guarded by the loading state, tagging the reason for the caller.
  const requestClose = useCallback(
    (reason) => {
      if (loading) return;
      onClose?.(reason);
    },
    [loading, onClose],
  );

  // Mount immediately when opening.
  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  // Drive the enter/leave transition and unmount only after the exit finishes.
  useEffect(() => {
    if (!mounted) return undefined;
    if (open) {
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    setVisible(false);
    if (reducedMotion) {
      setMounted(false);
      return undefined;
    }
    const t = setTimeout(() => setMounted(false), EXIT_MS);
    return () => clearTimeout(t);
  }, [open, mounted, reducedMotion]);

  // Body scroll-lock while mounted.
  useEffect(() => {
    if (!mounted) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mounted]);

  // Save/restore focus and set the initial focus on open.
  useEffect(() => {
    if (!open) return undefined;
    restoreFocusRef.current = document.activeElement;
    const raf = requestAnimationFrame(() => {
      const focusTarget =
        initialFocusRef?.current || getFocusable()[0] || panelRef.current;
      focusTarget?.focus();
    });
    return () => {
      cancelAnimationFrame(raf);
      // Restore focus to whatever was focused before the modal opened.
      if (restoreFocusRef.current instanceof HTMLElement) {
        restoreFocusRef.current.focus();
      }
    };
  }, [open, initialFocusRef, getFocusable]);

  // ESC to close + Tab focus trap (focusables queried live on each key press,
  // so fields that appear/disappear mid-session are handled correctly).
  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        requestClose("escape");
        return;
      }
      if (e.key !== "Tab") return;

      const focusable = getFocusable();
      if (focusable.length === 0) {
        e.preventDefault();
        panelRef.current?.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      const insidePanel = panelRef.current?.contains(active);

      if (e.shiftKey && (active === first || !insidePanel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !insidePanel)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [open, requestClose, getFocusable]);

  if (!mounted) return null;

  const motion = reducedMotion ? "" : "transition-all duration-200";
  const hasChrome = Boolean(title || footer);

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 backdrop-blur-sm",
          reducedMotion ? "" : "transition-opacity duration-200",
          visible ? "opacity-100" : "opacity-0",
        )}
        onClick={closeOnBackdrop ? () => requestClose("backdrop") : undefined}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          aria-describedby={describedBy || bodyId}
          tabIndex={-1}
          className={cn(
            "relative w-full flex flex-col max-h-[calc(100vh-2rem)] rounded-2xl shadow-2xl focus:outline-none",
            motion,
            visible ? "opacity-100 scale-100" : "opacity-0 scale-95",
            SIZES[size] || SIZES.md,
            panelClassName || "bg-navy-850 border border-white/10 text-slate-200",
          )}
        >
          {title && (
            <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-white/[0.08] flex-shrink-0">
              <h3 id={titleId} className="text-lg font-bold text-white">
                {title}
              </h3>
              <button
                type="button"
                onClick={() => requestClose("closeButton")}
                aria-label="Close"
                className="text-slate-400 hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-white/20 rounded"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>
          )}

          <div
            id={bodyId}
            className={cn("overflow-y-auto", hasChrome ? "px-6 py-5" : "p-6")}
          >
            {children}
          </div>

          {footer && (
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.08] flex-shrink-0">
              {footer}
            </div>
          )}

          {loading && (
            <div
              className="absolute inset-0 rounded-2xl bg-navy-950/50 backdrop-blur-[1px] flex items-center justify-center"
              aria-hidden="true"
            >
              <span className="w-8 h-8 rounded-full border-2 border-gold-500 border-b-transparent animate-spin" />
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
