import { useState, useEffect } from "react";
import api from "../../api/axios";

const SERIF = { fontFamily: "'Playfair Display', Georgia, serif" };

/**
 * StatStrip — the four hero stat cards, wired to GET /api/landing/stats
 * (public, no auth). While the request is in flight the placeholder values
 * below render with a subtle pulse so nothing flashes "0"; on success they are
 * replaced with real numbers. On any error the strip silently keeps the
 * placeholders — the landing page never shows an error state for stats.
 */
const DEFAULT_STATS = [
  { id: "verified_alumni", value: "4,820", label: "Verified alumni" },
  { id: "employment_rate", value: "87", suffix: "%", label: "Employment rate" },
  { id: "board_passing_rate", value: "91", suffix: "%", label: "Board passing rate" },
  { id: "degree_programs", value: "24", label: "Degree programs" },
];

// Map the API payload onto the card shape. Any missing field falls back to its
// placeholder value so a partial response still renders cleanly.
function buildStats(d) {
  const num = (v) => (v === null || v === undefined || Number.isNaN(Number(v)) ? null : Number(v));
  const withFallback = (v, fallback) => (v === null ? fallback : v);
  // "Based on X of Y alumni" — only when the reporting counts are present.
  const known = num(d.employment_known_count);
  const totalProfiles = num(d.employment_total_profiles);
  const employmentNote =
    known !== null && totalProfiles !== null && totalProfiles > 0
      ? `Based on ${known.toLocaleString()} of ${totalProfiles.toLocaleString()} alumni`
      : null;
  return [
    {
      id: "verified_alumni",
      value: withFallback(num(d.verified_alumni)?.toLocaleString() ?? null, "4,820"),
      label: "Verified alumni",
    },
    {
      id: "employment_rate",
      value: withFallback(num(d.employment_rate) !== null ? String(num(d.employment_rate)) : null, "87"),
      suffix: "%",
      label: "Employment rate",
      note: employmentNote,
    },
    {
      id: "board_passing_rate",
      value: withFallback(num(d.board_passing_rate) !== null ? String(num(d.board_passing_rate)) : null, "91"),
      suffix: "%",
      label: "Board passing rate",
    },
    {
      id: "degree_programs",
      value: withFallback(num(d.degree_programs) !== null ? String(num(d.degree_programs)) : null, "24"),
      label: "Degree programs",
    },
  ];
}

export default function StatStrip() {
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .get("/landing/stats")
      .then((res) => {
        if (!active) return;
        const payload = res.data?.data ?? res.data;
        if (payload && typeof payload === "object") {
          setStats(buildStats(payload));
        }
      })
      .catch(() => {
        // Graceful degradation: keep the placeholder values, show no error.
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.id}
          className="rounded-[11px] border border-gold-500/[0.28] bg-navy-800/55 p-3.5"
        >
          <div
            className={`text-[23px] font-extrabold leading-none text-gold-300 ${
              loading ? "animate-pulse" : ""
            }`}
            style={SERIF}
          >
            {stat.value}
            {stat.suffix && <span className="text-[15px]">{stat.suffix}</span>}
          </div>
          <div className="mt-1.5 text-[10.5px] leading-snug text-[#aebbd6]">
            {stat.label}
          </div>
          {stat.note && (
            <div className="mt-1 text-[9px] leading-tight text-[#8ea0c4]">
              {stat.note}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
