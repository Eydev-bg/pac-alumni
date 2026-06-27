import { cn } from "../../utils/formatters";

/**
 * StatusBadge — colored badge for user status, login status, etc.
 */

const variants = {
  // User statuses
  active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  suspended: "bg-amber-50 text-amber-700 ring-amber-600/20",
  deactivated: "bg-red-50 text-red-700 ring-red-600/20",

  // Login statuses
  success: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  failed: "bg-red-50 text-red-700 ring-red-600/20",
  blocked: "bg-slate-100 text-slate-700 ring-slate-600/20",

  // Roles
  admin: "bg-purple-50 text-purple-700 ring-purple-600/20",
  alumni: "bg-slate-50 text-slate-700 ring-slate-600/20",

  // Default
  default: "bg-slate-50 text-slate-700 ring-slate-600/20",
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
