// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: frontend/src/pages/admin/departments/DepartmentDetailPage.jsx
//  Shows department details and its courses.
//  COURSE actions (add/edit/delete) live here, scoped to this department.
//  Department-level actions (edit, delete, status) remain in DepartmentsListPage.
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import adminApi from "../../../api/adminApi";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import CourseFormModal from "./CourseFormModal";
import { useToast } from "../../../hooks/useToast";
import { EDUCATION_LEVEL_LABELS } from "../../../config/departmentOptions";
import { formatDateOnly } from "../../../utils/formatters";
import Card from "../../../ui/Card";
import Button from "../../../ui/Button";
import {
  HiOutlineArrowLeft,
  HiOutlineAcademicCap,
  HiOutlinePlus,
  HiOutlinePencilSquare,
  HiOutlineTrash,
} from "react-icons/hi2";

export default function DepartmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [dept, setDept] = useState(null);
  const [loading, setLoading] = useState(true);

  // Course modal (null = closed; { course } where course is null → create)
  const [courseModal, setCourseModal] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({
    open: false,
    id: null,
    name: "",
  });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchDept = async () => {
    try {
      const deptRes = await adminApi.getDepartment(id);
      setDept(deptRes.data.data);
    } catch {
      toast.error("Department not found.");
      navigate("/admin/departments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDept();
  }, [id]);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await adminApi.deleteCourse(confirmDelete.id);
      setConfirmDelete({ open: false, id: null, name: "" });
      toast.success("Course deleted.");
      fetchDept();
    } catch (err) {
      toast.error(err.response?.data?.message || "Cannot delete course.");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500 mb-3" />
        <p className="text-sm text-slate-500">Loading department...</p>
      </div>
    );

  if (!dept) return null;

  const isCollege = dept.education_level === "college";
  const hasCourses = isCollege && dept.courses && dept.courses.length > 0;
  const thClass =
    "text-left py-3 px-4 font-semibold text-gold-500 text-[11px] uppercase tracking-wider";

  return (
    <>
      <div className="max-w-[1100px] mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate("/admin/departments")}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-gold-500 mb-5 transition-colors"
        >
          <HiOutlineArrowLeft className="w-4 h-4" /> Back to Departments
        </button>

        {/* Page title */}
        <h1 className="text-xl font-bold text-white mb-6">{dept.name}</h1>

        {/* Courses Under This Department — ONLY for College */}
        {isCollege && (
          <Card className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[11px] font-semibold text-gold-500 uppercase tracking-wider">
                Courses Under This Department
              </h2>
              <Button
                size="sm"
                icon={HiOutlinePlus}
                onClick={() => setCourseModal({ course: null })}
              >
                Add Course
              </Button>
            </div>
            {hasCourses ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className={thClass}>Code</th>
                      <th className={thClass}>Course Name</th>
                      <th className={`${thClass} text-center`}>Board?</th>
                      <th className={thClass}>Board Exam</th>
                      <th className={thClass}>Status</th>
                      <th className={`${thClass} text-right`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {dept.courses.map((c) => (
                      <tr
                        key={c.id}
                        className="hover:bg-white/[0.03] transition-colors"
                      >
                        <td className="py-3 px-4">
                          <span className="font-mono text-[11px] bg-gold-500/10 text-gold-500 px-2 py-0.5 rounded-lg border border-gold-500/15 font-semibold">
                            {c.code}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-200">
                          {c.name}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {c.is_board_program ? (
                            <span className="text-[11px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-lg font-medium">
                              Yes
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-600">
                              No
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-400">
                          {c.board_exam_name || (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                              c.status === "active"
                                ? "bg-emerald-500/15 text-emerald-400"
                                : "bg-white/[0.06] text-slate-500"
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setCourseModal({ course: c })}
                              className="p-1.5 text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                            >
                              <HiOutlinePencilSquare className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                setConfirmDelete({
                                  open: true,
                                  id: c.id,
                                  name: c.code,
                                })
                              }
                              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              <HiOutlineTrash className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <HiOutlineAcademicCap className="w-10 h-10 text-slate-600 mb-3" />
                <h3 className="text-sm font-semibold text-slate-300 mb-1">
                  No courses yet
                </h3>
                <p className="text-sm text-slate-500 max-w-sm mb-3">
                  This department has no courses. Add the first one to get
                  started.
                </p>
                <button
                  onClick={() => setCourseModal({ course: null })}
                  className="text-sm text-gold-500 hover:text-gold-300 font-medium transition-colors"
                >
                  Add Course
                </button>
              </div>
            )}
          </Card>
        )}

        {/* Non-college info box */}
        {!isCollege && (
          <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-6 mb-6">
            <p className="text-sm text-slate-400">
              {dept.education_level === "elementary"
                ? "This department supports Graduate List and Graduation Trend tracking only."
                : "This department supports Graduate List and Graduation Trend tracking only."}
            </p>
          </div>
        )}

        {/* Department Details */}
        <Card>
          <h2 className="text-[11px] font-semibold text-gold-500 mb-5 uppercase tracking-wider">
            Department Details
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
            {[
              ["Full Name", dept.name],
              ["Code", dept.code],
              [
                "Education Level",
                EDUCATION_LEVEL_LABELS[dept.education_level] ||
                  dept.education_level,
              ],
              ["Status", dept.status_label],
              ["Created", formatDateOnly(dept.created_at)],
            ].map(([label, value]) => (
              <div
                key={label}
                className="py-2 border-b border-white/[0.04] last:border-0"
              >
                <dt className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  {label}
                </dt>
                <dd className="mt-1 text-sm text-slate-200 font-medium">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>

      {courseModal && (
        <CourseFormModal
          course={courseModal.course}
          lockedDepartmentId={dept.id}
          onClose={() => setCourseModal(null)}
          onSaved={fetchDept}
        />
      )}

      <ConfirmDialog
        open={confirmDelete.open}
        title="Delete Course"
        message={`Delete "${confirmDelete.name}"? Only possible if no graduates are linked.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete({ open: false, id: null, name: "" })}
      />
    </>
  );
}
