import {
  TbChartHistogram,
  TbHeartHandshake,
  TbUsersGroup,
} from "react-icons/tb";
import Reveal from "./Reveal";

const SERIF = { fontFamily: "'Playfair Display', Georgia, serif" };

// Value props — PAC-specific, one sentence each, not generic alumni-portal
// boilerplate. A single blue chip tint throughout reads more institutional
// than a rotating pastel palette.
const CHECKS = [
  {
    icon: TbChartHistogram,
    title: "Build a Stronger PAC Community",
    desc: "Your employment and board exam records help the college measure graduate outcomes and improve its programs.",
  },
  {
    icon: TbHeartHandshake,
    title: "Stay Connected with Your Alma Mater",
    desc: "Take part in alumni activities, mentor students, and keep contributing to the PAC community.",
  },
  {
    icon: TbUsersGroup,
    title: "Reconnect with Fellow Alumni",
    desc: "Search the verified directory, find batchmates, and rebuild the friendships that started at PAC.",
  },
];

/**
 * NetworkGraphic — the abstract "alumni network" composition that replaces
 * the old stock illustration. Pure SVG on a navy gradient: a loose
 * constellation of nodes joined by thin blue links, with one larger anchor
 * node ringed in institutional gold. No external assets, crisp at any
 * resolution, and it costs nothing to ship.
 */
function NetworkGraphic() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[460px] overflow-hidden rounded-3xl bg-[linear-gradient(140deg,var(--color-navy-900)_0%,var(--color-navy-950)_100%)] shadow-[0_24px_64px_rgba(12,21,37,0.25)] ring-1 ring-white/10">
      <svg
        aria-hidden="true"
        viewBox="0 0 400 400"
        className="absolute inset-0 h-full w-full"
      >
        {/* Links first so every node circle paints on top of them. */}
        <g stroke="rgba(96,165,250,0.35)" strokeWidth="1.5" fill="none">
          <line x1="200" y1="200" x2="95" y2="110" />
          <line x1="200" y1="200" x2="300" y2="95" />
          <line x1="200" y1="200" x2="330" y2="225" />
          <line x1="200" y1="200" x2="240" y2="320" />
          <line x1="200" y1="200" x2="105" y2="285" />
          <line x1="200" y1="200" x2="62" y2="205" />
          <line x1="95" y1="110" x2="185" y2="62" />
          <line x1="185" y1="62" x2="300" y2="95" />
          <line x1="330" y1="225" x2="240" y2="320" />
          <line x1="105" y1="285" x2="62" y2="205" />
          <line x1="62" y1="205" x2="95" y2="110" />
        </g>

        {/* Soft glow halos behind the two heaviest nodes. */}
        <circle cx="200" cy="200" r="46" fill="rgba(96,165,250,0.12)" />
        <circle cx="330" cy="225" r="32" fill="rgba(96,165,250,0.1)" />

        {/* Satellite nodes. */}
        <circle cx="95" cy="110" r="14" fill="var(--color-blue-500)" />
        <circle
          cx="300"
          cy="95"
          r="11"
          fill="var(--color-blue-400)"
          opacity="0.85"
        />
        <circle cx="330" cy="225" r="16" fill="var(--color-blue-600)" />
        <circle
          cx="240"
          cy="320"
          r="13"
          fill="var(--color-blue-500)"
          opacity="0.9"
        />
        <circle
          cx="105"
          cy="285"
          r="9"
          fill="var(--color-blue-400)"
          opacity="0.75"
        />
        <circle
          cx="62"
          cy="205"
          r="7"
          fill="var(--color-blue-500)"
          opacity="0.7"
        />
        <circle
          cx="185"
          cy="62"
          r="6"
          fill="var(--color-blue-400)"
          opacity="0.7"
        />

        {/* Anchor node — the section's single gold institutional accent. */}
        <circle
          cx="200"
          cy="200"
          r="22"
          fill="var(--color-blue-600)"
          stroke="var(--color-gold-500)"
          strokeWidth="1.5"
        />
      </svg>

      {/* Floating glass stat chip — minimal and real, not a fake dashboard. */}
      <div className="absolute bottom-4 left-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur-md">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
          <TbUsersGroup aria-hidden="true" className="h-4 w-4 text-white" />
        </span>
        <span className="block">
          <b className="block text-[16px] font-bold text-white">4,800+</b>
          <span className="block text-[11px] text-slate-300">
            Connected alumni
          </span>
        </span>
      </div>
    </div>
  );
}

/**
 * AboutSection — light two-column band that inverts the hero's arrangement:
 * the abstract network graphic sits left on desktop, mission copy and the
 * value list right. On mobile the copy leads so text is read first.
 */
export default function AboutSection() {
  return (
    <section
      id="about"
      className="relative scroll-mt-20 overflow-hidden bg-white px-5 py-16 sm:px-8 lg:px-12 lg:py-24"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <Reveal direction="right" className="order-1 lg:order-2">
          <p className="mb-3 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-blue-600">
            About the Platform
          </p>
          <h2
            className="mb-4 text-[28px] font-extrabold leading-tight text-slate-900 sm:text-[32px]"
            style={SERIF}
          >
            Fifty Years of Graduates. One Connected Community.
          </h2>
          <p className="max-w-xl text-[15px] leading-[1.7] text-slate-600">
            Since 1975, Philippine Advent College in Sindangan has produced
            thousands of graduates now serving in professions across the
            Philippines and around the world. The PAC Alumni Tracking System
            brings them together in one secure platform to stay connected, share
            career and board exam achievements, and keep a lasting bond with
            their alma mater.
          </p>

          <ul className="mt-8 space-y-5">
            {CHECKS.map(({ icon: Icon, title, desc }) => (
              <li key={title} className="flex items-start gap-4">
                <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Icon aria-hidden="true" className="h-[19px] w-[19px]" />
                </span>
                <div>
                  <b className="block text-[14px] font-semibold text-slate-900">
                    {title}
                  </b>
                  <span className="text-[13px] leading-[1.6] text-slate-500">
                    {desc}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal direction="left" delay={120} className="order-2 lg:order-1">
          <NetworkGraphic />
        </Reveal>
      </div>
    </section>
  );
}
