import { TbMapPin, TbPhone, TbMail, TbExternalLink } from "react-icons/tb";
import Reveal from "./Reveal";

const SERIF = { fontFamily: "'Playfair Display', Georgia, serif" };

// Public contact details for Philippine Advent College, Sindangan.
// Source: philadventcollege.edu.ph "About Us" / CHED institution profile —
// double-check against the college's current official listing before launch.
const ADDRESS = "Ramon Magsaysay, Sindangan, Zamboanga del Norte, 7112";
const PHONE = "  (63+) 9357768845";
const EMAIL = "philippineadventcollege@gmail.com";
const MAP_QUERY = encodeURIComponent(`Philippine Advent College, ${ADDRESS}`);

/**
 * ContactSection — a clean, light closing band of reference details before
 * the dark footer. The map is an outbound link rather than an embed: the
 * iframe cost a lot of payload for something nobody converts on, and the
 * conversion moment now lives in the CtaBand above.
 */
export default function ContactSection() {
  return (
    <section
      id="contact"
      className="scroll-mt-20 bg-white px-5 py-16 sm:px-8 lg:px-12 lg:py-20"
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <Reveal direction="up">
            <p className="mb-3 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-blue-600">
              Contact
            </p>
            <h2
              className="mb-4 text-[28px] font-extrabold leading-tight text-slate-900 sm:text-[32px]"
              style={SERIF}
            >
              Get in touch with the alumni office
            </h2>
            <p className="max-w-md text-[14px] leading-[1.7] text-slate-500">
              Have questions about the platform or your alumni account? Reach
              the Philippine Advent College alumni office through any of the
              channels below.
            </p>
          </Reveal>

          <Reveal direction="up" delay={100}>
            <div className="space-y-3">
              <div className="flex items-start gap-4 rounded-2xl border border-slate-200/60 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm">
                <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <TbMapPin aria-hidden="true" className="h-[19px] w-[19px]" />
                </span>
                <div>
                  <p className="text-[13px] font-semibold text-slate-900">
                    Campus Location
                  </p>
                  <p className="text-[13px] leading-[1.55] text-slate-500">
                    {ADDRESS}
                  </p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${MAP_QUERY}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 text-[12.5px] font-medium text-blue-600 transition hover:text-blue-700"
                  >
                    View on Google Maps
                    <TbExternalLink
                      aria-hidden="true"
                      className="h-3.5 w-3.5"
                    />
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-2xl border border-slate-200/60 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm">
                <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <TbPhone aria-hidden="true" className="h-[19px] w-[19px]" />
                </span>
                <div>
                  <p className="text-[13px] font-semibold text-slate-900">
                    Phone
                  </p>
                  <a
                    href={`tel:${PHONE.replace(/[^\d+]/g, "")}`}
                    className="text-[13px] leading-[1.55] text-slate-500 transition hover:text-blue-600"
                  >
                    {PHONE}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-2xl border border-slate-200/60 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm">
                <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <TbMail aria-hidden="true" className="h-[19px] w-[19px]" />
                </span>
                <div>
                  <p className="text-[13px] font-semibold text-slate-900">
                    Email
                  </p>
                  <a
                    href={`mailto:${EMAIL}`}
                    className="text-[13px] leading-[1.55] text-slate-500 transition hover:text-blue-600"
                  >
                    {EMAIL}
                  </a>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
