// Central API configuration. Set NEXT_PUBLIC_API_URL in .env.local for deployment.
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

function authHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('rafik_auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// fetch wrapper that prefixes the API URL and attaches the Bearer token.
// Pass a plain object as `body` and it is JSON-encoded; FormData passes through.
export async function apiFetch(
  path: string,
  options: Omit<RequestInit, 'body'> & { body?: unknown } = {}
): Promise<Response> {
  const { body, headers, ...rest } = options;
  const isForm = body instanceof FormData;
  return fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      ...(!isForm && body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...authHeaders(),
      ...(headers as Record<string, string>),
    },
    ...(body !== undefined
      ? { body: isForm ? (body as FormData) : JSON.stringify(body) }
      : {}),
  });
}
