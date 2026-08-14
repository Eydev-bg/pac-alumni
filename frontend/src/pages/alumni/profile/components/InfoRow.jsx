// ═══════════════════════════════════════════════════════════
//  FILE: frontend/src/pages/alumni/profile/components/InfoRow.jsx
// ═══════════════════════════════════════════════════════════

import { IconChip } from "../../../../components/alumni/ui";

// ─── Read-only info row ──────────────────────────────────────
export default function InfoRow({ icon: Icon, label, value, highlight }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <IconChip icon={Icon} color="slate" size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-[0.7rem] text-slate-400 font-medium">{label}</p>
        <p
          className={`text-[0.82rem] mt-0.5 break-words ${highlight ? "font-bold text-blue-700 dark:text-blue-300" : "font-medium text-slate-700 dark:text-slate-200"}`}
        >
          {value || "—"}
        </p>
      </div>
    </div>
  );
}
