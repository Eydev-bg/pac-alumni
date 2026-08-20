import { useEffect, useRef, useState } from "react";

/**
 * Tracks browser network connectivity.
 * Returns:
 *   status: "online" | "offline" | "reconnected"
 *
 * - Starts as "online" (no banner on first load).
 * - Flips to "offline" on the browser's "offline" event.
 * - Flips to "reconnected" on the "online" event (only if it was offline).
 * - "reconnected" auto-reverts to "online" after `reconnectedDuration` ms.
 */
export default function useNetworkStatus(reconnectedDuration = 4000) {
  const [status, setStatus] = useState("online");
  const wasOfflineRef = useRef(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const handleOffline = () => {
      clearTimeout(timerRef.current);
      wasOfflineRef.current = true;
      setStatus("offline");
    };

    const handleOnline = () => {
      if (!wasOfflineRef.current) return;
      wasOfflineRef.current = false;
      setStatus("reconnected");
      timerRef.current = setTimeout(() => {
        setStatus("online");
      }, reconnectedDuration);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    // If already offline when the hook mounts (e.g. page loaded from cache)
    if (!navigator.onLine) {
      wasOfflineRef.current = true;
      setStatus("offline");
    }

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      clearTimeout(timerRef.current);
    };
  }, [reconnectedDuration]);

  return status;
}
