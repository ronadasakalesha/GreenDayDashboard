// Thin fetch wrapper that attaches the JWT from localStorage

const BASE_URL = ''; // Requests go through Vite's proxy to Express on :4000

export function getToken(): string | null {
  return localStorage.getItem('jwt_token');
}

export function setToken(token: string) {
  localStorage.setItem('jwt_token', token);
}

export function clearToken() {
  localStorage.removeItem('jwt_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  // Auth
  getMe: () => request<{ user: AuthUser }>('/auth/me'),

  // Logs
  getLogs: () => request<any[]>('/api/logs'),
  saveLog: (log: any) => request<any>('/api/logs', { method: 'POST', body: JSON.stringify(log) }),
  deleteLog: (id: string) => request<any>(`/api/logs/${id}`, { method: 'DELETE' }),

  // Habits
  getHabits: () => request<any[]>('/api/habits'),
  saveHabit: (habit: any) => request<any>('/api/habits', { method: 'POST', body: JSON.stringify(habit) }),
};

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
}
