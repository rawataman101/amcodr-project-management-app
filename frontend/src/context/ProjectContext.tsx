import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from "react";
import {
  Project,
  Issue,
  ProjectCreate,
  IssueCreate,
  IssueUpdate,
} from "../types";
import { projectApi, issueApi } from "../services/api";
import { useAuth } from "./AuthContext";

interface ProjectContextType {
  projects: Project[];
  currentProject: Project | null;
  issues: Issue[];
  loading: boolean;
  fetchProjects: () => Promise<void>;
  createProject: (project: ProjectCreate) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  fetchIssues: (projectId: number) => Promise<void>;
  createIssue: (projectId: number, issue: IssueCreate) => Promise<void>;
  updateIssue: (issueId: number, update: IssueUpdate) => Promise<void>;
  deleteIssue: (issueId: number) => Promise<void>;
  deleteProject: (projectId: number) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
};

interface ProjectProviderProps {
  children: ReactNode;
}

export const ProjectProvider: React.FC<ProjectProviderProps> = ({
  children,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const fetchProjects = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const projectsData = await projectApi.getProjects(token);
      setProjects(projectsData);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (project: ProjectCreate) => {
    if (!token) return;

    try {
      const newProject = await projectApi.createProject(project, token);
      setProjects((prev) => [...prev, newProject]);
    } catch (error) {
      console.error("Failed to create project:", error);
      throw error;
    }
  };

  const fetchIssues = useCallback(
    async (projectId: number) => {
      if (!token) return;

      setLoading(true);
      try {
        const issuesData = await issueApi.getProjectIssues(projectId, token);
        setIssues(issuesData);
      } catch (error) {
        console.error("Failed to fetch issues:", error);
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  const createIssue = async (projectId: number, issue: IssueCreate) => {
    if (!token) return;

    try {
      const newIssue = await issueApi.createIssue(projectId, issue, token);
      setIssues((prev) => [...prev, newIssue]);
    } catch (error) {
      console.error("Failed to create issue:", error);
      throw error;
    }
  };

  const updateIssue = useCallback(
    async (issueId: number, update: IssueUpdate) => {
      if (!token) return;

      try {
        const updatedIssue = await issueApi.updateIssue(issueId, update, token);
        setIssues((prev) =>
          prev.map((issue) => (issue.id === issueId ? updatedIssue : issue))
        );
      } catch (error) {
        console.error("Failed to update issue:", error);
        throw error;
      }
    },
    [token]
  );

  const deleteIssue = async (issueId: number) => {
    if (!token) return;

    try {
      await issueApi.deleteIssue(issueId, token);
      setIssues((prev) => prev.filter((issue) => issue.id !== issueId));
    } catch (error) {
      console.error("Failed to delete issue:", error);
      throw error;
    }
  };

  const deleteProject = async (projectId: number) => {
    if (!token) return;

    try {
      await projectApi.deleteProject(projectId, token);
      setProjects((prev) => prev.filter((project) => project.id !== projectId));

      if (currentProject && currentProject.id === projectId) {
        setCurrentProject(null);
      }
    } catch (error) {
      console.error("Failed to delete project:", error);
      throw error;
    }
  };

  const value = {
    projects,
    currentProject,
    issues,
    loading,
    fetchProjects,
    createProject,
    setCurrentProject,
    fetchIssues,
    createIssue,
    updateIssue,
    deleteIssue,
    deleteProject,
  };

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
};
