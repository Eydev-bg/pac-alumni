const SERIF = { fontFamily: "'Playfair Display', Georgia, serif" };

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
    <section className="bg-[linear-gradient(140deg,var(--color-navy-900),var(--color-navy-800)_60%,var(--color-navy-950))] px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-300">
          Alumni success stories
        </p>
        <h2 className="mb-2 text-[26px] font-extrabold leading-tight text-white" style={SERIF}>
          Where a PAC degree can take you
        </h2>

        <div className="mt-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((story) => (
            <figure key={story.id} className="rounded-xl border border-gold-500/25 bg-navy-800/50 p-4">
              <blockquote className="text-[11.5px] italic leading-[1.55] text-[#d5deef]">
                “{story.quote}”
              </blockquote>
              <figcaption className="mt-3.5 flex items-center gap-2.5">
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-gold-500/20 text-sm font-semibold text-gold-300">
                  {story.initials}
                </span>
                <span>
                  <b className="block text-[12.5px] font-semibold text-white">{story.name}</b>
                  <span className="text-[11px] text-[#aebbd6]">{story.detail}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
