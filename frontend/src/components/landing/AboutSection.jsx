import { TbMapPin, TbHeartHandshake, TbUsersGroup } from "react-icons/tb";

const SERIF = { fontFamily: "'Playfair Display', Georgia, serif" };

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
    <section id="about" className="scroll-mt-20 bg-[#f6f8fc] px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-8 md:grid-cols-[1.15fr_1fr] md:gap-12">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9a7d2f]">
            About the system
          </p>
          <h2 className="mb-2 text-[26px] font-extrabold leading-tight text-navy-800" style={SERIF}>
            One digital home for every PAC graduate
          </h2>
          <p className="max-w-xl text-[13px] leading-[1.65] text-[#51607a] sm:text-sm">
            The Alumni Tracking System exists to keep Philippine Advent College
            and its graduates connected long after commencement. It helps the
            college trace where its alumni are, celebrate their achievements, and
            give back through opportunities — while giving you one place to stay
            involved with the community that shaped you.
          </p>
        </div>

        <ul className="space-y-3">
          {CHECKS.map(({ icon: Icon, title, desc }) => (
            <li key={title} className="flex items-start gap-2.5">
              <Icon aria-hidden="true" className="mt-0.5 h-[17px] w-[17px] flex-none text-[#b8963e]" />
              <div>
                <b className="block text-[13px] font-semibold text-navy-800">{title}</b>
                <span className="text-[11.5px] text-[#6b7a95]">{desc}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
