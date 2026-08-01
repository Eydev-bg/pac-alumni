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

  return (
    <div className="h-screen w-screen overflow-hidden relative flex items-center justify-center">
      {/* ━━━━ Background Image + Dark Overlay ━━━━ */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/campus-bg.jpg')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-blue-700/45 via-blue-600/25 to-blue-800/55" />
      </div>

      {/* ━━━━ Split Card ━━━━ */}
      <div className="relative z-10 w-full max-w-[880px] px-4 sm:px-5">
        <div className="flex overflow-hidden rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.18)]">
          {/* LEFT — form column */}
          <div className="w-full md:w-1/2 bg-white px-7 py-6">
            {/* ── Brand (logo + name) ── */}
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/pac-logo.jpg"
                alt="Philippine Advent College Seal"
                className="w-[60px] h-[60px] rounded-full object-cover border-[3px] border-blue-500 shadow-[0_0_0_4px_rgba(37,99,235,0.35),0_6px_20px_rgba(0,0,0,0.3)] bg-white shrink-0"
              />
              <div className="min-w-0">
                <h1
                  className="text-slate-800 text-[0.95rem] font-extrabold leading-tight"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  Philippine Advent College
                </h1>
                <span className="text-blue-600 text-[0.6rem] font-bold tracking-wide uppercase">
                  Alumni Login
                </span>
              </div>
            </div>

            <h2 className="text-[1.1rem] font-bold text-slate-800 mb-0.5">
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

            {needsVerification && (
              <div className="mb-3">
                {resent ? (
                  <p className="text-[0.72rem] text-emerald-600">
                    If that email is registered and not yet verified, a new
                    verification link has been sent.
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resending}
                    className="text-[0.72rem] font-semibold text-blue-600 hover:text-blue-700 hover:underline disabled:opacity-50"
                  >
                    {resending ? "Sending…" : "Resend verification email"}
                  </button>
                )}
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
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
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
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
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
                className="w-full py-2.5 bg-blue-600 text-white text-[0.85rem] font-bold tracking-wide rounded-lg shadow-[0_4px_14px_rgba(37,99,235,0.3)] transition-all duration-200 hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(37,99,235,0.4)] active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                Sign Up
              </a>
            </p>
          </div>

          {/* RIGHT — illustration panel (desktop only) */}
          <div className="hidden md:flex md:w-1/2 flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 px-8 py-10">
            <img
              src="/Login-rafiki.png"
              alt="Alumni signing in"
              className="w-full max-w-[320px] h-auto object-contain"
            />
            <p className="mt-4 text-center text-[0.8rem] text-slate-500 max-w-[260px]">
              Welcome back to the PAC Alumni community. Sign in to stay
              connected.
            </p>
          </div>
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
