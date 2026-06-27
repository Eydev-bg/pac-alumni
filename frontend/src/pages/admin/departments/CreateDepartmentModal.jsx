import { useState } from "react";
import adminApi from "../../../api/adminApi";
import { HiOutlineXMark } from "react-icons/hi2";

const EDUCATION_LEVELS = [
  {
    value: "college",
    label: "College",
    description: "Has courses underneath (BSIT, BSCS, etc.)",
  },
  {
    value: "elementary",
    label: "Elementary",
    description: "Standalone department — no courses",
  },
  {
    value: "jhs",
    label: "Junior High School",
    description: "Part of JHS/SHS combined dashboard",
  },
  {
    value: "shs",
    label: "Senior High School",
    description: "Part of JHS/SHS combined dashboard",
  },
];

export default function CreateDepartmentModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: "",
    code: "",
    education_level: "college",
    is_board_program: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const isCollege = form.education_level === "college";

  const handleChange = (field, value) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      // Reset board program if switching away from college
      if (field === "education_level" && value !== "college") {
        updated.is_board_program = false;
      }
      return updated;
    });
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
      await adminApi.createDepartment(form);
      onCreated();
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
      } else {
        setErrors({
          general:
            err.response?.data?.message || "Failed to create department.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedLevel = EDUCATION_LEVELS.find(
    (l) => l.value === form.education_level,
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">
              Create Department
            </h3>
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
            {/* Education Level */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Education Level *
              </label>
              <select
                value={form.education_level}
                onChange={(e) =>
                  handleChange("education_level", e.target.value)
                }
                required
                className={`w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.education_level ? "border-red-300" : "border-slate-300"}`}
              >
                {EDUCATION_LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
              {selectedLevel && (
                <p className="text-xs text-slate-400 mt-1">
                  {selectedLevel.description}
                </p>
              )}
              {errors.education_level && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.education_level[0]}
                </p>
              )}
            </div>

            {/* Department Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Department Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
                placeholder={
                  isCollege
                    ? "e.g., Computer Department"
                    : form.education_level === "elementary"
                      ? "e.g., Elementary Department"
                      : form.education_level === "jhs"
                        ? "e.g., Junior High School Department"
                        : "e.g., Senior High School Department"
                }
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? "border-red-300" : "border-slate-300"}`}
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">{errors.name[0]}</p>
              )}
            </div>

            {/* Department Code */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Department Code *
              </label>
              <input
                type="text"
                value={form.code}
                onChange={(e) =>
                  handleChange("code", e.target.value.toUpperCase())
                }
                required
                placeholder={
                  isCollege
                    ? "e.g., CD"
                    : form.education_level === "elementary"
                      ? "e.g., ELEM"
                      : form.education_level === "jhs"
                        ? "e.g., JHS"
                        : "e.g., SHS"
                }
                maxLength={20}
                className={`w-full px-3 py-2 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.code ? "border-red-300" : "border-slate-300"}`}
              />
              <p className="text-xs text-slate-400 mt-1">
                Letters and numbers only, no spaces
              </p>
              {errors.code && (
                <p className="text-xs text-red-500 mt-1">{errors.code[0]}</p>
              )}
            </div>

            {/* Info box */}
            <div className="bg-slate-50 rounded-lg p-3">
              {isCollege ? (
                <p className="text-xs text-slate-400">
                  Board program settings are managed per Course, not per
                  Department. After creating the department, add courses under
                  it.
                </p>
              ) : (
                <p className="text-xs text-slate-400">
                  {form.education_level === "elementary"
                    ? "Elementary departments do not have courses or board exams. Graduates are tracked directly under this department."
                    : "JHS/SHS departments do not have courses. Graduates are tracked directly under this department."}
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
                {loading ? "Creating..." : "Create Department"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
