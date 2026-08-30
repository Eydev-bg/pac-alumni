import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import authApi from "../../api/authApi";
import {
  HiOutlineEnvelope,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeSlash,
} from "react-icons/hi2";
import {
  TbUsersGroup,
  TbBriefcase,
  TbCalendarEvent,
  TbLock,
  TbUserPlus,
  TbShieldCheck,
  TbSchool,
  TbCertificate,
  TbMessageCircle,
  TbAddressBook,
} from "react-icons/tb";

const SERIF = { fontFamily: "'Playfair Display', Georgia, serif" };

// Left-panel value props — marketing copy only, no links. Mirrors the
// landing page's feature language so the two surfaces read as one product.
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

/** Faint dot-matrix block used in two corners of the navy panel. */
function DotGrid({ className }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute [background-image:radial-gradient(rgba(147,197,253,0.28)_1.5px,transparent_1.5px)] [background-size:15px_15px] ${className}`}
    />
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const from = location.state?.from?.pathname;

  // Dev-only seeded admin credentials (see backend AdminUserSeeder).
  // Stripped from production builds via the import.meta.env.DEV guard below.
  const DEV_CREDENTIALS = {
    email: "admin@pac.edu.ph",
    password: "P@cAdmin2026!",
  };

  const ROLE_DASHBOARDS = {
    admin: "/admin/dashboard",
    alumni: "/alumni/dashboard",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setNeedsVerification(false);
    setResent(false);
    setLoading(true);

    try {
      const userData = await login(form.email, form.password);
      const destination = from || ROLE_DASHBOARDS[userData.role] || "/login";
      navigate(destination, { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Unable to connect to server. Please try again.";
      setError(msg);
      if (err.response?.data?.errors?.code === "EMAIL_NOT_VERIFIED") {
        setNeedsVerification(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!form.email) return;
    setResending(true);
    try {
      await authApi.resendVerification(form.email);
      setResent(true);
    } finally {
      setResending(false);
    }
  };

  const fieldClass =
    "w-full rounded-[10px] border border-slate-200 bg-white py-3.5 pl-12 text-[15px] text-slate-800 placeholder:text-slate-300 outline-none transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15";

  return (
    <div className="flex h-svh overflow-hidden">
      {/* ━━━━━━━━ LEFT — navy branding panel (lg+ only) ━━━━━━━━ */}
      <div className="relative hidden overflow-hidden bg-[var(--color-navy-950)] lg:flex lg:w-[45%] lg:flex-col">
        {/* Depth wash + decorative layers, all beneath the content column */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 [background:radial-gradient(75%_60%_at_35%_15%,rgba(37,99,235,0.16)_0%,transparent_60%)]"
        />
        <DotGrid className="right-8 top-10 h-24 w-28" />
        <DotGrid className="bottom-28 left-8 h-20 w-24" />

        {/* ── Floating accent icons ──
            Watermark-faint glyphs that drift behind the brand block and
            heading. Staggered durations/delays keep them out of lockstep so
            the motion reads as ambient rather than mechanical. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-6 right-6 top-6 z-0 h-[280px]"
        >
          <style>{`
            @keyframes floatIcon {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-12px); }
            }
            @media (prefers-reduced-motion: reduce) {
              @keyframes floatIcon { 0%, 100% { transform: translateY(0); } }
            }
          `}</style>
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
            Same floatIcon keyframes declared above. Held clear of the
            copyright line, with timings offset from the upper cluster so the
            two groups never fall into step. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-20 left-6 right-6 z-0 h-[200px]"
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

        {/* ── Illustration ──
            Absolutely mounted on the panel so it never participates in the
            flex layout — it can be full-bleed at the bottom without ever
            pushing the copy off a short viewport. The source PNG carries an
            opaque near-white interior (furniture, walls) that would read as
            bright grey blobs on navy, so it is dropped back to a low opacity
            that lets the panel read through it. */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex justify-end" aria-hidden="true">
          <img
            src="/illustrations/Login-rafiki.png"
            alt=""
            className="mr-[-20px] w-full max-w-[520px] select-none object-contain opacity-[0.40]"
          />
        </div>

        <div className="relative z-10 flex min-h-0 flex-1 flex-col px-12 py-10 xl:px-14">
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

          {/* ── Welcome ── */}
          <h1
            className="mt-20 text-[38px] font-extrabold leading-[1.15] text-white"
            style={SERIF}
          >
            <span className="text-white">Welcome Back, </span>
            <span className="text-blue-400">Alumni!</span>
          </h1>
          <p className="mt-5 max-w-[430px] text-[15.5px] leading-[1.65] text-slate-300">
            Stay connected with your fellow alumni, explore opportunities, and
            be part of the PAC legacy.
          </p>

          {/* ── Feature highlights ── */}
          <ul className="mt-10 space-y-7">
            {HIGHLIGHTS.map(({ icon: Icon, title, desc }) => (
              <li key={title} className="flex items-start gap-4">
                <span className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl bg-blue-600/25 text-white">
                  <Icon aria-hidden="true" className="h-6 w-6" />
                </span>
                <span className="block max-w-[300px] pt-0.5">
                  <span className="block text-[15px] font-semibold text-white">
                    {title}
                  </span>
                  <span className="mt-1 block text-[13px] leading-[1.55] text-slate-400">
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
      <div className="flex w-full flex-col items-center justify-start overflow-y-auto bg-white px-6 py-10 pt-12 sm:px-10 lg:w-[55%] lg:px-16 lg:pl-20 lg:pt-16 xl:px-20 xl:pl-24">
        <div className="w-full max-w-[470px]">
          {/* ── Header ── */}
          <h2
            style={SERIF}
            className="text-[32px] font-bold leading-tight text-[var(--color-navy-900)]"
          >
            Sign In
          </h2>
          <p className="mt-2 text-[14.5px] text-slate-400">
            Enter your credentials to access your account
          </p>

          {/* Error */}
          {error && (
            <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3">
              <svg
                className="w-4 h-4 text-red-500 shrink-0 mt-0.5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-[13px] text-red-600 leading-[1.5]">{error}</p>
            </div>
          )}

          {needsVerification && (
            <div className="mt-4 text-[13px]">
              {resent ? (
                <p className="text-emerald-600">
                  If that email is registered and not yet verified, a new
                  verification link has been sent.
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resending}
                  className="font-semibold text-blue-600 hover:text-blue-700 hover:underline disabled:opacity-50"
                >
                  {resending ? "Sending…" : "Resend verification email"}
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8">
            {/* Email */}
            <div>
              <label className="mb-2 block text-[14px] font-bold text-slate-800">
                Email Address
              </label>
              <div className="relative">
                <HiOutlineEnvelope className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  autoComplete="email"
                  placeholder="Enter your email address"
                  className={`${fieldClass} pr-4`}
                />
              </div>
            </div>

            {/* Password */}
            <div className="mt-5">
              <label className="mb-2 block text-[14px] font-bold text-slate-800">
                Password
              </label>
              <div className="relative">
                <HiOutlineLockClosed className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className={`${fieldClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <HiOutlineEyeSlash className="h-5 w-5" />
                  ) : (
                    <HiOutlineEye className="h-5 w-5" />
                  )}
                </button>
              </div>

              <div className="mt-2.5 text-right">
                <a
                  href="/forgot-password"
                  className="text-[13px] font-medium text-blue-600 transition hover:text-blue-700"
                >
                  Forgot password?
                </a>
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
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
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
                  Signing in…
                </>
              ) : (
                <>
                  <TbLock aria-hidden="true" className="h-5 w-5" />
                  Log In
                </>
              )}
            </button>
          </form>

          {/* Dev-only credentials hint — removed from production builds */}
          {import.meta.env.DEV && (
            <div className="mt-4 p-3 bg-amber-50 border border-dashed border-amber-300 rounded-xl">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wide text-amber-700">
                  Dev — Seeded Admin
                </span>
                <button
                  type="button"
                  onClick={() => setForm(DEV_CREDENTIALS)}
                  className="text-[10px] font-semibold text-amber-700 hover:text-amber-900 hover:underline"
                >
                  Autofill
                </button>
              </div>
              <p className="text-[11px] text-amber-800/90 font-mono leading-relaxed break-all">
                {DEV_CREDENTIALS.email}
                <br />
                {DEV_CREDENTIALS.password}
              </p>
            </div>
          )}

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-[13px] text-slate-400">or</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {/* Sign up */}
          <p className="flex items-center justify-center gap-2 rounded-[10px] bg-slate-50 py-3.5 text-center text-[14px] text-slate-600">
            <TbUserPlus
              aria-hidden="true"
              className="h-[18px] w-[18px] flex-none text-slate-500"
            />
            <span>
              Don't have an account?{" "}
              <a
                href="/register"
                className="font-bold text-blue-600 transition hover:text-blue-700 hover:underline"
              >
                Sign Up
              </a>
            </span>
          </p>

          {/* Trust line */}
          <p className="mt-12 flex items-center justify-center gap-2">
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
