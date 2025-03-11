import {
  CreateTaskData,
  taskService,
  TaskWithRelations,
  UpdateTaskData
} from "@/lib/api/task-service";
import { TaskStatus } from "@prisma/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

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
    queryFn: () => taskService.getAllTasks()
  });

  // Get a single task by ID
  const useTask = (id?: string) => {
    return useQuery({
      queryKey: ["task", id],
      queryFn: () => (id ? taskService.getTaskById(id) : null),
      enabled: !!id
    });
  };

  // Get task history
  const useTaskHistory = (id?: string) => {
    return useQuery({
      queryKey: ["taskHistory", id],
      queryFn: () => (id ? taskService.getTaskHistory(id) : null),
      enabled: !!id
    });
  };

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: (data: CreateTaskData) => taskService.createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
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
    }
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => taskService.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      router.push("/dashboard");
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
