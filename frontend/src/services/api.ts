const API_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')

export type ApiError = Error & { status?: number }

function getToken() {
  return localStorage.getItem('blogforge_token')
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${API_URL}${path}`, { ...options, headers })
  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await response.json() : await response.blob()
  if (!response.ok) {
    const message = typeof data === 'object' && data && 'detail' in data ? String(data.detail) : `Request failed (${response.status})`
    const error = new Error(message) as ApiError
    error.status = response.status
    throw error
  }
  return data as T
}

export interface User { id: number; username: string; is_admin: boolean }
export interface AuthResponse { access_token: string; token_type: string; user_id: number; username: string }
export interface RunSummary { id: string; topic: string; status: string; created_at: string | null; updated_at: string | null }
export interface RunDetail extends RunSummary {
  as_of: string | null; audience_pref: string | null; tone_pref: string | null; blog_kind_pref: string | null
  plan: any; evidence: any[] | null; final_markdown: string | null; image_specs: any[] | null
  interrupt_type: string | null; interrupt_data: any; error_message: string | null; guardrail_msg: string | null
  images: { filename: string; alt_text?: string; caption?: string }[]
}

export const api = {
  login: (username: string, password: string) => request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  register: (username: string, password: string) => request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) }),
  me: () => request<User>('/auth/me'),
  createRun: (payload: { topic: string; as_of?: string; audience_pref?: string; tone_pref?: string; blog_kind_pref?: string }) => request<{ run_id: string; status: string }>('/api/runs', { method: 'POST', body: JSON.stringify(payload) }),
  getRuns: () => request<RunSummary[]>('/api/runs'),
  getRun: (id: string) => request<RunDetail>(`/api/runs/${id}`),
  resumeRun: (id: string, payload: { action: string; queries?: string[]; instructions?: string }) => request<{ run_id: string; status: string }>(`/api/runs/${id}/resume`, { method: 'POST', body: JSON.stringify(payload) }),
  deleteRun: (id: string) => request<{ detail: string }>(`/api/runs/${id}`, { method: 'DELETE' }),
  export: async (format: 'pdf' | 'docx', markdown: string, title: string) => {
    const blob = await request<Blob>(`/api/export/${format}`, { method: 'POST', body: JSON.stringify({ markdown, title }) })
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${title || 'BlogForge-export'}.${format}`; a.click(); URL.revokeObjectURL(url)
  },
  imageUrl: (runId: string, filename: string) => `${API_URL}/api/runs/${runId}/images/${encodeURIComponent(filename)}`,
  admin: {
    metrics: () => request<any>('/api/admin/metrics'),
    runs: (status?: string) => request<any[]>(`/api/admin/runs${status ? `?status=${encodeURIComponent(status)}` : ''}`),
    users: () => request<any[]>('/api/admin/users'),
    auditLogs: () => request<any[]>('/api/admin/audit-logs'),
  },
}

export function saveToken(token: string) { localStorage.setItem('blogforge_token', token) }
export function clearToken() { localStorage.removeItem('blogforge_token') }
export { API_URL }
