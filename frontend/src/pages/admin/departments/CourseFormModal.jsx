// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: frontend/src/pages/admin/departments/CourseFormModal.jsx
//  Reusable create/edit course modal (WHITE background).
//  Used by DepartmentDetailPage (locked department) and elsewhere.
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import adminApi from "../../../api/adminApi";
import { useToast } from "../../../hooks/useToast";
import Modal from "../../../ui/Modal";
import Button from "../../../ui/Button";
import Input from "../../../ui/Input";
import Select from "../../../ui/Select";
import Alert from "../../../ui/Alert";

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
  const toast = useToast();

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
        toast.success("Course updated successfully.");
      } else {
        await adminApi.createCourse(form);
        toast.success("Course created successfully.");
      }
      onSaved();
      onClose();
    } catch (err) {
      if (err.response?.status === 422) {
        setFormErrors(err.response.data.errors || {});
      } else {
        setFormErrors({
          general: err.response?.data?.message || "Failed to save course.",
        });
      }
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={course ? "Edit Course" : "Add Course"}
      size="md"
    >
      {formErrors.general && (
        <Alert variant="error" className="mb-4">
          {formErrors.general}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {lockedDepartmentId ? (
          <Input
            tone="dark"
            label="Department"
            value={lockedDept?.name || "Current department"}
            disabled
            readOnly
            className="opacity-60 cursor-not-allowed"
          />
        ) : (
          <Select
            tone="dark"
            label="Department"
            required
            value={form.department_id}
            onChange={(e) => setForm({ ...form, department_id: e.target.value })}
            placeholder="Select department..."
            error={formErrors.department_id}
            options={departments.map((d) => ({ value: d.id, label: d.name }))}
          />
        )}

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Input
              tone="dark"
              label="Course Name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Bachelor of Science in Information Technology"
              error={formErrors.name}
            />
          </div>
          <Input
            tone="dark"
            label="Code"
            required
            value={form.code}
            onChange={(e) =>
              setForm({ ...form, code: e.target.value.toUpperCase() })
            }
            placeholder="BSIT"
            className="font-mono"
            error={formErrors.code}
          />
        </div>

        <div className="flex items-center gap-3 p-3 bg-white/[0.04] border border-white/[0.06] rounded-lg">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_board_program}
              onChange={(e) =>
                setForm({ ...form, is_board_program: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-white/[0.15] peer-focus:ring-2 peer-focus:ring-gold-500/40 rounded-full peer peer-checked:bg-gold-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
          </label>
          <span className="text-sm text-slate-300">Board Program</span>
        </div>

        {form.is_board_program && (
          <Input
            tone="dark"
            label="Board Exam Name"
            value={form.board_exam_name}
            onChange={(e) =>
              setForm({ ...form, board_exam_name: e.target.value })
            }
            placeholder="Licensure Examination for Teachers"
            error={formErrors.board_exam_name}
          />
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={formLoading}>
            {formLoading ? "Saving..." : course ? "Save Changes" : "Create Course"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
