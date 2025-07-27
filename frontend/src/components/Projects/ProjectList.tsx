import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useProject } from "../../context/ProjectContext";
import { useAuth } from "../../context/AuthContext";
import CreateProjectModal from "./CreateProjectModal";

const ProjectList: React.FC = () => {
  const { projects, fetchProjects, loading, deleteProject } = useProject();
  const { logout } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const handleDeleteProject = async (
    projectId: number,
    projectTitle: string
  ) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${projectTitle}"? This will also delete all issues in this project.`
      )
    ) {
      try {
        await deleteProject(projectId);
      } catch (error) {
        alert("Failed to delete project");
      }
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Project Management
            </h1>
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              Your Projects
            </h2>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              New Project
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-500">Loading projects...</div>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">No projects yet</div>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Create your first project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="w-full flex justify-end-safe px-2 py-1 ">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleDeleteProject(project.id, project.title);
                      }}
                      className="text-red-400 hover:text-red-600 ml-2 p-1 cursor-pointer"
                      title="Delete project"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        x="0px"
                        y="0px"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                      >
                        <path d="M 10 2 L 9 3 L 3 3 L 3 5 L 4.109375 5 L 5.8925781 20.255859 L 5.8925781 20.263672 C 6.023602 21.250335 6.8803207 22 7.875 22 L 16.123047 22 C 17.117726 22 17.974445 21.250322 18.105469 20.263672 L 18.107422 20.255859 L 19.890625 5 L 21 5 L 21 3 L 15 3 L 14 2 L 10 2 z M 6.125 5 L 17.875 5 L 16.123047 20 L 7.875 20 L 6.125 5 z"></path>
                      </svg>
                    </button>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {project.title}
                    </h3>
                    {project.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {project.description}
                      </p>
                    )}
                    <div className="text-xs text-gray-500">
                      Created{" "}
                      {new Date(project.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      ={" "}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};

export default ProjectList;
