// ═══════════════════════════════════════════════════════════
//  FILE: frontend/src/pages/alumni/profile/components/EmploymentBadge.jsx
// ═══════════════════════════════════════════════════════════

import { Badge } from "../../../../components/alumni/ui";

export default function EmploymentBadge({ value, label }) {
  const color =
    value === "employed"
      ? "green"
      : value === "unemployed"
        ? "orange"
        : "slate";
  return (
    <Badge color={color} size="md">
      {label}
    </Badge>
  );
}
