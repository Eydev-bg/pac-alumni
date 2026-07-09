import { createContext, useState, useCallback, useMemo, useRef } from "react";
import ToastViewport from "../ui/Toast";

export const ToastContext = createContext(null);

// Default auto-dismiss window (ms). Named so it is not a magic number and can
// be tuned in one place; individual calls may override via opts.duration.
const DEFAULT_DURATION = 5000;

// Cap on simultaneously-rendered toasts. Extra toasts stay in the list but are
// not rendered by the viewport until a visible one is dismissed (queue).
const MAX_VISIBLE = 3;

/**
 * ToastProvider — app-wide toast/notification host.
 *
 * Mounted once at the app root (above the router) so `useToast()` is available
 * in every tree. Surfaces the API's `{ message }` to the user; failures are no
 * longer swallowed silently.
 *
 * The exposed `toast` helper is back-compatible:
 *   toast.success(message, opts?)   toast.error(message, opts?)
 *   toast.warning(message, opts?)   toast.info(message, opts?)
 * and additively richer:
 *   opts = { duration, title, action: { label, onClick } }
 *   toast.loading(message, opts?) -> id           (persistent spinner toast)
 *   toast.update(id, { type, message, ... })      (resolve a loading toast)
 *   toast.dismiss(id)
 *
 * Behaviour: auto-dismiss + pause-on-hover + progress bar (in the viewport),
 * a capped number of visible toasts with the rest queued, and duplicate
 * collapsing (an identical type+title+message toast is ignored while shown).
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const update = useCallback((id, patch) => {
    setToasts((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              ...patch,
              // Resolving a loading toast: stop the spinner and (re)start the
              // auto-dismiss countdown unless the caller specifies otherwise.
              loading: patch.loading ?? false,
              duration: patch.duration ?? DEFAULT_DURATION,
              // Drop the dedupe key so the resolved toast can't collide.
              dedupeKey: undefined,
            }
          : t,
      ),
    );
  }, []);

  const show = useCallback((type, message, opts = {}) => {
    const isLoading = type === "loading" || !!opts.loading;
    if (!message && !isLoading) return undefined;

    const dedupeKey = `${type}|${opts.title || ""}|${message}`;
    let resultId;

    setToasts((prev) => {
      // Duplicate detection: ignore an identical non-loading toast already shown.
      const existing = prev.find((t) => t.dedupeKey === dedupeKey && !t.loading);
      if (existing) {
        resultId = existing.id;
        return prev;
      }
      const id = ++idRef.current;
      resultId = id;
      const toast = {
        id,
        type,
        message,
        title: opts.title,
        action: opts.action, // { label, onClick }
        loading: isLoading,
        duration: opts.duration ?? (isLoading ? 0 : DEFAULT_DURATION),
        dedupeKey,
      };
      return [...prev, toast];
    });

    return resultId;
  }, []);

  // Stable helper object so consumers memoized on `toast` don't churn.
  const toast = useMemo(
    () => ({
      success: (message, opts) => show("success", message, opts),
      error: (message, opts) => show("error", message, opts),
      warning: (message, opts) => show("warning", message, opts),
      info: (message, opts) => show("info", message, opts),
      loading: (message, opts) =>
        show("loading", message || "Loading…", { ...opts, loading: true }),
      update: (id, patch) => update(id, patch),
      dismiss: (id) => dismiss(id),
    }),
    [show, update, dismiss],
  );

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport
        toasts={toasts}
        maxVisible={MAX_VISIBLE}
        onDismiss={dismiss}
      />
    </ToastContext.Provider>
  );
}
