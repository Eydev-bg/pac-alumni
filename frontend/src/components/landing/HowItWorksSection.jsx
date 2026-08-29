import { TbUserPlus, TbListCheck, TbUsersGroup } from "react-icons/tb";
import Reveal from "./Reveal";

const SERIF = { fontFamily: "'Playfair Display', Georgia, serif" };

const STEPS = [
  {
    icon: TbUserPlus,
    title: "Create Your Account",
    desc: "Register with your name, graduation year, and program. Verification keeps the network trusted.",
  },
  {
    icon: TbListCheck,
    title: "Complete Your Profile",
    desc: "Add your employment details, board exam results, and contact preferences.",
  },
  {
    icon: TbUsersGroup,
    title: "Connect & Engage",
    desc: "Access the alumni directory, receive announcements, discover job opportunities, and message fellow alumni.",
  },
];

/**
 * HowItWorksSection — the three-step onboarding path, sitting between About
 * and Features. A dashed connector runs behind the step badges on md+ to
 * imply sequence; the badges sit above it so they visually break the line.
 */
export default function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 bg-slate-50 px-5 py-16 sm:px-8 lg:px-12 lg:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal direction="up" className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-blue-600">
            How It Works
          </p>
          <h2
            className="mb-3 text-[28px] font-extrabold leading-tight text-slate-900 sm:text-[32px]"
            style={SERIF}
          >
            Get started in three simple steps
          </h2>
          <p className="text-[14px] leading-[1.6] text-slate-500">
            Joining the PAC alumni community takes just a few minutes.
          </p>
        </Reveal>

        <div className="relative mt-14 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6">
          {/* Decorative connector, desktop only — drawn first, under the steps */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-[16.66%] right-[16.66%] top-7 hidden border-t-2 border-dashed border-slate-300 md:block"
          />

          {STEPS.map(({ icon: Icon, title, desc }, i) => (
            <Reveal
              key={title}
              direction="up"
              delay={i * 100}
              className="relative z-10 flex flex-col items-center text-center"
            >
              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_8px_24px_-6px_rgba(37,99,235,0.5)]">
                  <Icon aria-hidden="true" className="h-6 w-6" />
                </div>
                <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[12px] font-bold text-blue-600 ring-2 ring-slate-50">
                  {i + 1}
                </span>
              </div>

              <h3 className="mt-5 text-[16px] font-semibold text-slate-900">
                {title}
              </h3>
              <p className="mt-2 max-w-[260px] text-[13px] leading-[1.6] text-slate-500">
                {desc}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
