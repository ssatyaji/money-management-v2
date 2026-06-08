export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
  avatar: string | null;
  isEmailVerified: boolean;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
}

export interface RegisterResponse {
  user: User;
  accessToken: string;
}
