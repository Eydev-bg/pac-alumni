// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: frontend/src/pages/admin/analytics/ElementaryAnalyticsTab.jsx
//  Elementary-specific analytics: graduate counts, LRN coverage,
//  document request activity (replaces continuation tracking)
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import adminApi from "../../../api/adminApi";
import {
  HiOutlineAcademicCap,
  HiOutlineIdentification,
  HiOutlineDocumentText,
  HiOutlineExclamationTriangle,
} from "react-icons/hi2";

export default function ElementaryAnalyticsTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [years, setYears] = useState([]);
  const [yearFilter, setYearFilter] = useState("");

  useEffect(() => {
    adminApi
      .getGraduationYears("elementary")
      .then((res) => setYears(res.data.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (yearFilter) {
      params.year_from = yearFilter;
      params.year_to = yearFilter;
    }
    adminApi
      .getElementaryAnalytics(params)
      .then((res) => setData(res.data.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [yearFilter]);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c8a84e] mb-3" />
        <p className="text-sm text-slate-500">
          Loading elementary analytics...
        </p>
      </div>
    );

  if (!data) return null;

  const lrnCoverage =
    data.total_graduates > 0
      ? Math.round((data.with_lrn / data.total_graduates) * 100)
      : 0;

  return (
    <div>
      {/* Year Filter */}
      <div className="flex gap-3 mb-6">
        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="px-3 py-2 bg-white/[0.06] border border-white/[0.08] rounded-xl text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#c8a84e]/40 appearance-none cursor-pointer min-w-[140px]"
          style={{ colorScheme: "dark" }}
        >
          <option value="" >All Years</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* Summary Cards Row 1: Graduates + LRN */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 text-center">
          <HiOutlineAcademicCap className="w-6 h-6 text-blue-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">
            {data.total_graduates}
          </p>
          <p className="text-[10px] text-blue-400/80 uppercase font-semibold mt-1 tracking-wider">
            Total Graduates
          </p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center">
          <HiOutlineIdentification className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{data.with_lrn}</p>
          <p className="text-[10px] text-emerald-400/80 uppercase font-semibold mt-1 tracking-wider">
            With LRN
          </p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-center">
          <HiOutlineExclamationTriangle className="w-6 h-6 text-amber-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{data.without_lrn}</p>
          <p className="text-[10px] text-amber-400/80 uppercase font-semibold mt-1 tracking-wider">
            Missing LRN
          </p>
        </div>
        <div className="bg-[#c8a84e]/10 border border-[#c8a84e]/20 rounded-2xl p-4 text-center flex flex-col justify-center">
          <p className="text-2xl font-bold text-[#c8a84e]">{lrnCoverage}%</p>
          <p className="text-[10px] text-[#c8a84e]/80 uppercase font-semibold mt-1 tracking-wider">
            LRN Coverage
          </p>
        </div>
      </div>

      {/* Document Request Activity */}
      <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-6 mb-6">
        <h3 className="text-[11px] font-semibold text-[#c8a84e] uppercase tracking-wider mb-4 flex items-center gap-2">
          <HiOutlineDocumentText className="w-4 h-4" />
          Document request activity
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="text-center p-4 bg-white/[0.04] border border-white/[0.06] rounded-xl">
            <p className="text-xl font-bold text-white">
              {data.total_doc_requests}
            </p>
            <p className="text-[10px] text-slate-500 uppercase font-semibold mt-1 tracking-wider">
              Total Requests
            </p>
          </div>
          <div className="text-center p-4 bg-blue-500/10 border border-blue-500/15 rounded-xl">
            <p className="text-xl font-bold text-blue-400">
              {data.lrn_requests}
            </p>
            <p className="text-[10px] text-blue-400/80 uppercase font-semibold mt-1 tracking-wider">
              LRN Printed
            </p>
          </div>
          <div className="text-center p-4 bg-purple-500/10 border border-purple-500/15 rounded-xl">
            <p className="text-xl font-bold text-purple-400">
              {data.good_moral_requests}
            </p>
            <p className="text-[10px] text-purple-400/80 uppercase font-semibold mt-1 tracking-wider">
              Good Moral Issued
            </p>
          </div>
          <div className="text-center p-4 bg-emerald-500/10 border border-emerald-500/15 rounded-xl">
            <p className="text-xl font-bold text-emerald-400">
              {data.recent_lrn + data.recent_good_moral}
            </p>
            <p className="text-[10px] text-emerald-400/80 uppercase font-semibold mt-1 tracking-wider">
              Last 30 Days
            </p>
          </div>
        </div>
      </div>

      {/* Yearly Breakdown Table */}
      {data.by_year && data.by_year.length > 0 && (
        <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-3.5 px-4 font-semibold text-[#c8a84e] text-[11px] uppercase tracking-wider">
                    Year
                  </th>
                  <th className="text-center py-3.5 px-4 font-semibold text-[#c8a84e] text-[11px] uppercase tracking-wider">
                    Graduates
                  </th>
                  <th className="text-center py-3.5 px-4 font-semibold text-emerald-400 text-[11px] uppercase tracking-wider">
                    With LRN
                  </th>
                  <th className="text-center py-3.5 px-4 font-semibold text-amber-400 text-[11px] uppercase tracking-wider">
                    Missing LRN
                  </th>
                  <th className="text-center py-3.5 px-4 font-semibold text-[#c8a84e] text-[11px] uppercase tracking-wider">
                    Coverage
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {data.by_year.map((row) => {
                  const coverage =
                    row.total_graduates > 0
                      ? Math.round((row.with_lrn / row.total_graduates) * 100)
                      : 0;
                  return (
                    <tr
                      key={row.year}
                      className="hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {row.year}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-300">
                        {row.total_graduates}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-emerald-400">
                        {row.with_lrn}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-amber-400">
                        {row.without_lrn}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`font-bold ${
                            coverage === 100
                              ? "text-emerald-400"
                              : coverage >= 80
                                ? "text-blue-400"
                                : "text-amber-400"
                          }`}
                        >
                          {coverage}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
