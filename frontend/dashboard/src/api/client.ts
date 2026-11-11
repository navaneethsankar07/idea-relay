const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// In-memory access token store
let currentAccessToken: string | null = null;
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

export const setAccessToken = (token: string | null) => {
  currentAccessToken = token;
};

export const getAccessToken = (): string | null => {
  return currentAccessToken;
};

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export class ApiError extends Error {
  public status: number;
  public data: Record<string, unknown>;

  constructor(status: number, message: string, data: Record<string, unknown> = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (currentAccessToken) {
    headers.set('Authorization', `Bearer ${currentAccessToken}`);
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Send and receive HttpOnly cookies
  };

  const response = await fetch(url, config);

  if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/token/refresh')) {
    if (!isRefreshing) {
      isRefreshing = true;

      try {
        const refreshRes = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (!refreshRes.ok) {
          throw new Error('Refresh token expired or invalid');
        }

        const refreshData = await refreshRes.json();
        const newToken = refreshData.access;
        setAccessToken(newToken);
        processQueue(null, newToken);
        isRefreshing = false;

        headers.set('Authorization', `Bearer ${newToken}`);
        const retryRes = await fetch(url, { ...config, headers });
        return (await retryRes.json()) as T;
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        isRefreshing = false;
        setAccessToken(null);
        throw new ApiError(401, 'Session expired. Please log in again.');
      }
    }

    return new Promise<T>((resolve, reject) => {
      failedQueue.push({
        resolve: async (token: string) => {
          headers.set('Authorization', `Bearer ${token}`);
          try {
            const retryRes = await fetch(url, { ...config, headers });
            const data = await retryRes.json();
            resolve(data as T);
          } catch (err) {
            reject(err);
          }
        },
        reject: (err) => reject(err),
      });
    });
  }

  const contentType = response.headers.get('content-type');
  let data: Record<string, unknown> = {};

  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  }

  if (!response.ok) {
    const errorDetail =
      (data.detail as string) ||
      (data.message as string) ||
      (typeof data === 'object' ? Object.values(data).flat().join(', ') : '') ||
      response.statusText;
    throw new ApiError(response.status, errorDetail || 'An error occurred', data);
  }

  return data as T;
}
