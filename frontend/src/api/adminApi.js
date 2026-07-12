// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: frontend/src/api/adminApi.js
//  COMPLETE — ALL 6 PHASES
// ═══════════════════════════════════════════════════════════

import api from './axios';

const adminApi = {
  // ─── Dashboard ─────────────────────────────────────────
  getDashboardData: () => api.get('/admin/dashboard'),

  // ─── Admin Account Settings ────────────────────────────
  updateMyProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),

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
  // ─── Phase 5: Graduate Trash / Soft-delete ─────────────
  getTrashedGraduates: (params = {}) => api.get('/admin/graduates/trashed', { params }),
  restoreGraduate: (id) => api.post(`/admin/graduates/${id}/restore`),
  forceDeleteGraduate: (id) => api.delete(`/admin/graduates/${id}/force`),

  // ─── Phase 4: Verification & Registration ─────────────
  getRegistrationSettings: () => api.get('/admin/registration/settings'),
  updateRegistrationSettings: (data) => api.put('/admin/registration/settings', data),

  // ─── System Settings: Maintenance Mode ─────────────────
  getMaintenanceSettings: () => api.get('/admin/settings/maintenance'),
  updateMaintenanceSettings: (data) => api.put('/admin/settings/maintenance', data),
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

  // ─── Phase 6: Alumni Search ────────────────────────────
  searchAlumni: (params = {}) => api.get('/admin/alumni/search', { params }),
  getAlumniProfile: (graduateId) => api.get(`/admin/alumni/${graduateId}/profile`),

  // ─── Phase 6: Notifications ────────────────────────────
  getNotifications: (params = {}) => api.get('/admin/notifications', { params }),
  getUnreadCount: () => api.get('/admin/notifications/unread-count'),
  markNotificationRead: (id) => api.patch(`/admin/notifications/${id}/read`),
  markAllNotificationsRead: () => api.patch('/admin/notifications/read-all'),

  // ─── Phase 4.3: Reminder Stats ─────────────────────────
  getReminderStats: () => api.get('/admin/reminders/stats'),

  // ─── Phase 6: Email Logs ───────────────────────────────
  getEmailLogs: (params = {}) => api.get('/admin/email-logs', { params }),

  // ─── Consolidated report exports (xlsx/csv/pdf blob) ───
  exportBoardPassingReport: (params = {}) => api.get('/admin/reports/board-passing/export', { params, responseType: 'blob' }),
  exportEmploymentReport:   (params = {}) => api.get('/admin/reports/employment/export', { params, responseType: 'blob' }),
  exportAlumniIdListReport: (params = {}) => api.get('/admin/reports/alumni-id-list/export', { params, responseType: 'blob' }),

  // ─── Phase 2: Announcements ────────────────────────────
  getAnnouncements: (params = {}) => api.get('/admin/announcements', { params }),
  getAnnouncement: (id) => api.get(`/admin/announcements/${id}`),
  // Accepts FormData (title, content, target_type, target_value, is_pinned,
  // is_published, optional image banner).
  createAnnouncement: (formData) =>
    api.post('/admin/announcements', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  // POST + method spoofing so the optional banner file is parsed correctly
  // (PHP does not parse multipart PUT bodies).
  updateAnnouncement: (id, formData) => {
    formData.append('_method', 'PUT');
    return api.post(`/admin/announcements/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteAnnouncement: (id) => api.delete(`/admin/announcements/${id}`),
  publishAnnouncement: (id) => api.patch(`/admin/announcements/${id}/publish`),
  archiveAnnouncement: (id) => api.patch(`/admin/announcements/${id}/archive`),
  toggleAnnouncementPin: (id) => api.patch(`/admin/announcements/${id}/pin`),

  // ─── Phase 2: Events ───────────────────────────────────
  getEvents: (params = {}) => api.get('/admin/events', { params }),
  getEvent: (id) => api.get(`/admin/events/${id}`),
  // Accepts FormData (title, content, target_type, target_value, is_pinned,
  // is_published, start_datetime, end_datetime, location, optional image banner).
  createEvent: (formData) =>
    api.post('/admin/events', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  // POST + method spoofing so the optional banner file is parsed correctly
  // (PHP does not parse multipart PUT bodies).
  updateEvent: (id, formData) => {
    formData.append('_method', 'PUT');
    return api.post(`/admin/events/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteEvent: (id) => api.delete(`/admin/events/${id}`),
  publishEvent: (id) => api.patch(`/admin/events/${id}/publish`),
  archiveEvent: (id) => api.patch(`/admin/events/${id}/archive`),
  toggleEventPin: (id) => api.patch(`/admin/events/${id}/pin`),
};

export default adminApi;