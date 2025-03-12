import { authService, LoginCredentials, RegisterData } from "@/lib/api/auth-service";
import { toastUtils } from "@/lib/toast";
import { useAuthStore } from "@/store/auth-store";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";

// Define interface for API error response
interface ApiErrorResponse {
  message: string;
}

export const useAuth = () => {
  const { setAuth, clearAuth } = useAuthStore();
  const router = useRouter();

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    onSuccess: (data) => {
      setAuth(data.token, data.user);
      toastUtils.success("Logged in successfully");
      router.push("/dashboard");
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      // Extract the actual error message from the API response if available
      const errorMessage = error.response?.data?.message || "Failed to log in";
      toastUtils.error(errorMessage);
      if (error.response?.data?.message) {
        error.message = error.response.data.message;
      }
      return error;
    }
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterData) => authService.register(data),
    onSuccess: () => {
      // Redirect to login after successful registration
      toastUtils.success("Account created successfully");
      router.push("/auth/login");
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      // Extract the actual error message from the API response if available
      const errorMessage = error.response?.data?.message || "Registration failed";
      toastUtils.error(errorMessage);
      if (error.response?.data?.message) {
        error.message = error.response.data.message;
      }
      return error;
    }
  });

  const logout = () => {
    clearAuth();
    toastUtils.success("Logged out successfully");
    router.push("/auth/login");
  };

  return {
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    loginError: loginMutation.error,
    registerError: registerMutation.error
  };
};
