import { request, setAuthToken, removeAuthToken } from './api.ts';
import { User } from '../types/index.ts';

export interface UserProfile extends User {
  name?: string;
  hasPassword?: boolean;
  emailVerified?: string | null;
  createdAt?: string;
  connectedAccounts?: string[];
}

export interface MeResponse {
  authenticated: boolean;
  user: UserProfile | null;
}

export interface AuthResponse {
  authenticated: boolean;
  user: UserProfile;
  sessionToken?: string;
  token?: string;
  message?: string;
}

export const login = async (credentials: { identifier: string; password: string }): Promise<AuthResponse> => {
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

export const register = async (userData: {
  email: string;
  password: string;
  confirmPassword?: string;
  name?: string;
  username?: string;
  avatarUrl?: string;
}): Promise<AuthResponse> => {
  const result = await request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
  const token = result.sessionToken || result.token;
  if (token) {
    setAuthToken(token);
  }
  return result;
};

export const getMe = async (): Promise<MeResponse> => {
  return request<MeResponse>('/auth/me');
};

export const logout = async (): Promise<void> => {
  try {
    await request('/auth/logout', { method: 'POST' });
  } catch (err) {
    console.error('Logout error:', err);
  } finally {
    removeAuthToken();
  }
};

export const disconnectProvider = async (provider: string): Promise<{ success: boolean }> => {
  return request<{ success: boolean }>(`/auth/disconnect/${provider}`, {
    method: 'POST',
  });
};

export const startGoogleOAuth = () => {
  window.location.href = '/api/auth/google';
};

export const startGitHubOAuth = () => {
  window.location.href = '/api/auth/github';
};

export const updateProfile = async (profileData: {
  displayName?: string;
  name?: string;
  bio?: string;
  avatarUrl?: string;
  status?: 'ONLINE' | 'AWAY' | 'OFFLINE';
}): Promise<User> => {
  const res = await request<{ data: User }>('/users/profile', {
    method: 'PATCH',
    body: JSON.stringify(profileData),
  });
  return res.data || (res as any);
};

export const searchUsers = async (query: string): Promise<User[]> => {
  const res = await request<{ data: User[] }>(`/users/search?q=${encodeURIComponent(query)}`);
  return res.data || (res as any);
};
