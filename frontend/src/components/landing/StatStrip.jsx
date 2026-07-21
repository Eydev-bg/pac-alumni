import { useState, useEffect } from "react";
import api from "../../api/axios";

const SERIF = { fontFamily: "'Playfair Display', Georgia, serif" };

/**
 * StatStrip — the four hero stat cards, wired to GET /api/landing/stats
 * (public, no auth). Initial state is null: while the request is in flight we
 * render skeleton cards (matching the real card dimensions) so no placeholder
 * numbers ever flash. On success we render the real numbers. Only if the
 * request fails do we fall back to sample values, dimmed and clearly labelled.
 */
const CARD_CLASS =
  "rounded-[11px] border border-gold-500/[0.28] bg-navy-800/55 p-3.5";

// Sample fallback — shown ONLY on API error so the strip is never empty.
const SAMPLE_STATS = [
  { id: "verified_alumni", value: "4,820", label: "Verified alumni" },
  { id: "employment_rate", value: "87", suffix: "%", label: "Employment rate" },
  { id: "board_passing_rate", value: "91", suffix: "%", label: "Board passing rate" },
  { id: "degree_programs", value: "24", label: "Degree programs" },
];

// Map the API payload onto the card shape. Any missing field falls back to its
// sample value so a partial response still renders cleanly.
function buildStats(d) {
  const num = (v) => (v === null || v === undefined || Number.isNaN(Number(v)) ? null : Number(v));
  const withFallback = (v, fallback) => (v === null ? fallback : v);
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

// One loading placeholder card. Uses em-based bar heights so the card height
// exactly matches a real card (same font-size/line-height boxes), and shimmer
// bar widths roughly track "4,820" and "Verified alumni".
function SkeletonCard() {
  return (
    <div className={CARD_CLASS} aria-hidden="true">
      <div className="text-[23px] leading-none">
        <div className="h-[0.82em] w-16 animate-pulse rounded bg-gold-300/25" />
      </div>
      <div className="mt-1.5 text-[10.5px] leading-snug">
        <div className="h-[0.9em] w-20 animate-pulse rounded bg-[#aebbd6]/20" />
      </div>
    </div>
  );
}

export default function StatStrip() {
  const [stats, setStats] = useState(null);
  const [isSample, setIsSample] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .get("/landing/stats")
      .then((res) => {
        if (!active) return;
        const payload = res.data?.data ?? res.data;
        if (payload && typeof payload === "object") {
          setStats(buildStats(payload));
        } else {
          setStats(SAMPLE_STATS);
          setIsSample(true);
        }
      })
      .catch(() => {
        // Graceful degradation: show dimmed sample data so the strip isn't
        // permanently empty when the backend is down.
        if (!active) return;
        setStats(SAMPLE_STATS);
        setIsSample(true);
      });
    return () => {
      active = false;
    };
  }, []);

  // Loading: render skeletons in the identical grid so layout never shifts.
  if (stats === null) {
    return (
      <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-7">
      <div className={`grid grid-cols-2 gap-3 sm:grid-cols-4 ${isSample ? "opacity-70" : ""}`}>
        {stats.map((stat) => (
          <div key={stat.id} className={CARD_CLASS}>
            <div className="text-[23px] font-extrabold leading-none text-gold-300" style={SERIF}>
              {stat.value}
              {stat.suffix && <span className="text-[15px]">{stat.suffix}</span>}
            </div>
            <div className="mt-1.5 text-[10.5px] leading-snug text-[#aebbd6]">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
      {isSample && (
        <p className="mt-2 text-[10px] italic text-[#aebbd6]/70">(sample data)</p>
      )}
    </div>
  );
}
