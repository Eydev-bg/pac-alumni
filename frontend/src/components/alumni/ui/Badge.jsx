import { cn } from "../../../utils/formatters";

/**
 * Badge — small soft pill for counts, statuses, and tags (job type, etc.).
 *
 * Props:
 *   color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'slate' (default 'blue')
 *   size:  'sm' | 'md' (default 'sm')
 */
const COLORS = {
  blue: "bg-blue-50 text-blue-700",
  green: "bg-emerald-50 text-emerald-700",
  purple: "bg-purple-50 text-purple-700",
  orange: "bg-orange-50 text-orange-700",
  red: "bg-red-50 text-red-700",
  slate: "bg-slate-100 text-slate-600",
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
