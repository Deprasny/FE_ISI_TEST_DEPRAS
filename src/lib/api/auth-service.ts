import { User } from "@/store/auth-store";
import apiClient from "./axios-instance";

interface LoginResponse {
  token: string;
  user: User;
}

interface RegisterResponse {
  message: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>("/auth/login", credentials);
    return response.data;
  },

  register: async (data: RegisterData): Promise<RegisterResponse> => {
    const response = await apiClient.post<RegisterResponse>("/auth/register", data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    // No need to call a backend endpoint, just clear the auth on the client
    // If you need to invalidate the token on the server, you can add that here
    return Promise.resolve();
  }
};
