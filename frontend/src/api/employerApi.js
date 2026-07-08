import api from './axios';

/**
 * Employer (HR) API endpoints.
 * Maps to backend Employer controllers (registration, dashboard,
 * profile, jobs, applicants).
 */
const employerApi = {
  // ─── Registration (Public) ─────────────────────────────
  // Expects a FormData (includes business_permit_document + optional logo).
  register(formData) {
    return api.post('/employer/register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // ─── Dashboard ─────────────────────────────────────────
  getDashboard() {
    return api.get('/employer/dashboard');
  },

  // ─── Company Profile ───────────────────────────────────
  getProfile() {
    return api.get('/employer/profile');
  },

  // Accepts a FormData; uses POST + method spoofing so the optional
  // logo file is parsed correctly (PHP does not parse multipart PUT bodies).
  updateProfile(formData) {
    formData.append('_method', 'PUT');
    return api.post('/employer/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // ─── Job Management ────────────────────────────────────
  getJobs(params = {}) {
    return api.get('/employer/jobs', { params });
  },

  getJob(id) {
    return api.get(`/employer/jobs/${id}`);
  },

  createJob(data) {
    return api.post('/employer/jobs', data);
  },

  updateJob(id, data) {
    return api.put(`/employer/jobs/${id}`, data);
  },

  deleteJob(id) {
    return api.delete(`/employer/jobs/${id}`);
  },

  closeJob(id) {
    return api.patch(`/employer/jobs/${id}/close`);
  },

  // ─── Applicants ────────────────────────────────────────
  getApplicants(jobId, params = {}) {
    return api.get(`/employer/jobs/${jobId}/applicants`, { params });
  },

  updateApplicationStatus(applicationId, data) {
    return api.patch(`/employer/applications/${applicationId}/status`, data);
  },
};

export default employerApi;
