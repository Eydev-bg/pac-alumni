// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: frontend/src/pages/admin/courses/CoursesListPage.jsx
//  Course CRUD — courses belong to departments
// ═══════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import adminApi from "../../../api/adminApi";
import Pagination from "../../../components/common/Pagination";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import {
  LoadingSpinner,
  EmptyState,
} from "../../../components/common/LoadingSpinner";
import { useDebounce } from "../../../hooks/useDebounce";
import {
  HiOutlineMagnifyingGlass,
  HiOutlineAcademicCap,
  HiOutlinePlus,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineXMark,
} from "react-icons/hi2";

export default function CoursesListPage() {
  const [courses, setCourses] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);

  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 400);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [form, setForm] = useState({
    name: "",
    code: "",
    department_id: "",
    is_board_program: false,
    board_exam_name: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({
    open: false,
    id: null,
    name: "",
  });
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getCourses({
        page,
        per_page: 20,
        search: debouncedSearch || undefined,
        department_id: deptFilter || undefined,
      });
      setCourses(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, deptFilter]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, deptFilter]);

  const openCreate = () => {
    setEditingCourse(null);
    setForm({
      name: "",
      code: "",
      department_id: "",
      is_board_program: false,
      board_exam_name: "",
    });
    setFormErrors({});
    setShowModal(true);
  };

  const openEdit = (course) => {
    setEditingCourse(course);
    setForm({
      name: course.name,
      code: course.code,
      department_id: course.department?.id || "",
      is_board_program: course.is_board_program,
      board_exam_name: course.board_exam_name || "",
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setFormLoading(true);
    try {
      if (editingCourse) {
        await adminApi.updateCourse(editingCourse.id, form);
      } else {
        await adminApi.createCourse(form);
      }
      setShowModal(false);
      fetchCourses();
    } catch (err) {
      if (err.response?.status === 422)
        setFormErrors(err.response.data.errors || {});
      else alert(err.response?.data?.message || "Failed.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await adminApi.deleteCourse(confirmDelete.id);
      setConfirmDelete({ open: false, id: null, name: "" });
      fetchCourses();
    } catch (err) {
      alert(err.response?.data?.message || "Cannot delete.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="bg-[#0c1525] -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 min-h-screen">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Courses</h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage academic programs under each department
            </p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#c8a84e] to-[#a88a3a] text-white text-sm font-semibold rounded-xl hover:from-[#d4b85e] hover:to-[#b89848] transition-all shadow-lg shadow-[#c8a84e]/20"
          >
            <HiOutlinePlus className="w-4 h-4" /> Add Course
          </button>
        </div>

        {/* Filters */}
        <div className="bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] p-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or code..."
                className="w-full pl-10 pr-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-xl text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#c8a84e]/40 focus:border-[#c8a84e]/30 transition-colors"
              />
            </div>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3 py-2 bg-white/[0.06] border border-white/[0.08] rounded-xl text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#c8a84e]/40 appearance-none cursor-pointer"
              style={{ colorScheme: "dark" }}
            >
              <option value="" className="bg-[#1a2e5a] text-slate-300">
                All Departments
              </option>
              {departments.map((d) => (
                <option
                  key={d.id}
                  value={d.id}
                  className="bg-[#1a2e5a] text-slate-300"
                >
               {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c8a84e] mb-3" />
              <p className="text-sm text-slate-500">Loading courses...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <HiOutlineAcademicCap className="w-12 h-12 text-slate-600 mb-4" />
              <h3 className="text-sm font-semibold text-slate-300 mb-1">
                No courses
              </h3>
              <p className="text-sm text-slate-500 max-w-sm">
                Add courses under departments.
              </p>
              <button
                onClick={openCreate}
                className="mt-3 text-sm text-[#c8a84e] hover:text-[#e0c76a] font-medium transition-colors"
              >
                Add Course
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left py-3.5 px-4 font-semibold text-[#c8a84e] text-[11px] uppercase tracking-wider">
                      Code
                    </th>
                    <th className="text-left py-3.5 px-4 font-semibold text-[#c8a84e] text-[11px] uppercase tracking-wider">
                      Course Name
                    </th>
                    <th className="text-left py-3.5 px-4 font-semibold text-[#c8a84e] text-[11px] uppercase tracking-wider">
                      Department
                    </th>
                    <th className="text-center py-3.5 px-4 font-semibold text-[#c8a84e] text-[11px] uppercase tracking-wider">
                      Board?
                    </th>
                    <th className="text-left py-3.5 px-4 font-semibold text-[#c8a84e] text-[11px] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-right py-3.5 px-4 font-semibold text-[#c8a84e] text-[11px] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {courses.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[11px] bg-[#c8a84e]/10 text-[#c8a84e] px-2 py-1 rounded-lg border border-[#c8a84e]/15 font-semibold">
                          {c.code}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-200">
                        {c.name}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400">
                        {c.department?.name}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {c.is_board_program ? (
                          <span className="text-[11px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-lg font-medium">
                            Yes
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-600">No</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${c.status === "active" ? "bg-emerald-500/15 text-emerald-400" : "bg-white/[0.06] text-slate-500"}`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(c)}
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
          )}
          {meta && (
            <div className="px-4 pb-4">
              <Pagination meta={meta} onPageChange={setPage} />
            </div>
          )}
        </div>

        {/* Create/Edit Modal — WHITE background (original style) */}
        {showModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
            />
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-slate-800">
                    {editingCourse ? "Edit Course" : "Add Course"}
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
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
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
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
                    <span className="text-sm text-slate-700">
                      Board Program
                    </span>
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
                      onClick={() => setShowModal(false)}
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
                        : editingCourse
                          ? "Save Changes"
                          : "Create Course"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
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
    </div>
  );
}
