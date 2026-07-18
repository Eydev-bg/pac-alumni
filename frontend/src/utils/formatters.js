/**
 * Format ISO date string to readable format.
 */
export function formatDate(isoString, options = {}) {
  if (!isoString) return '—';

  const defaults = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  };

  return new Date(isoString).toLocaleDateString('en-PH', defaults);
}

/**
 * Format date only (no time).
 */
export function formatDateOnly(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Relative time (e.g., "2 hours ago").
 */
export function timeAgo(isoString) {
  if (!isoString) return '—';

  const now = new Date();
  const past = new Date(isoString);
  const diffMs = now - past;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return formatDateOnly(isoString);
}

/**
 * Truncate text with ellipsis.
 */
export function truncate(str, length = 50) {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) + '...' : str;
}

/**
 * Strip HTML tags/entities down to plain text (for list snippets).
 */
export function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Conditional class names (like clsx).
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Build full URL for backend storage files (profile pictures, uploads, etc.).
 * In dev: frontend runs on :5173, backend on :8000 — relative paths won't work.
 * In production: both are on the same domain, so relative paths work fine.
 */
export function storageUrl(path) {
  if (!path) return null;

  // Already a full URL (e.g., https://...) — return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  // Build backend base URL from the API base URL
  // VITE_API_BASE_URL = "http://localhost:8000/api" → we need "http://localhost:8000"
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
  const backendBase = apiBase.replace(/\/api\/?$/, '');

  return `${backendBase}${path}`;
}