import { TaskWithRelations } from "@/lib/api/task-service";

interface StatsCardsProps {
  tasks: TaskWithRelations[];
  isLoadingTasks: boolean;
  completedTasks: TaskWithRelations[];
  inProgressTasks: TaskWithRelations[];
  notStartedTasks: TaskWithRelations[];
}

export function StatsCards({
  tasks,
  isLoadingTasks,
  completedTasks,
  inProgressTasks,
  notStartedTasks
}: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Stats Card */}
      <div className="bg-primary-50 rounded-lg p-5 border border-primary-100">
        <h3 className="text-lg font-medium text-primary-900 mb-1">Total Tasks</h3>
        <p className="text-3xl font-bold text-primary-700">
          {isLoadingTasks ? "..." : tasks.length}
        </p>
      </div>

      {/* Stats Card */}
      <div className="bg-success-50 rounded-lg p-5 border border-success-100">
        <h3 className="text-lg font-medium text-success-700 mb-1">Completed</h3>
        <p className="text-3xl font-bold text-success-700">
          {isLoadingTasks ? "..." : completedTasks.length}
        </p>
      </div>

      {/* Stats Card */}
      <div className="bg-warning-50 rounded-lg p-5 border border-warning-100">
        <h3 className="text-lg font-medium text-warning-700 mb-1">In Progress</h3>
        <p className="text-3xl font-bold text-warning-700">
          {isLoadingTasks ? "..." : inProgressTasks.length}
        </p>
      </div>

      {/* Stats Card */}
      <div className="bg-secondary-50 rounded-lg p-5 border border-secondary-100">
        <h3 className="text-lg font-medium text-secondary-700 mb-1">Not Started</h3>
        <p className="text-3xl font-bold text-secondary-700">
          {isLoadingTasks ? "..." : notStartedTasks.length}
        </p>
      </div>
    </div>
  );
} 