// ═══════════════════════════════════════════════════════════
//  FILE: frontend/src/pages/admin/graduates/GraduateDetailPage.jsx
//  Layout: Profile Hero → Alumni Records → Graduate Details
//  No redundant "College" badge in hero — it's in details.
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import adminApi from "../../../api/adminApi";
import { storageUrl, formatDate } from "../../../utils/formatters";
import StatusBadge from "../../../components/common/StatusBadge";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import EditGraduateModal from "./EditGraduateModal";
import { useToast } from "../../../hooks/useToast";
import Card from "../../../ui/Card";
import {
  HiOutlineArrowLeft,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineIdentification,
  HiOutlineAcademicCap,
  HiOutlineBriefcase,
} from "react-icons/hi2";

export default function GraduateDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [graduate, setGraduate] = useState(null);
  const [alumniData, setAlumniData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchGraduate = async () => {
    try {
      const res = await adminApi.getGraduate(id);
      const grad = res.data.data;
      setGraduate(grad);

      if (grad.education_level === "college" && grad.has_alumni_account) {
        try {
          const alumniRes = await adminApi.getAlumniProfile(id);
          setAlumniData(alumniRes.data.data);
        } catch {
          setAlumniData(null);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Graduate not found.");
      navigate("/admin/graduates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraduate();
  }, [id]);

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await adminApi.deleteGraduate(id);
      toast.success("Graduate record deleted.");
      navigate("/admin/graduates");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500 mb-3" />
        <p className="text-sm text-slate-500">Loading graduate...</p>
      </div>
    );

  if (!graduate) return null;

  const isCollege = graduate.education_level === "college";
  const hasAlumniAccount = graduate.has_alumni_account;
  const alumniProfile = alumniData?.alumni_profile;
  const boardRecords = alumniData?.board_exam_records || [];
  const employmentRecords = alumniData?.employment_records || [];
  const isBoardProgram = graduate.course?.is_board_program === true;

  const detailRows = [
    ["First Name", graduate.first_name],
    ["Middle Name", graduate.middle_name || "—"],
    ["Last Name", graduate.last_name],
    ["Suffix", graduate.suffix || "—"],
    ["Education Level", graduate.education_level_label],
    ["Graduation Year", graduate.graduation_year],
    ["Department", graduate.department ? `${graduate.department.name}` : "—"],
  ];

  if (isCollege) {
    detailRows.push(
      ["Course", graduate.course ? `${graduate.course.name}` : "—"],
      ["Has Alumni Account", hasAlumniAccount ? "Yes" : "No"],
    );
  }

  detailRows.push(
    ["Record Created", formatDate(graduate.created_at)],
    ["Last Updated", formatDate(graduate.updated_at)],
  );

  const actionBtn =
    "inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl transition-colors border";

  return (
    <>
      <div className="max-w-[1100px] mx-auto">
        {/* Back */}
        <button
          onClick={() => navigate("/admin/graduates")}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-gold-500 mb-5 transition-colors"
        >
          <HiOutlineArrowLeft className="w-4 h-4" /> Back to Graduates
        </button>

        {/* ═══ 1. Profile Hero — college grads with account ═══ */}
        {isCollege && hasAlumniAccount && (
          <Card padding={false} className="overflow-hidden mb-6">
            <div className="flex flex-col items-center pt-8 pb-6 px-6">
              {/* Avatar */}
              {graduate.profile_picture ? (
                <img
                  src={storageUrl(graduate.profile_picture)}
                  alt={graduate.full_name}
                  className="w-28 h-28 rounded-full border-4 border-navy-950 shadow-xl object-cover"
                />
              ) : (
                <div className="w-28 h-28 rounded-full border-4 border-navy-950 shadow-xl bg-gradient-to-br from-gold-500 to-gold-700 flex items-center justify-center">
                  <span className="text-3xl font-bold text-white tracking-wider">
                    {graduate.first_name?.[0]}
                    {graduate.last_name?.[0]}
                  </span>
                </div>
              )}

              {/* Name */}
              <h1 className="text-2xl font-bold text-white mt-4">
                {graduate.full_name}
              </h1>

              {/* Alumni ID badge only — no "College" badge */}
              {graduate.alumni_id_number && (
                <div className="mt-3">
                  <span className="font-mono text-[11px] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/15 flex items-center gap-1">
                    <HiOutlineIdentification className="w-5.5 h-5.5" />
                    {graduate.alumni_id_number}
                  </span>
                </div>
              )}

              {/* Employment + Board status badges */}
              {alumniProfile && (
                <div className="flex flex-wrap justify-center gap-2 mt-3">
                  <StatusBadge
                    status={
                      alumniProfile.employment_status === "employed"
                        ? "success"
                        : alumniProfile.employment_status === "unemployed"
                          ? "failed"
                          : "blocked"
                    }
                    label={`Employment: ${alumniProfile.employment_status?.replace("_", " ")}`}
                  />
                  {isBoardProgram &&
                    alumniProfile.board_status &&
                    alumniProfile.board_status !== "not_applicable" && (
                      <StatusBadge
                        status={alumniProfile.board_status}
                        label={`Board: ${alumniProfile.board_status?.replace("_", " ")}`}
                      />
                    )}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Alumni ID Card — college without account */}
        {isCollege && !hasAlumniAccount && graduate.alumni_id_number && (
          <div className="relative bg-gradient-to-br from-gold-500 via-gold-650 to-gold-700 rounded-2xl p-6 mb-6 text-white shadow-2xl shadow-gold-500/20 overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-navy-800/20 blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <HiOutlineIdentification className="w-4 h-4 text-white/80" />
                <p className="text-[11px] font-bold text-white/90 uppercase tracking-[0.15em]">
                  Alumni ID
                </p>
              </div>
              <p className="text-3xl font-bold font-mono mt-1 tracking-wider drop-shadow-sm">
                {graduate.alumni_id_number}
              </p>
              <p className="text-sm text-white/80 mt-2 font-medium">
                Philippine Advent College, Inc.
              </p>
            </div>
          </div>
        )}

        {/* ═══ 2. Alumni Records — Employment + Board Exam ═══ */}
        {isCollege && hasAlumniAccount && (
          <div
            className={`grid grid-cols-1 ${isBoardProgram ? "lg:grid-cols-2" : ""} gap-6 mb-6`}
          >
            {/* Employment History */}
            <Card>
              <h2 className="text-[11px] font-semibold text-gold-500 mb-4 uppercase tracking-wider flex items-center gap-2">
                <HiOutlineBriefcase className="w-4 h-4" />
                Employment History
              </h2>
              {employmentRecords.length === 0 ? (
                <p className="text-sm text-slate-500">No employment records.</p>
              ) : (
                <div className="space-y-3">
                  {employmentRecords.map((r) => (
                    <div
                      key={r.id}
                      className={`p-3 rounded-xl ${r.is_current ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-white/[0.04] border border-white/[0.06]"}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-200">
                            {r.job_title}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {r.company_name}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {r.industry}
                            {r.employment_type
                              ? ` · ${r.employment_type.replace("_", "-")}`
                              : ""}
                          </p>
                        </div>
                        {r.is_current && (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Current
                          </span>
                        )}
                      </div>
                      {(r.start_date || r.end_date) && (
                        <p className="text-xs text-slate-500 mt-2">
                          {r.start_date || "?"} -{" "}
                          {r.is_current ? "Present" : r.end_date || "?"}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Board Exam — only for board program courses */}
            {isBoardProgram && (
              <Card>
                <h2 className="text-[11px] font-semibold text-gold-500 mb-4 uppercase tracking-wider flex items-center gap-2">
                  <HiOutlineAcademicCap className="w-4 h-4" />
                  Board Exam Records
                </h2>
                {boardRecords.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No board exam records yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {boardRecords.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between p-3 bg-white/[0.04] border border-white/[0.06] rounded-xl"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-200">
                            {r.exam_name}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Year: {r.exam_year}
                          </p>
                        </div>
                        <StatusBadge status={r.status} label={r.status} />
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>
        )}

        {/* ═══ 3. Graduate Details — bottom ═══ */}
        <Card>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-gold-500 uppercase tracking-wider">
              Graduate Details
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowEdit(true)}
                className={`${actionBtn} text-slate-300 bg-white/[0.06] border-white/[0.08] hover:bg-white/[0.1]`}
              >
                <HiOutlinePencilSquare className="w-4 h-4" /> Edit
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className={`${actionBtn} text-red-400 bg-red-500/10 border-red-500/20 hover:bg-red-500/20`}
              >
                <HiOutlineTrash className="w-4 h-4" /> Delete
              </button>
            </div>
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
            {detailRows.map(([label, value]) => (
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

        {/* Modals */}
        {showEdit && (
          <EditGraduateModal
            graduate={graduate}
            onClose={() => setShowEdit(false)}
            onUpdated={() => {
              setShowEdit(false);
              fetchGraduate();
            }}
          />
        )}
        <ConfirmDialog
          open={confirmDelete}
          title="Delete Graduate Record"
          message={`Delete "${graduate.full_name}"? This cannot be undone.`}
          confirmLabel="Delete"
          variant="danger"
          loading={actionLoading}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      </div>
    </>
  );
}
