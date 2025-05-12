const API_BASE_URL = 'http://localhost:8000/api';

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

// Function to check if the user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  // Check for token in both possible localStorage keys
  const agentToken = localStorage.getItem('agent_token');
  const token = localStorage.getItem('token');
  const activeToken = agentToken || token;
  
  if (!activeToken) return false;
  
  // If we found a token in 'token' but not in 'agent_token', copy it to ensure consistency
  if (token && !agentToken) {
    localStorage.setItem('agent_token', token);
  }
  
  // Get cookies to check if JWT is present
  const cookies = document.cookie;
  const hasCookie = cookies.split(';').some(item => item.trim().startsWith('jwt='));
  
  // If token exists but cookie doesn't, try to fetch the cookie from the server
  if (!hasCookie) {
    try {
      console.log('Token exists but no JWT cookie, attempting to refresh...');
      const response = await fetch(`${API_BASE_URL}/agent/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        console.error('Token refresh failed with status:', response.status);
        clearAuthData();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error refreshing authentication:', error);
      clearAuthData();
      return false;
    }
  }
  
  return true;
}

// Main fetch function with authentication
export async function fetchWithAuth(
  endpoint: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { params, ...fetchOptions } = options;
  
  // Build URL with query parameters if provided
  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      queryParams.append(key, value);
    });
    url += `?${queryParams.toString()}`;
  }
  
  // Get token from localStorage (check both possible keys)
  const agentToken = localStorage.getItem('agent_token');
  const token = localStorage.getItem('token');
  const activeToken = agentToken || token;
  
  // If we found a token in 'token' but not in 'agent_token', copy it to ensure consistency
  if (token && !agentToken) {
    localStorage.setItem('agent_token', token);
  }
  
  // Set default headers
  const headers = new Headers(fetchOptions.headers);
  if (activeToken) {
    headers.set('Authorization', `Bearer ${activeToken}`);
  }
  headers.set('Content-Type', 'application/json');
  
  // Make the request
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      credentials: 'include', // Include cookies in the request
    });
    
    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401) {
      // Try to refresh the token, but only once to avoid infinite loops
      const refreshed = await refreshToken();
      if (refreshed) {
        // Retry the original request with the new token
        return fetchWithAuth(endpoint, options);
      } else {
        // Clear auth data and redirect to login if refresh failed
        clearAuthData();
        window.location.href = '/';
        throw new Error('Authentication failed');
      }
    }
    
    return response;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    throw error;
  }
}

// Helper function to clear all authentication data
export function clearAuthData(): void {
  console.log('Clearing all authentication data');
  // Clear both token keys
  localStorage.removeItem('agent_token');
  localStorage.removeItem('token');
  
  // Clear other auth-related data
  localStorage.removeItem('username');
  localStorage.removeItem('full_name');
  localStorage.removeItem('phone_login');
  localStorage.removeItem('extension');
  localStorage.removeItem('campaign_id');
  localStorage.removeItem('campaign_name');
  localStorage.removeItem('agent_campaign_id');
  localStorage.removeItem('agent_full_name');
  
  // Clear cookies
  document.cookie = 'jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  document.cookie = 'user_level=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  document.cookie = 'auth_success=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
}

// Helper function to refresh the token
async function refreshToken(): Promise<boolean> {
  try {
    console.log('Attempting to refresh token...');
    const response = await fetch(`${API_BASE_URL}/agent/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    
    if (!response.ok) {
      console.error('Token refresh failed with status:', response.status);
      clearAuthData();
      return false;
    }
    
    const data = await response.json();
    if (data.token) {
      console.log('New token received, updating storage');
      // Store token in both locations for compatibility
      localStorage.setItem('agent_token', data.token);
      localStorage.setItem('token', data.token);
      return true;
    } else {
      console.error('No token received in refresh response');
      clearAuthData();
      return false;
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
    clearAuthData();
    return false;
  }
}

// Convenience methods for common HTTP methods
export const api = {
  get: (endpoint: string, options: FetchOptions = {}) => 
    fetchWithAuth(endpoint, { ...options, method: 'GET' }),
    
  post: (endpoint: string, data: any, options: FetchOptions = {}) => 
    fetchWithAuth(endpoint, { 
      ...options, 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
    
  put: (endpoint: string, data: any, options: FetchOptions = {}) => 
    fetchWithAuth(endpoint, { 
      ...options, 
      method: 'PUT', 
      body: JSON.stringify(data) 
    }),
    
  delete: (endpoint: string, options: FetchOptions = {}) => 
    fetchWithAuth(endpoint, { ...options, method: 'DELETE' }),
};
