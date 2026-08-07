import {
  TbMessages,
  TbBellRinging,
  TbAddressBook,
  TbBriefcase,
  TbCertificate,
  TbUsersGroup,
  TbArrowRight,
} from "react-icons/tb";
import Reveal from "./Reveal";

const SERIF = { fontFamily: "'Playfair Display', Georgia, serif" };

// Rotating icon-chip tints — flat, no gradients, cycled across cards by
// index so no two neighboring cards share a color.
const HUES = {
  blue: "bg-blue-50 text-blue-600",
  emerald: "bg-emerald-50 text-emerald-600",
  purple: "bg-purple-50 text-purple-600",
  amber: "bg-amber-50 text-amber-600",
};

// Six core tools. Every card gets identical visual treatment (icon chip +
// title + description + link) — no per-row illustration, so nothing here
// competes in weight with the photo already used in AboutSection above.
const FEATURES = [
  {
    icon: TbMessages,
    title: "Messaging",
    desc: "Message fellow alumni directly from their profiles, reconnect with batchmates, coordinate reunions, and stay connected through secure, private conversations.",
    cta: "Explore messaging",
    hue: "blue",
  },
  {
    icon: TbBellRinging,
    title: "Notifications",
    desc: "Receive announcements, event reminders, job opportunities, and important updates in one place.",
    cta: "See notifications",
    hue: "amber",
  },
  {
    icon: TbAddressBook,
    title: "Verified Alumni Directory",
    desc: "Find and reconnect with verified PAC alumni through a trusted directory organized by batch, program, and graduation year.",
    cta: "Browse the directory",
    hue: "purple",
  },
  {
    icon: TbBriefcase,
    title: "Career & Employment Tracking",
    desc: "Keep your employment information up to date and discover career opportunities shared exclusively with PAC alumni.",
    cta: "Update employment",
    hue: "emerald",
  },
  {
    icon: TbCertificate,
    title: "Board Examination Records",
    desc: "Record your licensure examination results to help the college measure program outcomes while recognizing alumni achievements.",
    cta: "View exam records",
    hue: "blue",
  },
  {
    icon: TbUsersGroup,
    title: "Alumni Networking",
    desc: "Reconnect with classmates, expand your professional network, and build lasting relationships within the PAC alumni community.",
    cta: "Start networking",
    hue: "amber",
  },
];

/**
 * FeaturesSection — six feature cards in a 3x2 grid (2 columns on small
 * screens, 3 on lg+). Every card shares the same icon-chip + title + desc +
 * link structure, so visual weight stays even across the whole section
 * instead of one row outweighing the rest with a full illustration.
 */
export default function FeaturesSection() {
  return (
    <section
      id="features"
      className="scroll-mt-20 bg-slate-50 px-5 py-14 sm:px-8 lg:px-12 lg:py-20"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal direction="up" className="max-w-2xl">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-600">
            Features
          </p>
          <h2
            className="mb-2 text-[26px] font-extrabold leading-tight text-slate-800"
            style={SERIF}
          >
            Everything alumni and staff need in one place
          </h2>
          <p className="max-w-xl text-[13px] leading-[1.65] text-slate-500 sm:text-sm">
            Six essential tools designed to help PAC alumni stay connected,
            manage their records, and engage with the alumni community.
          </p>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3 lg:gap-6">
          {FEATURES.map(({ icon: Icon, title, desc, cta, hue }, i) => (
            <Reveal
              key={title}
              direction="up"
              delay={i * 60}
              className="h-full"
            >
              <div className="group flex h-full flex-col rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-md motion-reduce:transform-none">
                <div
                  className={`mb-4 flex h-11 w-11 flex-none items-center justify-center rounded-[10px] ${HUES[hue] ?? HUES.blue}`}
                >
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </div>
                <h3
                  className="mb-2 text-[16px] font-bold text-slate-800"
                  style={SERIF}
                >
                  {title}
                </h3>
                <p className="mb-4 flex-1 text-[13px] leading-[1.65] text-slate-500">
                  {desc}
                </p>
                <a
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-blue-600 transition group-hover:gap-2.5 hover:text-blue-700"
                >
                  {cta}{" "}
                  <TbArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                </a>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
