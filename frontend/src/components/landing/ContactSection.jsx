import { Link } from "react-router-dom";
import { TbMapPin, TbPhone, TbMail, TbArrowRight } from "react-icons/tb";
import Reveal from "./Reveal";

const SERIF = { fontFamily: "'Playfair Display', Georgia, serif" };

// Public contact details for Philippine Advent College, Sindangan.
// Source: philadventcollege.edu.ph "About Us" / CHED institution profile —
// double-check against the college's current official listing before launch.
const ADDRESS = "Ramon Magsaysay, Sindangan, Zamboanga del Norte, 7112";
const PHONE = "  (63+) 9357768845";
const EMAIL = "philippineadventcollege@gmail.com";
const MAP_QUERY = encodeURIComponent(`Philippine Advent College, ${ADDRESS}`);

export default function ContactSection() {
  return (
    <section
      id="contact"
      className="scroll-mt-20 bg-slate-50 px-5 py-14 sm:px-8 lg:px-12 lg:py-20"
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-[1fr_1.3fr] lg:gap-12">
          <Reveal direction="up" className="flex h-full flex-col">
            <div className="flex h-full flex-col">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-600">
                Contact
              </p>
              <h2
                className="mb-6 text-[26px] font-extrabold leading-tight text-slate-800"
                style={SERIF}
              >
                Get in touch with the alumni office
              </h2>

              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <TbMapPin
                      aria-hidden="true"
                      className="h-[18px] w-[18px]"
                    />
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold text-slate-800">
                      Campus Location
                    </p>
                    <p className="text-[12.5px] leading-[1.55] text-slate-500">
                      {ADDRESS}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <TbPhone aria-hidden="true" className="h-[18px] w-[18px]" />
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold text-slate-800">
                      Phone
                    </p>
                    <a
                      href={`tel:${PHONE.replace(/[^\d+]/g, "")}`}
                      className="text-[12.5px] text-slate-500 hover:text-blue-600"
                    >
                      {PHONE}
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <TbMail aria-hidden="true" className="h-[18px] w-[18px]" />
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold text-slate-800">
                      Email
                    </p>
                    <a
                      href={`mailto:${EMAIL}`}
                      className="text-[12.5px] text-slate-500 hover:text-blue-600"
                    >
                      {EMAIL}
                    </a>
                  </div>
                </li>
              </ul>

              {/* mt-auto pins the CTA to the bottom of this column so it
                  lines up with the map's bottom edge once the column is
                  stretched to match the map's height on lg+ screens. */}
              <Link
                to="/register"
                className="mt-6 inline-flex items-center gap-2 self-start rounded-lg bg-blue-600 px-[22px] py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 lg:mt-auto"
              >
                Create your alumni account{" "}
                <TbArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>

          <Reveal direction="up" className="flex h-full flex-col">
            <div className="min-h-[420px] flex-1 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
              <iframe
                title="Philippine Advent College campus location"
                src={`https://www.google.com/maps?q=${MAP_QUERY}&output=embed`}
                className="h-full w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
