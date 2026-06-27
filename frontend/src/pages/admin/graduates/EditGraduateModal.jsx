import { useState, useEffect } from "react";
import adminApi from "../../../api/adminApi";
import { HiOutlineXMark } from "react-icons/hi2";

export default function EditGraduateModal({ graduate, onClose, onUpdated }) {
  const [form, setForm] = useState({
    first_name: graduate.first_name || "",
    middle_name: graduate.middle_name || "",
    last_name: graduate.last_name || "",
    suffix: graduate.suffix || "",
    graduation_year: graduate.graduation_year || "",
    course_id: graduate.course?.id || "",
  });
  const [courses, setCourses] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    adminApi
      .getAllCourses()
      .then((res) => setCourses(res.data.data))
      .catch(() => {});
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const n = { ...prev };
        delete n[field];
        return n;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const payload = { ...form };
      if (!payload.course_id) payload.course_id = null;
      await adminApi.updateGraduate(graduate.id, payload);
      onUpdated();
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
      } else {
        setErrors({
          general: err.response?.data?.message || "Failed to update.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const isCollege = graduate.education_level === "college";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">Edit Graduate</h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
            >
              <HiOutlineXMark className="w-5 h-5" />
            </button>
          </div>

          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  value={form.first_name}
                  onChange={(e) => handleChange("first_name", e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={form.last_name}
                  onChange={(e) => handleChange("last_name", e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Middle Name
                </label>
                <input
                  type="text"
                  value={form.middle_name}
                  onChange={(e) => handleChange("middle_name", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Suffix
                </label>
                <input
                  type="text"
                  value={form.suffix}
                  onChange={(e) => handleChange("suffix", e.target.value)}
                  placeholder="Jr, Sr"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Graduation Year *
              </label>
              <input
                type="number"
                value={form.graduation_year}
                onChange={(e) =>
                  handleChange("graduation_year", e.target.value)
                }
                required
                min="1950"
                max="2099"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {isCollege && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Course
                </label>
                <select
                  value={form.course_id}
                  onChange={(e) => handleChange("course_id", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.name} ({c.department_code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-400">
                <span className="font-medium">Education Level:</span>{" "}
                {graduate.education_level_label} (cannot be changed)
              </p>
              {graduate.alumni_id_number && (
                <p className="text-xs text-slate-400 mt-1">
                  <span className="font-medium">Alumni ID:</span>{" "}
                  {graduate.alumni_id_number} (auto-generated, cannot be
                  changed)
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
