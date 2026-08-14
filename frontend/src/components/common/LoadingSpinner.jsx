import { HiOutlineInboxStack } from "react-icons/hi2";

/**
 * LoadingSpinner — centered spinner with optional message.
 */
export function LoadingSpinner({ message = "Loading...", className = "" }) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 ${className}`}
    >
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3" />
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  );
}

/**
 * EmptyState — displayed when no data is available.
 */
export function EmptyState({
  icon: Icon = HiOutlineInboxStack,
  title = "No data found",
  description = "There are no records to display.",
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon className="w-12 h-12 text-slate-300 dark:text-slate-500 mb-4" />
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
        {title}
      </h3>
      <p className="text-sm text-slate-400 max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
