import { authService, LoginCredentials, RegisterData } from "@/lib/api/auth-service";
import { useAuthStore } from "@/store/auth-store";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export const useAuth = () => {
  const { setAuth, clearAuth } = useAuthStore();
  const router = useRouter();

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    onSuccess: (data) => {
      setAuth(data.token, data.user);
      router.push("/dashboard");
    }
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterData) => authService.register(data),
    onSuccess: () => {
      // Redirect to login after successful registration
      router.push("/auth/login");
    }
  });

  const logout = () => {
    clearAuth();
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
