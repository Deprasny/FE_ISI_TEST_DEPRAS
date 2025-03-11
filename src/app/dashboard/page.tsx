"use client";

import { Button } from "@/components/ui/button";
import { TaskStatusBadge } from "@/components/ui/task-status-badge";
import { useTasks } from "@/hooks/use-tasks";
import { TaskWithRelations } from "@/lib/api/task-service";
import { useAuthStore } from "@/store/auth-store";
import { ChevronDownIcon, ChevronUpIcon, PlusIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Define sorting types
type SortField = "title" | "status" | "assignedTo" | "createdBy";
type SortDirection = "asc" | "desc";

export default function DashboardPage() {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();
  const {
    tasks = [],
    isLoadingTasks,
    getCompletedTasks,
    getTasksInProgress,
    getNotStartedTasks
  } = useTasks();

  // Sorting state
  const [sortField, setSortField] = useState<SortField>("title");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const handleLogout = () => {
    clearAuth();
    router.push("/auth/login");
  };

  const completedTasks = getCompletedTasks();
  const inProgressTasks = getTasksInProgress();
  const notStartedTasks = getNotStartedTasks();

  // Sort tasks based on current sorting state
  const sortedTasks = [...tasks].sort((a, b) => {
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

  // Filter tasks by search term
  const filteredTasks =
    searchTerm.trim() === ""
      ? sortedTasks
      : sortedTasks.filter(
          (task) =>
            task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (task.assignedTo?.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            task.createdBy.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

  return (
    <div className="min-h-screen bg-secondary-50 font-poppins">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-600 to-primary-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">TM</span>
            </div>
            <span className="font-semibold text-secondary-900 text-lg">TaskMaster</span>
          </div>

          <div className="flex items-center">
            <div className="mr-4 text-sm text-secondary-600">
              Welcome,{" "}
              <span className="font-medium text-secondary-900">{user?.name || "User"}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="font-poppins"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-secondary-900 font-poppins">Dashboard</h1>

          {user?.role === "LEAD" && (
            <Link href="/tasks/new">
              <Button className="flex items-center space-x-1">
                <PlusIcon className="h-4 w-4" />
                <span>New Task</span>
              </Button>
            </Link>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
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

          <div className="mt-8">
            <h2 className="text-xl font-medium text-secondary-900 mb-4 font-poppins">
              Recent Tasks
            </h2>

            {/* Search Input */}
            <div className="mb-4">
              <div className="relative max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Search tasks by title, description, or person..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Search tasks"
                />
              </div>
            </div>

            {isLoadingTasks ? (
              <div className="text-center py-8 text-secondary-500">Loading tasks...</div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-8 text-secondary-500">No tasks found.</div>
            ) : (
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
                    {filteredTasks.map((task) => (
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
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
