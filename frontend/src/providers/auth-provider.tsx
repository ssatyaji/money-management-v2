'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '@/types/auth.types';
import { authApi, LoginInput, RegisterInput } from '@/lib/api/auth.api';
import { setAccessToken, isServerOrNetworkError } from '@/lib/api/client';

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
      // Check if we have a stored refresh token before attempting
      const hasStoredToken = typeof window !== 'undefined' && localStorage.getItem('refresh_token');
      if (!hasStoredToken) {
        setIsLoading(false);
        return;
      }

      const MAX_RETRIES = 3;
      const BASE_DELAY_MS = 2000; // Exponential backoff: 2s, 4s, 8s

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
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
          return; // Success — exit
        } catch (error: unknown) {
          const isServerDown = isServerOrNetworkError(error);

          if (isServerDown && attempt < MAX_RETRIES) {
            // Server is cold-starting — wait and retry
            await new Promise(resolve =>
              setTimeout(resolve, BASE_DELAY_MS * Math.pow(2, attempt)),
            );
            continue;
          }

          // Genuine auth error (401/403) or max retries exceeded
          setAccessToken(null);
          if (!isServerDown) {
            // Token is truly invalid — clear it
            localStorage.removeItem('refresh_token');
          }
          // If server is still down after max retries, keep the token
          // so user can try again on next page load
          setUser(null);
          return;
        }
      }
    };

    initAuth().finally(() => setIsLoading(false));
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
