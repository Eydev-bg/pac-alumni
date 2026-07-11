import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import adminApi from "../../../api/adminApi";
import { storageUrl } from "../../../utils/formatters";
import { useToast } from "../../../hooks/useToast";
import { TARGET_TYPES } from "../../../config/announcementOptions";
import Card from "../../../ui/Card";
import Button from "../../../ui/Button";
import Alert from "../../../ui/Alert";
import { HiOutlineArrowLeft, HiOutlinePhoto, HiOutlineXMark } from "react-icons/hi2";

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
  is_pinned: false,
};

const labelCls =
  "block text-[0.72rem] font-semibold text-slate-300 mb-1.5 uppercase tracking-wider";
const inputCls =
  "w-full px-3 py-2.5 bg-white/[0.06] border border-white/[0.08] rounded-xl text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-500/30 transition-colors";

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
        <option value="" className="bg-navy-800">
          Select department…
        </option>
        {departments.map((d) => (
          <option key={d.id} value={String(d.id)} className="bg-navy-800">
            {d.name}
          </option>
        ))}
      </select>
    );
  }

  if (type === "course") {
    return (
      <select value={value} onChange={onChange} className={className}>
        <option value="" className="bg-navy-800">
          Select course…
        </option>
        {courses.map((c) => (
          <option key={c.id} value={String(c.id)} className="bg-navy-800">
            {c.name}
          </option>
        ))}
      </select>
    );
  }

  if (type === "batch") {
    return (
      <select value={value} onChange={onChange} className={className}>
        <option value="" className="bg-navy-800">
          Select graduation year…
        </option>
        {years.map((y) => (
          <option key={y} value={String(y)} className="bg-navy-800">
            {y}
          </option>
        ))}
      </select>
    );
  }

  return null;
}

export default function AnnouncementFormPage() {
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
      .getAllDepartments()
      .then((res) => setDepartments(res.data.data))
      .catch(() => {});
    adminApi
      .getAllCourses()
      .then((res) => setCourses(res.data.data))
      .catch(() => {});
    adminApi
      .getGraduationYears()
      .then((res) => setYears(res.data.data))
      .catch(() => {});
  }, []);

  // ── Load existing announcement when editing ──
  useEffect(() => {
    if (!isEdit) return;
    adminApi
      .getAnnouncement(id)
      .then((res) => {
        const d = res.data.data;
        setForm({
          title: d.title || "",
          content: d.content || "",
          target_type: d.target_type || "all",
          target_value: d.target_value || "",
          is_pinned: !!d.is_pinned,
        });
        setExistingImage(d.image || null);
      })
      .catch(() => setError("Failed to load announcement."))
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
      setFieldErrors({ title: ["Announcement title is required."] });
      return;
    }
    if (contentIsEmpty) {
      setFieldErrors({ content: ["Announcement content is required."] });
      return;
    }
    if (form.target_type !== "all" && !form.target_value) {
      setFieldErrors({ target_value: ["Please select a target audience."] });
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await adminApi.updateAnnouncement(id, buildPayload(publish));
      } else {
        await adminApi.createAnnouncement(buildPayload(publish));
      }
      toast.success(isEdit ? "Announcement updated." : "Announcement created.");
      navigate("/admin/announcements");
    } catch (err) {
      if (err.response?.status === 422 && err.response.data?.errors) {
        setFieldErrors(err.response.data.errors);
        setError("Please correct the highlighted fields.");
      } else {
        setError(err.response?.data?.message || "Failed to save announcement.");
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500 mb-3" />
        <p className="text-sm text-slate-500">Loading announcement...</p>
      </div>
    );
  }

  const previewSrc =
    imagePreview || (existingImage ? storageUrl(existingImage) : null);

  return (
    <>
      <div className="max-w-[900px] mx-auto">
        <button
          onClick={() => navigate("/admin/announcements")}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-gold-500 mb-5 transition-colors"
        >
          <HiOutlineArrowLeft className="w-4 h-4" /> Back to Announcements
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">
            {isEdit ? "Edit Announcement" : "New Announcement"}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {isEdit
              ? "Update the announcement details and audience."
              : "Compose an announcement and choose who should see it."}
          </p>
        </div>

        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

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

          {/* Target selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Audience</label>
              <select
                value={form.target_type}
                onChange={handleTargetTypeChange}
                className={inputCls}
              >
                {TARGET_TYPES.map((t) => (
                  <option key={t.value} value={t.value} className="bg-navy-800">
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

          {/* Banner image */}
          <div>
            <label className={labelCls}>Banner Image (optional)</label>
            {previewSrc ? (
              <div className="relative inline-block">
                <img
                  src={previewSrc}
                  alt="Banner preview"
                  className="max-h-44 rounded-xl border border-white/[0.08] object-cover"
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
              <label className="flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-white/[0.12] rounded-xl cursor-pointer hover:border-gold-500/40 transition-colors">
                <HiOutlinePhoto className="w-8 h-8 text-slate-500" />
                <span className="text-xs text-slate-400">
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
              <label className="inline-block mt-2 text-xs font-semibold text-gold-500 cursor-pointer hover:text-gold-300">
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

          {/* Rich text content */}
          <div>
            <label className={labelCls}>
              Content <span className="text-red-400">*</span>
            </label>
            <div className="announcement-editor rounded-xl overflow-hidden bg-white">
              <ReactQuill
                theme="snow"
                value={form.content}
                onChange={(html) => setForm((f) => ({ ...f, content: html }))}
                modules={QUILL_MODULES}
                formats={QUILL_FORMATS}
                placeholder="Write the announcement details here..."
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
            <span className="text-sm text-slate-300">
              Pin this announcement (shows at the top of the alumni feed)
            </span>
          </label>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-2 border-t border-white/[0.06]">
            <Button
              variant="secondary"
              onClick={() => navigate("/admin/announcements")}
              disabled={saving}
            >
              Cancel
            </Button>
            <button
              type="button"
              onClick={() => submit(false)}
              disabled={saving}
              className="px-5 py-2.5 text-sm font-semibold text-slate-200 bg-white/[0.08] border border-white/[0.1] rounded-xl hover:bg-white/[0.14] transition-colors disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save as Draft"}
            </button>
            <Button onClick={() => submit(true)} loading={saving} className="px-5">
              {saving ? "Saving..." : "Save & Publish"}
            </Button>
          </div>
        </Card>
      </div>

      {/* Make the Quill editor area comfortably tall. */}
      <style>{`.announcement-editor .ql-container { min-height: 220px; font-size: 14px; }
        .announcement-editor .ql-editor { min-height: 220px; }`}</style>
    </>
  );
}
