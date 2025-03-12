"use client";

import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { TaskHistoryList } from "@/components/task/TaskHistoryList";
import { Button } from "@/components/ui/button";
import { TaskStatusBadge, getStatusText } from "@/components/ui/task-status-badge";
import { useTasks } from "@/hooks/use-tasks";
import { useUsers } from "@/hooks/use-users";
import { useAuthStore } from "@/store/auth-store";
import { ArrowLeftIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { TaskStatus } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Custom scrollbar styles for Webkit browsers
const scrollbarStyles = `
  ::-webkit-scrollbar {
    width: 6px;
  }
  ::-webkit-scrollbar-track {
    background: #F7FAFC;
  }
  ::-webkit-scrollbar-thumb {
    background-color: #CBD5E0;
    border-radius: 3px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #A0AEC0;
  }
`;

export default function TaskDetailPage() {
  const { user } = useAuthStore();
  const params = useParams();
  const taskId = params.id as string;
  const router = useRouter();
  const { 
    useTask, 
    useTaskHistory, 
    useInfiniteTaskHistory,
    updateTask, 
    isUpdatingTask, 
    deleteTask, 
    isDeletingTask 
  } = useTasks();
  const { users, isLoadingUsers, getTeamMembers } = useUsers();
  const { data: task, isLoading: isLoadingTask } = useTask(taskId);
  
  // Replace regular task history with infinite query
  const {
    data: infiniteTaskHistory,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingHistory
  } = useInfiniteTaskHistory(taskId, 5); // Load 5 items per page

  const [newStatus, setNewStatus] = useState<TaskStatus | null>(null);
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownButtonRef = useRef<HTMLDivElement>(null);

  const teamMembers = getTeamMembers();

  // Flatten the pages of task history items
  const taskHistory = infiniteTaskHistory?.pages.flatMap(page => page?.items || []) || [];

  // Setup intersection observer for infinite scrolling
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.5 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Initialize form values when task data is loaded
  useEffect(() => {
    if (task) {
      setNewStatus(task.status);
      setDescription(task.description);
      setSelectedAssigneeId(task.assignedToId || null);
      setTitle(task.title);
    }
  }, [task]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current && 
        dropdownButtonRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        !dropdownButtonRef.current.contains(event.target as Node)
      ) {
        setIsAssigneeDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Check if current user is assigned to this task
  const isAssigned = task?.assignedToId === user?.id;
  const isLead = user?.role === "LEAD";
  const canEdit = isLead || isAssigned;

  const handleStatusChange = (status: TaskStatus) => {
    setNewStatus(status);
  };

  const handleUpdate = () => {
    if (!task) return;

    // Only include fields that have changed
    const updateData: {
      status?: TaskStatus;
      description?: string;
      assignedToId?: string | null;
      title?: string;
    } = {};

    if (newStatus !== task.status) {
      updateData.status = newStatus as TaskStatus;
    }

    if (description !== task.description) {
      updateData.description = description;
    }

    if (title !== task.title) {
      updateData.title = title;
    }

    // Only LEAD users can change assignments
    if (isLead && selectedAssigneeId !== task.assignedToId) {
      // If empty string, set to null to unassign
      updateData.assignedToId = selectedAssigneeId || null;
    }

    // Only update if there are changes
    if (Object.keys(updateData).length > 0) {
      updateTask(
        {
          id: taskId,
          data: updateData
        },
        {
          onSuccess: () => {
            setIsEditMode(false);
          }
        }
      );
    } else {
      setIsEditMode(false);
    }
  };

  const handleDelete = () => {
    if (
      window.confirm("Are you sure you want to delete this task? This action cannot be undone.")
    ) {
      deleteTask(taskId, {
        onSuccess: () => {
          // The router.push is handled in the useTasks hook
        }
      });
    }
  };

  if (isLoadingTask) {
    return (
      <div className="min-h-screen bg-secondary-50 p-8 flex justify-center items-center">
        <div className="text-secondary-600">Loading task details...</div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-secondary-50 p-8">
        <div className="max-w-4xl mx-auto bg-white shadow rounded-lg p-8">
          <h1 className="text-2xl font-semibold text-secondary-900 mb-6">Task Not Found</h1>
          <p className="text-secondary-600 mb-4">
            The task you are looking for does not exist or has been deleted.
          </p>
          <Link href="/dashboard">
            <Button
              variant="outline"
              className="flex items-center space-x-2"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <AuthenticatedLayout>
      <style jsx global>
        {scrollbarStyles}
      </style>
      <div className="min-h-screen bg-secondary-50 p-4 md:p-8 font-poppins">
      <div className="max-w-4xl mx-auto">
        {/* Back button and actions */}
        <div className="flex justify-between items-center mb-6">
          <Link href="/dashboard">
            <Button
              variant="outline"
              className="flex items-center space-x-2"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span>Back</span>
            </Button>
          </Link>

          <div className="flex space-x-2">
            {canEdit && (
              <Button
                  variant={isEditMode ? "default" : "outline"}
                className="flex items-center space-x-1"
                  onClick={() => setIsEditMode(!isEditMode)}
              >
                <PencilIcon className="h-4 w-4" />
                  <span>{isEditMode ? "Cancel" : "Edit"}</span>
              </Button>
            )}

            {isLead && (
              <Button
                variant="outline"
                className="flex items-center space-x-1 text-danger-600 hover:text-danger-800 border-danger-200 hover:border-danger-300 hover:bg-danger-50"
                onClick={handleDelete}
                disabled={isDeletingTask}
              >
                <TrashIcon className="h-4 w-4" />
                <span>Delete</span>
              </Button>
            )}
          </div>
        </div>

        {/* Task Details */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6 border-b border-secondary-100">
            <div className="flex justify-between items-start">
                {isEditMode ? (
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-2xl font-semibold text-secondary-900 w-full p-2 border border-secondary-200 rounded-md focus:ring-primary-500 focus:border-primary-500 mb-2"
                    placeholder="Task title"
                  />
                ) : (
              <h1 className="text-2xl font-semibold text-secondary-900">{task.title}</h1>
                )}
              <TaskStatusBadge
                status={task.status}
                className="text-sm px-3 py-1"
              />
            </div>

            <div className="mt-6">
              <h2 className="text-sm font-medium text-secondary-500 mb-2">Description</h2>

                {isEditMode ? (
                <div className="mb-4">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-2 border border-secondary-200 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    rows={4}
                  />
                </div>
              ) : (
                <p className="text-secondary-700 whitespace-pre-wrap">{task.description}</p>
              )}
            </div>

              {isEditMode && (
              <div className="mt-4">
                <h2 className="text-sm font-medium text-secondary-500 mb-2">Status</h2>
                <div className="flex flex-wrap gap-2">
                  {Object.values(TaskStatus).map((status) => {
                    const isSelected = newStatus === status;
                    return (
                      <button
                        key={status}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          isSelected
                            ? `bg-primary-100 text-primary-800 ring-2 ring-offset-2 ring-primary-500`
                            : "bg-secondary-50 text-secondary-700 hover:bg-secondary-100"
                        }`}
                        onClick={() => handleStatusChange(status as TaskStatus)}
                      >
                        {getStatusText(status as TaskStatus)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Allow only LEAD users to change assignment */}
              {isEditMode && isLead && (
              <div className="mt-4">
                <h2 className="text-sm font-medium text-secondary-500 mb-2">Task Assignment</h2>
                  {isLoadingHistory ? (
                  <div className="text-sm text-secondary-500">Loading team members...</div>
                  ) : !taskHistory || taskHistory.length === 0 ? (
                    <div className="text-center py-6 text-secondary-500">
                      No history available for this task.
                    </div>
                ) : (
                  <div
                    className="relative"
                  >
                    <div 
                      className="mt-1 relative rounded-md shadow-sm"
                      ref={dropdownButtonRef}
                    >
                      <div
                        className="cursor-pointer w-full border border-secondary-300 rounded-md py-2 pl-3 pr-10 text-left focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        onClick={() => setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen);
                          } else if (e.key === "Escape" && isAssigneeDropdownOpen) {
                            setIsAssigneeDropdownOpen(false);
                          }
                        }}
                        tabIndex={0}
                        role="combobox"
                        aria-expanded={isAssigneeDropdownOpen}
                        aria-haspopup="listbox"
                        aria-controls="team-member-options"
                      >
                          {selectedAssigneeId ? (
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-primary-50 flex items-center justify-center text-primary-700 font-semibold mr-2">
                                {selectedAssigneeId === user.id
                                ? user.name.substring(0, 2).toUpperCase()
                                : teamMembers
                                      .find((m) => m.id === selectedAssigneeId)
                                    ?.name.substring(0, 2)
                                    .toUpperCase() || "??"}
                            </div>
                            <div>
                              <div className="font-medium">
                                  {selectedAssigneeId === user.id
                                  ? `${user.name} (you)`
                                    : teamMembers.find((m) => m.id === selectedAssigneeId)?.name ||
                                    "Unknown User"}
                              </div>
                              <div className="text-xs text-secondary-500">
                                  {selectedAssigneeId === user.id
                                    ? (user.email || "")
                                    : (teamMembers.find((m) => m.id === selectedAssigneeId)?.email || "")}
                                </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-secondary-500">Unassigned</div>
                        )}
                        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-secondary-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </span>
                      </div>

                        {isAssigneeDropdownOpen && (
                        <div
                          ref={dropdownRef}
                          className="fixed z-[1000] mt-1 bg-white shadow-lg rounded-md overflow-auto border border-secondary-200"
                          id="team-member-options"
                          role="listbox"
                          style={{
                            maxHeight: "250px",
                            overflowY: "auto",
                            width: dropdownButtonRef.current ? dropdownButtonRef.current.offsetWidth + "px" : "auto",
                            left: dropdownButtonRef.current ? dropdownButtonRef.current.getBoundingClientRect().left + "px" : "0",
                            top: dropdownButtonRef.current ? dropdownButtonRef.current.getBoundingClientRect().bottom + 5 + "px" : "0"
                          }}
                        >
                          <div className="py-1">
                            {/* Unassigned option */}
                            <div
                              className={`px-3 py-2 cursor-pointer hover:bg-primary-50 ${
                                  !selectedAssigneeId ? "bg-primary-50 text-primary-700" : ""
                              }`}
                              onClick={() => {
                                  setSelectedAssigneeId(null);
                                  setIsAssigneeDropdownOpen(false);
                              }}
                              role="option"
                                aria-selected={!selectedAssigneeId}
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                    setSelectedAssigneeId(null);
                                    setIsAssigneeDropdownOpen(false);
                                }
                              }}
                            >
                              <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-500 mr-2">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                    />
                                  </svg>
                                </div>
                                <div className="font-medium">Unassigned</div>
                              </div>
                            </div>

                            {/* Lead User (You) */}
                            <div className="px-3 py-1.5 bg-secondary-50 text-xs font-semibold text-secondary-500">
                              LEAD
                            </div>
                            <div
                              className={`px-3 py-2 cursor-pointer hover:bg-primary-50 ${
                                  selectedAssigneeId === user.id
                                  ? "bg-primary-50 text-primary-700"
                                  : ""
                              }`}
                              onClick={() => {
                                  setSelectedAssigneeId(user.id);
                                  setIsAssigneeDropdownOpen(false);
                              }}
                              role="option"
                                aria-selected={selectedAssigneeId === user.id}
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                    setSelectedAssigneeId(user.id);
                                    setIsAssigneeDropdownOpen(false);
                                }
                              }}
                            >
                              <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-primary-50 flex items-center justify-center text-primary-700 font-semibold mr-2">
                                  {user.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-medium">{user.name} (you)</div>
                                    <div className="text-xs text-secondary-500">
                                      {user.email || ""}
                                    </div>
                                  </div>
                              </div>
                            </div>

                            {/* Team members */}
                            {teamMembers.length > 0 && (
                              <>
                                <div className="px-3 py-1.5 bg-secondary-50 text-xs font-semibold text-secondary-500">
                                  TEAM MEMBERS
                                </div>
                                {teamMembers.map((member) => (
                                  <div
                                    key={member.id}
                                    className={`px-3 py-2 cursor-pointer hover:bg-primary-50 ${
                                        selectedAssigneeId === member.id
                                        ? "bg-primary-50 text-primary-700"
                                        : ""
                                    }`}
                                    onClick={() => {
                                        setSelectedAssigneeId(member.id);
                                        setIsAssigneeDropdownOpen(false);
                                    }}
                                    role="option"
                                      aria-selected={selectedAssigneeId === member.id}
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                          setSelectedAssigneeId(member.id);
                                          setIsAssigneeDropdownOpen(false);
                                      }
                                    }}
                                  >
                                    <div className="flex items-center">
                                      <div className="h-8 w-8 rounded-full bg-primary-50 flex items-center justify-center text-primary-700 font-semibold mr-2">
                                        {member.name.substring(0, 2).toUpperCase()}
                                      </div>
                                      <div>
                                        <div className="font-medium">{member.name}</div>
                                        <div className="text-xs text-secondary-500">
                                            {member.email || ""}
                                          </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

              {isEditMode && (
              <div className="mt-6">
                <Button
                  onClick={handleUpdate}
                  disabled={isUpdatingTask}
                  className="mr-2"
                >
                  {isUpdatingTask ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                      setIsEditMode(false);
                    setNewStatus(task.status);
                    setDescription(task.description);
                      setSelectedAssigneeId(task.assignedToId || null);
                      setTitle(task.title);
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>

          <div className="p-6 bg-secondary-50">
            <div className="flex flex-col sm:flex-row sm:justify-between mb-4">
              <div className="mb-2 sm:mb-0">
                <h2 className="text-sm font-medium text-secondary-500">Created by</h2>
                <p className="text-secondary-700">{task.createdBy.name}</p>
              </div>

              <div className="mb-2 sm:mb-0">
                <h2 className="text-sm font-medium text-secondary-500">Assigned to</h2>
                <p className="text-secondary-700">{task.assignedTo?.name || "Unassigned"}</p>
              </div>

              <div>
                <h2 className="text-sm font-medium text-secondary-500">Created</h2>
                <p className="text-secondary-700">
                  {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Task History */}
        <div className="mt-8 bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6 border-b border-secondary-100">
            <h2 className="text-xl font-semibold text-secondary-900">Task History</h2>
          </div>

          <div className="p-6">
              <TaskHistoryList taskId={taskId} users={users} />
              </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
