import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import alumniApi from "../../api/alumniApi";
import {
  HiOutlineIdentification,
  HiOutlineUser,
  HiOutlineEnvelope,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
} from "react-icons/hi2";
import {
  TbUsersGroup,
  TbBriefcase,
  TbCalendarEvent,
  TbUserPlus,
  TbShieldCheck,
  TbSchool,
  TbCertificate,
  TbMessageCircle,
  TbAddressBook,
  TbArrowLeft,
} from "react-icons/tb";

const SERIF = { fontFamily: "'Playfair Display', Georgia, serif" };

// Left-panel value props — identical copy to the Login page so the two auth
// surfaces read as one product. Marketing only, no links.
const HIGHLIGHTS = [
  {
    icon: TbUsersGroup,
    title: "Alumni Network",
    desc: "Reconnect with classmates and build meaningful professional relationships.",
  },
  {
    icon: TbBriefcase,
    title: "Career Opportunities",
    desc: "Discover job openings and advance your professional journey.",
  },
  {
    icon: TbCalendarEvent,
    title: "Events & Updates",
    desc: "Stay informed about alumni events, announcements, and college news.",
  },
];

/**
 * ── Vertical rhythm scale ──
 * Six fields plus a submit button do not fit a 768px-tall desktop viewport at
 * the Login page's fixed spacing, and this page must not scroll on desktop.
 * So every vertical dimension that contributes to the stack is a custom
 * property: fixed and comfortable below `lg` (mobile scrolls, as expected),
 * and from `lg` up a clamp() driven by `svh` so the form breathes at 1080p
 * and compresses smoothly — never abruptly — down to a 768p laptop.
 *
 * The clamp minimums are chosen so the whole stack lands near 590px at a
 * ~640px usable viewport (1366×768 with browser chrome), leaving real margin
 * rather than just barely fitting. `vh` fallbacks precede each `svh` value for
 * browsers without small-viewport units.
 */
const RHYTHM_CSS = `
  .reg-page {
    --reg-lp-pad: 40px;
    --reg-lp-brand-mt: 80px;
    --reg-lp-h1: 38px;
    --reg-lp-hl-gap: 28px;
    --reg-lp-hl-icon: 56px;

    --reg-pad-y: 40px;
    --reg-back-py: 10px;
    --reg-head-mt: 24px;
    --reg-h2: 32px;
    --reg-sub: 14.5px;
    --reg-form-mt: 28px;
    --reg-gap: 20px;
    --reg-label: 14px;
    --reg-label-mb: 8px;
    --reg-input-py: 14px;
    --reg-btn-py: 16px;
    --reg-trust-mt: 32px;
  }

  @media (min-width: 1024px) {
    .reg-page {
      --reg-lp-pad: clamp(18px, 3.5vh, 40px);
      --reg-lp-pad: clamp(18px, 3.5svh, 40px);
      --reg-lp-brand-mt: clamp(26px, 7vh, 80px);
      --reg-lp-brand-mt: clamp(26px, 7svh, 80px);
      --reg-lp-h1: clamp(28px, 4.6vh, 38px);
      --reg-lp-h1: clamp(28px, 4.6svh, 38px);
      --reg-lp-hl-gap: clamp(13px, 2.7vh, 28px);
      --reg-lp-hl-gap: clamp(13px, 2.7svh, 28px);
      --reg-lp-hl-icon: clamp(42px, 6vh, 56px);
      --reg-lp-hl-icon: clamp(42px, 6svh, 56px);

      --reg-pad-y: clamp(14px, 3.2vh, 40px);
      --reg-pad-y: clamp(14px, 3.2svh, 40px);
      --reg-back-py: clamp(6px, 1vh, 10px);
      --reg-back-py: clamp(6px, 1svh, 10px);
      --reg-head-mt: clamp(12px, 2.6vh, 30px);
      --reg-head-mt: clamp(12px, 2.6svh, 30px);
      --reg-h2: clamp(23px, 3.4vh, 32px);
      --reg-h2: clamp(23px, 3.4svh, 32px);
      --reg-sub: clamp(12.5px, 1.6vh, 14.5px);
      --reg-sub: clamp(12.5px, 1.6svh, 14.5px);
      --reg-form-mt: clamp(12px, 2.7vh, 28px);
      --reg-form-mt: clamp(12px, 2.7svh, 28px);
      --reg-gap: clamp(9px, 1.55vh, 20px);
      --reg-gap: clamp(9px, 1.55svh, 20px);
      --reg-label: clamp(12px, 1.55vh, 14px);
      --reg-label: clamp(12px, 1.55svh, 14px);
      --reg-label-mb: clamp(4px, 0.62vh, 8px);
      --reg-label-mb: clamp(4px, 0.62svh, 8px);
      --reg-input-py: clamp(8px, 1.3vh, 14px);
      --reg-input-py: clamp(8px, 1.3svh, 14px);
      --reg-btn-py: clamp(11px, 1.65vh, 16px);
      --reg-btn-py: clamp(11px, 1.65svh, 16px);
      --reg-trust-mt: clamp(10px, 2.6vh, 32px);
      --reg-trust-mt: clamp(10px, 2.6svh, 32px);
    }
  }

  /* Below ~760px of viewport height the lower decorative cluster stops
     sitting under the third highlight and starts colliding with it. */
  @media (min-width: 1024px) and (max-height: 760px) {
    .reg-lower-decor { display: none; }
  }

  /* Safety net well below the supported desktop range (a heavily shrunk
     window, not a real display). Lets the form panel scroll instead of
     clipping the submit button. */
  @media (min-width: 1024px) and (max-height: 600px) {
    .reg-form-panel { overflow-y: auto; }
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

// Shared input chrome — mirrors the Login page field, with vertical padding on
// the rhythm scale so six fields can share one viewport. Error state swaps the
// border/ring to red without changing the field's height.
const FIELD_BASE =
  "w-full rounded-[10px] border bg-white pl-12 text-[15px] leading-[1.35] text-slate-800 placeholder:text-slate-300 outline-none transition-all duration-200 focus:ring-2 [padding-block:var(--reg-input-py)]";
const FIELD_OK =
  "border-slate-200 focus:border-blue-500 focus:ring-blue-500/15";
const FIELD_ERR = "border-red-300 focus:border-red-500 focus:ring-red-500/15";

function InputField({
  icon: Icon,
  label,
  field,
  type = "text",
  placeholder,
  autoComplete,
  isPassword,
  showToggle,
  onToggle,
  maxLength,
  value,
  onChange,
  error,
}) {
  const inputId = `register-${field}`;
  const errorId = `${inputId}-error`;

  return (
    <div>
      <label
        htmlFor={inputId}
        className="block font-bold text-slate-800 [font-size:var(--reg-label)] [margin-bottom:var(--reg-label-mb)]"
      >
        {label}
      </label>
      <div className="relative">
        <Icon
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
        />
        <input
          id={inputId}
          type={isPassword ? (showToggle ? "text" : "password") : type}
          value={value}
          onChange={(e) => onChange(field, e.target.value)}
          required
          autoComplete={autoComplete}
          placeholder={placeholder}
          maxLength={maxLength}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`${FIELD_BASE} ${error ? FIELD_ERR : FIELD_OK} ${
            isPassword ? "pr-12" : "pr-4"
          }`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={onToggle}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
            aria-label={showToggle ? "Hide password" : "Show password"}
          >
            {showToggle ? (
              <HiOutlineEyeSlash className="h-5 w-5" />
            ) : (
              <HiOutlineEye className="h-5 w-5" />
            )}
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} className="mt-1 text-[12.5px] leading-tight text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Centered navy card used by the two terminal states (registration closed /
 * registration successful). Keeps those screens on the same brand palette as
 * the main split layout.
 */
function StatusScreen({ children }) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-[var(--color-navy-950)] px-6 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 [background:radial-gradient(75%_60%_at_50%_10%,rgba(37,99,235,0.18)_0%,transparent_60%)]"
      />
      <div className="relative z-10 w-full max-w-[440px] rounded-2xl bg-white px-8 py-9 text-center shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
        <img
          src="/pac-logo.jpg"
          alt="Philippine Advent College Seal"
          className="mx-auto mb-5 h-[68px] w-[68px] rounded-full border-2 border-[var(--color-gold-500)] bg-[var(--color-navy-900)] object-cover"
        />
        {children}
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Main Component
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function AlumniRegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    alumni_id: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [registrationClosed, setRegistrationClosed] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    alumniApi
      .checkRegistrationStatus()
      .then((res) => {
        if (!res.data.data.is_open) setRegistrationClosed(true);
      })
      .catch((err) => {
        if (import.meta.env.DEV)
          console.error("Registration status check failed:", err);
      })
      .finally(() => setCheckingStatus(false));
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const passwordChecks = {
    length: form.password.length >= 8,
    uppercase: /[A-Z]/.test(form.password),
    lowercase: /[a-z]/.test(form.password),
    number: /[0-9]/.test(form.password),
    special: /[^A-Za-z0-9]/.test(form.password),
    match:
      form.password.length > 0 &&
      form.password_confirmation.length > 0 &&
      form.password === form.password_confirmation,
  };

  const allPasswordChecksPass = Object.values(passwordChecks).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setLoading(true);
    try {
      await alumniApi.register(form);
      setSuccess(true);
    } catch (err) {
      const resp = err.response;
      if (resp?.status === 422 && resp?.data?.errors)
        setFieldErrors(resp.data.errors);
      setError(
        resp?.data?.message ||
          "Registration failed. Please check your details and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const getFieldError = (field) => {
    if (!fieldErrors[field]) return null;
    return Array.isArray(fieldErrors[field])
      ? fieldErrors[field][0]
      : fieldErrors[field];
  };

  // ── Loading ──
  if (checkingStatus) {
    return (
      <div className="flex h-svh w-full items-center justify-center bg-[var(--color-navy-950)]">
        <div
          role="status"
          aria-label="Checking registration availability"
          className="h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-blue-500"
        />
      </div>
    );
  }

  // ── Registration Closed ──
  if (registrationClosed) {
    return (
      <StatusScreen>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
          <HiOutlineExclamationTriangle
            aria-hidden="true"
            className="h-8 w-8 text-amber-600"
          />
        </div>
        <h2
          style={SERIF}
          className="text-[24px] font-bold text-[var(--color-navy-900)]"
        >
          Registration Closed
        </h2>
        <p className="mx-auto mt-3 max-w-[340px] text-[14px] leading-[1.6] text-slate-500">
          Alumni registration is currently closed. Please contact the
          administrator for assistance or check back later.
        </p>
        <button
          onClick={() => navigate("/login")}
          className="mt-7 w-full rounded-[10px] bg-blue-600 py-3.5 text-[15px] font-bold text-white shadow-[0_4px_16px_rgba(37,99,235,0.28)] transition-all duration-200 hover:bg-blue-500 hover:shadow-[0_6px_20px_rgba(37,99,235,0.38)]"
        >
          Back to Sign In
        </button>
      </StatusScreen>
    );
  }

  // ── Success ──
  if (success) {
    return (
      <StatusScreen>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <HiOutlineCheckCircle
            aria-hidden="true"
            className="h-8 w-8 text-emerald-600"
          />
        </div>
        <h2
          style={SERIF}
          className="text-[24px] font-bold text-[var(--color-navy-900)]"
        >
          Registration Successful!
        </h2>
        <p className="mx-auto mt-3 max-w-[360px] text-[14px] leading-[1.6] text-slate-500">
          Your alumni account has been created. We&apos;ve sent a verification
          link to your email — please check your inbox (and spam folder) and
          click the link before logging in. The link expires in 24 hours.
        </p>
        <button
          onClick={() => navigate("/login")}
          className="mt-7 w-full rounded-[10px] bg-blue-600 py-3.5 text-[15px] font-bold text-white shadow-[0_4px_16px_rgba(37,99,235,0.28)] transition-all duration-200 hover:bg-blue-500 hover:shadow-[0_6px_20px_rgba(37,99,235,0.38)]"
        >
          Go to Sign In
        </button>
      </StatusScreen>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  MAIN — navy branding panel (lg+) + form panel
  //  Below lg the page scrolls normally; from lg up it is pinned to the
  //  viewport and the rhythm scale keeps the form inside it.
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  return (
    <div className="reg-page flex min-h-svh lg:h-svh lg:overflow-hidden">
      <style>{RHYTHM_CSS}</style>

      {/* ━━━━━━━━ LEFT — navy branding panel (lg+ only) ━━━━━━━━ */}
      <div className="relative hidden overflow-hidden bg-[var(--color-navy-950)] lg:flex lg:w-[58%] lg:flex-col">
        {/* Depth wash + decorative layers, all beneath the content column */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 [background:radial-gradient(75%_60%_at_35%_15%,rgba(37,99,235,0.16)_0%,transparent_60%)]"
        />
        <DotGrid className="right-8 top-10 h-24 w-28" />
        <DotGrid className="reg-lower-decor bottom-28 left-8 h-20 w-24" />

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
          className="reg-lower-decor pointer-events-none absolute bottom-20 left-6 right-6 z-0 h-[200px]"
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

        {/* ── Registration illustration ──
            Absolutely mounted on the panel so it never participates in the
            flex layout — it sits full-bleed at the bottom without ever
            pushing the copy off a short viewport. Sizing and positioning are
            identical to the Login page's illustration so the two auth panels
            match. The source PNG carries an opaque near-white interior that
            would read as bright grey blobs on navy, so it is dropped back to
            a low opacity that lets the panel read through it. */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 flex justify-end"
          aria-hidden="true"
        >
          <img
            src="/Sign_up-rafiki.png"
            alt=""
            className="mr-[-20px] w-full max-w-[520px] select-none object-contain opacity-[0.40]"
          />
        </div>

        <div className="relative z-10 flex min-h-0 flex-1 flex-col px-12 xl:px-14 [padding-block:var(--reg-lp-pad)]">
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

          {/* ── Registration welcome ── */}
          <h1
            className="font-extrabold leading-[1.15] text-white [font-size:var(--reg-lp-h1)] [margin-top:var(--reg-lp-brand-mt)]"
            style={SERIF}
          >
            Join the <span className="text-blue-400">Alumni Network</span>
          </h1>
          <p className="mt-4 max-w-[430px] text-[15.5px] leading-[1.6] text-slate-300">
            Create your account to reconnect with fellow alumni, explore
            opportunities, and be part of the PAC legacy.
          </p>

          {/* ── Feature highlights ── */}
          <ul className="mt-8 flex flex-col [gap:var(--reg-lp-hl-gap)]">
            {HIGHLIGHTS.map(({ icon: Icon, title, desc }) => (
              <li key={title} className="flex items-start gap-4">
                <span className="flex flex-none items-center justify-center rounded-2xl bg-blue-600/25 text-white [height:var(--reg-lp-hl-icon)] [width:var(--reg-lp-hl-icon)]">
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
      <div className="reg-form-panel flex w-full flex-col items-center bg-white px-6 sm:px-10 lg:w-[42%] lg:justify-center lg:px-10 xl:px-12 [padding-block:var(--reg-pad-y)]">
        <div className="w-full max-w-[540px] lg:max-w-[490px]">
          {/* ── Back to Sign In ── */}
          <div className="flex justify-end">
            <a
              href="/login"
              className="inline-flex items-center gap-2 rounded-[10px] border border-slate-200 px-4 text-[14px] font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-[var(--color-navy-900)] [padding-block:var(--reg-back-py)]"
            >
              <TbArrowLeft aria-hidden="true" className="h-4 w-4" />
              Back to Sign In
            </a>
          </div>

          {/* ── Header ── */}
          <h2
            style={SERIF}
            className="font-bold leading-[1.15] text-[var(--color-navy-900)] [font-size:var(--reg-h2)] [margin-top:var(--reg-head-mt)]"
          >
            Create Your Account
          </h2>
          <p className="mt-1.5 leading-[1.4] text-slate-400 [font-size:var(--reg-sub)]">
            Join the PAC Alumni network by creating your account
          </p>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3"
            >
              <HiOutlineExclamationTriangle
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 shrink-0 text-red-500"
              />
              <p className="text-[13px] leading-[1.5] text-red-600">{error}</p>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="flex flex-col [gap:var(--reg-gap)] [margin-top:var(--reg-form-mt)]"
          >
            <InputField
              icon={HiOutlineIdentification}
              label="Alumni ID"
              field="alumni_id"
              placeholder="e.g. PAC-2023-0001"
              autoComplete="off"
              maxLength={50}
              value={form.alumni_id}
              onChange={handleChange}
              error={getFieldError("alumni_id")}
            />

            {/* Name pair — stacked on mobile, side by side from lg so the
                six-field stack clears a 768p viewport without tightening
                the remaining fields past comfort. */}
            <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-x-4 [row-gap:var(--reg-gap)]">
              <InputField
                icon={HiOutlineUser}
                label="First Name"
                field="first_name"
                placeholder="Enter your first name"
                autoComplete="given-name"
                maxLength={100}
                value={form.first_name}
                onChange={handleChange}
                error={getFieldError("first_name")}
              />
              <InputField
                icon={HiOutlineUser}
                label="Last Name"
                field="last_name"
                placeholder="Enter your last name"
                autoComplete="family-name"
                maxLength={100}
                value={form.last_name}
                onChange={handleChange}
                error={getFieldError("last_name")}
              />
            </div>

            <InputField
              icon={HiOutlineEnvelope}
              label="Email Address"
              field="email"
              type="email"
              placeholder="Enter your email address"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              error={getFieldError("email")}
            />
            <InputField
              icon={HiOutlineLockClosed}
              label="Password"
              field="password"
              isPassword
              showToggle={showPassword}
              onToggle={() => setShowPassword(!showPassword)}
              placeholder="Create a strong password"
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              error={getFieldError("password")}
            />
            <InputField
              icon={HiOutlineLockClosed}
              label="Confirm Password"
              field="password_confirmation"
              isPassword
              showToggle={showConfirm}
              onToggle={() => setShowConfirm(!showConfirm)}
              placeholder="Confirm your password"
              autoComplete="new-password"
              value={form.password_confirmation}
              onChange={handleChange}
              error={getFieldError("password_confirmation")}
            />

            {/* ── Password requirements ──
                Gates the submit button (allPasswordChecksPass), so it has to
                be visible — but only once the user starts typing. Laid out as
                a wrapping two-line chip row rather than a padded card so it
                costs ~40px of the viewport budget instead of ~90px. */}
            {form.password.length > 0 && (
              <ul className="flex flex-wrap gap-x-4 gap-y-0.5 rounded-[10px] bg-slate-50 px-3 py-2">
                {[
                  { key: "length", text: "8+ characters" },
                  { key: "uppercase", text: "Uppercase" },
                  { key: "lowercase", text: "Lowercase" },
                  { key: "number", text: "Number" },
                  { key: "special", text: "Special character" },
                  { key: "match", text: "Passwords match" },
                ].map(({ key, text }) => (
                  <li
                    key={key}
                    className={`flex items-center gap-1 text-[11.5px] leading-[1.5] transition-colors ${
                      passwordChecks[key] ? "text-emerald-600" : "text-slate-400"
                    }`}
                  >
                    <span aria-hidden="true">
                      {passwordChecks[key] ? "✓" : "○"}
                    </span>
                    {text}
                    <span className="sr-only">
                      {passwordChecks[key] ? " — met" : " — not yet met"}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !allPasswordChecksPass}
              className="flex w-full items-center justify-center gap-2.5 rounded-[10px] bg-blue-600 text-[15px] font-bold leading-[1.35] text-white shadow-[0_4px_16px_rgba(37,99,235,0.28)] transition-all duration-200 hover:bg-blue-500 hover:shadow-[0_6px_20px_rgba(37,99,235,0.38)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-blue-600 disabled:hover:shadow-[0_4px_16px_rgba(37,99,235,0.28)] [padding-block:var(--reg-btn-py)]"
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
                  Verifying &amp; Creating Account…
                </>
              ) : (
                <>
                  <TbUserPlus aria-hidden="true" className="h-5 w-5" />
                  Create Account
                </>
              )}
            </button>
          </form>

          {/* Mobile-only sign-in link — the navy panel is hidden below lg, so
              this keeps a route back to Login within thumb reach. */}
          <p className="mt-6 text-center text-[14px] text-slate-600 lg:hidden">
            Already have an account?{" "}
            <a
              href="/login"
              className="font-bold text-blue-600 transition hover:text-blue-700 hover:underline"
            >
              Sign In
            </a>
          </p>

          {/* Trust line */}
          <p className="flex items-center justify-center gap-2 [margin-top:var(--reg-trust-mt)]">
            <TbShieldCheck
              aria-hidden="true"
              className="h-[18px] w-[18px] flex-none text-emerald-500"
            />
            <span className="text-[13px] text-slate-500">
              Secure access to your PAC Alumni account
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
