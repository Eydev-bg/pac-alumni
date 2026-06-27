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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  InputField — MUST be outside the main component.
//  If defined inside, React re-creates it on every state
//  change → unmounts/remounts input → loses focus.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
  return (
    <div>
      <label className="block text-[0.72rem] font-semibold text-slate-600 mb-1">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type={isPassword ? (showToggle ? "text" : "password") : type}
          value={value}
          onChange={(e) => onChange(field, e.target.value)}
          required
          autoComplete={autoComplete}
          placeholder={placeholder}
          maxLength={maxLength}
          className={`w-full pl-9 ${isPassword ? "pr-10" : "pr-3"} py-2 border rounded-lg text-[0.8rem] text-slate-800 placeholder:text-slate-400 bg-white/70 outline-none transition-all duration-200 focus:ring-2 focus:bg-white ${
            error
              ? "border-red-400 focus:border-red-500 focus:ring-red-500/15"
              : "border-slate-300 focus:border-blue-500 focus:ring-blue-500/15"
          }`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={onToggle}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label={showToggle ? "Hide password" : "Show password"}
          >
            {showToggle ? (
              <HiOutlineEyeSlash className="w-4 h-4" />
            ) : (
              <HiOutlineEye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
      {error && <p className="text-[0.68rem] text-red-500 mt-0.5">{error}</p>}
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
      .catch(() => {})
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
      <div className="h-screen w-screen flex items-center justify-center bg-[#0f1b3d]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#c8a84e]" />
      </div>
    );
  }

  // ── Registration Closed ──
  if (registrationClosed) {
    return (
      <div className="h-screen w-screen overflow-hidden relative flex items-center justify-center">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/campus-bg.jpg')" }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[#0f1b3d]/60 via-[#0f1b3d]/40 to-[#0f1b3d]/70 backdrop-blur-[2px]" />
        </div>
        <div className="relative z-10 w-full max-w-[420px] px-5 flex flex-col items-center">
          <img
            src="/pac-logo.jpg"
            alt="PAC Seal"
            className="w-[84px] h-[84px] rounded-full object-cover border-[3px] border-[#c8a84e] shadow-[0_0_0_4px_rgba(26,46,90,0.4),0_6px_20px_rgba(0,0,0,0.3)] bg-white mb-[-18px] relative z-20"
          />
          <div className="w-full bg-white/[0.92] backdrop-blur-2xl border border-white/50 rounded-2xl px-7 pt-8 pb-6 shadow-[0_16px_48px_rgba(0,0,0,0.12)] text-center">
            <HiOutlineExclamationTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-[#1a2e5a] mb-2">
              Registration Closed
            </h2>
            <p className="text-sm text-slate-500 mb-5">
              Alumni registration is currently closed. Please contact the
              administrator for assistance or check back later.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="w-full py-2.5 bg-gradient-to-r from-[#1a2e5a] to-[#2a4177] text-white text-sm font-bold rounded-lg shadow-[0_4px_14px_rgba(26,46,90,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(26,46,90,0.45)]"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Success ──
  if (success) {
    return (
      <div className="h-screen w-screen overflow-hidden relative flex items-center justify-center">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/campus-bg.jpg')" }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[#0f1b3d]/60 via-[#0f1b3d]/40 to-[#0f1b3d]/70 backdrop-blur-[2px]" />
        </div>
        <div className="relative z-10 w-full max-w-[420px] px-5 flex flex-col items-center">
          <img
            src="/pac-logo.jpg"
            alt="PAC Seal"
            className="w-[84px] h-[84px] rounded-full object-cover border-[3px] border-[#c8a84e] shadow-[0_0_0_4px_rgba(26,46,90,0.4),0_6px_20px_rgba(0,0,0,0.3)] bg-white mb-[-18px] relative z-20"
          />
          <div className="w-full bg-white/[0.92] backdrop-blur-2xl border border-white/50 rounded-2xl px-7 pt-8 pb-6 shadow-[0_16px_48px_rgba(0,0,0,0.12)] text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
              <HiOutlineCheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-[#1a2e5a] mb-2">
              Registration Successful!
            </h2>
            <p className="text-sm text-slate-500 mb-5">
              Your alumni account has been verified and created. You can now log
              in using your email and password.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="w-full py-2.5 bg-gradient-to-r from-[#1a2e5a] to-[#2a4177] text-white text-sm font-bold rounded-lg shadow-[0_4px_14px_rgba(26,46,90,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(26,46,90,0.45)]"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  MAIN — Wide 2-column layout (desktop), stacked (mobile)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  return (
    <div className="h-screen w-screen overflow-y-auto relative flex items-center justify-center py-4 sm:py-6">
      {/* Background */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/campus-bg.jpg')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f1b3d]/60 via-[#0f1b3d]/40 to-[#0f1b3d]/70 backdrop-blur-[2px]" />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-[440px] md:max-w-[780px] px-4 sm:px-5 flex flex-col items-center">
        {/* Logo */}
        <img
          src="/pac-logo.jpg"
          alt="Philippine Advent College Seal"
          className="w-[70px] h-[70px] rounded-full object-cover border-[3px] border-[#c8a84e] shadow-[0_0_0_4px_rgba(26,46,90,0.4),0_6px_20px_rgba(0,0,0,0.3)] bg-white mb-[-15px] relative z-20"
        />

        {/* Branding Header */}
        <div className="w-full text-center pt-5 pb-2 bg-gradient-to-b from-[#1a2e5a]/90 to-[#1a2e5a]/75 backdrop-blur-xl rounded-t-2xl border border-white/15 border-b-0">
          <h1
            className="text-white text-[0.95rem] sm:text-[1.05rem] font-extrabold tracking-[0.06em] uppercase mb-1.5 drop-shadow-[0_2px_6px_rgba(0,0,0,0.3)]"
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
            Alumni Registration
          </span>
        </div>

        {/* Form Card */}
        <div className="w-full bg-white/[0.92] backdrop-blur-2xl border border-white/50 border-t-0 rounded-b-2xl px-5 sm:px-7 pt-4 pb-5 shadow-[0_16px_48px_rgba(0,0,0,0.12)]">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
            <div>
              <h2 className="text-[1.05rem] font-bold text-[#1a2e5a] mb-0.5">
                Create Your Alumni Account
              </h2>
              <p className="text-[0.72rem] text-slate-400">
                College graduates only — verify your identity to register
              </p>
            </div>
            <p className="text-[0.68rem] text-slate-400 mt-1 sm:mt-0 hidden md:block">
              Already have an account?{" "}
              <a
                href="/login"
                className="font-bold text-[#1a2e5a] hover:text-blue-600 hover:underline transition-colors"
              >
                Log In
              </a>
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <HiOutlineExclamationTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-[0.72rem] text-red-600 leading-relaxed">
                {error}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* 2-Column Grid (desktop) / Stacked (mobile) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-0">
              {/* LEFT: Graduate Verification */}
              <div className="space-y-2.5">
                <div className="bg-blue-50/60 border border-blue-100 rounded-lg p-3 space-y-2.5">
                  <p className="text-[0.68rem] font-semibold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                    <HiOutlineIdentification className="w-3.5 h-3.5" />
                    Graduate Verification
                  </p>
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
                  <div className="grid grid-cols-2 gap-2.5">
                    <InputField
                      icon={HiOutlineUser}
                      label="First Name"
                      field="first_name"
                      placeholder="Juan"
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
                      placeholder="Dela Cruz"
                      autoComplete="family-name"
                      maxLength={100}
                      value={form.last_name}
                      onChange={handleChange}
                      error={getFieldError("last_name")}
                    />
                  </div>
                  <div className="bg-blue-100/50 border border-blue-200/60 rounded-md px-2.5 py-2 mt-1">
                    <p className="text-[0.65rem] text-blue-600 leading-relaxed">
                      <span className="font-semibold">
                        How to find your Alumni ID:
                      </span>{" "}
                      Your Alumni ID was assigned upon graduation (format:
                      PAC-YYYY-XXXX). Check your diploma, transcript, or contact
                      the Registrar's Office.
                    </p>
                  </div>
                </div>
              </div>

              {/* RIGHT: Account Details */}
              <div className="space-y-2.5 mt-2.5 md:mt-0">
                <div className="bg-slate-50/60 border border-slate-200/80 rounded-lg p-3 space-y-2.5">
                  <p className="text-[0.68rem] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <HiOutlineLockClosed className="w-3.5 h-3.5" />
                    Account Details
                  </p>
                  <InputField
                    icon={HiOutlineEnvelope}
                    label="Email Address"
                    field="email"
                    type="email"
                    placeholder="you@email.com"
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

                  {/* Password strength */}
                  {form.password.length > 0 && (
                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 px-1 pt-0.5">
                      {[
                        { key: "length", text: "8+ characters" },
                        { key: "uppercase", text: "Uppercase letter" },
                        { key: "lowercase", text: "Lowercase letter" },
                        { key: "number", text: "Number" },
                        { key: "special", text: "Special character" },
                        { key: "match", text: "Passwords match" },
                      ].map(({ key, text }) => (
                        <span
                          key={key}
                          className={`flex items-center gap-1 text-[0.65rem] transition-colors ${
                            passwordChecks[key]
                              ? "text-emerald-600"
                              : "text-slate-400"
                          }`}
                        >
                          <span className="text-[0.7rem]">
                            {passwordChecks[key] ? "✓" : "○"}
                          </span>
                          {text}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !allPasswordChecksPass}
              className="w-full py-2.5 mt-4 bg-gradient-to-r from-[#1a2e5a] to-[#2a4177] text-white text-[0.85rem] font-bold tracking-wide rounded-lg shadow-[0_4px_14px_rgba(26,46,90,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(26,46,90,0.45)] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
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
                  Verifying & Creating Account…
                </>
              ) : (
                "Create Alumni Account"
              )}
            </button>
          </form>

          {/* Mobile-only login link */}
          <div className="md:hidden">
            <div className="flex items-center gap-3 my-3">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-[0.68rem] text-slate-400">or</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
            <p className="text-center text-[0.78rem] text-slate-500">
              Already have an account?{" "}
              <a
                href="/login"
                className="font-bold text-[#1a2e5a] hover:text-blue-600 hover:underline transition-colors"
              >
                Log In
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="fixed bottom-3 left-0 right-0 text-center text-[0.62rem] text-white/50 z-10 tracking-wide">
        © {new Date().getFullYear()} Philippine Advent College. All rights
        reserved.
      </p>
    </div>
  );
}
