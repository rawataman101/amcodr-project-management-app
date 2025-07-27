import React, { useState, useEffect } from "react";
import { useProject } from "../../context/ProjectContext";
import { IssueStatus, IssuePriority } from "../../types";

interface CreateIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
}

const CreateIssueModal: React.FC<CreateIssueModalProps> = ({
  isOpen,
  onClose,
  projectId,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<IssueStatus>(IssueStatus.TODO);
  const [priority, setPriority] = useState<IssuePriority>(IssuePriority.MEDIUM);
  const [assignee, setAssignee] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { createIssue } = useProject();

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setDescription("");
      setStatus(IssueStatus.TODO);
      setPriority(IssuePriority.MEDIUM);
      setAssignee("");
      setError("");
    }
  }, [isOpen]);

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

    setError("");
    setLoading(true);

    try {
      await createIssue(projectId, {
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        assignee: assignee.trim() || undefined,
      });

      handleClose();
    } catch (err: any) {
      console.error("Error creating issue:", err);
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Failed to create issue. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return; // Prevent closing while loading

    setTitle("");
    setDescription("");
    setStatus(IssueStatus.TODO);
    setPriority(IssuePriority.MEDIUM);
    setAssignee("");
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="issue-modal-title"
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
                  <h3
                    id="issue-modal-title"
                    className="text-lg leading-6 font-medium text-gray-900 mb-4"
                  >
                    Create New Issue
                  </h3>

                  {error && (
                    <div
                      className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"
                      role="alert"
                    >
                      {error}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="issue-title"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Issue Title *
                      </label>
                      <input
                        type="text"
                        id="issue-title"
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
                        htmlFor="issue-description"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Description
                      </label>
                      <textarea
                        id="issue-description"
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
                          htmlFor="issue-status"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Status
                        </label>
                        <select
                          id="issue-status"
                          value={status}
                          onChange={(e) =>
                            setStatus(e.target.value as IssueStatus)
                          }
                          disabled={loading}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                          htmlFor="issue-priority"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Priority
                        </label>
                        <select
                          id="issue-priority"
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
                        htmlFor="issue-assignee"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Assignee
                      </label>
                      <input
                        type="text"
                        id="issue-assignee"
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
                disabled={loading || !title.trim()}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? (
                  <span className="flex items-center">Creating...</span>
                ) : (
                  "Create Issue"
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

export default CreateIssueModal;
