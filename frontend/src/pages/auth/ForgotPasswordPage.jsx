import { useState } from "react";
import { Link } from "react-router-dom";
import authApi from "../../api/authApi";
import { HiOutlineEnvelope, HiOutlineCheckCircle } from "react-icons/hi2";
import {
  TbShieldLock,
  TbRefresh,
  TbShieldCheck,
  TbSend,
  TbArrowLeft,
  TbSchool,
  TbCertificate,
  TbMessageCircle,
  TbBriefcase,
  TbAddressBook,
  TbCalendarEvent,
} from "react-icons/tb";

const SERIF = { fontFamily: "'Playfair Display', Georgia, serif" };

// Left-panel value props — recovery-focused counterparts to the Login and
// Register panels' highlights, so the three auth surfaces read as one product.
const HIGHLIGHTS = [
  {
    icon: TbShieldLock,
    title: "Secure & Private",
    desc: "Your account security and privacy are our top priority.",
  },
  {
    icon: TbRefresh,
    title: "Quick Recovery",
    desc: "Reset your password and regain access to your account in just a few minutes.",
  },
  {
    icon: TbShieldCheck,
    title: "Always Protected",
    desc: "We use advanced security measures to keep your information safe.",
  },
];

/**
 * ── Vertical rhythm scale ──
 * The form itself is short (one field), so only the navy panel needs help
 * fitting a 768p laptop: brand block, heading, three highlights, illustration
 * and copyright together overflow at fixed Login-page spacing. Those
 * dimensions are custom properties — fixed below `lg`, and from `lg` up a
 * clamp() driven by `svh` so the panel compresses smoothly rather than in
 * breakpoint steps. Same mechanism as the Register page.
 */
const RHYTHM_CSS = `
  .fp-page {
    --fp-lp-pad: 40px;
    --fp-lp-brand-mt: 80px;
    --fp-lp-h1: 38px;
    --fp-lp-hl-gap: 28px;
    --fp-lp-hl-icon: 56px;
  }

  @media (min-width: 1024px) {
    .fp-page {
      --fp-lp-pad: clamp(18px, 3.5vh, 40px);
      --fp-lp-pad: clamp(18px, 3.5svh, 40px);
      --fp-lp-brand-mt: clamp(26px, 7vh, 80px);
      --fp-lp-brand-mt: clamp(26px, 7svh, 80px);
      --fp-lp-h1: clamp(28px, 4.6vh, 38px);
      --fp-lp-h1: clamp(28px, 4.6svh, 38px);
      --fp-lp-hl-gap: clamp(13px, 2.7vh, 28px);
      --fp-lp-hl-gap: clamp(13px, 2.7svh, 28px);
      --fp-lp-hl-icon: clamp(42px, 6vh, 56px);
      --fp-lp-hl-icon: clamp(42px, 6svh, 56px);
    }
  }

  /* Below ~760px of viewport height the lower decorative cluster stops
     sitting under the third highlight and starts colliding with it. */
  @media (min-width: 1024px) and (max-height: 760px) {
    .fp-lower-decor { display: none; }
  }

  @keyframes floatIcon {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-12px); }
  }
  @media (prefers-reduced-motion: reduce) {
    @keyframes floatIcon { 0%, 100% { transform: translateY(0); } }
  }
`;

/** Faint dot-matrix block used in two corners of the navy panel. */
function DotGrid({ className }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute [background-image:radial-gradient(rgba(147,197,253,0.28)_1.5px,transparent_1.5px)] [background-size:15px_15px] ${className}`}
    />
  );
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // Same field chrome as the Login and Register pages.
  const fieldClass =
    "w-full rounded-[10px] border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-[15px] text-slate-800 placeholder:text-slate-300 outline-none transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15";

  return (
    <div className="fp-page flex min-h-svh lg:h-svh lg:overflow-hidden">
      <style>{RHYTHM_CSS}</style>

      {/* ━━━━━━━━ LEFT — navy branding panel (lg+ only) ━━━━━━━━ */}
      <div className="relative hidden overflow-hidden bg-[var(--color-navy-950)] lg:flex lg:w-[50%] lg:flex-col">
        {/* Depth wash + decorative layers, all beneath the content column */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 [background:radial-gradient(75%_60%_at_35%_15%,rgba(37,99,235,0.16)_0%,transparent_60%)]"
        />
        <DotGrid className="right-8 top-10 h-24 w-28" />
        <DotGrid className="fp-lower-decor bottom-28 left-8 h-20 w-24" />

        {/* ── Floating accent icons ──
            Watermark-faint glyphs that drift behind the brand block and
            heading. Staggered durations/delays keep them out of lockstep so
            the motion reads as ambient rather than mechanical. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-6 right-6 top-6 z-0 h-[280px]"
        >
          <TbSchool
            className="absolute right-12 top-8 h-8 w-8 text-blue-400 opacity-[0.12] motion-reduce:animate-none"
            style={{ animation: "floatIcon 4s ease-in-out infinite" }}
          />
          <TbCertificate
            className="absolute right-32 top-24 h-8 w-8 text-blue-400 opacity-[0.12] motion-reduce:animate-none"
            style={{ animation: "floatIcon 5s ease-in-out infinite 0.5s" }}
          />
          <TbMessageCircle
            className="absolute left-[45%] top-16 h-8 w-8 text-blue-400 opacity-[0.12] motion-reduce:animate-none"
            style={{ animation: "floatIcon 4.5s ease-in-out infinite 1s" }}
          />
        </div>

        {/* ── Floating accent icons (lower cluster) ──
            Same floatIcon keyframes as above, timings offset so the two
            groups never fall into step. */}
        <div
          aria-hidden="true"
          className="fp-lower-decor pointer-events-none absolute bottom-20 left-6 right-6 z-0 h-[200px]"
        >
          <TbBriefcase
            className="absolute bottom-4 left-8 h-8 w-8 text-blue-400 opacity-[0.12] motion-reduce:animate-none"
            style={{ animation: "floatIcon 5.5s ease-in-out infinite 0.3s" }}
          />
          <TbAddressBook
            className="absolute bottom-20 left-24 h-8 w-8 text-blue-400 opacity-[0.12] motion-reduce:animate-none"
            style={{ animation: "floatIcon 4.2s ease-in-out infinite 0.8s" }}
          />
          <TbCalendarEvent
            className="absolute bottom-12 left-[42%] h-8 w-8 text-blue-400 opacity-[0.12] motion-reduce:animate-none"
            style={{ animation: "floatIcon 4.8s ease-in-out infinite 1.5s" }}
          />
        </div>

        {/* ── Password-recovery illustration ──
            Absolutely mounted on the panel so it never participates in the
            flex layout — it sits full-bleed at the bottom without ever
            pushing the copy off a short viewport. Same sizing and positioning
            as the Login and Register illustrations. The source PNG carries an
            opaque near-white interior that would read as bright grey blobs on
            navy, so it is dropped back to a low opacity that lets the panel
            read through it. */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 flex justify-end"
          aria-hidden="true"
        >
          <img
            src="/illustrations/Forgot%20password-rafiki.png"
            alt=""
            className="mr-[-20px] w-full max-w-[520px] select-none object-contain opacity-[0.40]"
          />
        </div>

        <div className="relative z-10 flex min-h-0 flex-1 flex-col px-12 xl:px-14 [padding-block:var(--fp-lp-pad)]">
          {/* ── Brand ── */}
          <div className="flex items-center gap-4">
            <img
              src="/pac-logo.jpg"
              alt="Philippine Advent College Seal"
              className="h-[72px] w-[72px] flex-none rounded-full border-2 border-[var(--color-gold-500)] bg-[var(--color-navy-900)] object-cover"
            />
            <div className="min-w-0">
              <p
                className="text-[26px] font-bold leading-tight text-white"
                style={SERIF}
              >
                Philippine Advent College
              </p>
              <p className="mt-1 text-[12px] font-medium uppercase tracking-[0.1em] text-slate-300">
                Alumni Tracking System
              </p>
            </div>
          </div>

          {/* ── Recovery welcome ── */}
          <h1
            className="font-extrabold leading-[1.15] text-white [font-size:var(--fp-lp-h1)] [margin-top:var(--fp-lp-brand-mt)]"
            style={SERIF}
          >
            <span className="text-white">Secure </span>
            <span className="text-blue-400">Your Account</span>
          </h1>
          <p className="mt-4 max-w-[430px] text-[15.5px] leading-[1.6] text-slate-300">
            Enter your registered email address and we&apos;ll send you a secure
            link to reset your password and get back to your account.
          </p>

          {/* ── Feature highlights ── */}
          <ul className="mt-8 flex flex-col [gap:var(--fp-lp-hl-gap)]">
            {HIGHLIGHTS.map(({ icon: Icon, title, desc }) => (
              <li key={title} className="flex items-start gap-4">
                <span className="flex flex-none items-center justify-center rounded-2xl bg-blue-600/25 text-white [height:var(--fp-lp-hl-icon)] [width:var(--fp-lp-hl-icon)]">
                  <Icon aria-hidden="true" className="h-6 w-6" />
                </span>
                <span className="block max-w-[300px] pt-0.5">
                  <span className="block text-[15px] font-semibold text-white">
                    {title}
                  </span>
                  <span className="mt-1 block text-[13px] leading-[1.5] text-slate-400">
                    {desc}
                  </span>
                </span>
              </li>
            ))}
          </ul>

          {/* ── Copyright ── */}
          <p className="relative z-10 mt-auto pt-6 text-[13px] text-slate-400">
            © {new Date().getFullYear()} Philippine Advent College. All rights
            reserved.
          </p>
        </div>
      </div>

      {/* ━━━━━━━━ RIGHT — form panel ━━━━━━━━ */}
      <div className="flex w-full flex-col items-center bg-white px-6 py-10 sm:px-10 lg:w-[50%] lg:justify-center lg:px-14 xl:px-20">
        <div className="w-full max-w-[490px]">
          {sent ? (
            /* ━━━━ Success State ━━━━ */
            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                <HiOutlineCheckCircle
                  aria-hidden="true"
                  className="h-8 w-8 text-emerald-600"
                />
              </div>
              <h1
                style={SERIF}
                className="mt-6 text-[32px] font-bold leading-[1.15] text-[var(--color-navy-900)]"
              >
                Check your email
              </h1>
              <p className="mt-3 text-[14.5px] leading-[1.6] text-slate-400">
                If an account exists with that email, we sent a password reset
                link.
              </p>
              <Link
                to="/login"
                className="mt-8 flex w-full items-center justify-center gap-2.5 rounded-[10px] bg-blue-600 py-4 text-[15px] font-bold text-white shadow-[0_4px_16px_rgba(37,99,235,0.28)] transition-all duration-200 hover:bg-blue-500 hover:shadow-[0_6px_20px_rgba(37,99,235,0.38)]"
              >
                <TbArrowLeft aria-hidden="true" className="h-5 w-5" />
                Back to Sign In
              </Link>
            </div>
          ) : (
            /* ━━━━ Form State ━━━━ */
            <>
              {/* ── Header ── */}
              <h1
                style={SERIF}
                className="text-[32px] font-bold leading-[1.15] text-[var(--color-navy-900)]"
              >
                Forgot your password?
              </h1>
              <p className="mt-3 max-w-[430px] text-[14.5px] leading-[1.6] text-slate-400">
                No worries! Enter your registered email address and we&apos;ll
                send you a secure link to reset your password.
              </p>

              {/* Error */}
              {error && (
                <div
                  role="alert"
                  className="mt-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3"
                >
                  <svg
                    className="mt-0.5 h-4 w-4 shrink-0 text-red-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-[13px] leading-[1.5] text-red-600">
                    {error}
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-8">
                {/* Email */}
                <div>
                  <label
                    htmlFor="forgot-email"
                    className="mb-2 block text-[14px] font-bold text-slate-800"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <HiOutlineEnvelope
                      aria-hidden="true"
                      className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      id="forgot-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      placeholder="Enter your email address"
                      className={fieldClass}
                    />
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-[10px] bg-blue-600 py-4 text-[15px] font-bold text-white shadow-[0_4px_16px_rgba(37,99,235,0.28)] transition-all duration-200 hover:bg-blue-500 hover:shadow-[0_6px_20px_rgba(37,99,235,0.38)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="3"
                          fill="none"
                          opacity="0.25"
                        />
                        <path
                          fill="currentColor"
                          opacity="0.85"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Sending…
                    </>
                  ) : (
                    <>
                      <TbSend aria-hidden="true" className="h-5 w-5" />
                      Send Reset Link
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-[13px] text-slate-400">or</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              {/* Secondary back action */}
              <Link
                to="/login"
                className="flex w-full items-center justify-center gap-2.5 rounded-[10px] border border-slate-200 bg-white py-4 text-[15px] font-bold text-blue-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-blue-700"
              >
                <TbArrowLeft aria-hidden="true" className="h-5 w-5" />
                Back to Sign In
              </Link>
            </>
          )}

          {/* Trust line */}
          <p className="mt-10 flex items-start justify-center gap-2 text-center">
            <TbShieldCheck
              aria-hidden="true"
              className="mt-0.5 h-[18px] w-[18px] flex-none text-emerald-500"
            />
            <span className="text-[13px] leading-[1.5] text-slate-500">
              We&apos;ll never share your email with anyone.
              <br />
              Your security is always our priority.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
