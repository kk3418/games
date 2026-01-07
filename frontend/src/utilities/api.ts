const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = `${BACKEND_URL}${path}`;
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Check for new token in headers
  const newToken = response.headers.get('X-New-Token');
  if (newToken) {
    localStorage.setItem('token', newToken);
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      // Optional: handle unauthorized/forbidden (e.g., clear storage and redirect to login)
      // localStorage.removeItem('token');
      // localStorage.removeItem('user');
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'GET' }),

  post: <T>(path: string, body: any, options?: RequestOptions) =>
    request<T>(path, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body)
    }),

  put: <T>(path: string, body: any, options?: RequestOptions) =>
    request<T>(path, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body)
    }),

  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};
