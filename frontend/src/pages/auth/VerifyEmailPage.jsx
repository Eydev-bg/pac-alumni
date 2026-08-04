import { useEffect, useState } from "react";
import {
  Link,
  useParams,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import authApi from "../../api/authApi";
import {
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineArrowLeft,
} from "react-icons/hi2";

export default function VerifyEmailPage() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const email = searchParams.get("email") || "";

  // "verifying" | "success" | "error"
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (!token || !email) {
      setStatus("error");
      setMessage("This verification link is missing required information.");
      return;
    }

    authApi
      .verifyEmail({ email, token })
      .then(() => {
        setStatus("success");
      })
      .catch((err) => {
        setStatus("error");
        setMessage(
          err.response?.data?.message ||
            "This verification link is invalid or has expired.",
        );
      });
    // Only run once on mount — the link is single-use.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    try {
      await authApi.resendVerification(email);
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
              Alumni Tracking System
            </span>
          </div>

          {status === "verifying" && (
            /* ━━━━ Verifying State ━━━━ */
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-blue-500 mx-auto mb-4" />
              <p className="text-[0.8rem] text-slate-400">
                Verifying your email…
              </p>
            </div>
          )}

          {status === "success" && (
            /* ━━━━ Success State ━━━━ */
            <div className="text-center py-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                <HiOutlineCheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <h2 className="text-[1.1rem] font-bold text-slate-800 mb-1">
                Email verified!
              </h2>
              <p className="text-[0.78rem] text-slate-400 mb-5 leading-relaxed">
                Your email has been confirmed. You can now log in to your
                account.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="w-full py-2.5 bg-blue-600 text-white text-[0.85rem] font-bold tracking-wide rounded-lg shadow-[0_4px_14px_rgba(37,99,235,0.3)] transition-all duration-200 hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(37,99,235,0.4)] active:translate-y-0"
              >
                Go to Login
              </button>
            </div>
          )}

          {status === "error" && (
            /* ━━━━ Error State ━━━━ */
            <div className="text-center py-2">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                <HiOutlineXCircle className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-[1.1rem] font-bold text-slate-800 mb-1">
                Verification failed
              </h2>
              <p className="text-[0.78rem] text-slate-400 mb-5 leading-relaxed">
                {message}
              </p>

              {resent ? (
                <p className="text-[0.75rem] text-emerald-600 mb-3">
                  If that email is registered and not yet verified, a new link
                  has been sent.
                </p>
              ) : (
                email && (
                  <button
                    onClick={handleResend}
                    disabled={resending}
                    className="w-full py-2.5 mb-3 bg-blue-600 text-white text-[0.85rem] font-bold tracking-wide rounded-lg shadow-[0_4px_14px_rgba(37,99,235,0.3)] transition-all duration-200 hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(37,99,235,0.4)] active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {resending ? "Sending…" : "Resend verification email"}
                  </button>
                )
              )}

              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 border border-slate-300 text-slate-600 text-[0.85rem] font-semibold rounded-lg hover:bg-slate-50 transition-colors"
              >
                <HiOutlineArrowLeft className="w-3.5 h-3.5" />
                Back to Login
              </Link>
            </div>
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
