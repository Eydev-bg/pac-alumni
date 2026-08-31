import { Link } from "react-router-dom";
import { TbArrowLeft, TbMail } from "react-icons/tb";

const SERIF = { fontFamily: "'Playfair Display', Georgia, serif" };

const SCHOOL_EMAIL = "philippineadventcollege@gmail.com";

// Revision date of this document — bump it by hand whenever the terms below
// change. Deliberately NOT derived from `new Date()`: a "last updated" line
// that always shows the current month tells the reader nothing.
const LAST_UPDATED = "August 2026";

/**
 * Sections 1–10. The Contact section is rendered separately below so its email
 * can be a real mailto link rather than plain text.
 */
const SECTIONS = [
  {
    title: "Acceptance of Terms",
    body: [
      "By accessing or using the PAC Alumni Tracking System (the “System”), you agree to be bound by these Terms of Use. These terms apply to every visitor and account holder.",
      "If you do not agree with any part of these terms, please do not use the System.",
    ],
  },
  {
    title: "Eligibility and Accounts",
    body: ["The System is intended for use by:"],
    list: [
      "Authorized administrators and staff of Philippine Advent College; and",
      "Verified alumni of Philippine Advent College.",
    ],
    after: [
      "Alumni accounts are for college graduates. During registration, the details you submit are checked against the College's official graduate records, and an account is issued only once that verification succeeds.",
    ],
  },
  {
    title: "Account Registration and Accuracy",
    body: [
      "You must provide accurate, current, and complete information when you register, and keep your profile up to date as your circumstances change.",
      "You are responsible for keeping your password confidential and for all activity that takes place under your account. Providing false or misleading information may result in your account being suspended or removed.",
    ],
  },
  {
    title: "Acceptable Use",
    body: ["When using the System, you agree not to:"],
    list: [
      "Create fake or duplicate accounts, or impersonate another person;",
      "Send spam, or harass, threaten, or abuse other members;",
      "Upload malicious software or any content intended to damage the System;",
      "Attempt to gain unauthorized access to the System, its data, or another user's account; or",
      "Use the System for any unlawful purpose.",
    ],
  },
  {
    title: "User Content",
    body: [
      "You are responsible for the information you submit, including your profile details, employment history, and board examination records.",
      "By submitting content, you confirm that it is accurate to the best of your knowledge and that you have the right to share it. The College may use the information you provide to maintain its alumni records and produce institutional reports.",
    ],
  },
  {
    title: "Account Suspension and Termination",
    body: [
      "Administrators may suspend or terminate any account that violates these terms, was created with false information, or is being used to misuse the System.",
      "You may also request that your account be deactivated by contacting the College.",
    ],
  },
  {
    title: "Privacy",
    body: [
      "The System collects personal information in order to maintain accurate alumni records and to provide alumni services such as announcements, events, and career opportunities.",
      "Personal information is handled in accordance with the College's data handling practices and is not sold to third parties. A separate, more detailed privacy policy may be published in the future.",
    ],
  },
  {
    title: "Intellectual Property",
    body: [
      "The System — including its design, layout, logos, seal, and content — is the property of Philippine Advent College.",
      "You may not copy, reproduce, modify, or redistribute any part of the System without the College's written permission.",
    ],
  },
  {
    title: "Disclaimer",
    body: [
      "The System is provided on an “as is” basis. The College works to keep the information accurate and the service available, but does not guarantee that the System will be uninterrupted, error-free, or free of inaccuracies.",
      "Alumni records are only as current as the information supplied by the graduates themselves.",
    ],
  },
  {
    title: "Changes to These Terms",
    body: [
      "The College may update these Terms of Use from time to time. When that happens, the “last updated” date above will change.",
      "Continuing to use the System after an update means you accept the revised terms.",
    ],
  },
];

const HEADING = "text-[17px] font-bold text-navy-800 dark:text-white sm:text-[19px]";
const PARAGRAPH =
  "mt-2.5 text-[14px] leading-[1.75] text-slate-600 dark:text-slate-300";
const LIST_ITEM = "text-[14px] leading-[1.7] text-slate-600 dark:text-slate-300";

/**
 * TermsOfUsePage — public document page at `/terms-of-use`, linked from the
 * landing footer. Reachable by anyone, signed in or not.
 *
 * Follows the public-page conventions: Inter as the base face with Playfair
 * Display on headings (inline, as on the Landing and auth pages), the navy
 * header band from the landing footer, and `dark:` variants throughout since
 * the `dark` class is toggled globally on <html>.
 */
export default function TermsOfUsePage() {
  return (
    <div
      className="min-h-screen bg-[#f5f7fb] dark:bg-navy-950"
      style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
    >
      {/* ─── Header band ───────────────────────────── */}
      <header className="bg-navy-900 px-5 pb-10 pt-6 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-blue-300 transition hover:text-blue-200"
          >
            <TbArrowLeft aria-hidden="true" className="h-4 w-4" />
            Back to Home
          </Link>

          <div className="mt-7 flex items-center gap-3.5">
            <img
              src="/pac-logo.jpg"
              alt="Philippine Advent College seal"
              className="h-[52px] w-[52px] flex-none rounded-full border-2 border-[var(--color-gold-500)] bg-navy-900 object-cover"
            />
            <div>
              <h1
                className="text-[27px] font-extrabold leading-tight text-white sm:text-[33px]"
                style={SERIF}
              >
                Terms of Use
              </h1>
              <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.12em] text-blue-300">
                Philippine Advent College · Alumni Tracking System
              </p>
            </div>
          </div>

          <p className="mt-5 text-[12.5px] text-[#8ea0c4]">
            Last updated: {LAST_UPDATED}
          </p>
        </div>
      </header>

      {/* ─── Document ──────────────────────────────── */}
      <main className="px-5 py-8 sm:px-8 sm:py-10">
        <article className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10 dark:border-white/[0.08] dark:bg-navy-900 dark:shadow-none">
          <p className="text-[14.5px] leading-[1.75] text-slate-600 dark:text-slate-300">
            These Terms of Use govern your access to and use of the Philippine
            Advent College Alumni Tracking System, the online platform the
            College uses to maintain its alumni records and keep graduates
            connected with the school.
          </p>

          {SECTIONS.map((section, i) => (
            <section key={section.title} className="mt-8">
              <h2 className={HEADING} style={SERIF}>
                {i + 1}. {section.title}
              </h2>

              {section.body.map((paragraph) => (
                <p key={paragraph} className={PARAGRAPH}>
                  {paragraph}
                </p>
              ))}

              {section.list && (
                <ul className="mt-2.5 list-disc space-y-1.5 pl-5 marker:text-slate-400 dark:marker:text-slate-500">
                  {section.list.map((item) => (
                    <li key={item} className={LIST_ITEM}>
                      {item}
                    </li>
                  ))}
                </ul>
              )}

              {section.after?.map((paragraph) => (
                <p key={paragraph} className={PARAGRAPH}>
                  {paragraph}
                </p>
              ))}
            </section>
          ))}

          {/* Contact — rendered here so the address is a real mailto link. */}
          <section className="mt-8">
            <h2 className={HEADING} style={SERIF}>
              {SECTIONS.length + 1}. Contact
            </h2>
            <p className={PARAGRAPH}>
              If you have questions about these Terms of Use, or about the
              information held in your alumni record, please reach out to the
              College at{" "}
              <a
                href={`mailto:${SCHOOL_EMAIL}`}
                className="font-medium text-blue-600 underline underline-offset-2 transition hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200"
              >
                {SCHOOL_EMAIL}
              </a>
              .
            </p>
          </section>

          {/* Closing note */}
          <div className="mt-10 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 dark:border-white/[0.08] dark:bg-white/[0.03]">
            <p className="flex flex-wrap items-center gap-1.5 text-[13px] text-slate-600 dark:text-slate-300">
              <TbMail
                aria-hidden="true"
                className="h-4 w-4 flex-none text-slate-400 dark:text-slate-500"
              />
              Questions about these terms? Email us at{" "}
              <a
                href={`mailto:${SCHOOL_EMAIL}`}
                className="font-medium text-blue-600 transition hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200"
              >
                {SCHOOL_EMAIL}
              </a>
            </p>
          </div>
        </article>

        <div className="mx-auto mt-6 max-w-3xl text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-blue-600 transition hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200"
          >
            <TbArrowLeft aria-hidden="true" className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </main>
    </div>
  );
}
