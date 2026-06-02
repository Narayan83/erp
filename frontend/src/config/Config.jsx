export const BASE_URL = "http://localhost:8000";

/**
 * Helper function to get authentication headers with JWT token
 * Retrieves the JWT token from localStorage and includes it as a Bearer token
 * @returns {Object} Headers object with Authorization token if available
 */
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || '';
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};
