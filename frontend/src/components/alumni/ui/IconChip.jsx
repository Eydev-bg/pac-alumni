import { cn } from "../../../utils/formatters";

/**
 * IconChip — colored rounded-square icon container used in Quick Actions,
 * the Notifications panel, job/company initials, etc. Pastel background + a
 * saturated icon in the same hue, matching the design reference.
 *
 * Props:
 *   color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'slate' (default 'blue')
 *   icon:  react-icons component
 *   size:  'sm' | 'md' | 'lg' (default 'md')
 */
const COLORS = {
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300",
  green:
    "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
  purple:
    "bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-300",
  orange:
    "bg-orange-50 text-orange-500 dark:bg-orange-500/15 dark:text-orange-300",
  red: "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300",
  slate: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
};

const SIZES = {
  sm: { box: "w-9 h-9 rounded-lg", icon: "w-4 h-4" },
  md: { box: "w-11 h-11 rounded-xl", icon: "w-5 h-5" },
  lg: { box: "w-12 h-12 rounded-xl", icon: "w-6 h-6" },
};

export default function IconChip({
  color = "blue",
  icon: Icon,
  size = "md",
  className,
  ...rest
}) {
  const s = SIZES[size] || SIZES.md;
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center flex-shrink-0",
        s.box,
        COLORS[color] || COLORS.blue,
        className,
      )}
      {...rest}
    >
      {Icon && <Icon className={s.icon} />}
    </span>
  );
}
