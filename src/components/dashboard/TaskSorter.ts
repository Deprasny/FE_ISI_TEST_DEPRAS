import { TaskWithRelations } from "@/lib/api/task-service";

export type SortField = "title" | "status" | "assignedTo" | "createdBy";
export type SortDirection = "asc" | "desc";

export function sortTasks(
  tasks: TaskWithRelations[],
  sortField: SortField,
  sortDirection: SortDirection
): TaskWithRelations[] {
  return [...tasks].sort((a, b) => {
    let aValue, bValue;

    switch (sortField) {
      case "title":
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case "status": {
        // Custom status order: NOT_STARTED -> ON_PROGRESS -> DONE -> REJECT
        const statusOrder = {
          NOT_STARTED: 1,
          ON_PROGRESS: 2,
          DONE: 3,
          REJECT: 4
        };
        aValue = statusOrder[a.status] || 999;
        bValue = statusOrder[b.status] || 999;
        break;
      }
      case "assignedTo": {
        // Special handling for unassigned tasks
        if (!a.assignedTo && !b.assignedTo) return 0;
        if (!a.assignedTo) return sortDirection === "asc" ? 1 : -1; // Unassigned at the end or start
        if (!b.assignedTo) return sortDirection === "asc" ? -1 : 1;

        // If both have assignees, compare names
        aValue = a.assignedTo.name.toLowerCase();
        bValue = b.assignedTo.name.toLowerCase();
        break;
      }
      case "createdBy": {
        // Sort by creator name
        aValue = a.createdBy.name.toLowerCase();
        bValue = b.createdBy.name.toLowerCase();
        break;
      }
      default:
        return 0;
    }

    if (sortDirection === "asc") {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });
}

export function filterTasks(
  tasks: TaskWithRelations[],
  searchTerm: string
): TaskWithRelations[] {
  if (searchTerm.trim() === "") {
    return tasks;
  }
  
  const lowercaseSearchTerm = searchTerm.toLowerCase();
  
  return tasks.filter(
    (task) =>
      task.title.toLowerCase().includes(lowercaseSearchTerm) ||
      task.description.toLowerCase().includes(lowercaseSearchTerm) ||
      (task.assignedTo?.name?.toLowerCase() || "").includes(lowercaseSearchTerm) ||
      task.createdBy.name.toLowerCase().includes(lowercaseSearchTerm)
  );
} 