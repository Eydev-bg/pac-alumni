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
}) {
  const toneCls = active
    ? tone === "emerald"
      ? "border-emerald-400 bg-emerald-50 dark:border-emerald-500/50 dark:bg-emerald-500/10"
      : "border-amber-300 bg-amber-50 dark:border-amber-500/50 dark:bg-amber-500/10"
    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:hover:border-slate-500 dark:hover:bg-slate-700";
  const iconBg = active
    ? tone === "emerald"
      ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
      : "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
    : "bg-slate-100 text-slate-400 dark:bg-slate-700";
  const titleCls = active
    ? tone === "emerald"
      ? "text-emerald-800 dark:text-emerald-300"
      : "text-amber-800 dark:text-amber-300"
    : "text-slate-700 dark:text-slate-200";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${toneCls}`}
    >
      <span
        className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}
      >
        <Icon className="w-5 h-5" />
      </span>
      <span className="text-left">
        <span className={`block text-sm font-bold ${titleCls}`}>{title}</span>
        <span className="block text-[0.68rem] text-slate-400">{subtitle}</span>
      </span>
    </button>
  );
}
