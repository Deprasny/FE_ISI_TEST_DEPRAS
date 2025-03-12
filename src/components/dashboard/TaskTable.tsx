import { TaskStatusBadge } from "@/components/ui/task-status-badge";
import { TaskWithRelations } from "@/lib/api/task-service";
import { useAuthStore } from "@/store/auth-store";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SortDirection, SortField, sortTasks } from "./TaskSorter";

interface TaskTableProps {
  tasks: TaskWithRelations[];
  isLoadingTasks: boolean;
  searchTerm: string;
}

export function TaskTable({ tasks, isLoadingTasks, searchTerm }: TaskTableProps) {
  const { user } = useAuthStore();
  
  // Sorting state
  const [sortField, setSortField] = useState<SortField>("title");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [sortedAndFilteredTasks, setSortedAndFilteredTasks] = useState<TaskWithRelations[]>([]);

  // Update sorted tasks when tasks, sort field, or sort direction changes
  useEffect(() => {
    // First sort the tasks
    const sorted = sortTasks(tasks, sortField, sortDirection);
    
    // Then filter by search term
    const filtered = searchTerm.trim() === ""
      ? sorted
      : sorted.filter(
          (task) =>
            task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (task.assignedTo?.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            task.createdBy.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    
    setSortedAndFilteredTasks(filtered);
  }, [tasks, sortField, sortDirection, searchTerm]);

  // Handle sorting when a column header is clicked
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Function to render sort indicator
  const renderSortIndicator = (field: SortField) => {
    if (field !== sortField) return null;

    return sortDirection === "asc" ? (
      <ChevronUpIcon className="inline-block h-4 w-4 ml-1" />
    ) : (
      <ChevronDownIcon className="inline-block h-4 w-4 ml-1" />
    );
  };

  // Function to get header class based on sort state
  const getHeaderClass = (field: SortField) => {
    const baseClass =
      "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-secondary-100 transition-colors duration-150";

    if (field === sortField) {
      return `${baseClass} text-primary-700 bg-secondary-100`;
    }

    return `${baseClass} text-secondary-500`;
  };

  // Get aria-sort value
  const getAriaSortValue = (field: SortField): "none" | "ascending" | "descending" => {
    if (field !== sortField) return "none";
    return sortDirection === "asc" ? "ascending" : "descending";
  };

  // Function to check if a task belongs to the current user
  const isCurrentUserTask = (task: TaskWithRelations) => {
    return task.assignedToId === user?.id || task.createdById === user?.id;
  };

  // Function to get row class based on task assignment
  const getRowClass = (task: TaskWithRelations) => {
    const baseClass = "hover:bg-secondary-50 transition-colors duration-150";

    if (isCurrentUserTask(task)) {
      return `${baseClass} bg-primary-50`;
    }

    return baseClass;
  };

  if (isLoadingTasks) {
    return <div className="text-center py-8 text-secondary-500">Loading tasks...</div>;
  }

  if (tasks.length === 0) {
    return <div className="text-center py-8 text-secondary-500">No tasks found.</div>;
  }

  if (sortedAndFilteredTasks.length === 0 && searchTerm.trim() !== "") {
    return <div className="text-center py-8 text-secondary-500">No tasks match your search.</div>;
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-secondary-200">
        <thead className="bg-secondary-50">
          <tr>
            <th
              scope="col"
              className={getHeaderClass("title")}
              onClick={() => handleSort("title")}
              title={`Sort by Task Title (${
                sortField === "title"
                  ? `currently ${sortDirection}ending`
                  : "click to sort"
              })`}
              aria-sort={getAriaSortValue("title")}
            >
              <div className="flex items-center">Task {renderSortIndicator("title")}</div>
            </th>
            <th
              scope="col"
              className={getHeaderClass("status")}
              onClick={() => handleSort("status")}
              title={`Sort by Status (${
                sortField === "status"
                  ? `currently ${sortDirection}ending`
                  : "click to sort"
              }). Order: Not Started -> In Progress -> Done -> Rejected`}
              aria-sort={getAriaSortValue("status")}
            >
              <div className="flex items-center">
                Status {renderSortIndicator("status")}
              </div>
            </th>
            <th
              scope="col"
              className={getHeaderClass("assignedTo")}
              onClick={() => handleSort("assignedTo")}
              title={`Sort by Assignee (${
                sortField === "assignedTo"
                  ? `currently ${sortDirection}ending - unassigned tasks ${
                      sortDirection === "asc" ? "last" : "first"
                    }`
                  : "click to sort"
              })`}
              aria-sort={getAriaSortValue("assignedTo")}
            >
              <div className="flex items-center">
                Assigned To {renderSortIndicator("assignedTo")}
              </div>
            </th>
            <th
              scope="col"
              className={getHeaderClass("createdBy")}
              onClick={() => handleSort("createdBy")}
              title={`Sort by Creator (${
                sortField === "createdBy"
                  ? `currently ${sortDirection}ending`
                  : "click to sort"
              })`}
              aria-sort={getAriaSortValue("createdBy")}
            >
              <div className="flex items-center">
                Created By {renderSortIndicator("createdBy")}
              </div>
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-secondary-200">
          {sortedAndFilteredTasks.map((task) => (
            <tr
              key={task.id}
              className={getRowClass(task)}
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-secondary-900">{task.title}</div>
                <div className="text-xs text-secondary-500 mt-1 max-w-xs truncate">
                  {task.description}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <TaskStatusBadge status={task.status} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                {task.assignedTo?.name || "Unassigned"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                {task.createdBy.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <Link
                  href={`/tasks/${task.id}`}
                  className="text-primary-600 hover:text-primary-900"
                >
                  View Details
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 