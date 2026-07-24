import { useState } from "react";
import {
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiCheckCircle,
  HiOutlineMinusCircle,
} from "react-icons/hi2";
import SettingsSection from "../../../../components/settings/SettingsSection";
import settingsApi from "../../../../api/settingsApi";
import { tokenStorage } from "../../../../utils/storage";
import { useToast } from "../../../../hooks/useToast";

// Mirrors App\Rules\StrongPassword EXACTLY. Client-side display only — the
// server remains the sole authority on acceptance.
const RULES = [
  { key: "length", label: "At least 8 characters", test: (v) => v.length >= 8 },
  { key: "upper", label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { key: "lower", label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
  { key: "number", label: "One number", test: (v) => /[0-9]/.test(v) },
  {
    key: "special",
    label: "One special character",
    test: (v) => /[^A-Za-z0-9]/.test(v),
  },
];

const EMPTY = {
  current_password: "",
  password: "",
  password_confirmation: "",
};

function PasswordField({
  id,
  label,
  value,
  onChange,
  error,
  autoComplete,
  show,
  onToggleShow,
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          className={`w-full rounded-lg border px-3 py-2 pr-10 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 ${
            error
              ? "border-red-400 dark:border-red-500"
              : "border-slate-300 dark:border-slate-600"
          }`}
        />
        <button
          type="button"
          onClick={onToggleShow}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          {show ? (
            <HiOutlineEyeSlash className="w-5 h-5" />
          ) : (
            <HiOutlineEye className="w-5 h-5" />
          )}
        </button>
      </div>
      {error && (
        <p className="text-xs text-red-500 dark:text-red-400 mt-1">{error}</p>
      )}
    </div>
  );
}

export default function SecurityTab() {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [show, setShow] = useState({
    current_password: false,
    password: false,
    password_confirmation: false,
  });
  const [pending, setPending] = useState(false);

  const setField = (name) => (e) => {
    const { value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear a field's server error as soon as the user edits it.
    setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
  };

  const toggleShow = (name) =>
    setShow((prev) => ({ ...prev, [name]: !prev[name] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pending) return; // guard against double-submit

    setPending(true);
    setErrors({});

    try {
      const res = await settingsApi.changePassword(form);

      // CRITICAL: the backend rotates the password fingerprint, invalidating
      // every previously-issued JWT. Persist the fresh token or the very next
      // request logs the user out.
      const token = res.data?.data?.token;
      if (token) tokenStorage.setToken(token);

      toast.success("Password changed successfully.");
      setForm(EMPTY);
    } catch (err) {
      const status = err.response?.status;
      const apiErrors = err.response?.data?.errors;

      if (status === 422 && apiErrors) {
        // Map field errors back to their inputs instead of a generic toast.
        setErrors({
          current_password: apiErrors.current_password?.[0],
          password: apiErrors.password?.[0],
          password_confirmation: apiErrors.password_confirmation?.[0],
        });
      } else {
        toast.error(
          err.response?.data?.message || "Could not change your password.",
        );
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <SettingsSection
      title="Change password"
      description="Use a strong, unique password you don't use anywhere else."
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <PasswordField
          id="current_password"
          label="Current password"
          value={form.current_password}
          onChange={setField("current_password")}
          error={errors.current_password}
          autoComplete="current-password"
          show={show.current_password}
          onToggleShow={() => toggleShow("current_password")}
        />

        <PasswordField
          id="password"
          label="New password"
          value={form.password}
          onChange={setField("password")}
          error={errors.password}
          autoComplete="new-password"
          show={show.password}
          onToggleShow={() => toggleShow("password")}
        />

        {/* Live requirement checklist — colour AND icon, never colour alone. */}
        <ul className="space-y-1.5" aria-label="Password requirements">
          {RULES.map((rule) => {
            const met = rule.test(form.password);
            return (
              <li
                key={rule.key}
                className={`flex items-center gap-2 text-xs ${
                  met
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {met ? (
                  <HiCheckCircle className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <HiOutlineMinusCircle className="w-4 h-4 flex-shrink-0" />
                )}
                <span>{rule.label}</span>
              </li>
            );
          })}
        </ul>

        <PasswordField
          id="password_confirmation"
          label="Confirm new password"
          value={form.password_confirmation}
          onChange={setField("password_confirmation")}
          error={errors.password_confirmation}
          autoComplete="new-password"
          show={show.password_confirmation}
          onToggleShow={() => toggleShow("password_confirmation")}
        />

        <div className="pt-2">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            {pending && (
              <span className="w-4 h-4 rounded-full border-2 border-current border-b-transparent animate-spin" />
            )}
            {pending ? "Changing…" : "Change password"}
          </button>
        </div>
      </form>
    </SettingsSection>
  );
}
