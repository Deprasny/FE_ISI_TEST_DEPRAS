import { Role } from "@prisma/client";
import apiClient from "./axios-instance";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export const userService = {
  // Get all users (LEAD only - for assigning tasks)
  getAllUsers: async (): Promise<User[]> => {
    const response = await apiClient.get<User[]>("/users");
    return response.data;
  }
};
