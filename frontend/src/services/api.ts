import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Base API configuration with fallback
const baseURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001/api';
console.log('API baseURL:', baseURL); // Debug info to check the URL

// Token storage key
const TOKEN_KEY = 'auth_token';

// Create axios instance with default config
const api: AxiosInstance = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for API calls
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    
    console.log(`[API] Making ${config.method?.toUpperCase()} request to ${config.url}`, 
      config.params ? `with params: ${JSON.stringify(config.params)}` : '');
    
    if (token && config.headers) {
      // Ensure the token is properly formatted and trimmed
      const cleanToken = token.trim();
      if (!cleanToken) {
        console.error('[API] Invalid token format: empty after trimming');
        return config;
      }
      config.headers.Authorization = `Bearer ${cleanToken}`;
    }
    return config;
  },
  (error) => {
    console.error('[API] Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => {
    console.log(`[API] Response from ${response.config.url}:`, 
      response.status, response.data ? 
        (response.data.success ? 'success' : 'failure') : 'no data');
    return response;
  },
  async (error: AxiosError) => {
    if (error.response) {
      console.error(`[API] Response error from ${error.config?.url}:`, 
        error.response.status, error.response.data);
    } else if (error.request) {
      console.error('[API] No response received:', error.request);
    } else {
      console.error('[API] Error setting up request:', error.message);
    }
    
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized responses
    if (error.response?.status === 401 && originalRequest) {
      const url = originalRequest.url || '';
      
      // Only redirect to login if this is not from a login attempt itself
      // This prevents the redirect loop
      if (!url.includes('/auth/login')) {
        // Clear invalid tokens
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem('auth_user');
        
        // Redirect to login page
        window.location.href = '/login';
      }
    }
    
    // Handle 403 Forbidden responses
    if (error.response?.status === 403) {
      console.error('[API] Permission denied:', error.response.data);
      // No redirigir automáticamente, permitir que el componente maneje el error
      // window.location.href = '/dashboard';
    }
    
    return Promise.reject(error);
  }
);

export default api; 