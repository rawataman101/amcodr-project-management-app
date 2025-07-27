import React, { useState, useEffect } from "react";
import { useProject } from "../../context/ProjectContext";
import { Issue, IssueStatus, IssuePriority } from "../../types";

interface EditIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  issue: Issue;
}

const EditIssueModal: React.FC<EditIssueModalProps> = ({
  isOpen,
  onClose,
  issue,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<IssueStatus>(IssueStatus.TODO);
  const [priority, setPriority] = useState<IssuePriority>(IssuePriority.MEDIUM);
  const [assignee, setAssignee] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const { updateIssue } = useProject();

  useEffect(() => {
    if (issue && isOpen) {
      setTitle(issue.title);
      setDescription(issue.description || "");
      setStatus(issue.status);
      setPriority(issue.priority);
      setAssignee(issue.assignee || "");
      setError("");
      setHasChanges(false);
    }
  }, [issue, isOpen]);

  useEffect(() => {
    if (issue) {
      const titleChanged = title !== issue.title;
      const descChanged = description !== (issue.description || "");
      const statusChanged = status !== issue.status;
      const priorityChanged = priority !== issue.priority;
      const assigneeChanged = assignee !== (issue.assignee || "");

      setHasChanges(
        titleChanged ||
          descChanged ||
          statusChanged ||
          priorityChanged ||
          assigneeChanged
      );
    }
  }, [title, description, status, priority, assignee, issue]);

  // Handle escape key and body scroll
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate input
    if (!title.trim()) {
      setError("Issue title is required");
      return;
    }

    if (!hasChanges) {
      handleClose();
      return;
    }

    setError("");
    setLoading(true);

    try {
      await updateIssue(issue.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        assignee: assignee.trim() || undefined,
      });

      handleClose();
    } catch (err: any) {
      console.error("Error updating issue:", err);
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Failed to update issue. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return; // Prevent closing while loading

    setError("");
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Format enum values for display
  const formatEnumValue = (value: string): string => {
    return value
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Get priority color for visual feedback
  const getPriorityColor = (priority: IssuePriority): string => {
    switch (priority) {
      case IssuePriority.LOW:
        return "text-green-600";
      case IssuePriority.MEDIUM:
        return "text-yellow-600";
      case IssuePriority.HIGH:
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  // Get status color for visual feedback
  const getStatusColor = (status: IssueStatus): string => {
    switch (status) {
      case IssueStatus.TODO:
        return "text-gray-600";
      case IssueStatus.IN_PROGRESS:
        return "text-blue-600";
      case IssueStatus.DONE:
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  if (!isOpen || !issue) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-issue-modal-title"
    >
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          onClick={handleBackdropClick}
        />

        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>

        <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="w-full mt-3 text-center sm:mt-0 sm:text-left">
                  <div className="flex items-center justify-between mb-4">
                    <h3
                      id="edit-issue-modal-title"
                      className="text-lg leading-6 font-medium text-gray-900"
                    >
                      Edit Issue
                    </h3>
                    <span className="text-sm text-gray-500">
                      ID: #{issue.id}
                    </span>
                  </div>

                  {error && (
                    <div
                      className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"
                      role="alert"
                    >
                      {error}
                    </div>
                  )}

                  {hasChanges && (
                    <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
                      <div className="flex">
                        <div className="ml-3">
                          <p className="text-sm">You have unsaved changes</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="edit-issue-title"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Issue Title *
                      </label>
                      <input
                        type="text"
                        id="edit-issue-title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        autoFocus
                        disabled={loading}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="Enter issue title"
                        maxLength={200}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="edit-issue-description"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Description
                      </label>
                      <textarea
                        id="edit-issue-description"
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={loading}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed resize-vertical"
                        placeholder="Enter issue description (optional)"
                        maxLength={1000}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="edit-issue-status"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Status
                        </label>
                        <select
                          id="edit-issue-status"
                          value={status}
                          onChange={(e) =>
                            setStatus(e.target.value as IssueStatus)
                          }
                          disabled={loading}
                          className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed ${getStatusColor(
                            status
                          )}`}
                        >
                          {Object.values(IssueStatus).map((statusValue) => (
                            <option key={statusValue} value={statusValue}>
                              {formatEnumValue(statusValue)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="edit-issue-priority"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Priority
                        </label>
                        <select
                          id="edit-issue-priority"
                          value={priority}
                          onChange={(e) =>
                            setPriority(e.target.value as IssuePriority)
                          }
                          disabled={loading}
                          className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed ${getPriorityColor(
                            priority
                          )}`}
                        >
                          {Object.values(IssuePriority).map((priorityValue) => (
                            <option key={priorityValue} value={priorityValue}>
                              {formatEnumValue(priorityValue)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="edit-issue-assignee"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Assignee
                      </label>
                      <input
                        type="text"
                        id="edit-issue-assignee"
                        value={assignee}
                        onChange={(e) => setAssignee(e.target.value)}
                        disabled={loading}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="Enter assignee name (optional)"
                        maxLength={100}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={loading || !title.trim() || !hasChanges}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? (
                  <span className="flex items-center">Updating...</span>
                ) : hasChanges ? (
                  "Update Issue"
                ) : (
                  "No Changes"
                )}
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditIssueModal;
