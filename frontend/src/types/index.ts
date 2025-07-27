export interface User {
  id: number;
  email: string;
  created_at: string;
}

export interface Project {
  id: number;
  title: string;
  description?: string;
  owner_id: number;
  created_at: string;
}

export interface Issue {
  id: number;
  title: string;
  description?: string;
  status: IssueStatus;
  priority: IssuePriority;
  assignee?: string;
  project_id: number;
  created_at: string;
}

export enum IssueStatus {
  TODO = "To Do",
  IN_PROGRESS = "In Progress",
  DONE = "Done",
}

export enum IssuePriority {
  LOW = "Low",
  MEDIUM = "Medium",
  HIGH = "High",
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface ProjectCreate {
  title: string;
  description?: string;
}

export interface IssueCreate {
  title: string;
  description?: string;
  status?: IssueStatus;
  priority?: IssuePriority;
  assignee?: string;
}

export interface IssueUpdate {
  title?: string;
  description?: string;
  status?: IssueStatus;
  priority?: IssuePriority;
  assignee?: string;
}
