import { TbMapPin, TbHeartHandshake, TbUsersGroup } from "react-icons/tb";

const SERIF = { fontFamily: "'Playfair Display', Georgia, serif" };

// Rotating pastel IconChip hues, cycled across items by index.
const HUES = [
  "bg-blue-50 text-blue-600",
  "bg-emerald-50 text-emerald-600",
  "bg-purple-50 text-purple-600",
  "bg-orange-50 text-orange-500",
];

// Right-column checklist items — copy from the approved comp.
const CHECKS = [
  {
    icon: TbMapPin,
    title: "Trace graduate outcomes",
    desc: "Employment and board results that strengthen PAC's programs.",
  },
  {
    icon: TbHeartHandshake,
    title: "Give back to your college",
    desc: "Your updates help future students and program accreditation.",
  },
  {
    icon: TbUsersGroup,
    title: "Stay part of the community",
    desc: "Events, announcements, and a directory of fellow alumni.",
  },
];

/**
 * AboutSection — light two-column band: mission copy on the left, three
 * value-checklist items on the right.
 */
export default function AboutSection() {
  return (
    <section id="about" className="scroll-mt-20 bg-white px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-8 md:grid-cols-[1.15fr_1fr] md:gap-12">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-600">
            About the system
          </p>
          <h2 className="mb-2 text-[26px] font-extrabold leading-tight text-slate-800" style={SERIF}>
            One digital home for every PAC graduate
          </h2>
          <p className="max-w-xl text-[13px] leading-[1.65] text-slate-500 sm:text-sm">
            The Alumni Tracking System exists to keep Philippine Advent College
            and its graduates connected long after commencement. It helps the
            college trace where its alumni are, celebrate their achievements, and
            give back through opportunities — while giving you one place to stay
            involved with the community that shaped you.
          </p>
        </div>

        <ul className="space-y-3">
          {CHECKS.map(({ icon: Icon, title, desc }, i) => (
            <li key={title} className="flex items-start gap-2.5">
              <span
                className={`flex h-9 w-9 flex-none items-center justify-center rounded-lg ${HUES[i % 4]}`}
              >
                <Icon aria-hidden="true" className="h-[17px] w-[17px]" />
              </span>
              <div>
                <b className="block text-[13px] font-semibold text-slate-800">{title}</b>
                <span className="text-[11.5px] text-slate-500">{desc}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
