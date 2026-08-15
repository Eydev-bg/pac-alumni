import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import adminApi from "../../../api/adminApi";
import { storageUrl } from "../../../utils/formatters";
import { useToast } from "../../../hooks/useToast";
import { EMPLOYMENT_TYPES, JOB_STATUSES } from "../../../config/jobOptions";
import Card from "../../../ui/Card";
import Button from "../../../ui/Button";
import Alert from "../../../ui/Alert";
import {
  HiOutlineArrowLeft,
  HiOutlinePhoto,
  HiOutlineXMark,
  HiOutlineBuildingOffice2,
  HiOutlineBriefcase,
  HiOutlineDocumentText,
  HiOutlineLink,
  HiOutlineFlag,
} from "react-icons/hi2";

const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["blockquote", "link"],
    [{ color: [] }, { background: [] }],
    ["clean"],
  ],
};

const QUILL_FORMATS = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "blockquote",
  "link",
  "color",
  "background",
];

const emptyForm = {
  company_name: "",
  company_email: "",
  job_position: "",
  location: "",
  employment_type: EMPLOYMENT_TYPES[0].value,
  salary: "",
  application_deadline: "",
  description: "",
  requirements: "",
  benefits: "",
  application_link: "",
  status: JOB_STATUSES[0].value,
  is_pinned: false,
};

const labelCls =
  "block text-[0.72rem] font-semibold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider";
const inputCls =
  "w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/30 transition-colors dark:bg-white/[0.06] dark:border-white/[0.08] dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:ring-gold-500/40 dark:focus:border-gold-500/30";

// Convert a backend ISO date/datetime to the 'YYYY-MM-DD' value that a
// <input type="date"> expects.
function isoToDateInput(iso) {
  if (!iso) return "";
  return iso.slice(0, 10);
}

// Today as a local 'YYYY-MM-DD' string (for the deadline min attribute).
function todayLocal() {
  const d = new Date();
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d - tzOffset).toISOString().slice(0, 10);
}

// Ensure the link has a scheme so window.open / backend validation accept it
// (bare domains get https:// prepended).
function normalizeLink(link) {
  const trimmed = link.trim();
  if (!trimmed) return "";
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

// Section heading shown above each form card.
function SectionLabel({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <Icon className="w-4 h-4 text-blue-600 dark:text-gold-500" />
      <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
        {children}
      </h2>
    </div>
  );
}

export default function JobPostingFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState(emptyForm);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [existingLogo, setExistingLogo] = useState(null);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // ── Load existing job posting when editing ──
  useEffect(() => {
    if (!isEdit) return;
    adminApi
      .getJobPosting(id)
      .then((res) => {
        const d = res.data.data;
        setForm({
          company_name: d.company_name || "",
          company_email: d.company_email || "",
          job_position: d.job_position || "",
          location: d.location || "",
          employment_type: d.employment_type?.value || EMPLOYMENT_TYPES[0].value,
          salary: d.salary || "",
          application_deadline: isoToDateInput(d.application_deadline),
          description: d.description || "",
          requirements: d.requirements || "",
          benefits: d.benefits || "",
          application_link: d.application_link || "",
          status: d.status?.value || JOB_STATUSES[0].value,
          is_pinned: !!d.is_pinned,
        });
        setExistingLogo(d.company_logo || null);
      })
      .catch(() => setError("Failed to load job posting."))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const clearLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  // Strip HTML to check whether the editor actually has content.
  const descriptionIsEmpty = useMemo(() => {
    const text = form.description
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();
    return text.length === 0;
  }, [form.description]);

  const buildPayload = () => {
    const fd = new FormData();
    fd.append("company_name", form.company_name);
    // Always sent (even when blank) so the backend's required_without pair
    // sees both values, and so clearing either field actually persists.
    fd.append("company_email", form.company_email.trim());
    fd.append("job_position", form.job_position);
    fd.append("location", form.location);
    fd.append("employment_type", form.employment_type);
    if (form.salary) fd.append("salary", form.salary);
    if (form.application_deadline)
      fd.append("application_deadline", form.application_deadline);
    fd.append("description", form.description);
    if (form.requirements) fd.append("requirements", form.requirements);
    if (form.benefits) fd.append("benefits", form.benefits);
    fd.append("application_link", normalizeLink(form.application_link));
    fd.append("status", form.status);
    fd.append("is_pinned", form.is_pinned ? "1" : "0");
    if (logoFile) fd.append("company_logo", logoFile);
    return fd;
  };

  const submit = async () => {
    setError("");
    setFieldErrors({});

    // Mirrors the backend Store/UpdateJobPostingRequest rules.
    if (!form.company_name.trim()) {
      setFieldErrors({ company_name: ["Company name is required."] });
      return;
    }
    if (form.company_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.company_email)) {
      setFieldErrors({ company_email: ["Enter a valid email address."] });
      return;
    }
    if (!form.job_position.trim()) {
      setFieldErrors({ job_position: ["Job position is required."] });
      return;
    }
    if (!form.location.trim()) {
      setFieldErrors({ location: ["Job location is required."] });
      return;
    }
    if (descriptionIsEmpty) {
      setFieldErrors({ description: ["Job description is required."] });
      return;
    }
    // Application link is optional, but alumni need at least one way to apply.
    if (!form.application_link.trim() && !form.company_email.trim()) {
      setFieldErrors({
        application_link: [
          "Provide an application link, or a company email so alumni can apply by email.",
        ],
        company_email: [
          "A company email is required when no application link is provided.",
        ],
      });
      setError("Please correct the highlighted fields.");
      return;
    }
    if (form.application_link.trim()) {
      try {
        new URL(normalizeLink(form.application_link));
      } catch {
        setFieldErrors({ application_link: ["The application link must be a valid URL."] });
        return;
      }
    }
    if (form.application_deadline && form.application_deadline < todayLocal()) {
      setFieldErrors({
        application_deadline: ["The application deadline must be today or later."],
      });
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await adminApi.updateJobPosting(id, buildPayload());
      } else {
        await adminApi.createJobPosting(buildPayload());
      }
      toast.success(isEdit ? "Job posting updated." : "Job posting created.");
      navigate("/admin/jobs");
    } catch (err) {
      if (err.response?.status === 422 && err.response.data?.errors) {
        setFieldErrors(err.response.data.errors);
        setError("Please correct the highlighted fields.");
      } else {
        setError(err.response?.data?.message || "Failed to save job posting.");
      }
    } finally {
      setSaving(false);
    }
  };

  const errFor = (n) =>
    fieldErrors[n] && (
      <p className="mt-1 text-[0.72rem] text-red-400">{fieldErrors[n][0]}</p>
    );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 dark:border-gold-500 mb-3" />
        <p className="text-sm text-slate-500">Loading job posting...</p>
      </div>
    );
  }

  const previewSrc =
    logoPreview || (existingLogo ? storageUrl(existingLogo) : null);

  return (
    <>
      <div className="max-w-[900px] mx-auto">
        <button
          onClick={() => navigate("/admin/jobs")}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 dark:hover:text-gold-500 mb-5 transition-colors"
        >
          <HiOutlineArrowLeft className="w-4 h-4" /> Back to Job Postings
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            {isEdit ? "Edit Job Posting" : "New Job Posting"}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isEdit
              ? "Update the job posting details."
              : "Post a job opportunity on behalf of a partner company."}
          </p>
        </div>

        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

        <div className="space-y-6">
          {/* ── Company ── */}
          <div>
            <SectionLabel icon={HiOutlineBuildingOffice2}>Company</SectionLabel>
            <Card className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>
                    Company Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={form.company_name}
                    onChange={set("company_name")}
                    placeholder="e.g. Acme Software Inc."
                    className={inputCls}
                  />
                  {errFor("company_name")}
                </div>
                <div>
                  <label className={labelCls}>Company Email</label>
                  <input
                    type="email"
                    value={form.company_email}
                    onChange={set("company_email")}
                    placeholder="e.g. hr@acme.com"
                    className={inputCls}
                  />
                  <p className="mt-1.5 text-[0.72rem] text-slate-500">
                    Required if no Application Link is provided — alumni apply
                    by emailing this address instead.
                  </p>
                  {errFor("company_email")}
                </div>
              </div>

              {/* Company logo */}
              <div>
                <label className={labelCls}>Company Logo (optional)</label>
                {previewSrc ? (
                  <div className="relative inline-block">
                    <img
                      src={previewSrc}
                      alt="Logo preview"
                      className="h-24 w-24 rounded-xl border border-slate-200 dark:border-white/[0.08] object-cover"
                    />
                    {logoPreview && (
                      <button
                        type="button"
                        onClick={clearLogo}
                        className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600"
                        title="Remove selected logo"
                      >
                        <HiOutlineXMark className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-slate-300 dark:border-white/[0.12] rounded-xl cursor-pointer hover:border-blue-500/40 dark:hover:border-gold-500/40 transition-colors">
                    <HiOutlinePhoto className="w-8 h-8 text-slate-500" />
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Click to upload (JPG, PNG, WEBP — max 4MB)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                  </label>
                )}
                {previewSrc && (
                  <label className="inline-block mt-2 text-xs font-semibold text-blue-600 cursor-pointer hover:text-blue-400 dark:text-gold-500 dark:hover:text-gold-300">
                    Change logo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                  </label>
                )}
                {errFor("company_logo")}
              </div>
            </Card>
          </div>

          {/* ── Position ── */}
          <div>
            <SectionLabel icon={HiOutlineBriefcase}>Position</SectionLabel>
            <Card className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>
                    Job Position <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={form.job_position}
                    onChange={set("job_position")}
                    placeholder="e.g. Junior Web Developer"
                    className={inputCls}
                  />
                  {errFor("job_position")}
                </div>
                <div>
                  <label className={labelCls}>
                    Location <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={form.location}
                    onChange={set("location")}
                    placeholder="e.g. Zamboanga City / Hybrid"
                    className={inputCls}
                  />
                  {errFor("location")}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>
                    Employment Type <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={form.employment_type}
                    onChange={set("employment_type")}
                    className={inputCls}
                  >
                    {EMPLOYMENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value} className="bg-white text-slate-800 dark:bg-navy-800 dark:text-slate-300">
                        {t.label}
                      </option>
                    ))}
                  </select>
                  {errFor("employment_type")}
                </div>
                <div>
                  <label className={labelCls}>Salary (optional)</label>
                  <input
                    value={form.salary}
                    onChange={set("salary")}
                    placeholder="e.g. ₱35,000–45,000"
                    className={inputCls}
                  />
                  {errFor("salary")}
                </div>
                <div>
                  <label className={labelCls}>Application Deadline</label>
                  <input
                    type="date"
                    value={form.application_deadline}
                    min={todayLocal()}
                    onChange={set("application_deadline")}
                    className={inputCls}
                  />
                  {errFor("application_deadline")}
                </div>
              </div>
            </Card>
          </div>

          {/* ── Details ── */}
          <div>
            <SectionLabel icon={HiOutlineDocumentText}>Details</SectionLabel>
            <Card className="space-y-6">
              <div>
                <label className={labelCls}>
                  Description <span className="text-red-400">*</span>
                </label>
                <div className="job-editor rounded-xl overflow-hidden bg-white">
                  <ReactQuill
                    theme="snow"
                    value={form.description}
                    onChange={(html) =>
                      setForm((f) => ({ ...f, description: html }))
                    }
                    modules={QUILL_MODULES}
                    formats={QUILL_FORMATS}
                    placeholder="Describe the role, responsibilities, and team..."
                  />
                </div>
                {errFor("description")}
              </div>

              <div>
                <label className={labelCls}>Requirements (optional)</label>
                <textarea
                  value={form.requirements}
                  onChange={set("requirements")}
                  rows={4}
                  placeholder={"e.g. Bachelor's degree in IT or related field\n2+ years experience with JavaScript"}
                  className={inputCls}
                />
                {errFor("requirements")}
              </div>

              <div>
                <label className={labelCls}>Benefits (optional)</label>
                <textarea
                  value={form.benefits}
                  onChange={set("benefits")}
                  rows={3}
                  placeholder={"e.g. HMO coverage, 13th month pay, flexible hours"}
                  className={inputCls}
                />
                {errFor("benefits")}
              </div>
            </Card>
          </div>

          {/* ── Application ── */}
          <div>
            <SectionLabel icon={HiOutlineLink}>Application</SectionLabel>
            <Card>
              <div>
                <label className={labelCls}>Application Link (optional)</label>
                <input
                  type="url"
                  value={form.application_link}
                  onChange={set("application_link")}
                  placeholder="e.g. https://company.com/careers/apply"
                  className={inputCls}
                />
                <p className="mt-1.5 text-[0.72rem] text-slate-500">
                  Where alumni are sent when they click Apply. If left empty,
                  alumni will be directed to email the company instead — make
                  sure Company Email is filled in.
                </p>
                {errFor("application_link")}
              </div>
            </Card>
          </div>

          {/* ── Status ── */}
          <div>
            <SectionLabel icon={HiOutlineFlag}>Status</SectionLabel>
            <Card className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>
                    Status <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={form.status}
                    onChange={set("status")}
                    className={inputCls}
                  >
                    {JOB_STATUSES.map((s) => (
                      <option key={s.value} value={s.value} className="bg-white text-slate-800 dark:bg-navy-800 dark:text-slate-300">
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-[0.72rem] text-slate-500">
                    Active postings are visible to alumni; publishing notifies
                    every alumni account.
                  </p>
                  {errFor("status")}
                </div>
              </div>

              {/* Pin toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_pinned}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, is_pinned: e.target.checked }))
                  }
                  className="w-4 h-4 rounded accent-gold-500"
                />
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  Pin this posting (shows at the top of the alumni career center)
                </span>
              </label>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => navigate("/admin/jobs")}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={submit} loading={saving} className="px-5">
              {saving
                ? "Saving..."
                : isEdit
                  ? "Save Changes"
                  : "Create Job Posting"}
            </Button>
          </div>
        </div>
      </div>

      {/* Make the Quill editor area comfortably tall. */}
      <style>{`.job-editor .ql-container { min-height: 220px; font-size: 14px; }
        .job-editor .ql-editor { min-height: 220px; }`}</style>
    </>
  );
}
