/**
 * Utility function to make authenticated fetch requests
 * This ensures all API calls include the authentication token
 * 
 * @param url - The URL to fetch
 * @param options - Fetch options (optional)
 * @returns The fetch response
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  // Essayer d'obtenir le token de plusieurs sources
  let token;
  
  // 1. Essayer d'abord localStorage
  token = localStorage.getItem('token');
  
  // 2. Si pas trouvé, essayer le cookie JavaScript token_js
  if (!token) {
    token = document.cookie
      .split('; ')
      .find(row => row.startsWith('token_js='))
      ?.split('=')[1];
  }
  
  // 3. Si toujours pas trouvé, essayer le cookie HTTP-only token
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
    // Ajouter aussi comme header X-Auth-Token pour la compatibilité
    headers.set('X-Auth-Token', token);
  }
  
  // Create the final request options
  const requestOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include' // Ensure cookies are sent with the request
  };
  
  // Make the authenticated request
  return fetch(url, requestOptions);
}
