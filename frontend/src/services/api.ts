import axios from "axios";
import {
  LoginRequest,
  SignupRequest,
  TokenResponse,
  User,
  Project,
  ProjectCreate,
  Issue,
  IssueCreate,
  IssueUpdate,
} from "../types";

const API_BASE_URL = "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Auth API
export const authApi = {
  login: async (credentials: LoginRequest): Promise<TokenResponse> => {
    const response = await api.post("/login", credentials);
    return response.data;
  },

  signup: async (credentials: SignupRequest): Promise<User> => {
    const response = await api.post("/signup", credentials);
    return response.data;
  },
};

// Project API
export const projectApi = {
  getProjects: async (token: string): Promise<Project[]> => {
    const response = await api.get("/projects", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  createProject: async (
    project: ProjectCreate,
    token: string
  ): Promise<Project> => {
    const response = await api.post("/projects", project, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  getProject: async (projectId: number, token: string): Promise<Project> => {
    const response = await api.get(`/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  deleteProject: async (projectId: number, token: string): Promise<void> => {
    await api.delete(`/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};

// Issue API
export const issueApi = {
  getProjectIssues: async (
    projectId: number,
    token: string
  ): Promise<Issue[]> => {
    const response = await api.get(`/projects/${projectId}/issues`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  createIssue: async (
    projectId: number,
    issue: IssueCreate,
    token: string
  ): Promise<Issue> => {
    const response = await api.post(`/projects/${projectId}/issues`, issue, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  updateIssue: async (
    issueId: number,
    update: IssueUpdate,
    token: string
  ): Promise<Issue> => {
    const response = await api.put(`/issues/${issueId}`, update, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  deleteIssue: async (issueId: number, token: string): Promise<void> => {
    await api.delete(`/issues/${issueId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};
