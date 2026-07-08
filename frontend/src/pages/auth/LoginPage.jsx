import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  HiOutlineEnvelope,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeSlash,
} from "react-icons/hi2";

// ╔══════════════════════════════════════════════════════════════════╗
// ║  SAAN ILAGAY YUNG IMAGES:                                       ║
// ║                                                                  ║
// ║  public/                                                         ║
// ║    ├── pac-logo.jpg       ← School seal / logo                   ║
// ║    └── campus-bg.jpg      ← Campus background photo              ║
// ║                                                                  ║
// ║  Kung Vite: same — public/ folder din.                           ║
// ║  Kung gusto sa src/assets/:                                      ║
// ║    import campusBg from "../../assets/campus-bg.jpg";            ║
// ║    import pacLogo from "../../assets/pac-logo.jpg";              ║
// ║    Then: src={pacLogo} and backgroundImage: `url(${campusBg})`  ║
// ╚══════════════════════════════════════════════════════════════════╝

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const from = location.state?.from?.pathname;

  // Dev-only seeded admin credentials (see backend AdminUserSeeder).
  // Stripped from production builds via the import.meta.env.DEV guard below.
  const DEV_CREDENTIALS = { email: "admin@pac.edu.ph", password: "P@cAdmin2026!" };

  const ROLE_DASHBOARDS = {
    admin: "/admin/dashboard",
    alumni: "/alumni/dashboard",
    employer: "/employer/dashboard",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden relative flex items-center justify-center">
      {/* ━━━━ Background Image + Dark Overlay ━━━━ */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/campus-bg.jpg')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f1b3d]/60 via-[#0f1b3d]/40 to-[#0f1b3d]/70 backdrop-blur-[2px]" />
      </div>

      {/* ━━━━ Centered Card ━━━━ */}
      <div className="relative z-10 w-full max-w-[400px] px-5 flex flex-col items-center">
        {/* ── Logo ── */}
        <img
          src="/pac-logo.jpg"
          alt="Philippine Advent College Seal"
          className="w-[84px] h-[84px] rounded-full object-cover border-[3px] border-[#c8a84e] shadow-[0_0_0_4px_rgba(26,46,90,0.4),0_6px_20px_rgba(0,0,0,0.3)] bg-white mb-[-18px] relative z-20"
        />

        {/* ── Branding Header (navy bar) ── */}
        <div className="w-full text-center pt-6 pb-2.5 bg-gradient-to-b from-[#1a2e5a]/90 to-[#1a2e5a]/75 backdrop-blur-xl rounded-t-2xl border border-white/15 border-b-0">
          <h1
            className="text-white text-[1.05rem] font-extrabold tracking-[0.06em] uppercase mb-1.5 drop-shadow-[0_2px_6px_rgba(0,0,0,0.3)]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Philippine Advent College
          </h1>
          <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#c8a84e] to-[#e0c76a] text-[#1a2e5a] text-[0.6rem] font-bold tracking-wide uppercase px-3.5 py-0.5 rounded-full shadow-[0_2px_8px_rgba(200,168,78,0.3)]">
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            Alumni Tracking System
          </span>
        </div>

        {/* ── Login Card (white, frosted glass) ── */}
        <div className="w-full bg-white/[0.92] backdrop-blur-2xl border border-white/50 border-t-0 rounded-b-2xl px-7 pt-4 pb-4 shadow-[0_16px_48px_rgba(0,0,0,0.12)]">
          <h2 className="text-[1.1rem] font-bold text-[#1a2e5a] mb-0.5">
            Welcome, Alumni!
          </h2>
          <p className="text-[0.75rem] text-slate-400 mb-3">
            Sign in to your account
          </p>

          {/* Error */}
          {error && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <svg
                className="w-3.5 h-3.5 text-red-500 shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-[0.72rem] text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div className="mb-3">
              <label className="block text-[0.72rem] font-semibold text-slate-600 mb-1">
                Email (PAC Alumni)
              </label>
              <div className="relative">
                <HiOutlineEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  autoComplete="email"
                  placeholder="Email (PAC Alumni)"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-[0.8rem] text-slate-800 placeholder:text-slate-400 bg-white/70 outline-none transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 focus:bg-white"
                />
              </div>
            </div>

            {/* Password */}
            <div className="mb-3.5">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[0.72rem] font-semibold text-slate-600">
                  Password
                </label>
                <a
                  href="/forgot-password"
                  className="text-[0.68rem] font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="w-full pl-9 pr-10 py-2 border border-slate-300 rounded-lg text-[0.8rem] text-slate-800 placeholder:text-slate-400 bg-white/70 outline-none transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <HiOutlineEyeSlash className="w-4 h-4" />
                  ) : (
                    <HiOutlineEye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-[#1a2e5a] to-[#2a4177] text-white text-[0.85rem] font-bold tracking-wide rounded-lg shadow-[0_4px_14px_rgba(26,46,90,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(26,46,90,0.45)] active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                "Log In"
              )}
            </button>
          </form>

          {/* Dev-only credentials hint — removed from production builds */}
          {import.meta.env.DEV && (
            <div className="mt-3 p-2.5 bg-amber-50 border border-dashed border-amber-300 rounded-lg">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[0.62rem] font-bold uppercase tracking-wide text-amber-700">
                  Dev — Seeded Admin
                </span>
                <button
                  type="button"
                  onClick={() => setForm(DEV_CREDENTIALS)}
                  className="text-[0.62rem] font-semibold text-amber-700 hover:text-amber-900 hover:underline"
                >
                  Autofill
                </button>
              </div>
              <p className="text-[0.68rem] text-amber-800/90 font-mono leading-relaxed break-all">
                {DEV_CREDENTIALS.email}
                <br />
                {DEV_CREDENTIALS.password}
              </p>
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3 my-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[0.68rem] text-slate-400">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Sign up */}
          <p className="text-center text-[0.78rem] text-slate-500">
            Don't have an account?{" "}
            <a
              href="/register"
              className="font-bold text-[#1a2e5a] hover:text-blue-600 hover:underline transition-colors"
            >
              Sign Up
            </a>
          </p>
          <p className="text-center text-[0.72rem] text-slate-400 mt-1">
            Hiring?{" "}
            <a
              href="/employer/register"
              className="font-semibold text-[#1a2e5a] hover:text-blue-600 hover:underline transition-colors"
            >
              Register as an Employer
            </a>
          </p>
        </div>
      </div>

      {/* ━━━━ Footer ━━━━ */}
      <p className="absolute bottom-3 left-0 right-0 text-center text-[0.62rem] text-white/50 z-10 tracking-wide">
        © {new Date().getFullYear()} Philippine Advent College. All rights
        reserved.
      </p>
    </div>
  );
}
