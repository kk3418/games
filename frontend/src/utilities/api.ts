const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = `${BACKEND_URL}${path}`;
  const token = localStorage.getItem('token');

  // Debug: Log token information
  console.log(`API Request to ${path}:`, {
    hasToken: token ? true : false,
    tokenLength: token?.length || 0
  });

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Only add Authorization header if token exists and is not empty
  if (token && token.trim() !== '') {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('Authorization header added:', {
      headerValue: `Bearer ${token.substring(0, 5)}...${token.substring(token.length - 5)}`,
      tokenType: typeof token
    });
  } else {
    console.warn('No token available for request to:', path);
  }

  console.log(`Sending request to ${url}`, { method: options.method || 'GET', headers });

  const response = await fetch(url, {
    ...options,
    headers,
  });

  console.log(`Response from ${path}:`, {
    status: response.status,
    statusText: response.statusText,
    hasNewToken: response.headers.has('X-New-Token'),
  });

  // Check for new token in headers
  const newToken = response.headers.get('X-New-Token');
  if (newToken) {
    localStorage.setItem('token', newToken);
  }

  if (!response.ok) {
    console.error(`API error for ${path}:`, {
      status: response.status,
      statusText: response.statusText
    });

    if (response.status === 401 || response.status === 403) {
      console.warn('Authentication error detected. Token may be invalid or expired.');
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }

    let errorData;
    try {
      errorData = await response.json();
      console.error('Error response data:', errorData);
    } catch (e) {
      errorData = {};
      console.error('Could not parse error response as JSON');
    }

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

  patch: <T>(path: string, body: any, options?: RequestOptions) =>
    request<T>(path, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body)
    }),

  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};
