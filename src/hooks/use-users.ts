import { User, userService } from "@/lib/api/user-service";
import { toastUtils } from "@/lib/toast";
import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";

// Define interface for API error response
interface ApiErrorResponse {
  message: string;
}

export const useUsers = () => {
  // Query to get all users
  const {
    data: users,
    isLoading: isLoadingUsers,
    error: usersError,
    refetch: refetchUsers
  } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      try {
        return await userService.getAllUsers();
      } catch (error) {
        const axiosError = error as AxiosError<ApiErrorResponse>;
        const errorMessage = axiosError.response?.data?.message || "Failed to load users";
        toastUtils.error(errorMessage);
        throw error;
      }
    }
  });

  // Filter to get only team members (TEAM role)
  const getTeamMembers = (): User[] => {
    if (!users) return [];
    return users.filter((user) => user.role === "TEAM");
  };

  return {
    users,
    isLoadingUsers,
    usersError,
    refetchUsers,
    getTeamMembers
  };
};
