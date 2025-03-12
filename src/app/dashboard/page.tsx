"use client";

import { SearchBar } from "@/components/dashboard/SearchBar";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { TaskTable } from "@/components/dashboard/TaskTable";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { Button } from "@/components/ui/button";
import { useTasks } from "@/hooks/use-tasks";
import { useAuthStore } from "@/store/auth-store";
import { PlusIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useState } from "react";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const {
    tasks = [],
    isLoadingTasks,
    getCompletedTasks,
    getTasksInProgress,
    getNotStartedTasks
  } = useTasks();

  // Search state
  const [searchTerm, setSearchTerm] = useState<string>("");

  const completedTasks = getCompletedTasks();
  const inProgressTasks = getTasksInProgress();
  const notStartedTasks = getNotStartedTasks();

  return (
    <AuthenticatedLayout>
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
        {/* Stats Cards */}
        <StatsCards
          tasks={tasks}
          isLoadingTasks={isLoadingTasks}
          completedTasks={completedTasks}
          inProgressTasks={inProgressTasks}
          notStartedTasks={notStartedTasks}
        />

        <div className="mt-8">
          <h2 className="text-xl font-medium text-secondary-900 mb-4 font-poppins">
            Recent Tasks
          </h2>

          {/* Search Input */}
          <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

          {/* Task Table */}
          <TaskTable
            tasks={tasks}
            isLoadingTasks={isLoadingTasks}
            searchTerm={searchTerm}
          />
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
