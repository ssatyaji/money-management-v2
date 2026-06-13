'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '@/types/auth.types';
import { authApi, LoginInput, RegisterInput } from '@/lib/api/auth.api';
import { setAccessToken } from '@/lib/api/client';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginInput) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  googleSignIn: (token: string) => Promise<void>;
  verifyEmail: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserContext: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Try to restore session on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Try to refresh token (cookie-based or storage-based)
        const tokens = await authApi.refresh();
        setAccessToken(tokens.accessToken);
        if (tokens.refreshToken) {
          localStorage.setItem('refresh_token', tokens.refreshToken);
        }

        // Get user profile
        const userData = await authApi.getMe();
        setUser(userData);
      } catch {
        // No valid session
        setAccessToken(null);
        localStorage.removeItem('refresh_token');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (data: LoginInput) => {
    const response = await authApi.login(data);
    setAccessToken(response.accessToken);
    if (response.refreshToken) {
      localStorage.setItem('refresh_token', response.refreshToken);
    }
    setUser(response.user);
  }, []);

  const register = useCallback(async (data: RegisterInput) => {
    const response = await authApi.register(data);
    setAccessToken(response.accessToken);
    if (response.refreshToken) {
      localStorage.setItem('refresh_token', response.refreshToken);
    }
    setUser(response.user);
  }, []);

  const googleSignIn = useCallback(async (token: string) => {
    const response = await authApi.googleSignIn({ token });
    setAccessToken(response.accessToken);
    if (response.refreshToken) {
      localStorage.setItem('refresh_token', response.refreshToken);
    }
    setUser(response.user);
  }, []);

  const verifyEmail = useCallback(async (code: string) => {
    await authApi.verifyEmail({ code });
    setUser((prev) => (prev ? { ...prev, isEmailVerified: true } : null));
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors
    } finally {
      setAccessToken(null);
      localStorage.removeItem('refresh_token');
      setUser(null);
    }
  }, []);

  const updateUserContext = useCallback((updatedUser: User) => {
    setUser(updatedUser);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        googleSignIn,
        verifyEmail,
        logout,
        updateUserContext,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
