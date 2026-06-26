import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// In-memory access token storage (more secure than localStorage)
let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

/**
 * Classify whether an error is a server/network error (server down, cold starting)
 * vs a genuine auth error (token invalid/expired).
 *
 * Server/network errors:
 * - No response at all (network error, DNS failure, timeout)
 * - 408 Request Timeout
 * - 502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout
 *
 * These indicate the server is unreachable (e.g., Render free tier cold start),
 * NOT that the token is invalid.
 */
export function isServerOrNetworkError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  if (!error.response) return true; // Network error — no response received
  const status = error.response.status;
  return [408, 502, 503, 504].includes(status);
}

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
        setAccessToken(null);

        if (typeof window !== 'undefined') {
          // Only clear refresh token on genuine auth errors (401/403).
          // If the server is down or cold-starting (502/503/504/network error),
          // preserve the refresh token so the user can retry later.
          const isServerDown = isServerOrNetworkError(refreshError);
          if (!isServerDown) {
            localStorage.removeItem('refresh_token');
            if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
              window.location.href = '/login';
            }
          }
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
