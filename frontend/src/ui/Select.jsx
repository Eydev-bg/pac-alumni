import { cn } from "../utils/formatters";

/**
 * Select — shared dropdown primitive with label / hint / error.
 *
 * Mirrors Input's tone system so form selects (light) and list-page filter
 * selects (dark) share one component. Options can be passed as an `options`
 * array ([{ value, label }]) or as raw <option> children. Colors reference
 * theme tokens, not literals.
 */
const TONES = {
  light: {
    base: "border rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500",
    idle: "border-slate-300",
    error: "border-red-300",
    label: "text-slate-700",
  },
  dark: {
    base: "bg-white/[0.06] border rounded-xl text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-gold-500/40 appearance-none cursor-pointer",
    idle: "border-white/[0.08]",
    error: "border-red-400/50",
    label: "text-slate-300",
  },
};

export default function Select({
  label,
  hint,
  error,
  tone = "light",
  required = false,
  options,
  placeholder,
  id,
  className,
  children,
  ...rest
}) {
  const t = TONES[tone] || TONES.light;
  const message = Array.isArray(error) ? error[0] : error;
  const selectId = id || rest.name;
  // Dark options need an explicit dark background or they render white-on-white.
  const optionClass = tone === "dark" ? "bg-navy-800 text-slate-300" : undefined;

  return (
    <div>
      {label && (
        <label
          htmlFor={selectId}
          className={cn("block text-sm font-medium mb-1", t.label)}
        >
          {label} {required && "*"}
        </label>
      )}
      <select
        id={selectId}
        required={required}
        aria-invalid={message ? true : undefined}
        style={tone === "dark" ? { colorScheme: "dark" } : undefined}
        className={cn(
          "w-full px-3 py-2",
          t.base,
          message ? t.error : t.idle,
          className,
        )}
        {...rest}
      >
        {placeholder !== undefined && (
          <option value="" className={optionClass}>
            {placeholder}
          </option>
        )}
        {options
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value} className={optionClass}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
      {hint && !message && (
        <p className="text-xs text-slate-400 mt-1">{hint}</p>
      )}
      {message && <p className="text-xs text-red-500 mt-1">{message}</p>}
    </div>
  );
}
