import { Link } from "react-router-dom";
import { TbUsersGroup, TbCalendarEvent, TbQuote } from "react-icons/tb";
import StatStrip from "./StatStrip";

const SERIF = { fontFamily: "'Playfair Display', Georgia, serif" };

// Shared CTA button styles — solid blue primary / outline secondary on navy.
const PRIMARY_BTN =
  "inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-[13.5px] font-semibold text-white shadow-[0_8px_24px_-6px_rgba(37,99,235,0.6)] transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400/60";
const SECONDARY_BTN =
  "inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/[0.03] px-5 py-3 text-[13.5px] font-medium text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30";

/**
 * HeroSection — deep-navy hero matching the approved comp: dotted texture,
 * kicker with flanking rule lines, three-line serif headline (white / blue /
 * white), supporting copy, two CTAs, the campus photo wrapped by an
 * oversized blue circle with a floating quote card, and the stat strip
 * anchored in its own bordered panel at the bottom.
 */
export default function HeroSection() {
  return (
    <section
      id="home"
      className="relative flex min-h-[calc(100svh-57px)] scroll-mt-20 flex-col justify-center overflow-hidden bg-[var(--color-navy-950)] px-5 py-12 sm:px-8 lg:px-12 lg:py-16"
    >
      {/* Decorative dotted texture, top-left corner only — purely cosmetic */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 h-40 w-40 opacity-[0.35] [background-image:radial-gradient(circle,rgba(96,165,250,0.5)_1px,transparent_1px)] [background-size:14px_14px] [mask-image:linear-gradient(135deg,black_0%,transparent_70%)]"
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-8">
          {/* Copy column — min-w-0 lets the grid actually enforce the column
              boundary instead of letting the long serif headline push wider
              than its track (which is what let it visually bleed under the
              photo/circle on the right). */}
          <div className="min-w-0">
            <div className="mb-5 flex items-center gap-3">
              <span aria-hidden="true" className="h-px w-8 bg-blue-400/40" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-400">
                Serving graduates since 1975
              </p>
              <span aria-hidden="true" className="h-px w-8 bg-blue-400/40" />
            </div>

            <h1
              className="text-[2.5rem] font-extrabold leading-[1.12] text-white sm:text-[3rem] lg:text-[3.1rem] xl:text-[3.4rem]"
              style={SERIF}
            >
              Stay Connected.
              <br />
              <span className="text-blue-500">Grow Together.</span>
              <br />
              Inspire the Future.
            </h1>

            <p className="my-6 max-w-lg text-[14.5px] leading-[1.75] text-slate-300">
              The Philippine Advent College Alumni Tracking System helps
              graduates stay connected through verified profiles, career
              opportunities, alumni events, and official announcements-all
              within one secure and trusted platform.
            </p>

            <div className="flex flex-wrap items-center gap-3.5">
              <Link to="/register" className={PRIMARY_BTN}>
                <TbUsersGroup
                  aria-hidden="true"
                  className="h-[18px] w-[18px]"
                />
                Join the Alumni Network
              </Link>
            </div>
          </div>

          {/* Campus photo, framed by an oversized blue circle. The circle
              lives in its own clipped wrapper (overflow-hidden, bounded to
              this column) so it can never bleed leftward into the copy
              column — only the photo card is allowed to sit above it. */}
          <div className="relative min-w-0">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 hidden overflow-hidden sm:block"
            >
              <div className="absolute right-[-15%] top-1/2 h-[130%] w-[115%] -translate-y-1/2 rounded-full bg-[linear-gradient(135deg,var(--color-blue-500)_0%,var(--color-blue-700)_100%)] opacity-90" />
            </div>

            <div className="relative overflow-hidden rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.5)]">
              <img
                src="/campus-bg.jpg"
                alt="Philippine Advent College campus"
                className="aspect-[4/3] w-full object-cover"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(12,21,37,0.05)_55%,rgba(12,21,37,0.55)_100%)]"
              />
            </div>

            {/* Floating quote card */}
            <div className="absolute -bottom-6 right-3 flex max-w-[240px] items-start gap-2.5 rounded-xl border border-white/10 bg-[var(--color-navy-900)]/95 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.45)] backdrop-blur sm:right-6">
              <TbQuote
                aria-hidden="true"
                className="mt-0.5 h-5 w-5 flex-none text-blue-400"
              />
              <p className="text-[12.5px] leading-[1.5] text-slate-200">
                Empowering graduates through lifelong connections and shared
                success.
                <span
                  aria-hidden="true"
                  className="mt-1.5 block h-px w-6 bg-blue-400/50"
                />
              </p>
            </div>
          </div>
        </div>

        <StatStrip />
      </div>
    </section>
  );
}
