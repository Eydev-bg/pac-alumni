import { cn } from "../../../utils/formatters";

/**
 * AlumniCard — white surface used across every alumni page in the blue
 * light-SaaS redesign (Phase A). The alumni counterpart to the admin `ui/Card`
 * (which is a dark navy glass panel); kept separate so the two themes don't
 * bleed into each other.
 *
 * Soft shadow + rounded-xl + hairline border on a light-gray page background.
 *
 * Props:
 *   padding: boolean — apply the default p-5 (default true)
 *   as:      element to render (default 'div')
 */
export default function AlumniCard({
  padding = true,
  as: Component = "div",
  className,
  children,
  ...rest
}) {
  return (
    <Component
      className={cn(
        "bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-sm",
        padding && "p-5",
        className,
      )}
      {...rest}
    >
      {children}
    </Component>
  );
}
