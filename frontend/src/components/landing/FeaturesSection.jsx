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
    <section id="features" className="scroll-mt-20 bg-white px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9a7d2f]">
          Features
        </p>
        <h2 className="mb-2 text-[26px] font-extrabold leading-tight text-navy-800" style={SERIF}>
          Everything alumni and staff need in one place
        </h2>
        <p className="max-w-xl text-[13px] leading-[1.65] text-[#51607a] sm:text-sm">
          Eight core tools, built around how graduates and the alumni office
          actually work.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl border-[0.5px] border-[#e4e9f2] bg-white p-4">
              <div className="mb-3 flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-gold-500/[0.14] text-[#b8963e]">
                <Icon aria-hidden="true" className="h-5 w-5" />
              </div>
              <p className="mb-1 text-[13.5px] font-semibold text-navy-800">{title}</p>
              <p className="text-[11.5px] leading-[1.5] text-[#6b7a95]">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
