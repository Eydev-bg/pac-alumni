import { useEffect, useRef } from "react";

// Same selector as ui/Modal.jsx — keep the two in sync.
const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * useModalA11y — keyboard accessibility for hand-rolled modals that keep
 * their own markup (trap/Escape logic adapted from ui/Modal.jsx).
 *
 * The consuming modal component mounts only while open, so mount/unmount
 * maps to open/close. Attach the returned ref to the modal panel element
 * (give it tabIndex={-1}) and set role="dialog", aria-modal="true", and
 * aria-labelledby in the caller's JSX — the hook adds behavior only:
 *
 *   - Escape → onClose
 *   - Tab / Shift+Tab focus trap (focusables queried live on each press,
 *     so fields that appear/disappear mid-session are handled)
 *   - Focuses the first focusable element on open, unless something inside
 *     the panel already has focus (preserves autoFocus inputs)
 *   - Restores focus to the previously focused element on close
 *   - Removes all listeners on unmount
 */
export default function useModalA11y(onClose) {
  const panelRef = useRef(null);

  // Initial focus on open + focus restoration on close (mount/unmount).
  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const panel = panelRef.current;
    // Skip if focus already landed inside (e.g. an autoFocus input) — the
    // autoFocus attribute applies at commit time, before effects run.
    if (panel && !panel.contains(document.activeElement)) {
      const first = panel.querySelector(FOCUSABLE);
      (first || panel).focus();
    }
    return () => {
      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus();
      }
    };
  }, []);

  // Escape to close + Tab focus trap.
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      const panel = panelRef.current;
      const focusable = Array.from(panel?.querySelectorAll(FOCUSABLE) || []);
      if (focusable.length === 0) {
        e.preventDefault();
        panel?.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      const insidePanel = panel?.contains(active);

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
  }, [onClose]);

  return panelRef;
}
