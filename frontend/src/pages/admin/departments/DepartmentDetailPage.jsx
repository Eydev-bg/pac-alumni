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
import {
  HiOutlineArrowLeft,
  HiOutlineAcademicCap,
  HiOutlinePlus,
  HiOutlinePencilSquare,
  HiOutlineTrash,
} from "react-icons/hi2";

const levelLabels = {
  college: "College",
  elementary: "Elementary",
  jhs: "Junior High School",
  shs: "Senior High School",
};

export default function DepartmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

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
      fetchDept();
    } catch (err) {
      alert(err.response?.data?.message || "Cannot delete.");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading)
    return (
      <div className="bg-[#0c1525] -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 min-h-screen">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c8a84e] mb-3" />
          <p className="text-sm text-slate-500">Loading department...</p>
        </div>
      </div>
    );

  if (!dept) return null;

  const isCollege = dept.education_level === "college";
  const hasCourses = isCollege && dept.courses && dept.courses.length > 0;

  return (
    <div className="bg-[#0c1525] -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 min-h-screen">
      <div className="max-w-[1100px] mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate("/admin/departments")}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#c8a84e] mb-5 transition-colors"
        >
          <HiOutlineArrowLeft className="w-4 h-4" /> Back to Departments
        </button>

        {/* Page title */}
        <h1 className="text-xl font-bold text-white mb-6">{dept.name}</h1>

        {/* Courses Under This Department — ONLY for College */}
        {isCollege && (
          <div className="bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[11px] font-semibold text-[#c8a84e] uppercase tracking-wider">
                Courses Under This Department
              </h2>
              <button
                onClick={() => setCourseModal({ course: null })}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-[#c8a84e] to-[#a88a3a] text-white text-xs font-semibold rounded-xl hover:from-[#d4b85e] hover:to-[#b89848] transition-all shadow-lg shadow-[#c8a84e]/20"
              >
                <HiOutlinePlus className="w-4 h-4" /> Add Course
              </button>
            </div>
            {hasCourses ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left py-3 px-4 font-semibold text-[#c8a84e] text-[11px] uppercase tracking-wider">
                        Code
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-[#c8a84e] text-[11px] uppercase tracking-wider">
                        Course Name
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-[#c8a84e] text-[11px] uppercase tracking-wider">
                        Board?
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-[#c8a84e] text-[11px] uppercase tracking-wider">
                        Board Exam
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-[#c8a84e] text-[11px] uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-[#c8a84e] text-[11px] uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {dept.courses.map((c) => (
                      <tr
                        key={c.id}
                        className="hover:bg-white/[0.03] transition-colors"
                      >
                        <td className="py-3 px-4">
                          <span className="font-mono text-[11px] bg-[#c8a84e]/10 text-[#c8a84e] px-2 py-0.5 rounded-lg border border-[#c8a84e]/15 font-semibold">
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
                  className="text-sm text-[#c8a84e] hover:text-[#e0c76a] font-medium transition-colors"
                >
                  Add Course
                </button>
              </div>
            )}
          </div>
        )}

        {/* Non-college info box */}
        {!isCollege && (
          <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-6 mb-6">
            <p className="text-sm text-slate-400">
              {dept.education_level === "elementary"
                ? "Elementary departments do not have courses. Graduates are tracked directly under this department."
                : "JHS/SHS departments do not have courses. Graduates are tracked directly under this department."}
            </p>
          </div>
        )}

        {/* Department Details */}
        <div className="bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] p-6">
          <h2 className="text-[11px] font-semibold text-[#c8a84e] mb-5 uppercase tracking-wider">
            Department Details
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
            {[
              ["Full Name", dept.name],
              ["Code", dept.code],
              [
                "Education Level",
                levelLabels[dept.education_level] || dept.education_level,
              ],
              ["Status", dept.status_label],
              [
                "Created",
                new Date(dept.created_at).toLocaleDateString("en-PH", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }),
              ],
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
        </div>
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
    </div>
  );
}
