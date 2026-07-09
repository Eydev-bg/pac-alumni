// ─── Custom Recharts tooltips ────────────────────────────
// Shared by the dashboard bar/pie charts. Rendered by Recharts internally,
// so they receive the active/payload props from the chart.

export function CustomBarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a2e5a] border border-[#c8a84e]/20 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-[11px] font-semibold text-[#c8a84e] mb-1.5">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-[11px]">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-400">{entry.name}:</span>
          <span className="text-white font-semibold">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export function CustomPieTooltip({ active, payload, colorMap = {} }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-[#1a2e5a] border border-[#c8a84e]/20 rounded-xl px-4 py-3 shadow-2xl">
      <div className="flex items-center gap-2 text-[12px]">
        <span
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: colorMap[d.name] || d.payload.fill }}
        />
        <span className="text-white font-semibold">{d.name}</span>
        <span className="text-slate-400">— {d.value}</span>
      </div>
    </div>
  );
}
