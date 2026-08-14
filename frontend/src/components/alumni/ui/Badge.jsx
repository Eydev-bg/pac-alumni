import { cn } from "../../../utils/formatters";

/**
 * Badge — small soft pill for counts, statuses, and tags (job type, etc.).
 *
 * Props:
 *   color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'slate' (default 'blue')
 *   size:  'sm' | 'md' (default 'sm')
 */
const COLORS = {
  blue: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  green:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  purple:
    "bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
  orange:
    "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
  red: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  slate: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
};

const SIZES = {
  sm: "px-2 py-0.5 text-[0.7rem]",
  md: "px-2.5 py-1 text-xs",
};

export default function Badge({
  color = "blue",
  size = "sm",
  className,
  children,
  ...rest
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center gap-1 font-semibold rounded-full whitespace-nowrap",
        COLORS[color] || COLORS.blue,
        SIZES[size] || SIZES.sm,
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
