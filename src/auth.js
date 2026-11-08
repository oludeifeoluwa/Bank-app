export const passwordMinimum = 12;

export async function apiRequest(path, { method = 'GET', body, userId, signal } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (userId !== undefined) headers['X-Harborline-Profile'] = String(userId);
  const response = await fetch('/api/' + path, {
    method,
    headers,
    credentials: 'same-origin',
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  }).catch(error => {
    if (error.name === 'AbortError') throw error;
    throw new Error('Harborline is temporarily unavailable. Check that the backend is running and try again.');
  });

  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) {
    throw Object.assign(new Error(data?.error ?? 'Harborline is temporarily unavailable. Check that the backend is running and try again.'), { status: response.status });
  }
  return data;
}

export const createProfile = (username, password) => apiRequest('signup', { method: 'POST', body: { username, password } });
export const authenticate = (username, password) => apiRequest('signin', { method: 'POST', body: { username, password } });
export const activeProfile = signal => apiRequest('session', { signal });
export const signOut = () => apiRequest('signout', { method: 'POST', body: {} });
