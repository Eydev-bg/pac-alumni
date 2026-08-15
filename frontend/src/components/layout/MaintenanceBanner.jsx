import { Link } from "react-router-dom";
import { HiOutlineExclamationTriangle } from "react-icons/hi2";
import { useMaintenance } from "../../hooks/useMaintenance";

/**
 * MaintenanceBanner — persistent reminder shown across the admin panel while
 * maintenance mode is active, so an admin doesn't forget it's on. Links to the
 * System settings tab where it can be turned off. Renders nothing when off.
 */
export default function MaintenanceBanner() {
  const { enabled } = useMaintenance();

  if (!enabled) return null;

  return (
    <div className="flex items-center gap-3 px-4 sm:px-6 lg:px-8 py-2.5 bg-amber-50 border-b border-amber-200 dark:bg-amber-500/15 dark:border-amber-500/25">
      <HiOutlineExclamationTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 dark:text-amber-400" />
      <p className="text-sm text-amber-800 flex-1 dark:text-amber-200">
        <span className="font-semibold">Maintenance mode is ON.</span>{" "}
        Alumni users are currently blocked from the system.
      </p>
      <Link
        to="/admin/settings"
        className="text-xs font-semibold text-amber-700 hover:text-amber-900 underline underline-offset-2 whitespace-nowrap dark:text-amber-300 dark:hover:text-amber-100"
      >
        Manage
      </Link>
    </div>
  );
}
