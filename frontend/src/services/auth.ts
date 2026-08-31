import { request, setAuthToken, removeAuthToken } from './api.ts';

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar?: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string;
  status: 'ONLINE' | 'AWAY' | 'OFFLINE';
  isAi: boolean;
  hasPassword?: boolean;
  emailVerified?: string | null;
  createdAt?: string;
  connectedAccounts?: string[];
}

export interface AuthResponse {
  authenticated: boolean;
  user: UserProfile | null;
  sessionToken?: string;
  token?: string;
  message?: string;
}

export const register = async (data: {
  email: string;
  password: string;
  confirmPassword?: string;
  name?: string;
  username?: string;
  avatarUrl?: string;
}): Promise<AuthResponse> => {
  const result = await request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  const token = result.sessionToken || result.token;
  if (token) {
    setAuthToken(token);
  }
  return result;
};

export const login = async (credentials: {
  identifier: string;
  password: string;
}): Promise<AuthResponse> => {
  const result = await request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
  const token = result.sessionToken || result.token;
  if (token) {
    setAuthToken(token);
  }
  return result;
};

export const getMe = async (): Promise<AuthResponse> => {
  return request<AuthResponse>('/auth/me');
};

export const logout = async (): Promise<void> => {
  try {
    await request('/auth/logout', { method: 'POST' });
  } finally {
    removeAuthToken();
  }
};

export const searchUsers = async (query: string): Promise<UserProfile[]> => {
  return request<UserProfile[]>(`/users/search?q=${encodeURIComponent(query)}`);
};
