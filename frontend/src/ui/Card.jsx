import { cn } from "../utils/formatters";

/**
 * Card — shared panel used across admin pages.
 *
 * Encapsulates the repeated card surface so panels reference one component
 * instead of duplicating the class string. Light mode is a white SaaS card;
 * dark mode is the navy glass panel. Colors reference theme tokens, not
 * literals.
 *
 * Props:
 *   padding: boolean — apply the default p-6 (default true)
 *   as:      element to render (default 'div')
 */
export default function Card({
  padding = true,
  as: Component = "div",
  className,
  children,
  ...rest
}) {
  return (
    <Component
      className={cn(
        "bg-white rounded-2xl border border-slate-200/80 shadow-sm dark:bg-navy-800/40 dark:backdrop-blur-sm dark:border-white/[0.06] dark:shadow-none",
        padding && "p-6",
        className,
      )}
      {...rest}
    >
      {children}
    </Component>
  );
}
