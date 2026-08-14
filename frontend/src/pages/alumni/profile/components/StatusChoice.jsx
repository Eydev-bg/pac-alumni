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
      ? "border-emerald-400 bg-emerald-50"
      : "border-amber-300 bg-amber-50"
    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50";
  const iconBg = active
    ? tone === "emerald"
      ? "bg-emerald-100 text-emerald-600"
      : "bg-amber-100 text-amber-600"
    : "bg-slate-100 text-slate-400";
  const titleCls = active
    ? tone === "emerald"
      ? "text-emerald-800"
      : "text-amber-800"
    : "text-slate-700";
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
