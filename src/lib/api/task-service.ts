import { Task, TaskHistory, TaskStatus } from "@prisma/client";
import apiClient from "./axios-instance";

export interface TaskWithRelations extends Task {
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface TaskHistoryWithUser extends TaskHistory {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface CreateTaskData {
  title: string;
  description: string;
  assignedToId?: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: TaskStatus;
  assignedToId?: string | null;
}

export const taskService = {
  // Get all tasks
  getAllTasks: async (): Promise<TaskWithRelations[]> => {
    const response = await apiClient.get<TaskWithRelations[]>("/tasks");
    return response.data;
  },

  // Get task by ID
  getTaskById: async (id: string): Promise<TaskWithRelations> => {
    const response = await apiClient.get<TaskWithRelations>(`/tasks/${id}`);
    return response.data;
  },

  // Create new task (LEAD only)
  createTask: async (data: CreateTaskData): Promise<TaskWithRelations> => {
    const response = await apiClient.post<TaskWithRelations>("/tasks", data);
    return response.data;
  },

  // Update task
  updateTask: async (id: string, data: UpdateTaskData): Promise<TaskWithRelations> => {
    const response = await apiClient.put<TaskWithRelations>(`/tasks/${id}`, data);
    return response.data;
  },

  // Delete task (LEAD only)
  deleteTask: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`/tasks/${id}`);
    return response.data;
  },

  // Get task history
  getTaskHistory: async (id: string): Promise<TaskHistoryWithUser[]> => {
    const response = await apiClient.get<TaskHistoryWithUser[]>(`/tasks/${id}/history`);
    return response.data;
  }
};
