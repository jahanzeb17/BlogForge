const API_URL = (
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

export type ApiError = Error & { status?: number };

function getToken() {
  return localStorage.getItem("blogforge_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = getToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";

  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.blob();

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "detail" in data
        ? String(data.detail)
        : `Request failed (${response.status})`;

    const error = new Error(message) as ApiError;
    error.status = response.status;

    if (response.status === 401) {
      window.dispatchEvent(new Event("blogforge:unauthorized"));
    }

    throw error;
  }

  return data as T;
}

export interface User {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  username: string;
  email: string;
}

export type RunStatus =
  | "pending"
  | "running"
  | "interrupted"
  | "completed"
  | "failed";

export type WorkflowStepId =
  | "guardrail"
  | "outline"
  | "outline-review"
  | "safety"
  | "research"
  | "research-plan"
  | "writing"
  | "merge"
  | "image-plan"
  | "image-gen"
  | "final-review"
  | "final-blog";

export interface RunSummary {
  id: string;
  topic: string;
  status: RunStatus;
  created_at: string | null;
  updated_at: string | null;
  interrupt_type: string | null;
  workflow_step: WorkflowStepId | null;
}

export interface PlanTask {
  title?: string;
  goal?: string;
  bullets?: string[];
  [key: string]: unknown;
}

export interface BlogPlan {
  blog_title?: string;
  audience?: string;
  tone?: string;
  blog_kind?: string;
  tasks?: PlanTask[];
  [key: string]: unknown;
}

export interface EvidenceItem {
  title?: string;
  url?: string;
  source?: string;
  published_at?: string;
  snippet?: string;
  [key: string]: unknown;
}

export interface ImageSpec {
  filename: string;
  alt_text?: string;
  caption?: string;
  [key: string]: unknown;
}

export interface AdminMetrics {
  total_users: number;
  total_blogs_generated: number;
  status_breakdown: Record<RunStatus, number>;
  system_health: string;
}

export interface AdminRun {
  run_id: string;
  user_id: number;
  username: string;
  topic: string;
  status: RunStatus;
  error_message: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface AdminUser {
  user_id: number;
  username: string;
  email: string;
  is_admin: boolean;
  total_blogs_created: number;
  joined_at: string | null;
}

export interface AuditLog {
  // Updated to match the new SecurityAuditLog backend response.
  id: number;
  run_id: string | null;
  user_id: number;
  username: string;
  email: string;
  input_type: "topic" | "subtopic" | "revision";
  topic: string;
  subtopic: string | null;
  guardrail_category: string;
  guardrail_message: string;
  action: string;
  timestamp: string | null;
}

export interface RunDetail extends RunSummary {
  as_of: string | null;
  audience_pref: string | null;
  tone_pref: string | null;
  blog_kind_pref: string | null;
  plan: BlogPlan | null;
  evidence: EvidenceItem[] | null;
  final_markdown: string | null;
  image_specs: ImageSpec[] | null;
  interrupt_data: {
    queries?: string[];
    [key: string]: unknown;
  } | null;
  error_message: string | null;
  guardrail_msg: string | null;
  images: ImageSpec[];
}

export interface UpdatedUserRole {
  user_id: number;
  username: string;
  is_admin: boolean;
}

export const api = {
  login: (email: string, password: string) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (username: string, email: string, password: string) =>
    request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    }),

  me: () => request<User>("/auth/me"),

  createRun: (payload: {
    topic: string;
    as_of?: string;
    audience_pref?: string;
    tone_pref?: string;
    blog_kind_pref?: string;
  }) =>
    request<{ run_id: string; status: RunStatus }>("/api/runs", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getRuns: () => request<RunSummary[]>("/api/runs"),

  getRun: (id: string) => request<RunDetail>(`/api/runs/${id}`),

  resumeRun: (
    id: string,
    payload: {
      action: string;
      queries?: string[];
      instructions?: string;
    },
  ) =>
    request<{ run_id: string; status: RunStatus }>(
      `/api/runs/${id}/resume`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    ),

  retryRun: (id: string) =>
    request<{ run_id: string; status: RunStatus }>(
      `/api/runs/${id}/retry`,
      {
        method: "POST",
      },
    ),

  deleteRun: (id: string) =>
    request<{ detail: string }>(`/api/runs/${id}`, {
      method: "DELETE",
    }),

  ///////////////////////////

  export: async (
    format: "pdf" | "docx",
    markdown: string,
    title: string,
  ) => {
    const blob = await request<Blob>(`/api/export/${format}`, {
      method: "POST",
      body: JSON.stringify({ markdown, title }),
    });

    const safeTitle =
      (title || "BlogForge-export")
        .replace(/[\/:*?"<>|]+/g, "-")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/^\.+|\.+$/g, "") || "BlogForge-export";

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `${safeTitle}.${format}`;

    document.body.appendChild(a);
    a.click();
    a.remove();

    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  },

  imageUrl: (runId: string, filename: string) =>
    `${API_URL}/api/runs/${runId}/images/${encodeURIComponent(filename)}`,

  admin: {
  metrics: () => request<AdminMetrics>("/api/admin/metrics"),

  runs: (status?: RunStatus) =>
    request<AdminRun[]>(
      `/api/admin/runs${
        status ? `?status=${encodeURIComponent(status)}` : ""
      }`,
    ),

  users: () => request<AdminUser[]>("/api/admin/users"),

  updateUserRole: (userId: number, isAdmin: boolean) =>
    request<UpdatedUserRole>(`/api/admin/users/${userId}/role`, {
      method: "PATCH",
      body: JSON.stringify({ is_admin: isAdmin }),
    }),

  deleteUser: (userId: number) =>
    request<{
      detail: string;
      user_id: number;
      username: string;
      email: string;
    }>(`/api/admin/users/${userId}`, {
      method: "DELETE",
    }),

  auditLogs: () => request<AuditLog[]>("/api/admin/audit-logs"),
},
};

export function saveToken(token: string) {
  localStorage.setItem("blogforge_token", token);
}

export function clearToken() {
  localStorage.removeItem("blogforge_token");
}

export function getStoredRunId() {
  return localStorage.getItem("blogforge_run_id");
}

export function saveRunId(id: string) {
  localStorage.setItem("blogforge_run_id", id);
}

export function clearRunId() {
  localStorage.removeItem("blogforge_run_id");
}

export { API_URL };