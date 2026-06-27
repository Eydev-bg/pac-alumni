/**
 * Application-wide constants.
 * Single source of truth — no magic strings in components.
 */

export const USER_ROLES = {
  ADMIN: 'admin',
  ALUMNI: 'alumni',
};

export const USER_ROLE_LABELS = {
  [USER_ROLES.ADMIN]: 'Administrator',
  [USER_ROLES.ALUMNI]: 'Alumni',
};

// No assignable roles — admin creates admin accounts directly
export const ASSIGNABLE_ROLES = [];

export const USER_STATUSES = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  DEACTIVATED: 'deactivated',
};

export const USER_STATUS_LABELS = {
  [USER_STATUSES.ACTIVE]: 'Active',
  [USER_STATUSES.SUSPENDED]: 'Suspended',
  [USER_STATUSES.DEACTIVATED]: 'Deactivated',
};

export const LOGIN_ATTEMPT_STATUSES = {
  SUCCESS: 'success',
  FAILED: 'failed',
  BLOCKED: 'blocked',
};

export const PAGINATION = {
  DEFAULT_PER_PAGE: 15,
  LOGS_PER_PAGE: 20,
  OPTIONS: [10, 15, 25, 50],
};

export const TOKEN_KEY = 'pac_token';
export const USER_KEY = 'pac_user';