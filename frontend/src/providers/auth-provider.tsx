'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '@/types/auth.types';
import { authApi, LoginInput, RegisterInput } from '@/lib/api/auth.api';
import { setAccessToken, getAccessToken } from '@/lib/api/client';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginInput) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Try to restore session on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Try to refresh token (cookie-based)
        const tokens = await authApi.refresh();
        setAccessToken(tokens.accessToken);

        // Get user profile
        const userData = await authApi.getMe();
        setUser(userData);
      } catch {
        // No valid session
        setAccessToken(null);
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
    setUser(response.user);
  }, []);

  const register = useCallback(async (data: RegisterInput) => {
    const response = await authApi.register(data);
    setAccessToken(response.accessToken);
    setUser(response.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
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
