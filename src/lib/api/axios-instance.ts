import { useAuthStore } from "@/store/auth-store";
import axios from "axios";

const apiClient = axios.create({
  baseURL: "/api", // Relative to the domain
  headers: {
    "Content-Type": "application/json"
  }
});

// Add a request interceptor to include the auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 Unauthorized, clear auth state
    if (error.response?.status === 401 && !originalRequest._retry) {
      useAuthStore.getState().clearAuth();
    }

    return Promise.reject(error);
  }
);

export default apiClient;
