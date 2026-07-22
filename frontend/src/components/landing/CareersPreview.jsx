import { TbMapPin, TbArrowRight } from "react-icons/tb";

const SERIF = { fontFamily: "'Playfair Display', Georgia, serif" };

// TODO: replace with GET /api/job-postings?limit=3
const DEFAULT_JOBS = [
  { id: 1, title: "Registered Nurse", type: "Full-time", company: "Zamboanga Medical Center", location: "Zamboanga del Norte" },
  { id: 2, title: "Junior Accountant", type: "Full-time", company: "Dipolog Finance Group", location: "Dipolog City" },
  { id: 3, title: "Elementary Teacher", type: "Contract", company: "Sindangan Central School", location: "Sindangan" },
];

/**
 * CareersPreview — light band showing three job postings. `data` defaults to
 * placeholder content shaped like the future API response.
 */
export default function CareersPreview({ data = DEFAULT_JOBS }) {
  return (
    <section id="careers" className="scroll-mt-20 bg-slate-50 px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-2.5">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-600">
              Career opportunities
            </p>
            <h2 className="text-[26px] font-extrabold leading-tight text-slate-800" style={SERIF}>
              Jobs shared for PAC alumni
            </h2>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((job) => (
            <article key={job.id} className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[13.5px] font-semibold text-slate-800">{job.title}</p>
                <span className="inline-block flex-none rounded-full bg-blue-50 px-2.5 py-[3px] text-[10.5px] font-semibold text-blue-700">
                  {job.type}
                </span>
              </div>
              <p className="mt-1.5 text-[11.5px] leading-[1.5] text-slate-500">{job.company}</p>
              <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                <TbMapPin aria-hidden="true" className="h-3.5 w-3.5" /> {job.location}
              </div>
              <a
                href="/login"
                className="mt-2.5 inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-blue-600 hover:text-blue-700"
              >
                View job <TbArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
