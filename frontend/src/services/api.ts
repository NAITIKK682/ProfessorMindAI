import axios, { AxiosError } from 'axios';

interface ApiValidationError {
  msg?: unknown;
}

interface ApiErrorResponse {
  detail?: unknown;
}

// ==================================================
// Global API Instance Configuration
// ==================================================

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001',
  headers: { 
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  },
  timeout: 30000, // 30-second timeout to prevent hanging requests
});

// ==================================================
// Request Interceptor
// ==================================================
// Useful for adding auth tokens, tracing IDs, etc., in the future.

api.interceptors.request.use(
  (config) => {
    // Example: Add auth token if it exists
    // const token = localStorage.getItem('auth_token');
    // if (token && config.headers) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ==================================================
// Response Interceptor
// ==================================================
// Centralized error handling for consistent UX.

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle specific global errors here if needed
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.error('API Request Timeout: The server took too long to respond.');
    } else if (!error.response) {
      console.error('Network Error: Unable to reach the backend server.');
    }
    
    return Promise.reject(error);
  }
);

// ==================================================
// Centralized Error Message Extractor
// ==================================================

export function getApiError(error: unknown, fallback = 'An unexpected error occurred.') {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as ApiErrorResponse | undefined;
    
    // Handle FastAPI/Pydantic validation errors (often an array of errors)
    if (responseData?.detail && Array.isArray(responseData.detail)) {
      return responseData.detail
        .map((entry: unknown) => {
          if (typeof entry === 'string') return entry;
          if (typeof entry === 'object' && entry !== null && 'msg' in entry) {
            const message = (entry as ApiValidationError).msg;
            return typeof message === 'string' ? message : String(message);
          }
          return String(entry);
        })
        .join(', ');
    }
    
    // Handle standard string detail
    if (typeof responseData?.detail === 'string') {
      return responseData.detail;
    }

    // Handle network/unreachable errors
    if (!error.response) {
      return 'The backend server is unavailable. Please ensure FastAPI is running.';
    }

    // Handle specific HTTP status codes with friendly messages
    if (error.response.status === 404) {
      return 'The requested resource was not found.';
    }
    if (error.response.status === 500) {
      return 'An internal server error occurred. Please try again later.';
    }
  }

  // Fallback for non-Axios errors or unknown formats
  return error instanceof Error ? error.message : fallback;
}

export default api;