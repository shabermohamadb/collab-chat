import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authService from '../services/auth.ts';
import { UserProfile } from '../services/auth.ts';
import { setAuthToken } from '../services/api.ts';
import { socketService } from '../services/socket.ts';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { identifier: string; password: string }) => Promise<void>;
  register: (data: { email: string; password: string; confirmPassword?: string; name?: string; username?: string; avatarUrl?: string }) => Promise<void>;
  startGoogleOAuth: () => void;
  startGitHubOAuth: () => void;
  disconnectProvider: (provider: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: Partial<UserProfile>) => void;
  updateStatus: (status: 'ONLINE' | 'AWAY' | 'OFFLINE') => Promise<void>;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshMe = useCallback(async () => {
    try {
      const res = await authService.getMe();
      if (res.authenticated && res.user) {
        console.log('[AUTH FRONTEND] Session verified for:', res.user.username);
        setUser(res.user);
        try {
          socketService.connect();
        } catch (sockErr) {
          console.warn('[AUTH FRONTEND] Socket connect notice (non-fatal):', sockErr);
        }
      } else {
        console.log('[AUTH FRONTEND] No active session found.');
        setUser(null);
        socketService.disconnect();
      }
    } catch (err) {
      console.warn('[AUTH FRONTEND] /api/auth/me query error:', err);
      setUser(null);
      socketService.disconnect();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 1. Check if returning from Google / OAuth callback with token
    const params = new URLSearchParams(window.location.search);
    const callbackToken = params.get('token');
    const authSuccess = params.get('auth_success') || params.get('login_success');

    if (callbackToken) {
      console.log('[AUTH FRONTEND] Capturing OAuth session token from URL');
      setAuthToken(callbackToken);
    }

    if (callbackToken || authSuccess) {
      // Clean query params from browser URL bar without page reload
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // 2. Fetch authenticated user session
    refreshMe();

    const handleUnauthorized = () => {
      console.log('[AUTH FRONTEND] Unauthorized event received. Clearing user state.');
      setUser(null);
      socketService.disconnect();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [refreshMe]);

  const login = async (credentials: { identifier: string; password: string }) => {
    setLoading(true);
    try {
      const res = await authService.login(credentials);
      if (res.user) {
        setUser(res.user);
        try {
          socketService.connect();
        } catch (sockErr) {
          console.warn('Socket connect notice:', sockErr);
        }
      } else {
        await refreshMe();
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: { email: string; password: string; confirmPassword?: string; name?: string; username?: string; avatarUrl?: string }) => {
    setLoading(true);
    try {
      const res = await authService.register(data);
      if (res.user) {
        setUser(res.user);
        try {
          socketService.connect();
        } catch (sockErr) {
          console.warn('Socket connect notice:', sockErr);
        }
      } else {
        await refreshMe();
      }
    } finally {
      setLoading(false);
    }
  };

  const startGoogleOAuth = () => {
    authService.startGoogleOAuth();
  };

  const startGitHubOAuth = () => {
    authService.startGitHubOAuth();
  };

  const disconnectProvider = async (provider: string) => {
    await authService.disconnectProvider(provider);
    await refreshMe();
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
    } finally {
      setUser(null);
      socketService.disconnect();
      setLoading(false);
    }
  };

  const updateUser = (updatedUser: Partial<UserProfile>) => {
    if (!user) return;
    setUser({ ...user, ...updatedUser });
  };

  const updateStatus = async (status: 'ONLINE' | 'AWAY' | 'OFFLINE') => {
    if (!user) return;
    try {
      const updated = await authService.updateProfile({ status });
      setUser((prev) => (prev ? { ...prev, ...updated } : null));
      socketService.emitPresenceChange(status);
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        startGoogleOAuth,
        startGitHubOAuth,
        disconnectProvider,
        logout,
        updateUser,
        updateStatus,
        refreshMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
