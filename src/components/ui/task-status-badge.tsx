import { TaskStatus } from "@prisma/client";

interface TaskStatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

// Helper function to get status badge styling
const getStatusBadge = (status: TaskStatus) => {
  switch (status) {
    case "NOT_STARTED":
      return "bg-secondary-100 text-secondary-800";
    case "ON_PROGRESS":
      return "bg-warning-100 text-warning-800";
    case "DONE":
      return "bg-success-100 text-success-800";
    case "REJECT":
      return "bg-danger-100 text-danger-800";
    default:
      return "bg-secondary-100 text-secondary-800";
  }
};

// Helper function to get human-readable status
export const getStatusText = (status: TaskStatus) => {
  switch (status) {
    case "NOT_STARTED":
      return "Not Started";
    case "ON_PROGRESS":
      return "In Progress";
    case "DONE":
      return "Completed";
    case "REJECT":
      return "Rejected";
    default:
      return status;
  }
};

export function TaskStatusBadge({ status, className = "" }: TaskStatusBadgeProps) {
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
        status
      )} ${className}`}
    >
      {getStatusText(status)}
    </span>
  );
}
