import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import employerApi from "../../../api/employerApi";
import { JOB_TYPES } from "../../../config/jobOptions";

const emptyForm = {
  title: "",
  description: "",
  location: "",
  job_type: "full_time",
  salary_range_min: "",
  salary_range_max: "",
  qualifications: "",
  expires_at: "",
};

export default function EmployerJobCreatePage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!isEdit) return;
    employerApi
      .getJob(id)
      .then((res) => {
        const d = res.data.data;
        setForm({
          title: d.title || "",
          description: d.description || "",
          location: d.location || "",
          job_type: d.job_type || "full_time",
          salary_range_min: d.salary_range_min ?? "",
          salary_range_max: d.salary_range_max ?? "",
          qualifications: d.qualifications || "",
          expires_at: d.expires_at ? d.expires_at.slice(0, 10) : "",
        });
      })
      .catch(() => setError("Failed to load job."))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setSaving(true);

    // Strip empty optional fields so backend nullable rules pass cleanly.
    const payload = { ...form };
    ["salary_range_min", "salary_range_max", "qualifications", "expires_at"].forEach((k) => {
      if (payload[k] === "" || payload[k] === null) delete payload[k];
    });

    try {
      if (isEdit) {
        await employerApi.updateJob(id, payload);
      } else {
        await employerApi.createJob(payload);
      }
      navigate("/employer/jobs");
    } catch (err) {
      if (err.response?.status === 422 && err.response.data?.errors) {
        setFieldErrors(err.response.data.errors);
        setError("Please correct the highlighted fields.");
      } else {
        setError(err.response?.data?.message || "Failed to save job.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-slate-500 text-sm">Loading…</div>;

  const errFor = (n) => fieldErrors[n] && <p className="mt-1 text-[0.7rem] text-red-600">{fieldErrors[n][0]}</p>;
  const inputCls =
    "w-full px-3 py-2 border border-slate-300 rounded-lg text-[0.8rem] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15";

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">
          {isEdit ? "Edit Job" : "Post a Job"}
        </h1>
        <p className="text-sm text-slate-500">
          {isEdit ? "Update your job posting." : "Create a new job posting for alumni."}
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-[0.78rem] text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div>
          <label className="block text-[0.72rem] font-semibold text-slate-600 mb-1">
            Job Title <span className="text-red-500">*</span>
          </label>
          <input value={form.title} onChange={set("title")} className={inputCls} />
          {errFor("title")}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[0.72rem] font-semibold text-slate-600 mb-1">
              Location <span className="text-red-500">*</span>
            </label>
            <input value={form.location} onChange={set("location")} className={inputCls} />
            {errFor("location")}
          </div>
          <div>
            <label className="block text-[0.72rem] font-semibold text-slate-600 mb-1">
              Job Type <span className="text-red-500">*</span>
            </label>
            <select value={form.job_type} onChange={set("job_type")} className={inputCls}>
              {JOB_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            {errFor("job_type")}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[0.72rem] font-semibold text-slate-600 mb-1">
              Min Salary
            </label>
            <input
              type="number"
              min="0"
              value={form.salary_range_min}
              onChange={set("salary_range_min")}
              className={inputCls}
            />
            {errFor("salary_range_min")}
          </div>
          <div>
            <label className="block text-[0.72rem] font-semibold text-slate-600 mb-1">
              Max Salary
            </label>
            <input
              type="number"
              min="0"
              value={form.salary_range_max}
              onChange={set("salary_range_max")}
              className={inputCls}
            />
            {errFor("salary_range_max")}
          </div>
        </div>

        <div>
          <label className="block text-[0.72rem] font-semibold text-slate-600 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={5}
            value={form.description}
            onChange={set("description")}
            className={inputCls}
          />
          {errFor("description")}
        </div>

        <div>
          <label className="block text-[0.72rem] font-semibold text-slate-600 mb-1">
            Qualifications
          </label>
          <textarea
            rows={3}
            value={form.qualifications}
            onChange={set("qualifications")}
            className={inputCls}
          />
          {errFor("qualifications")}
        </div>

        <div>
          <label className="block text-[0.72rem] font-semibold text-slate-600 mb-1">
            Expires On
          </label>
          <input
            type="date"
            value={form.expires_at}
            onChange={set("expires_at")}
            className={inputCls}
          />
          {errFor("expires_at")}
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate("/employer/jobs")}
            className="px-5 py-2.5 text-[0.82rem] font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-gradient-to-r from-[#1a2e5a] to-[#2a4177] text-white text-[0.82rem] font-bold rounded-lg shadow-md transition-all hover:-translate-y-0.5 disabled:opacity-60"
          >
            {saving ? "Saving…" : isEdit ? "Update Job" : "Post Job"}
          </button>
        </div>
      </form>
    </div>
  );
}
