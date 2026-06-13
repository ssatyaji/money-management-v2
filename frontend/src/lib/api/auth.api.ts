import apiClient from './client';
import { LoginResponse, RegisterResponse, User } from '@/types/auth.types';
import { ApiResponse } from '@/types/api.types';

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name?: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  occupation?: string;
  phoneNumber?: string;
  monthlyIncome?: number;
  startingBalance?: number;
  financialGoal?: string;
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

  googleSignIn: async (data: { token: string }): Promise<LoginResponse> => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/google/signin', data);
    return response.data.data;
  },

  verifyOtp: async (data: {
    email: string;
    code: string;
    purpose: 'REGISTER' | 'FORGOT_PASSWORD';
  }): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post<ApiResponse<{ success: boolean; message: string }>>('/auth/verify-otp', data);
    return response.data.data;
  },

  verifyEmail: async (data: { code: string }): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post<ApiResponse<{ success: boolean; message: string }>>('/auth/verify-email', data);
    return response.data.data;
  },

  resendOtp: async (data: {
    email: string;
    purpose: 'REGISTER' | 'FORGOT_PASSWORD';
  }): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post<ApiResponse<{ success: boolean; message: string }>>('/auth/resend-otp', data);
    return response.data.data;
  },

  forgotPassword: async (data: { email: string }): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post<ApiResponse<{ success: boolean; message: string }>>('/auth/forgot-password', data);
    return response.data.data;
  },

  resetPassword: async (data: {
    email: string;
    code: string;
    password: string;
  }): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post<ApiResponse<{ success: boolean; message: string }>>('/auth/reset-password', data);
    return response.data.data;
  },

  changePassword: async (data: ChangePasswordInput): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post<ApiResponse<{ success: boolean; message: string }>>('/auth/change-password', data);
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
