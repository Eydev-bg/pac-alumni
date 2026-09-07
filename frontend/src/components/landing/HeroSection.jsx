import { Link } from "react-router-dom";
import {
  TbUsersGroup,
  TbShieldCheck,
  TbCheck,
  TbSchool,
  TbCertificate,
  TbAward,
  TbBriefcase,
} from "react-icons/tb";
import StatStrip from "./StatStrip";

const SERIF = { fontFamily: "'Playfair Display', Georgia, serif" };

// Shared CTA button styles — one solid blue primary, one ghost outline.
const PRIMARY_BTN =
  "inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-[14px] font-semibold text-white shadow-[0_8px_24px_-6px_rgba(37,99,235,0.6)] transition hover:bg-blue-500 hover:scale-[1.02] motion-reduce:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-blue-400/60";
const GHOST_BTN =
  "inline-flex items-center gap-2 rounded-xl border border-white/20 px-6 py-3.5 text-[14px] font-medium text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30";

// Small trust perks shown under the subcopy — TxtCart-style checkmark row.
const PERKS = ["Verified alumni network", "Secure records", "Free to join"];

/**
 * Floating alumni-themed decoration cards — four of them, positioned to match
 * the requested layout:
 *   - two up top, level with the badge, pulled in toward the headline
 *   - two in the middle band, flanking the headline lines
 *
 * They're deliberately faint background decoration: large icons, very low
 * opacity, a barely-there border, and no animation or hover — steady and
 * subtle. None sit low enough to reach the supporting paragraph, and because
 * they're absolutely positioned they never affect the centered text alignment.
 */
const FLOAT_CARDS = [
  // Top pair — level with the badge, pulled in toward the headline
  {
    Icon: TbSchool,
    pos: "top-4 left-[10%] sm:left-[15%] lg:left-[19%]",
    tilt: "-rotate-6",
  },
  {
    Icon: TbAward,
    pos: "top-4 right-[10%] sm:right-[15%] lg:right-[19%]",
    tilt: "rotate-6",
  },
  // Middle pair — beside the headline lines, still clear of the paragraph
  {
    Icon: TbCertificate,
    pos: "top-[26%] left-[14%] sm:left-[20%] lg:left-[24%]",
    tilt: "rotate-6",
  },
  {
    Icon: TbBriefcase,
    pos: "top-[26%] right-[14%] sm:right-[20%] lg:right-[24%]",
    tilt: "-rotate-6",
  },
];

function FloatingCards() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0"
    >
      {FLOAT_CARDS.map(({ Icon, pos, tilt }, i) => (
        <div key={i} className={`absolute ${pos} ${tilt}`}>
          {/* Steady, faint decoration — larger icon, thin border, low opacity,
              no animation or hover. */}
          <div className="rounded-2xl border border-blue-400/[0.06] bg-[var(--color-navy-800)]/30 p-4 lg:p-5">
            <Icon className="h-9 w-9 text-blue-400/20 lg:h-11 lg:w-11" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * ScribbleUnderline — TxtCart-style hand-drawn underline made of three
 * overlapping strokes of varied weight and opacity, so it reads as a real
 * pen scribble rather than a single clean line. Sits under the final headline
 * word, purely decorative.
 */
function ScribbleUnderline() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 220 22"
      preserveAspectRatio="none"
      className="pointer-events-none absolute -bottom-3 left-[-4px] h-5 w-[calc(100%+8px)]"
    >
      <path
        d="M6,11 Q60,4 110,9 T214,8"
        stroke="var(--color-blue-600)"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
        opacity="0.95"
      />
      <path
        d="M10,15 Q70,9 120,13 T210,12"
        stroke="var(--color-blue-500)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        opacity="0.8"
      />
      <path
        d="M4,8 Q50,13 100,7 T216,10"
        stroke="var(--color-blue-600)"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}

/**
 * HeroSection — TxtCart-inspired centered hero on deep navy. A trust-badge
 * eyebrow, a two-line serif headline whose final word carries a scribbled
 * blue underline, supporting copy, a checkmark perks row, and the two CTAs —
 * all centered, with four faint floating alumni cards flanking the top and
 * headline. Below sits the campus photo, with the four-stat StatStrip over its
 * bottom edge.
 *
 * Type scale is responsive: headline, subcopy and perks all start smaller on
 * mobile and step up at sm/lg. Fonts and colors are unchanged from before.
 */
export default function HeroSection() {
  return (
    <section
      id="home"
      className="relative scroll-mt-20 overflow-hidden bg-[var(--color-navy-950)] px-5 pt-14 pb-16 sm:px-8 lg:px-12 lg:pt-20"
    >
      {/* Radial depth wash behind the copy — purely cosmetic */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[60%] [background:radial-gradient(70%_90%_at_50%_0%,rgba(37,99,235,0.14)_0%,transparent_65%)]"
      />

      {/* Floating alumni-themed decoration cards — faint, steady background
          decoration; absolutely positioned so they never move the text. */}
      <FloatingCards />

      {/* ── Centered copy column ─────────────────────────────── */}
      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-400/25 bg-blue-600/10 px-3.5 py-1.5">
          <TbShieldCheck
            aria-hidden="true"
            className="h-3.5 w-3.5 flex-none text-blue-400"
          />
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-blue-300 sm:text-[11px]">
            Official Platform · Philippine Advent College
          </span>
        </span>

        <h1
          className="text-[2.5rem] font-extrabold leading-[1.1] text-white sm:text-[3.5rem] lg:text-[4.35rem]"
          style={SERIF}
        >
          Stay Connected.
          <br />
          Grow{" "}
          <span className="relative inline-block">
            Together.
            {/* Scribbled multi-stroke blue underline (TxtCart-style) */}
            <ScribbleUnderline />
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-3xl text-[16px] leading-[1.7] text-slate-300 sm:text-[18px] lg:text-[20px]">
          The official alumni tracking system of Philippine Advent College.
          Reconnect with your batchmates, keep your career and board exam
          records up to date, and stay part of a trusted community of PAC
          graduates.
        </p>

        {/* Trust perks row */}
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {PERKS.map((perk) => (
            <li
              key={perk}
              className="flex items-center gap-1.5 text-[14px] text-slate-300 sm:text-[15px] lg:text-[16px]"
            >
              <TbCheck
                aria-hidden="true"
                className="h-4 w-4 flex-none text-blue-400 sm:h-[18px] sm:w-[18px]"
              />
              {perk}
            </li>
          ))}
        </ul>

        {/* CTAs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
          <Link to="/register" className={PRIMARY_BTN}>
            <TbUsersGroup aria-hidden="true" className="h-[18px] w-[18px]" />
            Join the Alumni Network
          </Link>
          <a href="#about" className={GHOST_BTN}>
            Explore the Platform
          </a>
        </div>
      </div>

      {/* ── Campus photo + floating stat strip ───────────────── */}
      <div className="relative z-10 mx-auto mt-12 max-w-5xl">
        <div className="relative aspect-[16/9] overflow-hidden rounded-3xl border border-white/10 shadow-[0_24px_64px_rgba(0,0,0,0.45)] sm:aspect-[16/6]">
          <img
            src="/campus-bg.jpg"
            alt="Philippine Advent College campus"
            className="h-full w-full object-cover"
          />
          {/* Bottom fade so the floating strip reads cleanly over the photo */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(12,21,37,0.7)_100%)]"
          />
        </div>

        {/* StatStrip pulled up to overlap the photo's bottom edge. The
            component owns its own frosted panel styling, count-up animation,
            and API wiring — we only reposition it here. */}
        <div className="relative z-10 -mt-12 px-2 sm:px-6">
          <StatStrip />
        </div>
      </div>
    </section>
  );
}
