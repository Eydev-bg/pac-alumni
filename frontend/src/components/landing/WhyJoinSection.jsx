import { Link } from "react-router-dom";
import { TbRocket, TbBellRinging, TbAward, TbArrowRight } from "react-icons/tb";

const SERIF = { fontFamily: "'Playfair Display', Georgia, serif" };

// Three benefit cards — copy from the approved comp.
const BENEFITS = [
  { icon: TbRocket, title: "Advance your career", desc: "See jobs shared for PAC alumni before anyone else." },
  { icon: TbBellRinging, title: "Never miss news", desc: "Announcements and events land in one notification center." },
  { icon: TbAward, title: "Be counted", desc: "Your success story strengthens PAC for the next batch." },
];

/**
 * WhyJoinSection — navy band with three frosted benefit cards and a single
 * gold CTA that routes to registration.
 */
export default function WhyJoinSection() {
  return (
    <section className="bg-[linear-gradient(140deg,var(--color-navy-900),var(--color-navy-800)_60%,var(--color-navy-950))] px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-300">
          Why join
        </p>
        <h2 className="mb-2 text-[26px] font-extrabold leading-tight text-white" style={SERIF}>
          Your college kept a seat for you
        </h2>
        <p className="max-w-xl text-[13px] leading-[1.65] text-[#c3cee2] sm:text-sm">
          Registering takes a minute and gives back for years - professionally
          and personally.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl border border-gold-500/25 bg-navy-800/50 p-4">
              <div className="mb-3 flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-gold-500/[0.18] text-gold-300">
                <Icon aria-hidden="true" className="h-5 w-5" />
              </div>
              <p className="mb-1 text-[13.5px] font-semibold text-white">{title}</p>
              <p className="text-[11.5px] leading-[1.5] text-[#aebbd6]">{desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-[9px] bg-gradient-to-r from-gold-500 to-gold-300 px-[22px] py-2.5 text-[13px] font-semibold text-navy-800 shadow-sm transition hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-gold-300/60"
          >
            Register with your ID <TbArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
