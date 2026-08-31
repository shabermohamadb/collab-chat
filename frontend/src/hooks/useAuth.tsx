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
          console.warn('[AUTH FRONTEND] Socket connect notice:', sockErr);
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
    refreshMe();
  }, [refreshMe]);

  const login = async (credentials: { identifier: string; password: string }) => {
    setLoading(true);
    try {
      const res = await authService.login(credentials);
      if (res.user) {
        if (res.sessionToken) {
          setAuthToken(res.sessionToken);
        }
        setUser(res.user);
        try {
          socketService.connect();
        } catch (err) {
          console.warn('Socket connect notice:', err);
        }
      } else {
        throw new Error(res.message || 'Login failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    confirmPassword?: string;
    name?: string;
    username?: string;
    avatarUrl?: string;
  }) => {
    setLoading(true);
    try {
      const res = await authService.register(data);
      if (res.user) {
        if (res.sessionToken) {
          setAuthToken(res.sessionToken);
        }
        setUser(res.user);
        try {
          socketService.connect();
        } catch (err) {
          console.warn('Socket connect notice:', err);
        }
      } else {
        throw new Error(res.message || 'Registration failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      socketService.disconnect();
      setLoading(false);
    }
  };

  const updateUser = (updated: Partial<UserProfile>) => {
    if (user) {
      setUser({ ...user, ...updated });
    }
  };

  const updateStatus = async (status: 'ONLINE' | 'AWAY' | 'OFFLINE') => {
    if (user) {
      setUser({ ...user, status });
      socketService.emitPresenceChange(status);
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
