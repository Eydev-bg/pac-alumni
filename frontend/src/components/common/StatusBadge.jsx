import { cn } from "../../utils/formatters";

/**
 * StatusBadge — colored badge for user status, login status, etc.
 */

const variants = {
  // User statuses
  active:
    "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/20",
  suspended:
    "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/20",
  deactivated:
    "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-400/20",

  // Login statuses
  success:
    "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/20",
  failed:
    "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-400/20",
  blocked:
    "bg-slate-100 text-slate-700 ring-slate-600/20 dark:bg-slate-700 dark:text-slate-300 dark:ring-slate-400/20",

  // Review / verification statuses
  pending:
    "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/20",
  approved:
    "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/20",
  rejected:
    "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-400/20",

  // Board statuses
  passed:
    "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/20",
  not_taken:
    "bg-slate-50 text-slate-700 ring-slate-600/20 dark:bg-slate-700 dark:text-slate-300 dark:ring-slate-400/20",
  not_applicable:
    "bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-700 dark:text-slate-300 dark:ring-slate-400/20",

  // Roles
  admin:
    "bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-500/15 dark:text-purple-300 dark:ring-purple-400/20",
  alumni:
    "bg-slate-50 text-slate-700 ring-slate-600/20 dark:bg-slate-700 dark:text-slate-300 dark:ring-slate-400/20",

  // Default
  default:
    "bg-slate-50 text-slate-700 ring-slate-600/20 dark:bg-slate-700 dark:text-slate-300 dark:ring-slate-400/20",
};

export default function StatusBadge({ status, label, className }) {
  const variant = variants[status] || variants.default;
  const displayLabel = label || status?.replace(/_/g, " ");

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset capitalize",
        variant,
        className,
      )}
    >
      {displayLabel}
    </span>
  );
}
