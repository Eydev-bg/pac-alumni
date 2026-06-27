// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: frontend/src/pages/admin/departments/DepartmentDetailPage.jsx
//  VIEW-ONLY: Shows department details, courses, and stats
//  All actions (edit, delete, status) are in DepartmentsListPage
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import adminApi from "../../../api/adminApi";
import StatusBadge from "../../../components/common/StatusBadge";
import {
  HiOutlineArrowLeft,
  HiOutlineAcademicCap,
  HiOutlineUserGroup,
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
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDept = async () => {
    try {
      const [deptRes, statsRes] = await Promise.all([
        adminApi.getDepartment(id),
        adminApi.getDepartmentStats(id),
      ]);
      setDept(deptRes.data.data);
      setStats(statsRes.data.data);
    } catch {
      navigate("/admin/departments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDept();
  }, [id]);

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

        {/* Department Header */}
        <div className="bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] p-6 mb-6">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h1 className="text-xl font-bold text-white">{dept.name}</h1>
            <span className="font-mono text-[11px] bg-white/[0.06] text-slate-400 px-2 py-1 rounded-lg border border-white/[0.06]">
              {dept.code}
            </span>
            <span className="text-[11px] font-medium text-slate-400 bg-white/[0.04] border border-white/[0.06] px-2 py-1 rounded-lg capitalize">
              {levelLabels[dept.education_level] || dept.education_level}
            </span>
          </div>
          <StatusBadge status={dept.status} label={dept.status_label} />
        </div>

        {/* Stats Cards */}
        <div
          className={`grid grid-cols-1 ${isCollege ? "sm:grid-cols-2" : "sm:grid-cols-1"} gap-4 mb-6`}
        >
          {isCollege && (
            <div className="bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] p-5 border-l-[3px] border-l-indigo-500">
              <div className="w-11 h-11 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center mb-3">
                <HiOutlineAcademicCap className="w-5 h-5" />
              </div>
              <p className="text-[28px] font-extrabold text-white tracking-tight leading-none">
                {dept.courses_count ?? dept.courses?.length ?? 0}
              </p>
              <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-[0.1em] font-semibold">
                Courses
              </p>
            </div>
          )}
          <div className="bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] p-5 border-l-[3px] border-l-purple-500">
            <div className="w-11 h-11 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center mb-3">
              <HiOutlineUserGroup className="w-5 h-5" />
            </div>
            <p className="text-[28px] font-extrabold text-white tracking-tight leading-none">
              {stats?.total_graduates ?? 0}
            </p>
            <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-[0.1em] font-semibold">
              Total Graduates
            </p>
          </div>
        </div>

        {/* Courses Under This Department — ONLY for College */}
        {hasCourses && (
          <div className="bg-[#1a2e5a]/40 backdrop-blur-sm rounded-2xl border border-white/[0.06] p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[11px] font-semibold text-[#c8a84e] uppercase tracking-wider">
                Courses Under This Department
              </h2>
              <Link
                to="/admin/courses"
                className="text-xs text-[#c8a84e] hover:text-[#e0c76a] font-semibold transition-colors"
              >
                Manage Courses →
              </Link>
            </div>
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
                          <span className="text-[11px] text-slate-600">No</span>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
    </div>
  );
}
