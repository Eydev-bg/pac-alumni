import {
  TbShieldCheck,
  TbBriefcase,
  TbCertificate,
  TbTargetArrow,
  TbSpeakerphone,
  TbCalendarEvent,
  TbMessages,
  TbAddressBook,
} from "react-icons/tb";

const SERIF = { fontFamily: "'Playfair Display', Georgia, serif" };

// Rotating pastel IconChip hues, cycled across items by index.
const HUES = [
  "bg-blue-50 text-blue-600",
  "bg-emerald-50 text-emerald-600",
  "bg-purple-50 text-purple-600",
  "bg-orange-50 text-orange-500",
];

// The eight core tools — copy from the approved comp.
const FEATURES = [
  { icon: TbShieldCheck, title: "Alumni verification", desc: "Secure ID-based sign up for real graduates only." },
  { icon: TbBriefcase, title: "Employment tracking", desc: "Keep your current work and history up to date." },
  { icon: TbCertificate, title: "Board exam monitoring", desc: "Record and track licensure exam results." },
  { icon: TbTargetArrow, title: "Career opportunities", desc: "An alumni-only board of curated job postings." },
  { icon: TbSpeakerphone, title: "Announcements", desc: "Official news delivered straight to your feed." },
  { icon: TbCalendarEvent, title: "Events", desc: "Reunions and gatherings you can RSVP to." },
  { icon: TbMessages, title: "Messaging", desc: "Reach the alumni office and stay in touch." },
  { icon: TbAddressBook, title: "Alumni directory", desc: "Find and reconnect with fellow batchmates." },
];

/**
 * FeaturesSection — white band with an eight-card feature grid
 * (4 cols desktop · 2 cols tablet · 1 col mobile).
 */
export default function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-20 bg-slate-50 px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-600">
          Features
        </p>
        <h2 className="mb-2 text-[26px] font-extrabold leading-tight text-slate-800" style={SERIF}>
          Everything alumni and staff need in one place
        </h2>
        <p className="max-w-xl text-[13px] leading-[1.65] text-slate-500 sm:text-sm">
          Eight core tools, built around how graduates and the alumni office
          actually work.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, desc }, i) => (
            <div key={title} className="group rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-md motion-reduce:transform-none motion-reduce:transition-none">
              <div className={`mb-3 flex h-[38px] w-[38px] items-center justify-center rounded-[10px] ${HUES[i % 4]} transition-transform duration-200 ease-out group-hover:scale-105 motion-reduce:transform-none`}>
                <Icon aria-hidden="true" className="h-5 w-5" />
              </div>
              <p className="mb-1 text-[13.5px] font-semibold text-slate-800">{title}</p>
              <p className="text-[11.5px] leading-[1.5] text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
