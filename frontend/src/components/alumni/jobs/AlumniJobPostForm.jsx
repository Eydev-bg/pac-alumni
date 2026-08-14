// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: frontend/src/components/alumni/jobs/AlumniJobPostForm.jsx
//  Alumni-facing job posting form (light theme). A simplified mirror of the
//  admin JobPostingFormPage: no status dropdown and no pin toggle — the
//  backend forces alumni posts to active/unpinned. Handles create + edit.
// ═══════════════════════════════════════════════════════════

import { useEffect, useState, useMemo } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import alumniApi from "../../../api/alumniApi";
import { storageUrl } from "../../../utils/formatters";
import { useToast } from "../../../hooks/useToast";
import { EMPLOYMENT_TYPES } from "../../../config/jobOptions";
import {
  HiOutlinePhoto,
  HiOutlineXMark,
  HiOutlineBuildingOffice2,
  HiOutlineBriefcase,
  HiOutlineDocumentText,
  HiOutlineLink,
} from "react-icons/hi2";

const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["blockquote", "link"],
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
};

const labelCls =
  "block text-[0.72rem] font-semibold text-slate-600 mb-1.5 uppercase tracking-wider";
const inputCls =
  "w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors";
const helpCls = "mt-1.5 text-[0.72rem] text-slate-500";

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

function SectionCard({ icon: Icon, title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-blue-600" />
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
          {title}
        </h2>
      </div>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

/**
 * Props:
 *   jobId     — numeric id when editing, null/undefined when creating
 *   onSuccess — called after a successful save
 *   onCancel  — called when the user backs out
 */
export default function AlumniJobPostForm({ jobId, onSuccess, onCancel }) {
  const isEdit = Boolean(jobId);
  const toast = useToast();

  const [form, setForm] = useState(emptyForm);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [existingLogo, setExistingLogo] = useState(null);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // ── Load the existing post when editing ──
  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    setLoading(true);
    alumniApi
      .getMyJobPost(jobId)
      .then((res) => {
        if (cancelled) return;
        const d = res.data.data;
        setForm({
          company_name: d.company_name || "",
          company_email: d.company_email || "",
          job_position: d.job_position || "",
          location: d.location || "",
          employment_type: d.employment_type || EMPLOYMENT_TYPES[0].value,
          salary: d.salary || "",
          application_deadline: isoToDateInput(d.application_deadline),
          description: d.description || "",
          requirements: d.requirements || "",
          benefits: d.benefits || "",
          application_link: d.application_link || "",
        });
        setExistingLogo(d.company_logo || null);
      })
      .catch(() => !cancelled && setError("Failed to load your job posting."))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [jobId, isEdit]);

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
    if (logoFile) fd.append("company_logo", logoFile);
    // NOTE: no status / is_pinned — the backend forces active + unpinned.
    return fd;
  };

  const submit = async () => {
    setError("");
    setFieldErrors({});

    // Mirrors the backend AlumniStore/UpdateJobPostingRequest rules.
    if (!form.company_name.trim()) {
      setFieldErrors({ company_name: ["Company name is required."] });
      return;
    }
    if (
      form.company_email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.company_email)
    ) {
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
        setFieldErrors({
          application_link: ["The application link must be a valid URL."],
        });
        return;
      }
    }
    if (form.application_deadline && form.application_deadline < todayLocal()) {
      setFieldErrors({
        application_deadline: [
          "The application deadline must be today or later.",
        ],
      });
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await alumniApi.updateMyJobPost(jobId, buildPayload());
      } else {
        await alumniApi.createMyJobPost(buildPayload());
      }
      toast.success(
        isEdit ? "Job posting updated." : "Job posting published.",
      );
      onSuccess?.();
    } catch (err) {
      if (err.response?.status === 422 && err.response.data?.errors) {
        setFieldErrors(err.response.data.errors);
        setError("Please correct the highlighted fields.");
      } else {
        // Covers the 3-active-posts cap and 403 ownership errors.
        setError(err.response?.data?.message || "Failed to save job posting.");
      }
    } finally {
      setSaving(false);
    }
  };

  const errFor = (n) =>
    fieldErrors[n] && (
      <p className="mt-1 text-[0.72rem] text-red-600">{fieldErrors[n][0]}</p>
    );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3" />
        <p className="text-sm text-slate-500">Loading job posting...</p>
      </div>
    );
  }

  const previewSrc =
    logoPreview || (existingLogo ? storageUrl(existingLogo) : null);

  return (
    <>
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[0.8rem] text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-5">
        {/* ── Company ── */}
        <SectionCard icon={HiOutlineBuildingOffice2} title="Company">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>
                Company Name <span className="text-red-500">*</span>
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
              <p className={helpCls}>
                Required if no Application Link is provided — alumni apply by
                emailing this address instead.
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
                  className="h-24 w-24 rounded-xl border border-slate-200 object-cover"
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
              <label className="flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-blue-400 transition-colors">
                <HiOutlinePhoto className="w-8 h-8 text-slate-400" />
                <span className="text-xs text-slate-500">
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
              <label className="inline-block mt-2 text-xs font-semibold text-blue-600 cursor-pointer hover:text-blue-700">
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
        </SectionCard>

        {/* ── Position ── */}
        <SectionCard icon={HiOutlineBriefcase} title="Position">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>
                Job Position <span className="text-red-500">*</span>
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
                Location <span className="text-red-500">*</span>
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
                Employment Type <span className="text-red-500">*</span>
              </label>
              <select
                value={form.employment_type}
                onChange={set("employment_type")}
                className={inputCls}
              >
                {EMPLOYMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
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
              <p className={helpCls}>
                Leave empty and the post is removed automatically after 60 days.
              </p>
              {errFor("application_deadline")}
            </div>
          </div>
        </SectionCard>

        {/* ── Details ── */}
        <SectionCard icon={HiOutlineDocumentText} title="Details">
          <div>
            <label className={labelCls}>
              Description <span className="text-red-500">*</span>
            </label>
            <div className="job-editor rounded-xl overflow-hidden bg-white border border-slate-200">
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
              placeholder={
                "e.g. Bachelor's degree in IT or related field\n2+ years experience with JavaScript"
              }
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
              placeholder="e.g. HMO coverage, 13th month pay, flexible hours"
              className={inputCls}
            />
            {errFor("benefits")}
          </div>
        </SectionCard>

        {/* ── Application ── */}
        <SectionCard icon={HiOutlineLink} title="Application">
          <div>
            <label className={labelCls}>Application Link (optional)</label>
            <input
              type="url"
              value={form.application_link}
              onChange={set("application_link")}
              placeholder="e.g. https://company.com/careers/apply"
              className={inputCls}
            />
            <p className={helpCls}>
              Where alumni are sent when they click Apply. If left empty, alumni
              will be directed to email the company instead — make sure Company
              Email is filled in.
            </p>
            {errFor("application_link")}
          </div>
        </SectionCard>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving
              ? "Saving..."
              : isEdit
                ? "Save Changes"
                : "Publish Job Posting"}
          </button>
        </div>
      </div>

      {/* Make the Quill editor area comfortably tall. */}
      <style>{`.job-editor .ql-container { min-height: 200px; font-size: 14px; }
        .job-editor .ql-editor { min-height: 200px; }
        .job-editor .ql-toolbar { border: none; border-bottom: 1px solid #e2e8f0; }
        .job-editor .ql-container.ql-snow { border: none; }`}</style>
    </>
  );
}
