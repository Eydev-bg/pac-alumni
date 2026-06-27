import api from './axios';

/**
 * Alumni API endpoints.
 * Maps to backend AlumniController + RegistrationController.
 */
const alumniApi = {
  // ─── Registration (Public) ─────────────────────────────
  checkRegistrationStatus() {
    return api.get('/registration/status');
  },

  register(data) {
    return api.post('/registration/verify', data);
  },

  // ─── Dashboard (Protected) ─────────────────────────────
  getDashboard() {
    return api.get('/alumni/dashboard');
  },

  // ─── Profile Management (Features 5-8) ─────────────────
  getProfile() {
    return api.get('/alumni/profile');
  },

  updateProfile(data) {
    return api.put('/alumni/profile', data);
  },

  uploadProfilePicture(file) {
    const formData = new FormData();
    formData.append('profile_picture', file);
    return api.post('/alumni/profile/picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  removeProfilePicture() {
    return api.delete('/alumni/profile/picture');
  },

  // ─── Board Exam Module (Features 9-12) ─────────────────
  getBoardExamData() {
    return api.get('/alumni/board-exam');
  },

  submitBoardExam(data, proofFile) {
    const formData = new FormData();
    formData.append('status', data.status);
    formData.append('exam_year', data.exam_year);
    if (proofFile) {
      formData.append('proof_file', proofFile);
    }
    return api.post('/alumni/board-exam', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // ─── Employment Module (Features 13-18) ────────────────
  getEmploymentData() {
    return api.get('/alumni/employment');
  },

  submitEmployment(data) {
    return api.post('/alumni/employment', data);
  },
};

export default alumniApi;