import apiClient from './client';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const getUsers = async (params?: GetUsersParams): Promise<PaginatedResponse<User>> => {
  const response = await apiClient.get('/users', { params });
  return response.data;
};

export const getUser = async (id: string): Promise<User> => {
  const response = await apiClient.get(`/users/${id}`);
  return response.data.data || response.data;
};

export interface UpdateUserDto {
  name?: string;
  role?: 'USER' | 'ADMIN';
  isVerified?: boolean;
  startingBalance?: number;
  firstName?: string;
  lastName?: string;
  occupation?: string;
  phoneNumber?: string;
  monthlyIncome?: number;
  financialGoal?: string;
  avatar?: string | null;
}

export const updateUser = async (id: string, data: UpdateUserDto): Promise<User> => {
  const response = await apiClient.patch(`/users/${id}`, data);
  return response.data.data || response.data;
};

export const deleteUser = async (id: string): Promise<void> => {
  await apiClient.delete(`/users/${id}`);
};
