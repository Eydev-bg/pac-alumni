import { useState } from "react";
import {
  Link,
  useParams,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import authApi from "../../api/authApi";
import {
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineCheckCircle,
} from "react-icons/hi2";
import {
  TbLock,
  TbShieldCheck,
  TbClock,
  TbArrowLeft,
  TbSchool,
  TbCertificate,
  TbMessageCircle,
  TbBriefcase,
  TbAddressBook,
  TbCalendarEvent,
} from "react-icons/tb";

const SERIF = { fontFamily: "'Playfair Display', Georgia, serif" };

// Left-panel value props — password-strength counterparts to the Login,
// Register and Forgot Password panels, so the auth surfaces read as one product.
const HIGHLIGHTS = [
  {
    icon: TbLock,
    title: "Stronger Security",
    desc: "Use a strong password to keep your account safe.",
  },
  {
    icon: TbShieldCheck,
    title: "Protect Your Data",
    desc: "We use advanced security measures to protect your information.",
  },
  {
    icon: TbClock,
    title: "Quick & Easy",
    desc: "Reset your password in just a few simple steps.",
  },
];

/**
 * ── Vertical rhythm scale ──
 * The form is short, so only the navy panel needs help fitting a 768p laptop:
 * brand block, heading, three highlights, illustration and copyright together
 * overflow at fixed Login-page spacing. Those dimensions are custom
 * properties — fixed below `lg`, and from `lg` up a clamp() driven by `svh` so
 * the panel compresses smoothly rather than in breakpoint steps. Same
 * mechanism as the Register and Forgot Password pages.
 */
const RHYTHM_CSS = `
  .rp-page {
    --rp-lp-pad: 40px;
    --rp-lp-brand-mt: 80px;
    --rp-lp-h1: 38px;
    --rp-lp-hl-gap: 28px;
    --rp-lp-hl-icon: 56px;
  }

  @media (min-width: 1024px) {
    .rp-page {
      --rp-lp-pad: clamp(18px, 3.5vh, 40px);
      --rp-lp-pad: clamp(18px, 3.5svh, 40px);
      --rp-lp-brand-mt: clamp(26px, 7vh, 80px);
      --rp-lp-brand-mt: clamp(26px, 7svh, 80px);
      --rp-lp-h1: clamp(28px, 4.6vh, 38px);
      --rp-lp-h1: clamp(28px, 4.6svh, 38px);
      --rp-lp-hl-gap: clamp(13px, 2.7vh, 28px);
      --rp-lp-hl-gap: clamp(13px, 2.7svh, 28px);
      --rp-lp-hl-icon: clamp(42px, 6vh, 56px);
      --rp-lp-hl-icon: clamp(42px, 6svh, 56px);
    }
  }

  /* Below ~760px of viewport height the lower decorative cluster stops
     sitting under the third highlight and starts colliding with it. */
  @media (min-width: 1024px) and (max-height: 760px) {
    .rp-lower-decor { display: none; }
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

export default function ResetPasswordPage() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: searchParams.get("email") || "",
    token: token || "",
    password: "",
    password_confirmation: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await authApi.resetPassword(form);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  // The reset link always carries ?email= (see backend ResetPasswordMail), so
  // the address is normally known and the design shows no email field. Should
  // it ever be missing — a hand-edited or truncated URL — the input is shown
  // instead of dead-ending the submit, since the API requires it.
  const emailFromLink = Boolean(searchParams.get("email"));

  // Same field chrome as the Login, Register and Forgot Password pages.
  const fieldClass =
    "w-full rounded-[10px] border border-slate-200 bg-white py-3.5 pl-12 pr-12 text-[15px] text-slate-800 placeholder:text-slate-300 outline-none transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15";

  return (
    <div className="rp-page flex min-h-svh lg:h-svh lg:overflow-hidden">
      <style>{RHYTHM_CSS}</style>

      {/* ━━━━━━━━ LEFT — navy branding panel (lg+ only) ━━━━━━━━ */}
      <div className="relative hidden overflow-hidden bg-[var(--color-navy-950)] lg:flex lg:w-[50%] lg:flex-col">
        {/* Depth wash + decorative layers, all beneath the content column */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 [background:radial-gradient(75%_60%_at_35%_15%,rgba(37,99,235,0.16)_0%,transparent_60%)]"
        />
        <DotGrid className="right-8 top-10 h-24 w-28" />
        <DotGrid className="rp-lower-decor bottom-28 left-8 h-20 w-24" />

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
          className="rp-lower-decor pointer-events-none absolute bottom-20 left-6 right-6 z-0 h-[200px]"
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
            as the Login, Register and Forgot Password illustrations. The
            source PNG carries an opaque near-white interior that would read as
            bright grey blobs on navy, so it is dropped back to a low opacity
            that lets the panel read through it. */}
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

        <div className="relative z-10 flex min-h-0 flex-1 flex-col px-12 xl:px-14 [padding-block:var(--rp-lp-pad)]">
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

          {/* ── Reset welcome ── */}
          <h1
            className="font-extrabold leading-[1.15] text-white [font-size:var(--rp-lp-h1)] [margin-top:var(--rp-lp-brand-mt)]"
            style={SERIF}
          >
            <span className="text-white">Secure </span>
            <span className="text-blue-400">Your Account</span>
          </h1>
          <p className="mt-4 max-w-[430px] text-[15.5px] leading-[1.6] text-slate-300">
            Create a new password for your account to continue accessing your
            alumni portal securely.
          </p>

          {/* ── Feature highlights ── */}
          <ul className="mt-8 flex flex-col [gap:var(--rp-lp-hl-gap)]">
            {HIGHLIGHTS.map(({ icon: Icon, title, desc }) => (
              <li key={title} className="flex items-start gap-4">
                <span className="flex flex-none items-center justify-center rounded-2xl bg-blue-600/25 text-white [height:var(--rp-lp-hl-icon)] [width:var(--rp-lp-hl-icon)]">
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
      {/* `my-auto` centering rather than `justify-center`, paired with
          `overflow-y-auto`: with the email fallback shown the stack can exceed
          a short viewport, and a centered flex item would be clipped at both
          ends with no way to reach the submit button. */}
      <div className="flex w-full flex-col items-center bg-white px-6 py-10 sm:px-10 lg:w-[50%] lg:overflow-y-auto lg:px-14 xl:px-20">
        <div className="w-full max-w-[490px] lg:my-auto">
          {success ? (
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
                Password reset!
              </h1>
              <p className="mt-3 text-[14.5px] leading-[1.6] text-slate-400">
                Redirecting you to sign in…
              </p>
            </div>
          ) : (
            /* ━━━━ Form State ━━━━ */
            <>
              {/* ── Back to Sign In ── */}
              <div className="flex justify-start">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-[10px] border border-slate-200 px-4 py-2.5 text-[14px] font-semibold text-blue-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-blue-700"
                >
                  <TbArrowLeft aria-hidden="true" className="h-4 w-4" />
                  Back to Sign In
                </Link>
              </div>

              {/* ── Header ── */}
              <h1
                style={SERIF}
                className="mt-8 text-[32px] font-bold leading-[1.15] text-[var(--color-navy-900)]"
              >
                Reset your password
              </h1>
              <p className="mt-3 max-w-[430px] text-[14.5px] leading-[1.6] text-slate-400">
                Enter and confirm your new password below to reset your
                password.
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

              <form onSubmit={handleSubmit} className="mt-7">
                {/* Email — only when the reset link did not supply it. The API
                    requires an address, so this keeps an otherwise unusable
                    link recoverable. */}
                {!emailFromLink && (
                  <div className="mb-5">
                    <label
                      htmlFor="reset-email"
                      className="mb-2 block text-[14px] font-bold text-slate-800"
                    >
                      Email Address
                    </label>
                    <input
                      id="reset-email"
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      required
                      autoComplete="email"
                      placeholder="Enter your email address"
                      className={`${fieldClass} pl-4 pr-4`}
                    />
                  </div>
                )}

                {/* New Password */}
                <div>
                  <label
                    htmlFor="reset-password"
                    className="mb-2 block text-[14px] font-bold text-slate-800"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <HiOutlineLockClosed
                      aria-hidden="true"
                      className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      id="reset-password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) =>
                        setForm({ ...form, password: e.target.value })
                      }
                      required
                      minLength={8}
                      autoComplete="new-password"
                      placeholder="Enter your new password"
                      aria-describedby="reset-password-hint"
                      className={fieldClass}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <HiOutlineEyeSlash className="h-5 w-5" />
                      ) : (
                        <HiOutlineEye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  <p
                    id="reset-password-hint"
                    className="mt-2 text-[12.5px] text-blue-600"
                  >
                    Min 8 chars, 1 uppercase, 1 number, 1 special character
                  </p>
                </div>

                {/* Confirm New Password */}
                <div className="mt-5">
                  <label
                    htmlFor="reset-password-confirm"
                    className="mb-2 block text-[14px] font-bold text-slate-800"
                  >
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <HiOutlineLockClosed
                      aria-hidden="true"
                      className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      id="reset-password-confirm"
                      type={showConfirm ? "text" : "password"}
                      value={form.password_confirmation}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          password_confirmation: e.target.value,
                        })
                      }
                      required
                      autoComplete="new-password"
                      placeholder="Confirm your new password"
                      className={fieldClass}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                      aria-label={
                        showConfirm ? "Hide password" : "Show password"
                      }
                    >
                      {showConfirm ? (
                        <HiOutlineEyeSlash className="h-5 w-5" />
                      ) : (
                        <HiOutlineEye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Security tip */}
                <div className="mt-6 flex items-start gap-3 rounded-[10px] bg-blue-50/70 px-4 py-3.5">
                  <TbShieldCheck
                    aria-hidden="true"
                    className="mt-0.5 h-[18px] w-[18px] flex-none text-emerald-500"
                  />
                  <p className="text-[13.5px] leading-[1.55] text-slate-600">
                    For your security, make sure your new password is different
                    from your previous password.
                  </p>
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
                      Resetting…
                    </>
                  ) : (
                    <>
                      <TbLock aria-hidden="true" className="h-5 w-5" />
                      Reset Password
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
