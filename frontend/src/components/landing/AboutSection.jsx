import {
  TbChartHistogram,
  TbHeartHandshake,
  TbUsersGroup,
} from "react-icons/tb";
import Reveal from "./Reveal";

const SERIF = { fontFamily: "'Playfair Display', Georgia, serif" };

// Rotating pastel IconChip hues, cycled across items by index.
const HUES = [
  "bg-blue-50 text-blue-600",
  "bg-emerald-50 text-emerald-600",
  "bg-purple-50 text-purple-600",
];

// Left-column checklist items — PAC-specific value props, not generic
// alumni-portal boilerplate.
const CHECKS = [
  {
    icon: TbChartHistogram,
    title: "Build a Stronger PAC Community",
    desc: "Your employment information and board examination results help Philippine Advent College understand graduate outcomes, improve academic programs, and support future generations of students.",
  },
  {
    icon: TbHeartHandshake,
    title: "Stay Connected with Your Alma Mater",
    desc: "Reconnect with your college, participate in alumni activities, mentor students, share career opportunities, and continue making a positive impact on the PAC community.",
  },
  {
    icon: TbUsersGroup,
    title: "Reconnect with Fellow Alumni",
    desc: "Search the verified alumni directory, find classmates and batchmates, join reunions, and reconnect with friends-no matter where life has taken you.",
  },
];

/**
 * AboutSection — light two-column band: mission copy + value checklist on
 * the left, an illustration on the right. Uses afterwork-rafiki.png (an
 * existing repo asset already shipped for another page) since it depicts
 * people connecting and talking — the actual subject of this section —
 * rather than reusing a login/signup-form illustration out of context.
 */
export default function AboutSection() {
  return (
    <section
      id="about"
      className="relative scroll-mt-20 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50 px-5 py-16 sm:px-8 lg:px-12 lg:py-24"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[0.95fr_1.05fr]">
        <Reveal direction="left" className="order-2 lg:order-1">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-600">
            About the system
          </p>
          <h2
            className="mb-2 text-[26px] font-extrabold leading-tight text-slate-800"
            style={SERIF}
          >
            Fifty Years of Graduates. One Connected Community.
          </h2>
          <p className="max-w-xl text-[13px] leading-[1.65] text-slate-500 sm:text-sm">
            Since 1975, Philippine Advent College in Sindangan has produced
            thousands of graduates who are now working in different professions
            across the Philippines and around the world. The PAC Alumni Tracking
            System brings these alumni together in one secure platform where
            they can stay connected, share their career and board examination
            achievements, and maintain a strong connection with Philippine
            Advent College.
          </p>

          <ul className="mt-6 space-y-3">
            {CHECKS.map(({ icon: Icon, title, desc }, i) => (
              <li key={title} className="flex items-start gap-2.5">
                <span
                  className={`flex h-9 w-9 flex-none items-center justify-center rounded-lg ${HUES[i % HUES.length]}`}
                >
                  <Icon aria-hidden="true" className="h-[17px] w-[17px]" />
                </span>
                <div>
                  <b className="block text-[13px] font-semibold text-slate-800">
                    {title}
                  </b>
                  <span className="text-[11.5px] text-slate-500">{desc}</span>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal
          direction="right"
          delay={120}
          className="mx-auto w-full max-w-sm md:max-w-none"
        >
          <div className="group relative mx-auto w-full max-w-[560px]">
            {/* Black Layer */}
            <div className="absolute left-1 top-1 h-full w-full rounded-[32px] bg-slate-900 transition-all duration-700"></div>

            {/* Image Card */}
            <div
              className="
        relative
        -translate-x-2
        -translate-y-2
        overflow-hidden
        rounded-[32px]
        bg-white
        shadow-2xl
        transition-all
        duration-700
        ease-out
        group-hover:translate-x-5
        group-hover:translate-y-5
      "
            >
              <img
                src="/illustrations/aboutimage.png"
                alt="PAC Alumni networking together"
                loading="lazy"
                width={1090}
                height={1090}
                className="
          h-full
          w-full
          object-cover
          transition-transform
          duration-700
          ease-out
          group-hover:scale-105
        "
              />
            </div>

            {/* Floating Circle */}
            <div
              className="
        absolute
        -right-5
        -top-5
        flex
        h-16
        w-16
        items-center
        justify-center
        rounded-full
        bg-blue-600
        shadow-xl
        transition-all
        duration-700
        group-hover:rotate-12
        group-hover:scale-110
      "
            >
              <TbUsersGroup className="h-8 w-8 text-white" />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
