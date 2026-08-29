import { Link } from "react-router-dom";
import { TbUsersGroup, TbShieldCheck } from "react-icons/tb";
import StatStrip from "./StatStrip";

const SERIF = { fontFamily: "'Playfair Display', Georgia, serif" };

// Shared CTA button styles — one solid blue primary, one ghost outline.
const PRIMARY_BTN =
  "inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-[14px] font-semibold text-white shadow-[0_8px_24px_-6px_rgba(37,99,235,0.6)] transition hover:bg-blue-500 hover:scale-[1.02] motion-reduce:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-blue-400/60";
const GHOST_BTN =
  "inline-flex items-center gap-2 rounded-xl border border-white/20 px-6 py-3.5 text-[14px] font-medium text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30";

/**
 * HeroSection — deep-navy, full-height hero: a two-line serif headline with
 * supporting copy and CTAs on the left, an editorial campus photo on the
 * right, and the stat strip anchored below. Decoration is deliberately
 * minimal — one barely-perceptible radial wash for depth, nothing else.
 */
export default function HeroSection() {
  return (
    <section
      id="home"
      className="relative flex min-h-[calc(100svh-57px)] scroll-mt-20 flex-col justify-center overflow-hidden bg-[var(--color-navy-950)] px-5 py-16 sm:px-8 lg:px-12 lg:py-20"
    >
      {/* Subtle depth wash behind everything — purely cosmetic */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 [background:radial-gradient(120%_120%_at_50%_0%,rgba(37,99,235,0.12)_0%,transparent_55%)]"
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
          {/* Copy column — min-w-0 lets the grid actually enforce the column
              boundary instead of letting the long serif headline push wider
              than its track. On mobile it sits under the photo. */}
          <div className="order-2 min-w-0 lg:order-1">
            <p className="mb-5 text-[11.5px] font-semibold uppercase tracking-[0.18em] text-blue-400">
              Official Alumni Platform · Philippine Advent College
            </p>

            <h1
              className="text-[2rem] font-extrabold leading-[1.12] text-white sm:text-[2.75rem] lg:text-[3.5rem]"
              style={SERIF}
            >
              Stay Connected.
              <br />
              <span className="text-blue-400">Grow Together.</span>
            </h1>

            <p className="my-6 max-w-xl text-[15px] leading-[1.7] text-slate-300">
              The official alumni tracking system of Philippine Advent College.
              Reconnect with your batchmates, keep your career and board exam
              records up to date, and stay part of a trusted community of PAC
              graduates — all in one secure platform.
            </p>

            <div className="flex flex-wrap items-center gap-3.5">
              <Link to="/register" className={PRIMARY_BTN}>
                <TbUsersGroup
                  aria-hidden="true"
                  className="h-[18px] w-[18px]"
                />
                Join the Alumni Network
              </Link>
              <a href="#about" className={GHOST_BTN}>
                Explore the Platform
              </a>
            </div>

            <p className="mt-5 flex items-center gap-2 text-[13px] text-slate-400">
              <TbShieldCheck
                aria-hidden="true"
                className="h-4 w-4 flex-none text-blue-400"
              />
              The official alumni platform of Philippine Advent College - built
              to connect, verify, and support our alumni community.
            </p>
          </div>

          {/* Campus photo — wide and height-capped on mobile so the headline
              stays above the fold, taller and editorial from lg up. */}
          <div className="order-1 min-w-0 lg:order-2">
            <div className="relative aspect-[16/10] max-h-[260px] overflow-hidden rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.45)] lg:aspect-[4/5] lg:max-h-none">
              <img
                src="/campus-bg.jpg"
                alt="Philippine Advent College campus"
                className="h-full w-full object-cover"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_60%,rgba(12,21,37,0.45)_100%)]"
              />
            </div>
          </div>
        </div>

        <StatStrip />
      </div>
    </section>
  );
}
