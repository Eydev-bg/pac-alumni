const SERIF = { fontFamily: "'Playfair Display', Georgia, serif" };

// Neutral monoline person glyph on a soft slate circle, tinted with the blue
// accent to stay on-theme. Self-contained inline SVG — no external image.
function StoryAvatar({ name }) {
  return (
    <span
      role="img"
      aria-label={name}
      className="flex h-10 w-10 flex-none items-center justify-center overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200"
    >
      <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden="true">
        <circle cx="20" cy="15" r="6.5" className="fill-blue-500/80" />
        <path d="M8 34c1.8-6.4 6.6-9.5 12-9.5S30.2 27.6 32 34z" className="fill-blue-500/80" />
      </svg>
    </span>
  );
}

// Placeholder testimonials — replace with real alumni submissions.
// These are illustrative only and must not be presented as real quotes.
const DEFAULT_STORIES = [
  { id: 1, initials: "MR", quote: "PAC gave me the foundation and the values I carry into every operating room. This community still feels like home.", name: "Maria Reyes", detail: "BS Nursing · Batch 2015" },
  { id: 2, initials: "JD", quote: "From a Sindangan classroom to leading a finance team - my journey started here, and I'm proud to give back.", name: "Jose Dela Cruz", detail: "BS Accountancy · Batch 2012" },
  { id: 3, initials: "AS", quote: "The teachers here believed in me first. Now I get to pass that same belief on to my own students.", name: "Ana Santos", detail: "BEEd · Batch 2018" },
];

/**
 * SuccessStories — navy band with three testimonial cards. Content is
 * explicitly placeholder/illustrative (see DEFAULT_STORIES) and should not be
 * presented as real alumni quotes until real submissions replace it.
 */
export default function SuccessStories({ data = DEFAULT_STORIES }) {
  return (
    <section className="bg-white px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-600">
          Alumni success stories
        </p>
        <h2 className="mb-2 text-[26px] font-extrabold leading-tight text-slate-800" style={SERIF}>
          Where a PAC degree can take you
        </h2>

        <div className="mt-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((story) => (
            <figure key={story.id} className="group rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-md motion-reduce:transform-none motion-reduce:transition-none">
              <blockquote className="text-[11.5px] italic leading-[1.55] text-slate-600">
                “{story.quote}”
              </blockquote>
              <figcaption className="mt-3.5 flex items-center gap-2.5">
                <StoryAvatar name={story.name} />
                <span>
                  <b className="block text-[12.5px] font-semibold text-slate-800">{story.name}</b>
                  <span className="text-[11px] text-slate-400">{story.detail}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
