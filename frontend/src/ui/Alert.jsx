import {
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineInformationCircle,
  HiOutlineXCircle,
} from "react-icons/hi2";
import { cn } from "../utils/formatters";

/**
 * Alert — inline, page-level message surface.
 *
 * Used where a persistent in-page banner is more appropriate than a transient
 * toast (e.g. a list page that failed to load). Tuned for the dark admin
 * surfaces; colors use semantic Tailwind roles.
 *
 * Props:
 *   variant: 'error' | 'warning' | 'info' | 'success'  (default 'error')
 *   title:   optional heading
 *   action:  optional node (e.g. a "Retry" button)
 */
const VARIANTS = {
  error: {
    icon: HiOutlineXCircle,
    wrap: "bg-red-500/10 border-red-500/20 text-red-300",
    iconColor: "text-red-400",
  },
  warning: {
    icon: HiOutlineExclamationTriangle,
    wrap: "bg-amber-500/10 border-amber-500/20 text-amber-300",
    iconColor: "text-amber-400",
  },
  info: {
    icon: HiOutlineInformationCircle,
    wrap: "bg-blue-500/10 border-blue-500/20 text-blue-300",
    iconColor: "text-blue-400",
  },
  success: {
    icon: HiOutlineCheckCircle,
    wrap: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300",
    iconColor: "text-emerald-400",
  },
};

export default function Alert({
  variant = "error",
  title,
  action,
  className,
  children,
}) {
  const meta = VARIANTS[variant] || VARIANTS.error;
  const Icon = meta.icon;

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-2xl border p-4",
        meta.wrap,
        className,
      )}
    >
      <Icon className={cn("w-5 h-5 flex-shrink-0 mt-0.5", meta.iconColor)} />
      <div className="flex-1">
        {title && <p className="text-sm font-semibold">{title}</p>}
        {children && <p className="text-sm opacity-90 mt-0.5">{children}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
