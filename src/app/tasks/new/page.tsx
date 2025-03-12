"use client";

import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTasks } from "@/hooks/use-tasks";
import { useUsers } from "@/hooks/use-users";
import { useAuthStore } from "@/store/auth-store";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

export default function NewTaskPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { createTask, isCreatingTask } = useTasks();
  const { isLoadingUsers, getTeamMembers } = useUsers();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTeamMemberId, setSelectedTeamMemberId] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({});

  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownButtonRef = useRef<HTMLDivElement>(null);

  const teamMembers = getTeamMembers();

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current && 
        dropdownButtonRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        !dropdownButtonRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Only LEAD users can access this page
  if (user?.role !== "LEAD") {
    router.push("/dashboard");
    return null;
  }

  const validateForm = () => {
    const newErrors: { title?: string; description?: string } = {};
    let isValid = true;

    if (!title.trim()) {
      newErrors.title = "Title is required";
      isValid = false;
    }

    if (!description.trim()) {
      newErrors.description = "Description is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    let assignedToId: string | undefined;

    if (selectedTeamMemberId) {
      assignedToId = selectedTeamMemberId;
    }

    createTask(
      {
        title,
        description,
        assignedToId
      },
      {
        onSuccess: () => {
          router.push("/dashboard");
        }
      }
    );
  };

  return (
    <AuthenticatedLayout>
      <style
        jsx
        global
      >
        {scrollbarStyles}
      </style>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
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

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6 border-b border-secondary-100">
            <h1 className="text-2xl font-semibold text-secondary-900">Create New Task</h1>
          </div>

          <form
            onSubmit={handleSubmit}
            className="p-6"
          >
            <div className="space-y-6">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-secondary-700 mb-1"
                >
                  Task Title <span className="text-danger-500">*</span>
                </label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full ${
                    errors.title ? "border-danger-500 focus:ring-danger-500" : ""
                  }`}
                  placeholder="Enter task title"
                />
                {errors.title && <p className="mt-1 text-sm text-danger-600">{errors.title}</p>}
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-secondary-700 mb-1"
                >
                  Description <span className="text-danger-500">*</span>
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full p-2 border border-secondary-200 rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                    errors.description ? "border-danger-500 focus:ring-danger-500" : ""
                  }`}
                  rows={6}
                  placeholder="Enter task description"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-danger-600">{errors.description}</p>
                )}
              </div>

              <div>
                <h3 className="block text-sm font-medium text-secondary-700 mb-2">
                  Task Assignment
                </h3>

                {isLoadingUsers ? (
                  <div className="text-sm text-secondary-500">Loading team members...</div>
                ) : teamMembers.length === 0 ? (
                  <div className="text-sm text-secondary-500">No team members available</div>
                ) : (
                  <div className="relative">
                    <div 
                      className="mt-1 relative rounded-md shadow-sm"
                      ref={dropdownButtonRef}
                    >
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
                              {teamMembers
                                .find((m) => m.id === selectedTeamMemberId)
                                ?.name.substring(0, 2)
                                .toUpperCase() || "??"}
                            </div>
                            <div>
                              <div className="font-medium">
                                {teamMembers.find((m) => m.id === selectedTeamMemberId)?.name ||
                                  "Unknown User"}
                              </div>
                              <div className="text-xs text-secondary-500">
                                {teamMembers.find((m) => m.id === selectedTeamMemberId)?.email ||
                                  ""}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-secondary-500">Select a team member</div>
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
                            {/* Option to select none/unassigned */}
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
                                <div className="font-medium">Select None</div>
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
                                    <div className="text-xs text-secondary-500">{member.email}</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <p className="mt-1 text-xs text-secondary-500">
                  Optional: Leave unselected to create an unassigned task
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <Link href="/dashboard">
                  <Button
                    variant="outline"
                    type="button"
                  >
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={isCreatingTask}
                >
                  {isCreatingTask ? "Creating..." : "Create Task"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
