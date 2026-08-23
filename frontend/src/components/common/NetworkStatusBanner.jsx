import {
  HiOutlineExclamationTriangle,
  HiOutlineCheckCircle,
} from "react-icons/hi2";
import useNetworkStatus from "../../hooks/useNetworkStatus";

/**
 * NetworkStatusBanner — global, fixed-to-top alert shown when the browser goes
 * offline, plus a brief "back online" confirmation once the connection returns.
 * Rendered at the app root so it covers auth, alumni and admin pages alike.
 * Renders nothing while the connection is healthy.
 */
export default function NetworkStatusBanner() {
  const status = useNetworkStatus();

  if (status === "online") return null;

  const isOffline = status === "offline";

  return (
    <div
      role="alert"
      className={`fixed top-0 inset-x-0 z-[9999] flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium shadow-sm transition-colors ${
        isOffline
          ? "bg-amber-50 text-amber-800 border-b border-amber-200 dark:bg-amber-900/90 dark:text-amber-100 dark:border-amber-700"
          : "bg-emerald-50 text-emerald-800 border-b border-emerald-200 dark:bg-emerald-900/90 dark:text-emerald-100 dark:border-emerald-700"
      }`}
    >
      {isOffline ? (
        <HiOutlineExclamationTriangle className="w-5 h-5 flex-shrink-0" />
      ) : (
        <HiOutlineCheckCircle className="w-5 h-5 flex-shrink-0" />
      )}
      <span>
        {isOffline
          ? "Connection problem - Please check your internet connection."
          : "Back online - Your connection has been restored."}
      </span>
    </div>
  );
}
