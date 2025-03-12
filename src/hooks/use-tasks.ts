import {
    CreateTaskData,
    taskService,
    TaskWithRelations,
    UpdateTaskData
} from "@/lib/api/task-service";
import { toastUtils } from "@/lib/toast";
import { TaskStatus } from "@prisma/client";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";

// Define interface for API error response
interface ApiErrorResponse {
  message: string;
}

export const useTasks = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  // Query to get all tasks
  const {
    data: tasks,
    isLoading: isLoadingTasks,
    error: tasksError,
    refetch: refetchTasks
  } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      try {
        return await taskService.getAllTasks();
      } catch (error) {
        const axiosError = error as AxiosError<ApiErrorResponse>;
        const errorMessage = axiosError.response?.data?.message || "Failed to load tasks";
        toastUtils.error(errorMessage);
        throw error;
      }
    }
  });

  // Get a single task by ID
  const useTask = (id?: string) => {
    return useQuery({
      queryKey: ["task", id],
      queryFn: async () => {
        if (!id) return null;
        try {
          return await taskService.getTaskById(id);
        } catch (error) {
          const axiosError = error as AxiosError<ApiErrorResponse>;
          const errorMessage = axiosError.response?.data?.message || "Failed to load task details";
          toastUtils.error(errorMessage);
          throw error;
        }
      },
      enabled: !!id
    });
  };

  // Get task history
  const useTaskHistory = (id?: string) => {
    return useQuery({
      queryKey: ["taskHistory", id],
      queryFn: async () => {
        if (!id) return null;
        try {
          return await taskService.getTaskHistory(id);
        } catch (error) {
          const axiosError = error as AxiosError<ApiErrorResponse>;
          const errorMessage = axiosError.response?.data?.message || "Failed to load task history";
          toastUtils.error(errorMessage);
          throw error;
        }
      },
      enabled: !!id
    });
  };

  // Get task history with pagination and infinite scrolling
  const useInfiniteTaskHistory = (id?: string, limit: number = 5) => {
    return useInfiniteQuery({
      queryKey: ["taskHistoryInfinite", id, limit],
      queryFn: async ({ pageParam = 1 }) => {
        if (!id) return null;
        try {
          return await taskService.getPaginatedTaskHistory(id, pageParam, limit);
        } catch (error) {
          const axiosError = error as AxiosError<ApiErrorResponse>;
          const errorMessage = axiosError.response?.data?.message || "Failed to load task history";
          toastUtils.error(errorMessage);
          throw error;
        }
      },
      initialPageParam: 1,
      getNextPageParam: (lastPage) => {
        if (!lastPage || !lastPage.hasMore) return undefined;
        return lastPage.page + 1;
      },
      enabled: !!id
    });
  };

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: (data: CreateTaskData) => taskService.createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toastUtils.success("Task created successfully");
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const errorMessage = error.response?.data?.message || "Failed to create task";
      toastUtils.error(errorMessage);
    }
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskData }) =>
      taskService.updateTask(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["taskHistory", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["taskHistoryInfinite", variables.id] });
      toastUtils.success("Task updated successfully");
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const errorMessage = error.response?.data?.message || "Failed to update task";
      toastUtils.error(errorMessage);
    }
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => taskService.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toastUtils.success("Task deleted successfully");
      router.push("/dashboard");
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const errorMessage = error.response?.data?.message || "Failed to delete task";
      toastUtils.error(errorMessage);
    }
  });

  // Helper functions to get tasks by status
  const getTasksByStatus = (status: TaskStatus): TaskWithRelations[] => {
    if (!tasks) return [];
    return tasks.filter((task) => task.status === status);
  };

  const getTasksInProgress = (): TaskWithRelations[] => {
    return getTasksByStatus(TaskStatus.ON_PROGRESS);
  };

  const getCompletedTasks = (): TaskWithRelations[] => {
    return getTasksByStatus(TaskStatus.DONE);
  };

  const getRejectedTasks = (): TaskWithRelations[] => {
    return getTasksByStatus(TaskStatus.REJECT);
  };

  const getNotStartedTasks = (): TaskWithRelations[] => {
    return getTasksByStatus(TaskStatus.NOT_STARTED);
  };

  return {
    // Queries
    tasks,
    isLoadingTasks,
    tasksError,
    refetchTasks,
    useTask,
    useTaskHistory,
    useInfiniteTaskHistory,

    // Mutations
    createTask: (data: CreateTaskData, options?: { onSuccess?: () => void }) => {
      return createTaskMutation.mutate(data, options);
    },
    updateTask: (
      params: { id: string; data: UpdateTaskData },
      options?: { onSuccess?: () => void }
    ) => {
      return updateTaskMutation.mutate(params, options);
    },
    deleteTask: (id: string, options?: { onSuccess?: () => void }) => {
      return deleteTaskMutation.mutate(id, options);
    },

    // Mutation states
    isCreatingTask: createTaskMutation.isPending,
    isUpdatingTask: updateTaskMutation.isPending,
    isDeletingTask: deleteTaskMutation.isPending,
    createTaskError: createTaskMutation.error,
    updateTaskError: updateTaskMutation.error,
    deleteTaskError: deleteTaskMutation.error,

    // Helper functions
    getTasksByStatus,
    getTasksInProgress,
    getCompletedTasks,
    getRejectedTasks,
    getNotStartedTasks
  };
};
