import { cn } from "../utils/formatters";

/**
 * Input — shared text-field primitive with label / hint / error.
 *
 * Standardizes the two field styles used across admin pages:
 *   - tone="light" (default): white form fields used inside modals
 *   - tone="dark":           navy filter fields used on list-page bars
 *
 * Laravel validation errors arrive as `string[]`; pass the field's array (or
 * a string) to `error` and the first message is shown. Colors reference
 * theme tokens, not literals.
 */
const TONES = {
  light: {
    base: "border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500",
    idle: "border-slate-300",
    error: "border-red-300",
    label: "text-slate-700",
  },
  dark: {
    base: "bg-white/[0.06] border rounded-xl text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-500/30 transition-colors",
    idle: "border-white/[0.08]",
    error: "border-red-400/50",
    label: "text-slate-300",
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
