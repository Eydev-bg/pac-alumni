import { forwardRef } from "react";
import { cn } from "../utils/formatters";

/**
 * Button — shared button primitive.
 *
 * Replaces the repeated inline button markup across admin pages/modals
 * (gold-gradient primary, white secondary, red danger). Colors reference
 * theme tokens, not literals.
 *
 * Props:
 *   variant: 'primary' | 'secondary' | 'danger' | 'ghost'  (default 'primary')
 *   size:    'sm' | 'md'                                     (default 'md')
 *   loading: boolean — shows a spinner + disables the button
 *   as:      element/component to render instead of <button> (e.g. Link)
 *   icon:    optional leading icon component
 */
const VARIANTS = {
  primary:
    "bg-gradient-to-r from-gold-500 to-gold-700 text-white hover:from-gold-400 hover:to-gold-600 shadow-lg shadow-gold-500/20 focus:ring-gold-500/40",
  secondary:
    "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-slate-400 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 dark:hover:bg-slate-600",
  danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm focus:ring-red-500",
  ghost:
    "bg-transparent text-slate-300 hover:bg-white/[0.06] focus:ring-white/20",
};

const SIZES = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
};

const Button = forwardRef(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    disabled = false,
    icon: Icon,
    as: Component = "button",
    className,
    children,
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || loading;

  return (
    <Component
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed",
        VARIANTS[variant] || VARIANTS.primary,
        SIZES[size] || SIZES.md,
        className,
      )}
      disabled={Component === "button" ? isDisabled : undefined}
      aria-disabled={isDisabled || undefined}
      {...rest}
    >
      {loading ? (
        <span className="w-4 h-4 rounded-full border-2 border-current border-b-transparent animate-spin" />
      ) : (
        Icon && <Icon className="w-4 h-4" />
      )}
      {children}
    </Component>
  );
});

export default Button;
