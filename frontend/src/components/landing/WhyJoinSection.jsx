import { Link } from "react-router-dom";
import { TbRocket, TbBellRinging, TbAward, TbArrowRight } from "react-icons/tb";

const SERIF = { fontFamily: "'Playfair Display', Georgia, serif" };

// Rotating pastel IconChip hues, cycled across items by index.
const HUES = [
  "bg-blue-50 text-blue-600",
  "bg-emerald-50 text-emerald-600",
  "bg-purple-50 text-purple-600",
  "bg-orange-50 text-orange-500",
];

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
    <section className="bg-white px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-600">
          Why join
        </p>
        <h2 className="mb-2 text-[26px] font-extrabold leading-tight text-slate-800" style={SERIF}>
          Your college kept a seat for you
        </h2>
        <p className="max-w-xl text-[13px] leading-[1.65] text-slate-500 sm:text-sm">
          Registering takes a minute and gives back for years - professionally
          and personally.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map(({ icon: Icon, title, desc }, i) => (
            <div key={title} className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <div className={`mb-3 flex h-[38px] w-[38px] items-center justify-center rounded-[10px] ${HUES[i % 4]}`}>
                <Icon aria-hidden="true" className="h-5 w-5" />
              </div>
              <p className="mb-1 text-[13.5px] font-semibold text-slate-800">{title}</p>
              <p className="text-[11.5px] leading-[1.5] text-slate-500">{desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-[22px] py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            Register with your ID <TbArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
