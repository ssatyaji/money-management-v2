export interface User {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  occupation: string | null;
  phoneNumber: string | null;
  monthlyIncome: number | null;
  financialGoal: string | null;
  role: 'ADMIN' | 'USER';
  avatar: string | null;
  isEmailVerified: boolean;
  startingBalance: number;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
}

export interface RegisterResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
}
