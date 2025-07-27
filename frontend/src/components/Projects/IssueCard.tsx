import React, { useState } from "react";
import { Issue, IssuePriority } from "../../types";
import { useProject } from "../../context/ProjectContext";
import EditIssueModal from "./EditIssueModal";

interface IssueCardProps {
  issue: Issue;
  onDragStart: (e: React.DragEvent, issue: Issue) => void;
  getPriorityColor: (priority: IssuePriority) => string;
}

const IssueCard: React.FC<IssueCardProps> = ({
  issue,
  onDragStart,
  getPriorityColor,
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { deleteIssue } = useProject();

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this issue?")) {
      try {
        await deleteIssue(issue.id);
      } catch (error) {
        console.error("Failed to delete issue:", error);
      }
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditModalOpen(true);
  };

  return (
    <>
      <div
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-move hover:shadow-md transition-shadow"
        draggable
        onDragStart={(e) => onDragStart(e, issue)}
        onClick={() => setIsEditModalOpen(true)}
      >
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-medium text-gray-900 text-sm line-clamp-2">
            {issue.title}
          </h4>
          <div className="flex space-x-1 ml-2">
            <button
              onClick={handleEdit}
              className="text-gray-400 hover:text-indigo-600 text-xs p-1 cursor-pointer"
              title="Edit issue"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="text-gray-400 hover:text-red-600 text-xs p-1 cursor-pointer"
              title="Delete issue"
            >
              Delete
            </button>
          </div>
        </div>

        {issue.description && (
          <p className="text-gray-600 text-xs mb-3 line-clamp-2">
            {issue.description}
          </p>
        )}

        <div className="flex justify-between items-center">
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
              issue.priority
            )}`}
          >
            {issue.priority}
          </span>

          {issue.assignee && (
            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {issue.assignee}
            </div>
          )}
        </div>

        <div className="mt-2 text-xs text-gray-400">
          {new Date(issue.created_at).toLocaleDateString()}
        </div>
      </div>

      <EditIssueModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        issue={issue}
      />
    </>
  );
};

export default IssueCard;
