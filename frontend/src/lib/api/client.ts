import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// In-memory access token storage (more secure than localStorage)
let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Send cookies (refresh token)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach access token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (config.url?.endsWith('/auth/refresh')) {
      const storedRefreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
      if (storedRefreshToken) {
        config.headers.Authorization = `Bearer ${storedRefreshToken}`;
      }
    } else if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If 401 and not already retrying, attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const storedRefreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
        const headers: Record<string, string> = {};
        if (storedRefreshToken) {
          headers['Authorization'] = `Bearer ${storedRefreshToken}`;
        }

        const response = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { 
            withCredentials: true,
            headers
          },
        );

        const newAccessToken = response.data.data?.accessToken || response.data.accessToken;
        const newRefreshToken = response.data.data?.refreshToken || response.data.refreshToken;

        setAccessToken(newAccessToken);
        if (newRefreshToken && typeof window !== 'undefined') {
          localStorage.setItem('refresh_token', newRefreshToken);
        }
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed — clear token and redirect to login
        setAccessToken(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('refresh_token');
          if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
            window.location.href = '/login';
          }
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
