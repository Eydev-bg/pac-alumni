import { cn } from "../../../utils/formatters";

/**
 * ProgressBar — thin rounded track with a blue fill. Used for profile
 * completion on the dashboard and the My Profile page.
 *
 * Props:
 *   value: number 0–100 (clamped)
 *   size:  'sm' | 'md' (default 'md')
 */
export default function ProgressBar({ value = 0, size = "md", className, ...rest }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const height = size === "sm" ? "h-1.5" : "h-2";
  return (
    <div
      className={cn(
        "w-full rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden",
        height,
        className,
      )}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      {...rest}
    >
      <div
        className="h-full rounded-full bg-blue-600 transition-[width] duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
