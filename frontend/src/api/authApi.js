import api from './axios';

/**
 * Authentication API endpoints.
 * Maps 1:1 with backend AuthController.
 */
const authApi = {
  login(email, password) {
    return api.post('/auth/login', { email, password });
  },

  logout() {
    return api.post('/auth/logout');
  },

  refresh() {
    return api.post('/auth/refresh');
  },

  getMe() {
    return api.get('/auth/me');
  },

  forgotPassword(email) {
    return api.post('/auth/forgot-password', { email });
  },

  resetPassword(data) {
    return api.post('/auth/reset-password', data);
  },

  updateProfile(data) {
    return api.put('/auth/profile', data);
  },

  changePassword(data) {
    return api.put('/auth/change-password', data);
  },
};

export default authApi;