/**
 * Dynamic API Base URL resolver
 * Automatically switches between local development and HTTPS production deployment.
 */
export const API_BASE =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' &&
  window.location.hostname !== 'localhost' &&
  window.location.hostname !== '127.0.0.1'
    ? `${window.location.origin}/api/v1`
    : 'http://localhost:5000/api/v1');
