/**
 * Secure Token Storage
 *
 * SECURITY NOTE:
 * - In a production SPA, the safest approach is to keep the JWT in memory only
 *   (a JS variable) and use short-lived tokens + refresh tokens.
 * - We use sessionStorage as a compromise so tokens survive page refresh
 *   but NOT new tabs/windows (unlike localStorage).
 * - sessionStorage is cleared when the browser tab closes.
 * - For maximum security, switch to httpOnly cookie approach on the backend.
 *
 * NEVER use localStorage — it's accessible to any XSS attack.
 */

import { TOKEN_KEY, USER_KEY } from '../config/constants';

// ─── In-memory fallback (most secure, but lost on refresh) ───
let memoryToken = null;
let memoryUser = null;

/**
 * Choose storage strategy.
 * Set to 'memory' for maximum security (token lost on refresh).
 * Set to 'session' for usability (survives refresh, not new tabs).
 */
const STORAGE_STRATEGY = 'session'; // 'memory' | 'session'

export const tokenStorage = {
  getToken() {
    if (STORAGE_STRATEGY === 'memory') {
      return memoryToken;
    }
    try {
      return sessionStorage.getItem(TOKEN_KEY);
    } catch {
      return memoryToken;
    }
  },

  setToken(token) {
    memoryToken = token;
    if (STORAGE_STRATEGY === 'session') {
      try {
        sessionStorage.setItem(TOKEN_KEY, token);
      } catch {
        // Storage full or blocked — fall back to memory
      }
    }
  },

  removeToken() {
    memoryToken = null;
    try {
      sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      // Silent fail
    }
  },

  getUser() {
    if (STORAGE_STRATEGY === 'memory') {
      return memoryUser;
    }
    try {
      const raw = sessionStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return memoryUser;
    }
  },

  setUser(user) {
    memoryUser = user;
    if (STORAGE_STRATEGY === 'session') {
      try {
        sessionStorage.setItem(USER_KEY, JSON.stringify(user));
      } catch {
        // Silent fail
      }
    }
  },

  removeUser() {
    memoryUser = null;
    try {
      sessionStorage.removeItem(USER_KEY);
    } catch {
      // Silent fail
    }
  },

  clearAll() {
    this.removeToken();
    this.removeUser();
  },
};

export default tokenStorage;