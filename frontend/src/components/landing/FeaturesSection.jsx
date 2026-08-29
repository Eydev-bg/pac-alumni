import {
  TbAddressBook,
  TbBriefcase,
  TbMessages,
  TbCertificate,
} from "react-icons/tb";
import Reveal from "./Reveal";

const SERIF = { fontFamily: "'Playfair Display', Georgia, serif" };

// Four real, implemented, distinct capabilities. Cards describe what the
// platform does — they deliberately carry no CTA link, since a feature card
// that pretends to deep-link somewhere it can't reach is just misleading.
const FEATURES = [
  {
    icon: TbAddressBook,
    title: "Alumni Directory",
    desc: "Search and reconnect with verified PAC alumni organized by batch, program, and graduation year — and control your own visibility with privacy settings.",
  },
  {
    icon: TbBriefcase,
    title: "Career Center",
    desc: "Browse job opportunities shared with the PAC alumni community and keep your employment records up to date.",
  },
  {
    icon: TbMessages,
    title: "Secure Messaging",
    desc: "Message fellow alumni directly. Share files and images, and stay connected through private, real-time conversations.",
  },
  {
    icon: TbCertificate,
    title: "Board Exam Records",
    desc: "Record your licensure examination results to help the college track program outcomes and recognize alumni achievements.",
  },
];

/**
 * FeaturesSection — four glassmorphic cards on a deep-navy surface. Moving
 * this section off a light background is the redesign's signature structural
 * change: it bookends the hero and breaks the run of light sections above.
 */
export default function FeaturesSection() {
  return (
    <section
      id="features"
      className="relative scroll-mt-20 overflow-hidden bg-[var(--color-navy-950)] px-5 py-16 sm:px-8 lg:px-12 lg:py-24"
    >
      {/* Subtle depth wash — purely cosmetic */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 [background:radial-gradient(90%_60%_at_50%_0%,rgba(37,99,235,0.10)_0%,transparent_60%)]"
      />

      <div className="relative mx-auto max-w-6xl">
        <Reveal direction="up" className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-blue-400">
            Platform Features
          </p>
          <h2
            className="mb-3 text-[28px] font-extrabold leading-tight text-white sm:text-[32px]"
            style={SERIF}
          >
            Everything you need in one place
          </h2>
          <p className="text-[14px] leading-[1.6] text-slate-300">
            Core tools built for PAC alumni to stay connected, manage their
            records, and grow together.
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:gap-6">
          {FEATURES.map(({ icon: Icon, title, desc }, i) => (
            <Reveal
              key={title}
              direction="up"
              delay={i * 80}
              className="h-full"
            >
              <div className="group flex h-full flex-col rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-sm transition-all duration-300 ease-out hover:border-white/[0.14] hover:bg-white/[0.07] hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)] motion-reduce:transition-none">
                <div className="mb-4 flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-blue-600/15 text-blue-400">
                  <Icon aria-hidden="true" className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-[17px] font-semibold text-white">
                  {title}
                </h3>
                <p className="text-[13.5px] leading-[1.65] text-slate-300">
                  {desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
