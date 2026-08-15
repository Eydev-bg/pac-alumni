import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import adminApi from "../../../api/adminApi";
import { storageUrl } from "../../../utils/formatters";
import { useToast } from "../../../hooks/useToast";
import { TARGET_TYPES } from "../../../config/eventOptions";
import Card from "../../../ui/Card";
import Button from "../../../ui/Button";
import Alert from "../../../ui/Alert";
import {
  HiOutlineArrowLeft,
  HiOutlinePhoto,
  HiOutlineXMark,
  HiOutlineCalendarDays,
  HiOutlineDocumentText,
  HiOutlineUsers,
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
  title: "",
  content: "",
  target_type: "all",
  target_value: "",
  start_datetime: "",
  end_datetime: "",
  location: "",
  is_pinned: false,
};

const labelCls =
  "block text-[0.72rem] font-semibold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider";
const inputCls =
  "w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/30 transition-colors dark:bg-white/[0.06] dark:border-white/[0.08] dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:ring-gold-500/40 dark:focus:border-gold-500/30";

// Convert a backend ISO datetime to the 'YYYY-MM-DDTHH:mm' local value that a
// <input type="datetime-local"> expects (adjusts UTC → local wall-clock time).
function isoToLocalInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d - tzOffset).toISOString().slice(0, 16);
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

function TargetValueSelect({
  type,
  value,
  onChange,
  className,
  departments,
  courses,
  years,
}) {
  if (type === "department") {
    return (
      <select value={value} onChange={onChange} className={className}>
        <option value="" className="bg-white text-slate-800 dark:bg-navy-800 dark:text-slate-300">
          Select department…
        </option>
        {departments.map((d) => (
          <option key={d.id} value={String(d.id)} className="bg-white text-slate-800 dark:bg-navy-800 dark:text-slate-300">
            {d.name}
          </option>
        ))}
      </select>
    );
  }

  if (type === "course") {
    return (
      <select value={value} onChange={onChange} className={className}>
        <option value="" className="bg-white text-slate-800 dark:bg-navy-800 dark:text-slate-300">
          Select course…
        </option>
        {courses.map((c) => (
          <option key={c.id} value={String(c.id)} className="bg-white text-slate-800 dark:bg-navy-800 dark:text-slate-300">
            {c.name}
          </option>
        ))}
      </select>
    );
  }

  if (type === "batch") {
    return (
      <select value={value} onChange={onChange} className={className}>
        <option value="" className="bg-white text-slate-800 dark:bg-navy-800 dark:text-slate-300">
          Select graduation year…
        </option>
        {years.map((y) => (
          <option key={y} value={String(y)} className="bg-white text-slate-800 dark:bg-navy-800 dark:text-slate-300">
            {y}
          </option>
        ))}
      </select>
    );
  }

  return null;
}

export default function EventFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImage, setExistingImage] = useState(null);

  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [years, setYears] = useState([]);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // ── Load reference data for the target selector ──
  useEffect(() => {
    adminApi
      .getAllDepartments({ education_level: "college" })
      .then((res) => setDepartments(res.data.data))
      .catch((err) => { if (import.meta.env.DEV) console.error("Failed to load departments selector:", err); });
    adminApi
      .getAllCourses()
      .then((res) => setCourses(res.data.data))
      .catch((err) => { if (import.meta.env.DEV) console.error("Failed to load courses selector:", err); });
    adminApi
      .getGraduationYears()
      .then((res) => setYears(res.data.data))
      .catch((err) => { if (import.meta.env.DEV) console.error("Failed to load graduation years selector:", err); });
  }, []);

  // ── Load existing event when editing ──
  useEffect(() => {
    if (!isEdit) return;
    adminApi
      .getEvent(id)
      .then((res) => {
        const d = res.data.data;
        setForm({
          title: d.title || "",
          content: d.content || "",
          target_type: d.target_type || "all",
          target_value: d.target_value || "",
          start_datetime: isoToLocalInput(d.start_datetime),
          end_datetime: isoToLocalInput(d.end_datetime),
          location: d.location || "",
          is_pinned: !!d.is_pinned,
        });
        setExistingImage(d.image || null);
      })
      .catch(() => setError("Failed to load event."))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleTargetTypeChange = (e) => {
    // Reset target_value whenever the audience type changes.
    setForm((f) => ({ ...f, target_type: e.target.value, target_value: "" }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  // Strip HTML to check whether the editor actually has content.
  const contentIsEmpty = useMemo(() => {
    const text = form.content
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();
    return text.length === 0;
  }, [form.content]);

  const buildPayload = (publish) => {
    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("content", form.content);
    fd.append("target_type", form.target_type);
    if (form.target_type !== "all") {
      fd.append("target_value", form.target_value);
    }
    fd.append("start_datetime", form.start_datetime);
    fd.append("end_datetime", form.end_datetime);
    fd.append("location", form.location);
    fd.append("is_pinned", form.is_pinned ? "1" : "0");
    // Only stamp is_published when the admin chooses to publish from here.
    // On edit, leaving it out preserves the existing published state.
    if (publish) fd.append("is_published", "1");
    if (imageFile) fd.append("image", imageFile);
    return fd;
  };

  const submit = async (publish) => {
    setError("");
    setFieldErrors({});

    if (!form.title.trim()) {
      setFieldErrors({ title: ["Event title is required."] });
      return;
    }
    if (contentIsEmpty) {
      setFieldErrors({ content: ["Event content is required."] });
      return;
    }
    if (form.target_type !== "all" && !form.target_value) {
      setFieldErrors({ target_value: ["Please select a target audience."] });
      return;
    }
    if (!form.start_datetime) {
      setFieldErrors({ start_datetime: ["Event start date and time is required."] });
      return;
    }
    if (!form.end_datetime) {
      setFieldErrors({ end_datetime: ["Event end date and time is required."] });
      return;
    }
    if (form.end_datetime < form.start_datetime) {
      setFieldErrors({ end_datetime: ["The event end must be on or after the start."] });
      return;
    }
    if (!form.location.trim()) {
      setFieldErrors({ location: ["Event location is required."] });
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await adminApi.updateEvent(id, buildPayload(publish));
      } else {
        await adminApi.createEvent(buildPayload(publish));
      }
      toast.success(isEdit ? "Event updated." : "Event created.");
      navigate("/admin/events");
    } catch (err) {
      if (err.response?.status === 422 && err.response.data?.errors) {
        setFieldErrors(err.response.data.errors);
        setError("Please correct the highlighted fields.");
      } else {
        setError(err.response?.data?.message || "Failed to save event.");
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
        <p className="text-sm text-slate-500">Loading event...</p>
      </div>
    );
  }

  const previewSrc =
    imagePreview || (existingImage ? storageUrl(existingImage) : null);

  return (
    <>
      <div className="max-w-[900px] mx-auto">
        <button
          onClick={() => navigate("/admin/events")}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 dark:hover:text-gold-500 mb-5 transition-colors"
        >
          <HiOutlineArrowLeft className="w-4 h-4" /> Back to Events
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            {isEdit ? "Edit Event" : "New Event"}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isEdit
              ? "Update the event details and audience."
              : "Compose an event and choose who should see it."}
          </p>
        </div>

        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

        <div className="space-y-6">
          {/* ── Basics: title + banner ── */}
          <Card className="space-y-6">
            {/* Title */}
            <div>
              <label className={labelCls}>
                Title <span className="text-red-400">*</span>
              </label>
              <input
                value={form.title}
                onChange={set("title")}
                placeholder="e.g. Alumni Homecoming 2026"
                className={inputCls}
              />
              {errFor("title")}
            </div>

            {/* Banner image */}
            <div>
              <label className={labelCls}>Banner Image (optional)</label>
              {previewSrc ? (
                <div className="relative inline-block">
                  <img
                    src={previewSrc}
                    alt="Banner preview"
                    className="max-h-44 rounded-xl border border-slate-200 dark:border-white/[0.08] object-cover"
                  />
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={clearImage}
                      className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600"
                      title="Remove selected image"
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
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
              {previewSrc && (
                <label className="inline-block mt-2 text-xs font-semibold text-blue-600 cursor-pointer hover:text-blue-400 dark:text-gold-500 dark:hover:text-gold-300">
                  Change image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
              {errFor("image")}
            </div>
          </Card>

          {/* ── Audience ── */}
          <div>
            <SectionLabel icon={HiOutlineUsers}>Audience</SectionLabel>
            <Card>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Audience</label>
                  <select
                    value={form.target_type}
                    onChange={handleTargetTypeChange}
                    className={inputCls}
                  >
                    {TARGET_TYPES.map((t) => (
                      <option key={t.value} value={t.value} className="bg-white text-slate-800 dark:bg-navy-800 dark:text-slate-300">
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                {form.target_type !== "all" && (
                  <div>
                    <label className={labelCls}>
                      Target <span className="text-red-400">*</span>
                    </label>
                    <TargetValueSelect
                      type={form.target_type}
                      value={form.target_value}
                      onChange={set("target_value")}
                      className={inputCls}
                      departments={departments}
                      courses={courses}
                      years={years}
                    />
                    {errFor("target_value")}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* ── Event Details: schedule + location ── */}
          <div>
            <SectionLabel icon={HiOutlineCalendarDays}>Event Details</SectionLabel>
            <Card className="space-y-6">
              {/* Schedule */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>
                    Starts <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={form.start_datetime}
                    onChange={set("start_datetime")}
                    className={inputCls}
                  />
                  {errFor("start_datetime")}
                </div>
                <div>
                  <label className={labelCls}>
                    Ends <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={form.end_datetime}
                    min={form.start_datetime || undefined}
                    onChange={set("end_datetime")}
                    className={inputCls}
                  />
                  {errFor("end_datetime")}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className={labelCls}>
                  Location <span className="text-red-400">*</span>
                </label>
                <input
                  value={form.location}
                  onChange={set("location")}
                  placeholder="e.g. PAC Gymnasium, Main Campus"
                  className={inputCls}
                />
                {errFor("location")}
              </div>
            </Card>
          </div>

          {/* ── Content ── */}
          <div>
            <SectionLabel icon={HiOutlineDocumentText}>Content</SectionLabel>
            <Card className="space-y-6">
              {/* Rich text content */}
              <div>
                <label className={labelCls}>
                  Details <span className="text-red-400">*</span>
                </label>
                <div className="event-editor rounded-xl overflow-hidden bg-white">
                  <ReactQuill
                    theme="snow"
                    value={form.content}
                    onChange={(html) => setForm((f) => ({ ...f, content: html }))}
                    modules={QUILL_MODULES}
                    formats={QUILL_FORMATS}
                    placeholder="Write the event details here..."
                  />
                </div>
                {errFor("content")}
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
                  Pin this event (shows at the top of the alumni feed)
                </span>
              </label>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => navigate("/admin/events")}
              disabled={saving}
            >
              Cancel
            </Button>
            <button
              type="button"
              onClick={() => submit(false)}
              disabled={saving}
              className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 border border-slate-200 rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-60 dark:text-slate-200 dark:bg-white/[0.08] dark:border-white/[0.1] dark:hover:bg-white/[0.14]"
            >
              {saving ? "Saving..." : "Save as Draft"}
            </button>
            <Button onClick={() => submit(true)} loading={saving} className="px-5">
              {saving ? "Saving..." : "Save & Publish"}
            </Button>
          </div>
        </div>
      </div>

      {/* Make the Quill editor area comfortably tall. */}
      <style>{`.event-editor .ql-container { min-height: 220px; font-size: 14px; }
        .event-editor .ql-editor { min-height: 220px; }`}</style>
    </>
  );
}
