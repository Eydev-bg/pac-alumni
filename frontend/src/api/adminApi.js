// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: frontend/src/api/adminApi.js
//  COMPLETE — ALL 6 PHASES
// ═══════════════════════════════════════════════════════════

import api from './axios';

const adminApi = {
  // ─── Dashboard ─────────────────────────────────────────
  getDashboardData: () => api.get('/admin/dashboard'),

  // ─── Phase 1: User Management ──────────────────────────
  getUsers: (params = {}) => api.get('/admin/users', { params }),
  getUser: (uuid) => api.get(`/admin/users/${uuid}`),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (uuid, data) => api.put(`/admin/users/${uuid}`, data),
  updateUserStatus: (uuid, status) => api.patch(`/admin/users/${uuid}/status`, { status }),
  resetUserPassword: (uuid) => api.post(`/admin/users/${uuid}/reset-password`),
  getLoginLogs: (params = {}) => api.get('/admin/login-logs', { params }),

  // ─── Phase 2: Department Management ────────────────────
  getDepartments: (params = {}) => api.get('/admin/departments', { params }),
  getAllDepartments: () => api.get('/admin/departments/all'),
  getDepartment: (id) => api.get(`/admin/departments/${id}`),
  createDepartment: (data) => api.post('/admin/departments', data),
  updateDepartment: (id, data) => api.put(`/admin/departments/${id}`, data),
  deleteDepartment: (id) => api.delete(`/admin/departments/${id}`),
  updateDepartmentStatus: (id, status) => api.patch(`/admin/departments/${id}/status`, { status }),
  getDepartmentStats: (id) => api.get(`/admin/departments/${id}/stats`),

  // ─── Course Management (Hybrid Restructure) ───────────
  getCourses: (params = {}) => api.get('/admin/courses', { params }),
  getAllCourses: (departmentId = '') => api.get('/admin/courses/all', { params: { department_id: departmentId } }),
  createCourse: (data) => api.post('/admin/courses', data),
  updateCourse: (id, data) => api.put(`/admin/courses/${id}`, data),
  deleteCourse: (id) => api.delete(`/admin/courses/${id}`),
  updateCourseStatus: (id, status) => api.patch(`/admin/courses/${id}/status`, { status }),

  // ─── Phase 3: Graduate Management ──────────────────────
  getGraduates: (params = {}) => api.get('/admin/graduates', { params }),
  getGraduate: (id) => api.get(`/admin/graduates/${id}`),
  updateGraduate: (id, data) => api.put(`/admin/graduates/${id}`, data),
  deleteGraduate: (id) => api.delete(`/admin/graduates/${id}`),
  batchUpdateGraduates: (ids, data) => api.patch('/admin/graduates/batch-update', { ids, data }),
  getGraduationYears: (level = '') => api.get('/admin/graduates/years', { params: { education_level: level } }),
  importGraduates: (formData) => api.post('/admin/graduates/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getImportHistory: (params = {}) => api.get('/admin/graduates/import-history', { params }),
  getImportDetail: (id) => api.get(`/admin/graduates/import-history/${id}`),
  checkDuplicates: (alumniIds, level) => api.post('/admin/graduates/check-duplicates', { alumni_ids: alumniIds, education_level: level }),

  // ─── Phase 4: Verification & Registration ─────────────
  getRegistrationSettings: () => api.get('/admin/registration/settings'),
  updateRegistrationSettings: (data) => api.put('/admin/registration/settings', data),
  getVerificationLogs: (params = {}) => api.get('/admin/verification/logs', { params }),
  getVerifiedList: (params = {}) => api.get('/admin/verification/verified', { params }),
  getRejectedList: (params = {}) => api.get('/admin/verification/rejected', { params }),
  getVerificationStats: () => api.get('/admin/verification/stats'),
  getBlacklist: (params = {}) => api.get('/admin/blacklist', { params }),
  addToBlacklist: (data) => api.post('/admin/blacklist', data),
  removeFromBlacklist: (id) => api.delete(`/admin/blacklist/${id}`),

// ─── Graduate Tracer Analytics ─────────────────────────
  getTracerSummary: (params = {}) => api.get('/admin/tracer/summary', { params }),
  getTracerByCourse: (params = {}) => api.get('/admin/tracer/by-course', { params }),
  getTracerEmploymentTrend: (params = {}) => api.get('/admin/tracer/employment-trend', { params }),
  exportTracer: (params = {}) => api.get('/admin/tracer/export', { params, responseType: 'blob' }),

  // ─── Phase 5: Analytics Dashboard ──────────────────────
  getAnalyticsOverview: () => api.get('/admin/analytics/overview'),
  getElementaryAnalytics: (params = {}) => api.get('/admin/analytics/elementary', { params }),
  getJhsAnalytics: (params = {}) => api.get('/admin/analytics/jhs', { params }),
  getShsAnalytics: (params = {}) => api.get('/admin/analytics/shs', { params }),
  getCollegeAnalytics: (params = {}) => api.get('/admin/analytics/college', { params }),
  getBoardExamAnalytics: (params = {}) => api.get('/admin/analytics/college/board-exams', { params }),
  getEmploymentAnalytics: (params = {}) => api.get('/admin/analytics/college/employment', { params }),
  getContinuationFlow: (params = {}) => api.get('/admin/analytics/continuation-flow', { params }),

  // ─── Phase 6: Alumni Search ────────────────────────────
  searchAlumni: (params = {}) => api.get('/admin/alumni/search', { params }),
  getAlumniProfile: (graduateId) => api.get(`/admin/alumni/${graduateId}/profile`),

  // ─── Phase 6: Notifications ────────────────────────────
  getNotifications: (params = {}) => api.get('/admin/notifications', { params }),
  getUnreadCount: () => api.get('/admin/notifications/unread-count'),
  markNotificationRead: (id) => api.patch(`/admin/notifications/${id}/read`),
  markAllNotificationsRead: () => api.patch('/admin/notifications/read-all'),

  // ─── Phase 6: Email Logs ───────────────────────────────
  getEmailLogs: (params = {}) => api.get('/admin/email-logs', { params }),

  // ─── Phase 6: Reports ──────────────────────────────────
  getReportContinuation: (params = {}) => api.get('/admin/reports/continuation', { params }),
  getReportBoardPassing: (params = {}) => api.get('/admin/reports/board-passing', { params }),
  getReportEmployment: (params = {}) => api.get('/admin/reports/employment', { params }),
  getReportDeptSummary: () => api.get('/admin/reports/department-summary'),
  getReportAlumniMasterList: (params = {}) => api.get('/admin/reports/alumni-master-list', { params }),
  getReportVerificationLogs: () => api.get('/admin/reports/verification-logs'),
  getReportAlumniIdList: () => api.get('/admin/reports/alumni-id-list'),

  // ─── Phase 6: Job Post Moderation ──────────────────────
  getJobPosts: (params = {}) => api.get('/admin/job-posts', { params }),
  getJobPost: (id) => api.get(`/admin/job-posts/${id}`),
  deleteJobPost: (id) => api.delete(`/admin/job-posts/${id}`),
  getReportedJobPosts: (params = {}) => api.get('/admin/job-posts/reported', { params }),
  reviewJobReport: (id, status) => api.patch(`/admin/job-reports/${id}/review`, { status }),
};

export default adminApi;