// JWT-aware fetch wrapper

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

  const res = await fetch(path, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export const api = {
  // Auth
  signup: (email: string, displayName: string, password: string) =>
    request<AuthResponse>('/auth/signup', { method: 'POST', body: JSON.stringify({ email, displayName, password }) }),
  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getMe: () => request<{ user: AuthUser }>('/auth/me'),

  // Logs
  getLogs: () => request<any[]>('/api/logs'),
  saveLog: (log: any) => request<any>('/api/logs', { method: 'POST', body: JSON.stringify(log) }),
  deleteLog: (id: string) => request<any>(`/api/logs/${id}`, { method: 'DELETE' }),

  // Habits
  getHabits: () => request<any[]>('/api/habits'),
  saveHabit: (habit: any) => request<any>('/api/habits', { method: 'POST', body: JSON.stringify(habit) }),
};
