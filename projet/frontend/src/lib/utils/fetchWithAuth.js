/**
 * Utility function to make authenticated fetch requests
 * This ensures all API calls include the authentication token
 * 
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options (optional)
 * @returns {Promise<Response>} - The fetch response
 */
export async function fetchWithAuth(url, options = {}) {
  // Try to get token from multiple sources
  let token;
  
  // 1. Try localStorage first
  token = localStorage.getItem('token');
  
  // 2. If not found, try JavaScript cookie token_js
  if (!token) {
    token = document.cookie
      .split('; ')
      .find(row => row.startsWith('token_js='))
      ?.split('=')[1];
  }
  
  // 3. If still not found, try HTTP-only cookie token
  if (!token) {
    token = document.cookie
      .split('; ')
      .find(row => row.startsWith('token='))
      ?.split('=')[1];
  }
  
  // Create headers with authentication if token exists
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
    // Also add as X-Auth-Token header for compatibility
    headers.set('X-Auth-Token', token);
  }
  
  // Create the final request options
  const requestOptions = {
    ...options,
    headers,
    credentials: 'include' // Ensure cookies are sent with the request
  };
  
  // Make the authenticated request
  return fetch(url, requestOptions);
}
