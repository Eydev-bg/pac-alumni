// ═══════════════════════════════════════════════════════════
//  FILE: frontend/src/hooks/useVisibilityPolling.js
//  Background-aware polling — interval only runs while the tab
//  is visible; pauses on hidden, catches up + resumes on return.
// ═══════════════════════════════════════════════════════════

import { useEffect, useRef } from "react";

/**
 * Run `callback` every `delay` ms, but only while the document is visible.
 * When the tab is hidden the interval is cleared; when it becomes visible
 * again the callback fires immediately (to catch up) and the interval
 * restarts. All timers and listeners are cleaned up on unmount.
 *
 * @param {Function} callback  Poll function. Kept in a ref — callers do not
 *                             need to memoize it.
 * @param {number}   delay     Interval in milliseconds.
 * @param {Object}   [options]
 * @param {boolean}  [options.enabled=true]  When false, no polling at all.
 * @param {boolean}  [options.leading=false] Also fire once immediately on
 *                                           mount (if the tab is visible).
 */
export default function useVisibilityPolling(
  callback,
  delay,
  { enabled = true, leading = false } = {},
) {
  const savedCallback = useRef(callback);
  savedCallback.current = callback;

  useEffect(() => {
    if (!enabled) return undefined;

    let intervalId = null;
    const tick = () => savedCallback.current();

    const start = () => {
      if (intervalId === null) intervalId = setInterval(tick, delay);
    };
    const stop = () => {
      clearInterval(intervalId);
      intervalId = null;
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        tick();
        start();
      } else {
        stop();
      }
    };

    if (document.visibilityState === "visible") {
      if (leading) tick();
      start();
    }

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [delay, enabled, leading]);
}
