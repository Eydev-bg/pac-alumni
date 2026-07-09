import { cn } from "../utils/formatters";

/**
 * Card — shared glass panel used across admin pages.
 *
 * Encapsulates the repeated
 *   `bg-navy-800/40 backdrop-blur-sm rounded-2xl border border-white/[0.06]`
 * surface so panels reference one component instead of duplicating the
 * class string. Colors reference theme tokens, not literals.
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
        "bg-navy-800/40 backdrop-blur-sm rounded-2xl border border-white/[0.06]",
        padding && "p-6",
        className,
      )}
      {...rest}
    >
      {children}
    </Component>
  );
}
