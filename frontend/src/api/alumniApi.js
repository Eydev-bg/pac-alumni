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

  getProfileCompletion() {
    return api.get('/alumni/profile/completion');
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

  // ─── Job Board (Phase 1.8) ─────────────────────────────
  getJobs(params = {}) {
    return api.get('/alumni/jobs', { params });
  },

  getJob(id) {
    return api.get(`/alumni/jobs/${id}`);
  },

  applyToJob(id) {
    return api.post(`/alumni/jobs/${id}/apply`);
  },

  getMyApplications(params = {}) {
    return api.get('/alumni/my-applications', { params });
  },

  // ─── Announcements (Phase 2) ───────────────────────────
  getAnnouncements(params = {}) {
    return api.get('/alumni/announcements', { params });
  },

  getAnnouncement(id) {
    return api.get(`/alumni/announcements/${id}`);
  },

  markAnnouncementRead(id) {
    return api.post(`/alumni/announcements/${id}/read`);
  },

  getAnnouncementsUnreadCount() {
    return api.get('/alumni/announcements/unread-count');
  },

  // ─── Events (Phase 2) ──────────────────────────────────
  getEvents(params = {}) {
    return api.get('/alumni/events', { params });
  },

  getEvent(id) {
    return api.get(`/alumni/events/${id}`);
  },

  rsvpEvent(id, status) {
    return api.post(`/alumni/events/${id}/rsvp`, { status });
  },

  cancelEventRsvp(id) {
    return api.delete(`/alumni/events/${id}/rsvp`);
  },

  // ─── Achievement Feed (Phase 3.1) ──────────────────────
  getAchievementFeed(params = {}) {
    return api.get('/alumni/achievement-feed', { params });
  },

  toggleAchievementVisibility(id) {
    return api.patch(`/alumni/achievement-feed/${id}/visibility`);
  },

  // ─── Messaging (Phase 3.3) ─────────────────────────────
  getConversations() {
    return api.get('/alumni/conversations');
  },

  startConversation(recipientId) {
    return api.post('/alumni/conversations', { recipient_id: recipientId });
  },

  getMessages(conversationId) {
    return api.get(`/alumni/conversations/${conversationId}/messages`);
  },

  sendMessage(conversationId, content) {
    return api.post(`/alumni/conversations/${conversationId}/messages`, { content });
  },

  getMessagesUnreadCount() {
    return api.get('/alumni/messages/unread-count');
  },

  searchMessageRecipients(search = '') {
    return api.get('/alumni/messages/recipients', { params: { search } });
  },
};

export default alumniApi;