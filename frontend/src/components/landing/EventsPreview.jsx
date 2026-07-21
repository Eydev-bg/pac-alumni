import { TbClock } from "react-icons/tb";

const SERIF = { fontFamily: "'Playfair Display', Georgia, serif" };

// TODO: replace with GET /api/events?upcoming=true&limit=3
const DEFAULT_EVENTS = [
  { id: 1, month: "APR", day: "18", title: "Grand alumni homecoming", location: "PAC Main Campus, Sindangan", time: "8:00 AM" },
  { id: 2, month: "MAY", day: "09", title: "Career networking night", location: "College Auditorium", time: "5:30 PM" },
  { id: 3, month: "JUN", day: "21", title: "Board passers recognition", location: "Online livestream", time: "2:00 PM" },
];

/**
 * EventsPreview — white band showing the three upcoming events, each with a
 * navy date-block. `data` defaults to placeholder content shaped like the
 * future API response.
 */
export default function EventsPreview({ data = DEFAULT_EVENTS }) {
  return (
    <section id="events" className="scroll-mt-20 bg-white px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-2.5">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9a7d2f]">
              Upcoming events
            </p>
            <h2 className="text-[26px] font-extrabold leading-tight text-navy-800" style={SERIF}>
              Mark your calendar
            </h2>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((event) => (
            <article key={event.id} className="flex gap-3.5 rounded-xl border-[0.5px] border-[#e4e9f2] bg-white p-4">
              <div className="w-[50px] flex-none rounded-[9px] bg-navy-900 py-2 text-center">
                <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gold-300">
                  {event.month}
                </div>
                <div className="text-xl font-extrabold leading-none text-white" style={SERIF}>
                  {event.day}
                </div>
              </div>
              <div>
                <p className="text-[13.5px] font-semibold text-navy-800">{event.title}</p>
                <p className="mt-0.5 text-[11.5px] leading-[1.5] text-[#6b7a95]">{event.location}</p>
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#8593ad]">
                  <TbClock aria-hidden="true" className="h-3.5 w-3.5" /> {event.time}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
