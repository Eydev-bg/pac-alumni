import { useState } from "react";
import { Link } from "react-router-dom";
import authApi from "../../api/authApi";
import {
  HiOutlineEnvelope,
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
} from "react-icons/hi2";

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

  return (
    <div className="h-screen w-screen overflow-hidden relative flex items-center justify-center">
      {/* ━━━━ Background Image + Dark Overlay ━━━━ */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/campus-bg.jpg')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-blue-700/45 via-blue-600/25 to-blue-800/55" />
      </div>

      {/* ━━━━ Centered Card ━━━━ */}
      <div className="relative z-10 w-full max-w-[420px] px-5 flex flex-col items-center">
        {/* ── Logo ── */}
        <img
          src="/pac-logo.jpg"
          alt="Philippine Advent College Seal"
          className="w-[84px] h-[84px] rounded-full object-cover border-[3px] border-blue-500 shadow-[0_0_0_4px_rgba(37,99,235,0.35),0_6px_20px_rgba(0,0,0,0.3)] bg-white mb-[-18px] relative z-20"
        />

        {/* ── Card (white) ── */}
        <div className="w-full bg-white/[0.92] backdrop-blur-2xl border border-white/50 rounded-2xl px-7 pt-8 pb-6 shadow-[0_16px_48px_rgba(0,0,0,0.12)]">
          {/* ── Brand (name + tag, centered under logo) ── */}
          <div className="text-center mb-4">
            <h1
              className="text-slate-800 text-[0.95rem] font-extrabold leading-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Philippine Advent College
            </h1>
            <span className="text-blue-600 text-[0.6rem] font-bold tracking-wide uppercase">
              Alumni Forgot Password
            </span>
          </div>

          {sent ? (
            /* ━━━━ Success State ━━━━ */
            <div className="text-center py-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                <HiOutlineCheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <h2 className="text-[1.1rem] font-bold text-slate-800 mb-1">
                Check your email
              </h2>
              <p className="text-[0.78rem] text-slate-400 mb-5 leading-relaxed">
                If an account exists with that email, we sent a password reset
                link.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-[0.8rem] font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                <HiOutlineArrowLeft className="w-3.5 h-3.5" />
                Back to sign in
              </Link>
            </div>
          ) : (
            /* ━━━━ Form State ━━━━ */
            <>
              <Link
                to="/login"
                className="inline-flex items-center gap-1 text-[0.72rem] text-slate-400 hover:text-slate-600 transition-colors mb-3"
              >
                <HiOutlineArrowLeft className="w-3.5 h-3.5" />
                Back to sign in
              </Link>

              <h2 className="text-[1.1rem] font-bold text-slate-800 mb-0.5">
                Forgot password?
              </h2>
              <p className="text-[0.75rem] text-slate-400 mb-4">
                Enter your email and we'll send you a reset link.
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
                <div className="mb-4">
                  <label className="block text-[0.72rem] font-semibold text-slate-600 mb-1">
                    Email address
                  </label>
                  <div className="relative">
                    <HiOutlineEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      placeholder="admin@pac.edu.ph"
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-[0.8rem] text-slate-800 placeholder:text-slate-400 bg-white/70 outline-none transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 focus:bg-white"
                    />
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
                      Sending…
                    </>
                  ) : (
                    "Send reset link"
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* ━━━━ Footer ━━━━ */}
      <p className="fixed bottom-3 left-0 right-0 text-center text-[0.62rem] text-white/50 z-10 tracking-wide">
        © {new Date().getFullYear()} Philippine Advent College. All rights
        reserved.
      </p>
    </div>
  );
}
