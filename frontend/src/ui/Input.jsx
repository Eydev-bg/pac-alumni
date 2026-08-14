import { cn } from "../utils/formatters";

/**
 * Input — shared text-field primitive with label / hint / error.
 *
 * Standardizes the two field styles used across admin pages:
 *   - tone="light" (default): form fields used inside modals
 *   - tone="dark":           filter fields used on list-page bars
 *
 * Both tones are light-base with `dark:` overrides — the tone names describe
 * the field's role (modal form vs. filter bar), not the active theme.
 *
 * Laravel validation errors arrive as `string[]`; pass the field's array (or
 * a string) to `error` and the first message is shown. Colors reference
 * theme tokens, not literals.
 */
const TONES = {
  light: {
    base: "border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500",
    idle: "border-slate-300 dark:border-slate-600",
    error: "border-red-300 dark:border-red-500",
    label: "text-slate-700 dark:text-slate-300",
  },
  dark: {
    base: "border rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 text-slate-800 placeholder:text-slate-400 bg-slate-50 focus:ring-blue-500/40 focus:bg-white dark:bg-white/[0.06] dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:ring-gold-500/40 dark:focus:border-gold-500/30 dark:focus:bg-transparent",
    idle: "border-slate-300 dark:border-white/[0.08]",
    error: "border-red-300 dark:border-red-400/50",
    label: "text-slate-700 dark:text-slate-300",
  },
};

export default function Input({
  label,
  hint,
  error,
  tone = "light",
  required = false,
  id,
  className,
  ...rest
}) {
  const t = TONES[tone] || TONES.light;
  const message = Array.isArray(error) ? error[0] : error;
  const inputId = id || rest.name;

  return (
    <div>
      {label && (
        <label
          htmlFor={inputId}
          className={cn("block text-sm font-medium mb-1", t.label)}
        >
          {label} {required && "*"}
        </label>
      )}
      <input
        id={inputId}
        required={required}
        aria-invalid={message ? true : undefined}
        className={cn(
          "w-full px-3 py-2",
          t.base,
          message ? t.error : t.idle,
          className,
        )}
        {...rest}
      />
      {hint && !message && (
        <p className="text-xs text-slate-400 mt-1">{hint}</p>
      )}
      {message && <p className="text-xs text-red-500 mt-1">{message}</p>}
    </div>
  );
}
