import { User, userService } from "@/lib/api/user-service";
import { useQuery } from "@tanstack/react-query";

export const useUsers = () => {
  // Query to get all users
  const {
    data: users,
    isLoading: isLoadingUsers,
    error: usersError,
    refetch: refetchUsers
  } = useQuery({
    queryKey: ["users"],
    queryFn: () => userService.getAllUsers()
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
