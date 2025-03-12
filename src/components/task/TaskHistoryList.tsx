import { useTasks } from "@/hooks/use-tasks";
import { User } from "@/lib/api/user-service";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useRef, useState } from "react";
import { TaskStatusBadge } from "../ui/task-status-badge";

interface TaskHistoryListProps {
  taskId: string;
  users?: User[];
}

export function TaskHistoryList({ taskId, users }: TaskHistoryListProps) {
  const { useInfiniteTaskHistory } = useTasks();
  const [autoLoadEnabled, setAutoLoadEnabled] = useState(false);
  
  const {
    data: infiniteTaskHistory,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteTaskHistory(taskId, 5); // Load 5 items per page

  // Create a ref for the intersection observer
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Flatten the pages of task history items
  const taskHistory = infiniteTaskHistory?.pages.flatMap(page => page?.items || []) || [];

  // Setup intersection observer for infinite scrolling
  useEffect(() => {
    if (!hasNextPage || !autoLoadEnabled) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px 200px 0px" } // Start loading earlier when user approaches bottom
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
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, autoLoadEnabled]);

  if (isLoading && !taskHistory.length) {
    return <div className="text-center py-6 text-secondary-500">Loading task history...</div>;
  }

  if (!taskHistory.length) {
    return (
      <div className="text-center py-6 text-secondary-500">
        No history available for this task.
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline vertical line */}
      <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-primary-200"></div>

      <ul className="space-y-12">
        {taskHistory.map((history) => (
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
                    <div className="mt-1 text-secondary-500">
                      <div className="font-medium mb-1">From:</div>
                      <div className="bg-white p-2 rounded border border-secondary-200 text-xs max-h-20 overflow-y-auto">
                        {history.previousDesc}
                      </div>
                    </div>
                    <div className="mt-2 text-secondary-500">
                      <div className="font-medium mb-1">To:</div>
                      <div className="bg-white p-2 rounded border border-secondary-200 text-xs max-h-20 overflow-y-auto">
                        {history.newDesc}
                      </div>
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
                      <div className="flex items-center justify-between mt-2">
                        {history.previousAssignee && (
                          <span className="text-secondary-500 flex items-center">
                            From:{" "}
                            <span className="ml-1 font-medium">
                              {users?.find((u) => u.id === history.previousAssignee)?.name || "Unknown"}
                            </span>
                          </span>
                        )}
                        {history.previousAssignee && history.newAssignee && (
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
                        )}
                        {history.newAssignee && (
                          <span className="text-secondary-500 flex items-center">
                            To:{" "}
                            <span className="ml-1 font-medium">
                              {users?.find((u) => u.id === history.newAssignee)?.name || "Unknown"}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Loading indicator and Load More button at the bottom */}
      <div 
        ref={loadMoreRef} 
        className="text-center py-4 mt-4"
      >
        {hasNextPage && (
          <div className="flex flex-col items-center">
            {isFetchingNextPage ? (
              <div className="flex items-center justify-center space-x-2 mb-4">
                <div className="animate-pulse flex space-x-2">
                  <div className="h-2 w-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div className="h-2 w-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                  <div className="h-2 w-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                </div>
                <span className="text-sm text-secondary-500">Loading more history...</span>
              </div>
            ) : (
              <button
                onClick={() => fetchNextPage()}
                className="px-4 py-2 bg-primary-50 text-primary-600 rounded-md hover:bg-primary-100 transition-colors duration-200 mb-4"
              >
                Load More History
              </button>
            )}
            
            {/* Auto-load toggle - moved below the button and styled as a secondary option */}
            <div className="flex items-center space-x-2 text-sm text-secondary-500 mt-2">
              <input
                type="checkbox"
                id="autoload-toggle"
                checked={autoLoadEnabled}
                onChange={() => setAutoLoadEnabled(!autoLoadEnabled)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
              />
              <label htmlFor="autoload-toggle">
                Auto-load when scrolling (optional)
              </label>
            </div>
          </div>
        )}
        
        {!hasNextPage && taskHistory.length > 0 && (
          <div className="text-sm text-secondary-500 border-t border-secondary-100 pt-4">
            You&apos;ve reached the end of the task history
          </div>
        )}
      </div>
    </div>
  );
} 