export const getToken = () => localStorage.getItem('token');
export const setToken = (token: string) => localStorage.setItem('token', token);
export const removeToken = () => localStorage.removeItem('token');

const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, { ...options, headers });
  if (response.status === 401) {
    removeToken();
    window.location.reload();
  }
  
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || 'API request failed');
    }
    return data;
  }
  
  if (!response.ok) {
    throw new Error('API request failed');
  }
  return response;
};

export const login = (data: any) => authFetch('/auth/login', { method: 'POST', body: JSON.stringify(data) });
export const register = (data: any) => authFetch('/auth/register', { method: 'POST', body: JSON.stringify(data) });

export const createRun = (data: any) => authFetch('/api/runs', { method: 'POST', body: JSON.stringify(data) });
export const listRuns = () => authFetch('/api/runs', { method: 'GET' });
export const fetchRun = (runId: string) => authFetch(`/api/runs/${runId}`, { method: 'GET' });
export const resumeRun = (runId: string, data: any) => authFetch(`/api/runs/${runId}/resume`, { method: 'POST', body: JSON.stringify(data) });
export const deleteRun = (runId: string) => authFetch(`/api/runs/${runId}`, { method: 'DELETE' });

export const downloadFile = async (format: 'pdf' | 'docx', markdown: string, title?: string) => {
  const token = getToken();
  const headers = new Headers();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  headers.set('Content-Type', 'application/json');
  
  const response = await fetch(`/api/export/${format}`, { 
    method: 'POST',
    headers,
    body: JSON.stringify({ markdown, title })
  });
  
  if (!response.ok) throw new Error('Download failed');
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title || 'blog'}.${format}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};
