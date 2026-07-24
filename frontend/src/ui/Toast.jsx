import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineInformationCircle,
  HiOutlineXCircle,
  HiOutlineXMark,
} from "react-icons/hi2";
import { cn } from "../utils/formatters";

/**
 * Toast viewport + item.
 *
 * Presentational only — state lives in ToastProvider. Rendered via a portal into
 * `document.body` and stacked top-right. Each item:
 *   - announces via role="alert" (assertive: error/warning) or role="status"
 *     (polite: success/info/loading), inside an aria-live region
 *   - animates in/out (fade + slide), respecting prefers-reduced-motion
 *   - auto-dismisses on a timer that pauses on hover/focus, with a visible
 *     countdown progress bar kept in sync
 *   - supports an optional bold title, an optional action button, and a
 *     loading variant (spinner, no auto-dismiss) that can later resolve
 */
const TYPES = {
  success: {
    icon: HiOutlineCheckCircle,
    ring: "ring-emerald-500/20",
    iconColor: "text-emerald-400",
    bar: "bg-emerald-400",
    assertive: false,
  },
  error: {
    icon: HiOutlineXCircle,
    ring: "ring-red-500/20",
    iconColor: "text-red-400",
    bar: "bg-red-400",
    assertive: true,
  },
  warning: {
    icon: HiOutlineExclamationTriangle,
    ring: "ring-amber-500/20",
    iconColor: "text-amber-400",
    bar: "bg-amber-400",
    assertive: true,
  },
  info: {
    icon: HiOutlineInformationCircle,
    ring: "ring-blue-500/20",
    iconColor: "text-blue-400",
    bar: "bg-blue-400",
    assertive: false,
  },
  loading: {
    icon: null,
    ring: "ring-gold-500/20",
    iconColor: "text-gold-500",
    bar: "bg-gold-500",
    assertive: false,
  },
};

// Keep in sync with the leave transition duration below (ms).
const EXIT_MS = 200;

function ToastItem({ toast, onDismiss, reducedMotion }) {
  const { id, type, message, title, action, loading, duration } = toast;
  const meta = TYPES[type] || TYPES.info;
  const Icon = meta.icon;

  const [entered, setEntered] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [paused, setPaused] = useState(false);

  const timerRef = useRef(null);
  const startRef = useRef(0);
  const remainingRef = useRef(duration);

  // Begin the leave animation; actual removal happens after it finishes.
  const beginLeave = useCallback(() => setLeaving(true), []);

  // Enter animation on mount.
  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // With reduced motion there is no transition to wait on — remove immediately.
  useEffect(() => {
    if (leaving && reducedMotion) onDismiss(id);
  }, [leaving, reducedMotion, id, onDismiss]);

  // Reset the remaining time whenever the lifetime changes (e.g. a loading
  // toast resolves to success/error with a fresh duration).
  useEffect(() => {
    remainingRef.current = duration;
  }, [duration, loading]);

  // Auto-dismiss timer with pause-on-hover/focus.
  useEffect(() => {
    if (loading || duration <= 0 || leaving) return undefined;
    if (paused) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
        remainingRef.current -= Date.now() - startRef.current;
      }
      return undefined;
    }
    startRef.current = Date.now();
    timerRef.current = setTimeout(
      beginLeave,
      Math.max(remainingRef.current, 0),
    );
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [paused, loading, duration, leaving, beginLeave]);

  const handleTransitionEnd = () => {
    if (leaving) onDismiss(id);
  };

  const pause = () => setPaused(true);
  const resume = () => setPaused(false);

  const motion = reducedMotion ? "" : "transition-all duration-200";
  const showBar = !reducedMotion && !loading && duration > 0 && !leaving;

  return (
    <div
      role={meta.assertive ? "alert" : "status"}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
      onTransitionEnd={handleTransitionEnd}
      className={cn(
        "pointer-events-auto relative overflow-hidden flex items-start gap-3 w-80 max-w-[calc(100vw-2rem)] rounded-xl shadow-xl ring-1 p-4 bg-navy-850 border border-white/10 dark:bg-slate-800 dark:border-slate-700",
        meta.ring,
        motion,
        entered && !leaving
          ? "opacity-100 translate-x-0"
          : "opacity-0 translate-x-4",
      )}
    >
      {loading ? (
        <span
          className={cn(
            "w-5 h-5 flex-shrink-0 mt-0.5 rounded-full border-2 border-current border-b-transparent animate-spin",
            meta.iconColor,
          )}
          aria-hidden="true"
        />
      ) : (
        Icon && (
          <Icon className={cn("w-5 h-5 flex-shrink-0 mt-0.5", meta.iconColor)} />
        )
      )}

      <div className="flex-1 min-w-0">
        {title && (
          <p className="text-sm font-semibold text-white leading-snug break-words">
            {title}
          </p>
        )}
        <p
          className={cn(
            "text-sm text-slate-300 leading-snug break-words",
            title && "mt-0.5",
          )}
        >
          {message}
        </p>
        {action?.label && (
          <button
            type="button"
            onClick={() => {
              action.onClick?.();
              beginLeave();
            }}
            className="mt-2 text-xs font-semibold text-gold-500 hover:text-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-500/40 rounded"
          >
            {action.label}
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={beginLeave}
        aria-label="Dismiss"
        className="flex-shrink-0 text-slate-400 hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-white/20 rounded"
      >
        <HiOutlineXMark className="w-4 h-4" />
      </button>

      {showBar && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/[0.06]">
          <div
            key={duration}
            className={cn("h-full origin-left", meta.bar)}
            style={{
              animation: `toastProgress ${duration}ms linear forwards`,
              animationPlayState: paused ? "paused" : "running",
            }}
          />
        </div>
      )}
    </div>
  );
}

export default function ToastViewport({ toasts, maxVisible = 3, onDismiss }) {
  const [reducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
  );

  if (typeof document === "undefined") return null;

  // Render only up to `maxVisible`; the rest stay queued in the provider until
  // a visible toast is dismissed and the slice shifts.
  const visible = toasts.slice(0, maxVisible);

  return createPortal(
    <div
      className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-atomic="false"
    >
      {visible.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={onDismiss}
          reducedMotion={reducedMotion}
        />
      ))}
    </div>,
    document.body,
  );
}
