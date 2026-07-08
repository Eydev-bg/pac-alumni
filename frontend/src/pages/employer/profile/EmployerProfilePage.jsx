import { useEffect, useState } from "react";
import employerApi from "../../../api/employerApi";
import { HiOutlineCheckBadge } from "react-icons/hi2";

const FIELDS = [
  { name: "company_name", label: "Company Name" },
  { name: "company_email", label: "Company Email", type: "email" },
  { name: "company_contact_number", label: "Contact Number" },
  { name: "company_website", label: "Website" },
  { name: "company_address", label: "Company Address", full: true },
  { name: "hr_full_name", label: "HR Full Name" },
  { name: "hr_position", label: "HR Position" },
];

export default function EmployerProfilePage() {
  const [form, setForm] = useState(null);
  const [logo, setLogo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [employer, setEmployer] = useState(null);

  useEffect(() => {
    employerApi
      .getProfile()
      .then((res) => {
        const d = res.data.data;
        setEmployer(d);
        setForm({
          company_name: d.company_name || "",
          company_email: d.company_email || "",
          company_contact_number: d.company_contact_number || "",
          company_website: d.company_website || "",
          company_address: d.company_address || "",
          hr_full_name: d.hr_full_name || "",
          hr_position: d.hr_position || "",
        });
      })
      .catch(() => setError("Failed to load profile."))
      .finally(() => setLoading(false));
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setFieldErrors({});
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ""));
      if (logo) fd.append("company_logo", logo);

      const res = await employerApi.updateProfile(fd);
      setEmployer(res.data.data);
      setLogo(null);
      setMessage("Profile updated successfully.");
    } catch (err) {
      if (err.response?.status === 422 && err.response.data?.errors) {
        setFieldErrors(err.response.data.errors);
      }
      setError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-slate-500 text-sm">Loading profile…</div>;
  if (!form) return <div className="text-red-600 text-sm">{error}</div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Company Profile</h1>
          <p className="text-sm text-slate-500">Update your company information.</p>
        </div>
        {employer?.is_verified && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
            <HiOutlineCheckBadge className="w-4 h-4" /> Verified
          </span>
        )}
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-[0.78rem] text-emerald-700">
          {message}
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-[0.78rem] text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FIELDS.map((f) => (
            <div key={f.name} className={f.full ? "sm:col-span-2" : ""}>
              <label className="block text-[0.72rem] font-semibold text-slate-600 mb-1">
                {f.label}
              </label>
              <input
                type={f.type || "text"}
                value={form[f.name]}
                onChange={set(f.name)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[0.8rem] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
              />
              {fieldErrors[f.name] && (
                <p className="mt-1 text-[0.7rem] text-red-600">{fieldErrors[f.name][0]}</p>
              )}
            </div>
          ))}
          <div className="sm:col-span-2">
            <label className="block text-[0.72rem] font-semibold text-slate-600 mb-1">
              Replace Logo (JPG/PNG, max 2MB)
            </label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png"
              onChange={(e) => setLogo(e.target.files[0] || null)}
              className="text-[0.78rem] text-slate-600"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-gradient-to-r from-[#1a2e5a] to-[#2a4177] text-white text-[0.82rem] font-bold rounded-lg shadow-md transition-all hover:-translate-y-0.5 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
