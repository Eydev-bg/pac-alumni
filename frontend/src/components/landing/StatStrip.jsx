import { useState, useEffect, useMemo, useRef } from "react";
import {
  TbSchool,
  TbBriefcase,
  TbChartBar,
  TbBuildingBank,
} from "react-icons/tb";
import api from "../../api/axios";

const SERIF = { fontFamily: "'Playfair Display', Georgia, serif" };

/**
 * StatStrip — the four hero stat cards, wired to GET /api/landing/stats
 * (public, no auth). Initial state is null: while the request is in flight we
 * render skeleton cards (matching the real card dimensions) so no placeholder
 * numbers ever flash. On success we render the real numbers. Only if the
 * request fails do we fall back to sample values, dimmed and clearly labelled.
 *
 * Once the panel scrolls into view the numbers count up from zero — the same
 * fire-once IntersectionObserver pattern Reveal/LandingNav already use, and
 * skipped entirely under prefers-reduced-motion.
 */

// Icon + accent-underline per stat, matched by id, for the dark panel layout.
const STAT_META = {
  verified_alumni: { icon: TbSchool },
  employment_rate: { icon: TbBriefcase },
  board_passing_rate: { icon: TbChartBar },
  degree_programs: { icon: TbBuildingBank },
};

// Sample fallback — shown ONLY on API error so the strip is never empty.
const SAMPLE_STATS = [
  { id: "verified_alumni", value: "4,820", label: "Verified Alumni" },
  { id: "employment_rate", value: "87", suffix: "%", label: "Employment Rate" },
  {
    id: "board_passing_rate",
    value: "91",
    suffix: "%",
    label: "Board Passing Rate",
  },
  { id: "degree_programs", value: "24", label: "Degree Programs" },
];

// Count-up timing: ~1.5s on an ease-out cubic curve.
const COUNT_UP_MS = 1500;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

// "4,820" becomes 4820. Anything that is not a plain number (empty, "N/A", …)
// returns null so the caller can render it verbatim instead of animating.
function parseNumeric(value) {
  const raw = String(value ?? "")
    .replace(/,/g, "")
    .trim();
  if (raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/**
 * CountUp — animates an integer 0 to target once `active` flips true,
 * re-formatting with toLocaleString() on every frame so the thousands
 * separator survives. Non-numeric values pass straight through, unanimated.
 */
function CountUp({ value, active }) {
  const target = useMemo(() => parseNumeric(value), [value]);
  const [reduced] = useState(prefersReducedMotion);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (target === null) return;
    if (reduced) {
      setCurrent(target);
      return;
    }
    if (!active) return;

    let frame;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / COUNT_UP_MS, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setCurrent(Math.round(target * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, active, reduced]);

  if (target === null) return value;
  return current.toLocaleString();
}

// Map the API payload onto the card shape. Any missing field falls back to its
// sample value so a partial response still renders cleanly.
function buildStats(d) {
  const num = (v) =>
    v === null || v === undefined || Number.isNaN(Number(v)) ? null : Number(v);
  const withFallback = (v, fallback) => (v === null ? fallback : v);
  return [
    {
      id: "verified_alumni",
      value: withFallback(
        num(d.verified_alumni)?.toLocaleString() ?? null,
        "4,820",
      ),
      label: "Verified Alumni",
    },
    {
      id: "employment_rate",
      value: withFallback(
        num(d.employment_rate) !== null ? String(num(d.employment_rate)) : null,
        "87",
      ),
      suffix: "%",
      label: "Employment Rate",
    },
    {
      id: "board_passing_rate",
      value: withFallback(
        num(d.board_passing_rate) !== null
          ? String(num(d.board_passing_rate))
          : null,
        "91",
      ),
      suffix: "%",
      label: "Board Passing Rate",
    },
    {
      id: "degree_programs",
      value: withFallback(
        num(d.degree_programs) !== null ? String(num(d.degree_programs)) : null,
        "24",
      ),
      label: "Degree Programs",
    },
  ];
}

// One loading placeholder, sized to match a real stat's icon + number +
// label footprint so the panel height never shifts once data arrives.
function SkeletonStat() {
  return (
    <div className="flex items-center gap-3.5" aria-hidden="true">
      <div className="h-12 w-12 flex-none animate-pulse rounded-full bg-white/10" />
      <div>
        <div className="h-[28px] w-16 animate-pulse rounded bg-white/10" />
        <div className="mt-1.5 h-[17px] w-24 animate-pulse rounded bg-white/[0.06]" />
      </div>
    </div>
  );
}

export default function StatStrip() {
  const [stats, setStats] = useState(null);
  const [isSample, setIsSample] = useState(false);
  const [inView, setInView] = useState(false);
  const panelRef = useRef(null);

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

  // Fire-once visibility trigger for the count-up. Only wired up once the real
  // panel exists, so the skeleton never animates; if the panel is already on
  // screen when the data lands, the observer fires immediately.
  useEffect(() => {
    if (stats === null || inView) return;
    const node = panelRef.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [stats, inView]);

  // Loading: render skeletons inside the identical panel so layout never shifts.
  if (stats === null) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[var(--color-navy-900)]/60 p-6 sm:p-7">
        <div className="grid grid-cols-2 gap-y-6 sm:grid-cols-4 sm:gap-y-0">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonStat key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      className="rounded-2xl border border-white/10 bg-[var(--color-navy-900)]/60 p-6 sm:p-7"
    >
      <div
        className={`grid grid-cols-2 gap-y-6 sm:grid-cols-4 sm:gap-y-0 ${isSample ? "opacity-70" : ""}`}
      >
        {stats.map((stat, i) => {
          const Icon = STAT_META[stat.id]?.icon ?? TbSchool;
          const isLast = i === stats.length - 1;
          return (
            <div
              key={stat.id}
              className={`flex items-center gap-3.5 px-2 sm:px-5 ${
                !isLast ? "sm:border-r sm:border-white/10" : ""
              } ${i === 0 ? "sm:pl-0" : ""}`}
            >
              <div className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-blue-500)_0%,var(--color-blue-700)_100%)]">
                <Icon aria-hidden="true" className="h-5 w-5 text-white" />
              </div>
              <div>
                <div
                  className="text-[28px] font-extrabold leading-none text-white"
                  style={SERIF}
                >
                  <CountUp value={stat.value} active={inView} />
                  {stat.suffix && (
                    <span className="text-[18px]">{stat.suffix}</span>
                  )}
                </div>
                <div className="mt-1.5 flex items-center gap-1.5 text-[13px] leading-snug text-slate-400">
                  {stat.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
