import { Link } from "react-router-dom";
import { TbArrowRight, TbIdBadge2, TbLock } from "react-icons/tb";
import StatStrip from "./StatStrip";

const SERIF = { fontFamily: "'Playfair Display', Georgia, serif" };

// Shared CTA button styles (gold-fill primary / outline secondary on navy).
const PRIMARY_BTN =
  "inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-[13px] font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white/60";
const SECONDARY_BTN =
  "inline-flex items-center gap-2 rounded-[9px] border border-white/[0.28] px-[18px] py-2.5 text-[13px] font-medium text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40";

/**
 * HeroSection — the navy hero: kicker, headline, supporting copy, CTAs, trust
 * microcopy, the gold line-art emblem, and the four-stat strip.
 */
export default function HeroSection() {
  return (
    <section
      id="home"
      className="flex min-h-screen scroll-mt-20 flex-col justify-start bg-[linear-gradient(135deg,var(--color-blue-600)_0%,var(--color-blue-700)_100%)] px-5 pb-12 pt-24 sm:px-8 lg:px-12 lg:pb-16 lg:pt-28"
    >
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center gap-8 md:flex-row md:gap-10">
          {/* Copy column */}
          <div className="md:flex-[1.25]">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-blue-100">
              Serving graduates since 1975
            </p>
            <h1
              className="text-3xl font-extrabold leading-[1.1] text-white md:text-[3.10rem]"
              style={SERIF}
            >
              Stay connected with{" "}
              <em className="not-italic text-blue-100">Philippine Advent College</em>{" "}
              alumni
            </h1>
            <p className="my-4 max-w-xl text-[13px] leading-[1.65] text-blue-100 sm:text-sm">
              The PAC Alumni Tracking System is your home to reconnect with the
              college, stay informed, discover career opportunities, receive
              announcements, join events, and keep your employment details up to
              date.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link to="/login" className={PRIMARY_BTN}>
                Log in <TbArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
              <Link to="/register" className={SECONDARY_BTN}>
                <TbIdBadge2 aria-hidden="true" className="h-4 w-4" /> Register with your ID
              </Link>
            </div>
            <p className="mt-3.5 flex items-center gap-1.5 text-[11px] text-blue-200">
              <TbLock aria-hidden="true" className="h-3.5 w-3.5" />
              For verified Philippine Advent College graduates and staff
            </p>
          </div>

          {/* Campus photo — same column/position the illustration occupied.
              Rounded card frame + a navy vignette/gradient overlay so the photo
              edges fade into the hero background instead of reading as pasted. */}
          <div className="w-full md:flex-1">
            <div className="relative overflow-hidden rounded-xl border border-white/25 shadow-[0_16px_48px_rgba(0,0,0,0.35)]">
              <img
                src="/campus-bg.jpg"
                alt="Philippine Advent College campus"
                className="aspect-[4/3] w-full object-cover"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[linear-gradient(140deg,rgba(15,27,61,0.45)_0%,rgba(26,46,90,0.12)_45%,rgba(12,21,37,0.6)_100%)] shadow-[inset_0_0_55px_18px_rgba(12,21,37,0.6)]"
              />
            </div>
          </div>
        </div>

        <StatStrip />
      </div>
    </section>
  );
}
