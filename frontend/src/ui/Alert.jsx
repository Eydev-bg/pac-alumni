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
 * toast (e.g. a list page that failed to load). Colors use semantic Tailwind
 * roles: solid 50/200/800 tints on light surfaces, translucent tints on the
 * dark navy surfaces.
 *
 * Props:
 *   variant: 'error' | 'warning' | 'info' | 'success'  (default 'error')
 *   title:   optional heading
 *   action:  optional node (e.g. a "Retry" button)
 */
const VARIANTS = {
  error: {
    icon: HiOutlineXCircle,
    wrap: "bg-red-50 border-red-200 text-red-800 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-300",
    iconColor: "text-red-500 dark:text-red-400",
  },
  warning: {
    icon: HiOutlineExclamationTriangle,
    wrap: "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-300",
    iconColor: "text-amber-500 dark:text-amber-400",
  },
  info: {
    icon: HiOutlineInformationCircle,
    wrap: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-300",
    iconColor: "text-blue-500 dark:text-blue-400",
  },
  success: {
    icon: HiOutlineCheckCircle,
    wrap: "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-300",
    iconColor: "text-emerald-500 dark:text-emerald-400",
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
