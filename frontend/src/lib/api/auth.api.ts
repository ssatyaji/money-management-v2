import apiClient from './client';
import { LoginResponse, RegisterResponse, User } from '@/types/auth.types';
import { ApiResponse } from '@/types/api.types';

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export const authApi = {
  login: async (data: LoginInput): Promise<LoginResponse> => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', data);
    return response.data.data;
  },

  register: async (data: RegisterInput): Promise<RegisterResponse> => {
    const response = await apiClient.post<ApiResponse<RegisterResponse>>('/auth/register', data);
    return response.data.data;
  },

  refresh: async (): Promise<{ accessToken: string }> => {
    const response = await apiClient.post<ApiResponse<{ accessToken: string }>>('/auth/refresh');
    return response.data.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>('/auth/me');
    return response.data.data;
  },
};
