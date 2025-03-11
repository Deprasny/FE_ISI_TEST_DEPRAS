"use client";

import { Button } from "@/components/ui/button";
import { TaskStatusBadge, getStatusText } from "@/components/ui/task-status-badge";
import { useTasks } from "@/hooks/use-tasks";
import { useUsers } from "@/hooks/use-users";
import { useAuthStore } from "@/store/auth-store";
import { ArrowLeftIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { TaskStatus } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useParams } from "next/navigation";
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

  const { useTask, useTaskHistory, updateTask, isUpdatingTask, deleteTask, isDeletingTask } =
    useTasks();
  const { isLoadingUsers, getTeamMembers } = useUsers();
  const { data: task, isLoading: isLoadingTask } = useTask(taskId);
  const { data: taskHistory, isLoading: isLoadingHistory } = useTaskHistory(taskId);

  const [newStatus, setNewStatus] = useState<TaskStatus | null>(null);
  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState("");
  const [selectedTeamMemberId, setSelectedTeamMemberId] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const teamMembers = getTeamMembers();

  // Initialize form values when task data is loaded
  useEffect(() => {
    if (task) {
      setNewStatus(task.status);
      setDescription(task.description);
      setSelectedTeamMemberId(task.assignedToId || "");
    }
  }, [task]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Update dropdown position when window is resized
  useEffect(() => {
    function handleResize() {
      if (isDropdownOpen) {
        // Force a re-render to update the dropdown position
        setIsDropdownOpen(false);
        setTimeout(() => setIsDropdownOpen(true), 0);
      }
    }

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [isDropdownOpen]);

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
    } = {};

    if (newStatus !== task.status) {
      updateData.status = newStatus as TaskStatus;
    }

    if (description !== task.description) {
      updateData.description = description;
    }

    // Only LEAD users can change assignments
    if (isLead && selectedTeamMemberId !== task.assignedToId) {
      // If empty string, set to null to unassign
      updateData.assignedToId = selectedTeamMemberId || null;
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
            setEditing(false);
          }
        }
      );
    } else {
      setEditing(false);
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
    <div className="min-h-screen bg-secondary-50 p-4 md:p-8 font-poppins">
      <style
        jsx
        global
      >
        {scrollbarStyles}
      </style>
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
                variant={editing ? "default" : "outline"}
                className="flex items-center space-x-1"
                onClick={() => setEditing(!editing)}
              >
                <PencilIcon className="h-4 w-4" />
                <span>{editing ? "Cancel" : "Edit"}</span>
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
              <h1 className="text-2xl font-semibold text-secondary-900">{task.title}</h1>
              <TaskStatusBadge
                status={task.status}
                className="text-sm px-3 py-1"
              />
            </div>

            <div className="mt-6">
              <h2 className="text-sm font-medium text-secondary-500 mb-2">Description</h2>

              {editing ? (
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

            {editing && (
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
            {editing && isLead && (
              <div className="mt-4">
                <h2 className="text-sm font-medium text-secondary-500 mb-2">Task Assignment</h2>
                {isLoadingUsers ? (
                  <div className="text-sm text-secondary-500">Loading team members...</div>
                ) : (
                  <div
                    className="relative"
                    ref={dropdownRef}
                  >
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div
                        className="cursor-pointer w-full border border-secondary-300 rounded-md py-2 pl-3 pr-10 text-left focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setIsDropdownOpen(!isDropdownOpen);
                          } else if (e.key === "Escape" && isDropdownOpen) {
                            setIsDropdownOpen(false);
                          }
                        }}
                        tabIndex={0}
                        role="combobox"
                        aria-expanded={isDropdownOpen}
                        aria-haspopup="listbox"
                        aria-controls="team-member-options"
                      >
                        {selectedTeamMemberId ? (
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-primary-50 flex items-center justify-center text-primary-700 font-semibold mr-2">
                              {selectedTeamMemberId === user.id
                                ? user.name.substring(0, 2).toUpperCase()
                                : teamMembers
                                    .find((m) => m.id === selectedTeamMemberId)
                                    ?.name.substring(0, 2)
                                    .toUpperCase() || "??"}
                            </div>
                            <div>
                              <div className="font-medium">
                                {selectedTeamMemberId === user.id
                                  ? `${user.name} (you)`
                                  : teamMembers.find((m) => m.id === selectedTeamMemberId)?.name ||
                                    "Unknown User"}
                              </div>
                              <div className="text-xs text-secondary-500">
                                {selectedTeamMemberId === user.id
                                  ? user.email
                                  : teamMembers.find((m) => m.id === selectedTeamMemberId)?.email ||
                                    ""}
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

                      {isDropdownOpen && (
                        <div
                          className="fixed mt-1 w-full bg-white shadow-xl rounded-md overflow-hidden origin-top ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                          id="team-member-options"
                          role="listbox"
                          style={{
                            maxHeight: "300px",
                            overflowY: "auto",
                            width: dropdownRef.current
                              ? dropdownRef.current.offsetWidth + "px"
                              : "auto",
                            left: dropdownRef.current
                              ? dropdownRef.current.getBoundingClientRect().left + "px"
                              : "0",
                            top: dropdownRef.current
                              ? dropdownRef.current.getBoundingClientRect().bottom + 5 + "px"
                              : "0",
                            scrollbarWidth: "thin",
                            scrollbarColor: "#CBD5E0 #F7FAFC"
                          }}
                        >
                          <div className="py-1">
                            {/* Unassigned option */}
                            <div
                              className={`px-3 py-2 cursor-pointer hover:bg-primary-50 ${
                                !selectedTeamMemberId ? "bg-primary-50 text-primary-700" : ""
                              }`}
                              onClick={() => {
                                setSelectedTeamMemberId("");
                                setIsDropdownOpen(false);
                              }}
                              role="option"
                              aria-selected={!selectedTeamMemberId}
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  setSelectedTeamMemberId("");
                                  setIsDropdownOpen(false);
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
                                selectedTeamMemberId === user.id
                                  ? "bg-primary-50 text-primary-700"
                                  : ""
                              }`}
                              onClick={() => {
                                setSelectedTeamMemberId(user.id);
                                setIsDropdownOpen(false);
                              }}
                              role="option"
                              aria-selected={selectedTeamMemberId === user.id}
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  setSelectedTeamMemberId(user.id);
                                  setIsDropdownOpen(false);
                                }
                              }}
                            >
                              <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-primary-50 flex items-center justify-center text-primary-700 font-semibold mr-2">
                                  {user.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-medium">{user.name} (you)</div>
                                  <div className="text-xs text-secondary-500">{user.email}</div>
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
                                      selectedTeamMemberId === member.id
                                        ? "bg-primary-50 text-primary-700"
                                        : ""
                                    }`}
                                    onClick={() => {
                                      setSelectedTeamMemberId(member.id);
                                      setIsDropdownOpen(false);
                                    }}
                                    role="option"
                                    aria-selected={selectedTeamMemberId === member.id}
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        setSelectedTeamMemberId(member.id);
                                        setIsDropdownOpen(false);
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
                                          {member.email}
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

            {editing && (
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
                    setEditing(false);
                    setNewStatus(task.status);
                    setDescription(task.description);
                    setSelectedTeamMemberId(task.assignedToId || "");
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
            {isLoadingHistory ? (
              <div className="text-center py-6 text-secondary-500">Loading task history...</div>
            ) : !taskHistory || taskHistory.length === 0 ? (
              <div className="text-center py-6 text-secondary-500">
                No history available for this task.
              </div>
            ) : (
              <div className="relative">
                {/* Timeline vertical line */}
                <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-primary-200"></div>

                <ul className="space-y-12">
                  {taskHistory &&
                    taskHistory.map((history) => (
                      <li
                        key={history.id}
                        className="relative pl-10"
                      >
                        {/* Timeline dot */}
                        <div className="absolute left-0 top-0 w-10 flex items-center justify-center">
                          <div className="h-10 w-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-700 font-semibold z-10 border-4 border-white shadow-sm">
                            {history.user.name.substring(0, 2).toUpperCase()}
                          </div>

                          {/* Connector line from dot to card */}
                          <div className="absolute left-10 top-5 w-4 h-0.5 bg-primary-100"></div>
                        </div>

                        <div className="bg-white rounded-lg border border-secondary-100 p-4 shadow-sm ml-2 hover:shadow-md transition-shadow duration-200 relative">
                          {/* Small triangle pointing to the timeline */}
                          <div className="absolute left-[-8px] top-4 w-4 h-4 bg-white border-l border-b border-secondary-100 transform rotate-45"></div>

                          <div className="flex justify-between mb-2">
                            <div>
                              <p className="text-secondary-900 font-medium">{history.user.name}</p>
                              <p className="text-xs text-secondary-500">{history.user.role}</p>
                            </div>
                            <div className="text-sm text-secondary-500 whitespace-nowrap">
                              {formatDistanceToNow(new Date(history.timestamp), {
                                addSuffix: true
                              })}
                            </div>
                          </div>

                          <div className="border-t border-secondary-100 pt-3 mt-2">
                            <p className="text-secondary-700 font-medium mb-2">
                              {history.action === "TASK_CREATED" ? (
                                <span className="flex items-center">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 mr-1 text-success-500"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  Created this task
                                </span>
                              ) : history.action === "TASK_UPDATED" ? (
                                <span className="flex items-center">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 mr-1 text-warning-500"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                  </svg>
                                  Updated this task
                                </span>
                              ) : history.action === "TASK_DELETED" ? (
                                <span className="flex items-center">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 mr-1 text-danger-500"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  Deleted this task
                                </span>
                              ) : (
                                history.action
                              )}
                            </p>

                            {/* Status changes */}
                            {history.previousStatus && history.newStatus && (
                              <div className="mt-3 text-sm bg-secondary-50 p-2 rounded">
                                <div className="flex items-center text-secondary-700">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 mr-1 text-primary-500"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  Status changed
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-secondary-500 flex items-center">
                                    From:{" "}
                                    <TaskStatusBadge
                                      status={history.previousStatus}
                                      className="ml-1"
                                    />
                                  </span>
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 text-secondary-400 mx-2"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  <span className="text-secondary-500 flex items-center">
                                    To:{" "}
                                    <TaskStatusBadge
                                      status={history.newStatus}
                                      className="ml-1"
                                    />
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Description changes */}
                            {history.previousDesc && history.newDesc && (
                              <div className="mt-3 text-sm bg-secondary-50 p-2 rounded">
                                <div className="flex items-center text-secondary-700">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 mr-1 text-primary-500"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  Description updated
                                </div>
                              </div>
                            )}

                            {/* Title changes */}
                            {history.previousTitle && history.newTitle && (
                              <div className="mt-3 text-sm bg-secondary-50 p-2 rounded">
                                <div className="flex items-center text-secondary-700">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 mr-1 text-primary-500"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                  </svg>
                                  Title changed
                                </div>
                                <div className="mt-1 text-secondary-500">
                                  From:{" "}
                                  <span className="font-medium">
                                    &ldquo;{history.previousTitle}&rdquo;
                                  </span>
                                </div>
                                <div className="mt-1 text-secondary-500">
                                  To:{" "}
                                  <span className="font-medium">
                                    &ldquo;{history.newTitle}&rdquo;
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Assignment changes */}
                            {(history.previousAssignee || history.newAssignee) &&
                              history.previousAssignee !== history.newAssignee && (
                                <div className="mt-3 text-sm bg-secondary-50 p-2 rounded">
                                  <div className="flex items-center text-secondary-700">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-4 w-4 mr-1 text-primary-500"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                                    </svg>
                                    {!history.previousAssignee
                                      ? "Task assigned"
                                      : !history.newAssignee
                                      ? "Task unassigned"
                                      : "Assignment changed"}
                                  </div>
                                </div>
                              )}
                          </div>
                        </div>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
