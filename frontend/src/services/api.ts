// In development with Vite proxy, /api routes directly to backend with same-origin cookies
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem('auth_token', token);
};

export const removeAuthToken = (): void => {
  localStorage.removeItem('auth_token');
};

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const response = await fetch(`${API_BASE_URL}${normalizedEndpoint}`, {
    ...options,
    headers,
    credentials: 'include', // Automatically sends and receives session_token cookie
  });

  if (response.status === 401) {
    removeAuthToken();
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    throw new Error('Session expired or authentication required. Please log in.');
  }

  let data: any;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMessage = data?.error || data?.message || 'An unexpected error occurred.';
    throw new Error(errorMessage);
  }

  if (data && typeof data === 'object' && 'data' in data && data.data !== undefined) {
    return data.data as T;
  }

  return data as T;
}
