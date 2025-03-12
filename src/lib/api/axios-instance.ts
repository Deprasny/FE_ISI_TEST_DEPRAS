import { useAuthStore } from "@/store/auth-store";
import axios from "axios";

const apiClient = axios.create({
  baseURL: "/api", // Relative to the domain
  headers: {
    "Content-Type": "application/json"
  }
});

// Debug function to check token
const debugToken = () => {
  const token = useAuthStore.getState().token;
  console.log('Current token:', token ? 'exists' : 'missing');
  if (token) {
    console.log('Token value:', token);
  }
  return token;
};

// Add a request interceptor to include the auth token
apiClient.interceptors.request.use(
  (config) => {
    console.log('Request URL:', config.url);
    console.log('Request Method:', config.method);
    
    // Get the latest token from the store
    const token = debugToken();
    
    // Skip auth header for login and register endpoints
    const isAuthEndpoint = config.url?.includes('/auth/login') || config.url?.includes('/auth/register');
    if (isAuthEndpoint) {
      console.log('Auth endpoint detected, skipping token header');
      return config;
    }

    // Always ensure headers object exists
    config.headers = config.headers || {};
    
    // Set Authorization header if token exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Setting auth header:', `Bearer ${token}`);
    } else {
      // Remove Authorization header if no token
      delete config.headers.Authorization;
      console.log('No token available for request to:', config.url);
    }
    
    console.log('Final request headers:', config.headers);
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle 401 errors
apiClient.interceptors.response.use(
  (response) => {
    console.log('Response received:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('Response error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.message,
      data: error.response?.data
    });

    if (error.response?.status === 401) {
      console.log('Unauthorized access detected');
      // Don't clear auth for login attempts
      if (!error.config.url?.includes('/auth/login')) {
        console.log('Non-login 401 error, clearing auth state...');
        useAuthStore.getState().clearAuth();
        
        // Log the current pathname
        if (typeof window !== 'undefined') {
          console.log('Current pathname:', window.location.pathname);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
