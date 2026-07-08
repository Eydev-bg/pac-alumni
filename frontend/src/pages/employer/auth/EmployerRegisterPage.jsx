import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import employerApi from "../../../api/employerApi";
import {
  HiOutlineBuildingOffice2,
  HiOutlineDocumentArrowUp,
  HiOutlineEye,
  HiOutlineEyeSlash,
} from "react-icons/hi2";

const initialForm = {
  company_name: "",
  company_email: "",
  company_address: "",
  company_contact_number: "",
  company_website: "",
  hr_full_name: "",
  hr_position: "",
  email: "",
  password: "",
  password_confirmation: "",
};

export default function EmployerRegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [businessPermit, setBusinessPermit] = useState(null);
  const [logo, setLogo] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    if (!businessPermit) {
      setError("A business permit document is required.");
      return;
    }
    if (form.password !== form.password_confirmation) {
      setFieldErrors({ password_confirmation: ["Passwords do not match."] });
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ""));
      fd.append("business_permit_document", businessPermit);
      if (logo) fd.append("company_logo", logo);

      await employerApi.register(fd);

      // Auto sign-in with the credentials just registered.
      await login(form.email, form.password);
      navigate("/employer/dashboard", { replace: true });
    } catch (err) {
      if (err.response?.status === 422 && err.response.data?.errors) {
        setFieldErrors(err.response.data.errors);
        setError("Please correct the highlighted fields.");
      } else {
        setError(
          err.response?.data?.message ||
            "Registration failed. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, name, type = "text", required, placeholder, half }) => (
    <div className={half ? "" : "sm:col-span-2"}>
      <label className="block text-[0.72rem] font-semibold text-slate-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={form[name]}
        onChange={set(name)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[0.8rem] text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
      />
      {fieldErrors[name] && (
        <p className="mt-1 text-[0.7rem] text-red-600">{fieldErrors[name][0]}</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1a2e5a] to-[#2a4177] flex items-center justify-center shadow-lg mb-3">
            <HiOutlineBuildingOffice2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-[#1a2e5a]">
            Register as an Employer
          </h1>
          <p className="text-sm text-slate-500 mt-1 text-center">
            Create an HR account to post jobs and reach PAC alumni. Accounts with a
            valid business permit are approved automatically.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6"
        >
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-[0.78rem] text-red-700">
              {error}
            </div>
          )}

          {/* Company details */}
          <div>
            <h2 className="text-sm font-bold text-slate-700 mb-3">Company Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Company Name" name="company_name" required />
              <Field
                label="Company Email"
                name="company_email"
                type="email"
                required
              />
              <Field
                label="Contact Number"
                name="company_contact_number"
                required
                half
              />
              <Field
                label="Website"
                name="company_website"
                placeholder="https://"
                half
              />
              <Field label="Company Address" name="company_address" required />
            </div>
          </div>

          {/* HR representative */}
          <div>
            <h2 className="text-sm font-bold text-slate-700 mb-3">
              HR Representative
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name" name="hr_full_name" required half />
              <Field label="Position" name="hr_position" required half />
            </div>
          </div>

          {/* Documents */}
          <div>
            <h2 className="text-sm font-bold text-slate-700 mb-3">Documents</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[0.72rem] font-semibold text-slate-600 mb-1">
                  Business Permit <span className="text-red-500">*</span>
                </label>
                <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 text-[0.78rem] text-slate-600">
                  <HiOutlineDocumentArrowUp className="w-5 h-5 text-slate-400" />
                  <span className="truncate">
                    {businessPermit ? businessPermit.name : "PDF, JPG or PNG (max 5MB)"}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => setBusinessPermit(e.target.files[0] || null)}
                  />
                </label>
                {fieldErrors.business_permit_document && (
                  <p className="mt-1 text-[0.7rem] text-red-600">
                    {fieldErrors.business_permit_document[0]}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-[0.72rem] font-semibold text-slate-600 mb-1">
                  Company Logo
                </label>
                <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 text-[0.78rem] text-slate-600">
                  <HiOutlineDocumentArrowUp className="w-5 h-5 text-slate-400" />
                  <span className="truncate">
                    {logo ? logo.name : "JPG or PNG (max 2MB)"}
                  </span>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => setLogo(e.target.files[0] || null)}
                  />
                </label>
                {fieldErrors.company_logo && (
                  <p className="mt-1 text-[0.7rem] text-red-600">
                    {fieldErrors.company_logo[0]}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Account */}
          <div>
            <h2 className="text-sm font-bold text-slate-700 mb-3">Login Account</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Login Email" name="email" type="email" required />
              <div>
                <label className="block text-[0.72rem] font-semibold text-slate-600 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={set("password")}
                    className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg text-[0.8rem] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <HiOutlineEyeSlash className="w-4 h-4" />
                    ) : (
                      <HiOutlineEye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="mt-1 text-[0.7rem] text-red-600">
                    {fieldErrors.password[0]}
                  </p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[0.72rem] font-semibold text-slate-600 mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password_confirmation}
                  onChange={set("password_confirmation")}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[0.8rem] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
                />
                {fieldErrors.password_confirmation && (
                  <p className="mt-1 text-[0.7rem] text-red-600">
                    {fieldErrors.password_confirmation[0]}
                  </p>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-[#1a2e5a] to-[#2a4177] text-white text-[0.85rem] font-bold tracking-wide rounded-lg shadow-md transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account…" : "Create Employer Account"}
          </button>

          <p className="text-center text-[0.78rem] text-slate-500">
            Already have an account?{" "}
            <a
              href="/login"
              className="font-bold text-[#1a2e5a] hover:text-blue-600 hover:underline"
            >
              Log In
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
