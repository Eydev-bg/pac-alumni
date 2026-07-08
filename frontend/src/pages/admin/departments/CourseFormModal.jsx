// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: frontend/src/pages/admin/departments/CourseFormModal.jsx
//  Reusable create/edit course modal (WHITE background).
//  Used by DepartmentDetailPage (locked department) and elsewhere.
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import adminApi from "../../../api/adminApi";
import { HiOutlineXMark } from "react-icons/hi2";

/**
 * CourseFormModal
 *
 * Props:
 *   course              — null → create mode; object → edit mode
 *   lockedDepartmentId  — optional; when provided the Department select is
 *                         pre-filled with this id and rendered disabled
 *                         (the normal dropdown is hidden)
 *   onClose             — close the modal
 *   onSaved             — called after a successful create/update
 */
export default function CourseFormModal({
  course,
  lockedDepartmentId,
  onClose,
  onSaved,
}) {
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({
    name: course?.name || "",
    code: course?.code || "",
    department_id: lockedDepartmentId || course?.department?.id || "",
    is_board_program: course?.is_board_program || false,
    board_exam_name: course?.board_exam_name || "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    adminApi
      .getAllDepartments()
      .then((res) => {
        const collegeDepts = (res.data.data || []).filter(
          (d) => !d.education_level || d.education_level === "college",
        );
        setDepartments(collegeDepts);
      })
      .catch(() => {});
  }, []);

  const lockedDept = lockedDepartmentId
    ? departments.find((d) => String(d.id) === String(lockedDepartmentId))
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setFormLoading(true);
    try {
      if (course) {
        await adminApi.updateCourse(course.id, form);
      } else {
        await adminApi.createCourse(form);
      }
      onSaved();
      onClose();
    } catch (err) {
      if (err.response?.status === 422)
        setFormErrors(err.response.data.errors || {});
      else alert(err.response?.data?.message || "Failed.");
    } finally {
      setFormLoading(false);
    }
  };

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
              {course ? "Edit Course" : "Add Course"}
            </h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
            >
              <HiOutlineXMark className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Department *
              </label>
              {lockedDepartmentId ? (
                <input
                  type="text"
                  value={lockedDept?.name || "Current department"}
                  disabled
                  readOnly
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-100 text-slate-500 cursor-not-allowed"
                />
              ) : (
                <select
                  value={form.department_id}
                  onChange={(e) =>
                    setForm({ ...form, department_id: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select department...</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              )}
              {formErrors.department_id && (
                <p className="text-xs text-red-500 mt-1">
                  {formErrors.department_id[0]}
                </p>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Course Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="Bachelor of Science in Information Technology"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Code *
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  required
                  placeholder="BSIT"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {formErrors.code && (
                  <p className="text-xs text-red-500 mt-1">
                    {formErrors.code[0]}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_board_program}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      is_board_program: e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
              </label>
              <span className="text-sm text-slate-700">Board Program</span>
            </div>
            {form.is_board_program && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Board Exam Name *
                </label>
                <input
                  type="text"
                  value={form.board_exam_name}
                  onChange={(e) =>
                    setForm({ ...form, board_exam_name: e.target.value })
                  }
                  placeholder="Licensure Examination for Teachers"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
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
                disabled={formLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {formLoading
                  ? "Saving..."
                  : course
                    ? "Save Changes"
                    : "Create Course"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
