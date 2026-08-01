import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import authApi from "../../api/authApi";

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

  if (status === "verifying") {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4" />
        <p className="text-sm text-slate-400">Verifying your email…</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-800 mb-2">
          Email verified!
        </h2>
        <p className="text-sm text-slate-500 mb-5">
          Your email has been confirmed. You can now log in to your account.
        </p>
        <button
          onClick={() => navigate("/login")}
          className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="text-center">
      <h2 className="text-xl font-bold text-slate-800 mb-2">
        Verification failed
      </h2>
      <p className="text-sm text-slate-500 mb-5">{message}</p>

      {resent ? (
        <p className="text-sm text-emerald-600 mb-3">
          If that email is registered and not yet verified, a new link has been
          sent.
        </p>
      ) : (
        email && (
          <button
            onClick={handleResend}
            disabled={resending}
            className="w-full py-2.5 mb-3 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {resending ? "Sending…" : "Resend verification email"}
          </button>
        )
      )}

      <button
        onClick={() => navigate("/login")}
        className="w-full py-2.5 border border-slate-300 text-slate-600 text-sm font-semibold rounded-lg hover:bg-slate-50 transition"
      >
        Back to Login
      </button>
    </div>
  );
}
