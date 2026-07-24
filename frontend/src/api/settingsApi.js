import api from './axios';

/**
 * Alumni Settings API endpoints (Security + Appearance).
 * Maps 1:1 with the backend Alumni\Settings controllers.
 */
const settingsApi = {
  changePassword(data) {
    return api.put('/alumni/settings/security/password', data);
  },
  getAppearance() {
    return api.get('/alumni/settings/appearance');
  },
  updateAppearance(theme) {
    return api.patch('/alumni/settings/appearance', { theme });
  },
};

export default settingsApi;
