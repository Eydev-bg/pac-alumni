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

  // Sent as multipart so the request can carry an optional image/PDF file.
  // FormData can't express a JSON null, hence the conditional appends — an
  // attachment-only message simply omits `content`, which the backend allows.
  sendMessage(conversationId, content, replyToId = null, attachment = null) {
    const form = new FormData();
    if (content) form.append('content', content);
    if (replyToId) form.append('reply_to_id', replyToId);
    if (attachment) form.append('attachment', attachment);
    return api.post(`/alumni/conversations/${conversationId}/messages`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getMessagesUnreadCount() {
    return api.get('/alumni/messages/unread-count');
  },

  searchMessageRecipients(search = '') {
    return api.get('/alumni/messages/recipients', { params: { search } });
  },

  // ─── Alumni Directory (Phase B) ────────────────────────
  getDirectory(params = {}) {
    return api.get('/alumni/directory', { params });
  },

  getDirectoryFilters() {
    return api.get('/alumni/directory/filters');
  },

  getDirectoryProfile(uuid) {
    return api.get(`/alumni/directory/${uuid}`);
  },

  // ─── Job Postings (Phase 3) ────────────────────────────
  getJobPostings(params = {}) {
    return api.get('/alumni/job-postings', { params });
  },

  getJobPosting(id) {
    return api.get(`/alumni/job-postings/${id}`);
  },

  // ─── Alumni-authored postings (Career Center "My Posts") ───
  getMyJobPosts(params = {}) {
    return api.get('/alumni/careers/my-posts', { params });
  },

  // Unlike getJobPosting(), this also returns the alumni's own expired /
  // past-deadline posts — the edit form needs to load those.
  getMyJobPost(id) {
    return api.get(`/alumni/careers/my-posts/${id}`);
  },

  // Accepts FormData (same fields as the admin form minus status/is_pinned,
  // which the backend forces to active/false).
  createMyJobPost(formData) {
    return api.post('/alumni/careers/my-posts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // POST + method spoofing so the optional logo file is parsed correctly
  // (PHP does not parse multipart PUT bodies).
  updateMyJobPost(id, formData) {
    formData.append('_method', 'PUT');
    return api.post(`/alumni/careers/my-posts/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteMyJobPost(id) {
    return api.delete(`/alumni/careers/my-posts/${id}`);
  },

  // ─── Notifications (Phase 3) ───────────────────────────
  getNotifications(params = {}) {
    return api.get('/alumni/notifications', { params });
  },

  getUnreadCount() {
    return api.get('/alumni/notifications/unread-count');
  },

  markNotificationRead(id) {
    return api.patch(`/alumni/notifications/${id}/read`);
  },

  markAllNotificationsRead() {
    return api.patch('/alumni/notifications/read-all');
  },
};

export default alumniApi;