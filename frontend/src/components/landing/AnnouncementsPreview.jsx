import { format, parseISO } from "date-fns";
import { TbCalendar, TbArrowRight } from "react-icons/tb";

const SERIF = { fontFamily: "'Playfair Display', Georgia, serif" };

// TODO: replace with GET /api/announcements?limit=3
const DEFAULT_ANNOUNCEMENTS = [
  { id: 1, category: "Academic", title: "Alumni homecoming 2026 registration now open", excerpt: "Reserve your slot for this year's grand reunion weekend.", date: "2026-03-12" },
  { id: 2, category: "Scholarship", title: "New alumni-funded scholarship for incoming students", excerpt: "Give back by supporting the next generation of PAC scholars.", date: "2026-03-04" },
  { id: 3, category: "Notice", title: "Update your employment record for the 2026 tracer study", excerpt: "Help the college report accurate graduate outcomes.", date: "2026-02-28" },
];

/**
 * AnnouncementsPreview — light band showing the three latest announcements.
 * `data` defaults to placeholder content shaped like the future API response,
 * so wiring the real endpoint later is just passing a fetched prop.
 */
export default function AnnouncementsPreview({ data = DEFAULT_ANNOUNCEMENTS }) {
  return (
    <section id="announcements" className="scroll-mt-20 bg-slate-50 px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-2.5">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-600">
              Latest announcements
            </p>
            <h2 className="text-[26px] font-extrabold leading-tight text-slate-800" style={SERIF}>
              News from the college
            </h2>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((item) => (
            <article key={item.id} className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <span className="inline-block rounded-full bg-blue-50 px-2.5 py-[3px] text-[10.5px] font-semibold text-blue-700">
                {item.category}
              </span>
              <p className="mt-2.5 text-[13.5px] font-semibold text-slate-800">{item.title}</p>
              <p className="mt-1 text-[11.5px] leading-[1.5] text-slate-500">{item.excerpt}</p>
              <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                <TbCalendar aria-hidden="true" className="h-3.5 w-3.5" />
                {format(parseISO(item.date), "MMM dd, yyyy")}
              </div>
              <a
                href="/login"
                className="mt-2.5 inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-blue-600 hover:text-blue-700"
              >
                Read more <TbArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
