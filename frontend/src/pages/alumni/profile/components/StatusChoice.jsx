// ═══════════════════════════════════════════════════════════
//  FILE: frontend/src/pages/alumni/profile/components/StatusChoice.jsx
// ═══════════════════════════════════════════════════════════

export default function StatusChoice({
  active,
  onClick,
  icon: Icon,
  tone,
  title,
  subtitle,
  disabled = false,
  disabledNote,
}) {
  // Dark-mode active fills are OPAQUE on purpose. Each hex is the exact
  // composite of the old `dark:bg-<hue>-500/10` over the AlumniCard surface
  // (`dark:bg-slate-800` = #1e293b), so the rendered colour is unchanged — but
  // because the fill no longer carries alpha, the translucent same-hue layers
  // painted on top of it (the `dark:border-<hue>-500/50` border, which sits over
  // the background under the default `background-clip: border-box`, and the
  // `dark:bg-<hue>-500/20` icon chip) no longer double up against it. That
  // doubled alpha is what showed as a faint seam across the card in dark mode.
  // Light mode already used opaque fills (bg-emerald-50 / bg-amber-50).
  const toneCls = disabled
    ? "border-slate-200 bg-slate-50 cursor-not-allowed opacity-50 dark:border-slate-700 dark:bg-slate-800/50"
    : active
      ? tone === "emerald"
        ? "border-emerald-400 bg-emerald-50 dark:border-emerald-500/50 dark:bg-[#1d3742]"
        : "border-amber-300 bg-amber-50 dark:border-amber-500/50 dark:bg-[#343536]"
      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:hover:border-slate-500 dark:hover:bg-slate-700";
  const iconBg = disabled
    ? "bg-slate-100 text-slate-300 dark:bg-slate-700 dark:text-slate-500"
    : active
      ? tone === "emerald"
        ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
        : "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
      : "bg-slate-100 text-slate-400 dark:bg-slate-700";
  const titleCls = disabled
    ? "text-slate-400 dark:text-slate-500"
    : active
      ? tone === "emerald"
        ? "text-emerald-800 dark:text-emerald-300"
        : "text-amber-800 dark:text-amber-300"
      : "text-slate-700 dark:text-slate-200";
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`relative flex w-full min-w-0 items-center gap-3 p-4 rounded-xl border-2 transition-all ${toneCls}`}
    >
      <span
        className={`w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center ${iconBg}`}
      >
        <Icon className="w-5 h-5" />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className={`block text-sm font-bold break-words ${titleCls}`}>
          {title}
        </span>
        <span className="block text-[0.68rem] text-slate-400 break-words">
          {disabled && disabledNote ? disabledNote : subtitle}
        </span>
      </span>
    </button>
  );
}
