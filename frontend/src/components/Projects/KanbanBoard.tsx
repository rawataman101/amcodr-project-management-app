import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useProject } from "../../context/ProjectContext";
import { useAuth } from "../../context/AuthContext";
import { Issue, IssueStatus, IssuePriority } from "../../types";
import IssueCard from "./IssueCard";
import CreateIssueModal from "./CreateIssueModal";

const KanbanBoard: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const {
    currentProject,
    setCurrentProject,
    issues,
    fetchIssues,
    updateIssue,
  } = useProject();
  const { logout } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [draggedIssue, setDraggedIssue] = useState<Issue | null>(null);

  useEffect(() => {
    if (projectId) {
      fetchIssues(parseInt(projectId));
    }
  }, [projectId, fetchIssues]);

  const columns = [
    { status: IssueStatus.TODO, title: "To Do", color: "bg-gray-100" },
    {
      status: IssueStatus.IN_PROGRESS,
      title: "In Progress",
      color: "bg-blue-100",
    },
    { status: IssueStatus.DONE, title: "Done", color: "bg-green-100" },
  ];

  const getIssuesForStatus = (status: IssueStatus) => {
    return issues.filter((issue) => issue.status === status);
  };

  const handleDragStart = (e: React.DragEvent, issue: Issue) => {
    setDraggedIssue(issue);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, newStatus: IssueStatus) => {
    e.preventDefault();

    if (draggedIssue && draggedIssue.status !== newStatus) {
      try {
        await updateIssue(draggedIssue.id, { status: newStatus });
      } catch (error) {
        console.error("Failed to update issue status:", error);
      }
    }

    setDraggedIssue(null);
  };

  const getPriorityColor = (priority: IssuePriority) => {
    switch (priority) {
      case IssuePriority.HIGH:
        return "bg-red-100 text-red-800";
      case IssuePriority.MEDIUM:
        return "bg-yellow-100 text-yellow-800";
      case IssuePriority.LOW:
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex-grow:1 items-center space-x-4 justify-evenly">
              <Link
                to="/projects"
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                ← Back to Projects
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">
                {currentProject?.title || "Project Board"}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                New Issue
              </button>
              <button
                onClick={logout}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {columns.map((column) => (
              <div
                key={column.status}
                className={`${column.color} rounded-lg p-4`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.status)}
              >
                <h3 className="font-semibold text-lg mb-4 text-gray-800">
                  {column.title}
                  <span className="ml-2 text-sm text-gray-600">
                    ({getIssuesForStatus(column.status).length})
                  </span>
                </h3>

                <div className="space-y-3">
                  {getIssuesForStatus(column.status).map((issue) => (
                    <IssueCard
                      key={issue.id}
                      issue={issue}
                      onDragStart={handleDragStart}
                      getPriorityColor={getPriorityColor}
                    />
                  ))}

                  {getIssuesForStatus(column.status).length === 0 && (
                    <div className="text-gray-500 text-sm text-center py-8 border-2 border-dashed border-gray-300 rounded">
                      No issues
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {projectId && (
        <CreateIssueModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          projectId={parseInt(projectId)}
        />
      )}
    </div>
  );
};

export default KanbanBoard;
