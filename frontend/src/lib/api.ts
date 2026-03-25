// Force absolute URL logic in src/lib/api.ts
const rawUrl = process.env.NEXT_PUBLIC_API_URL || "";

// If it doesn't start with http, prepend https:// automatically
export const API_BASE = rawUrl.startsWith('http') 
  ? rawUrl.replace(/\/$/, "") 
  : `https://${rawUrl}`.replace(/\/$/, "");

console.log("Network targeting:", API_BASE);

/**
 * Standard fetch wrapper that enforces credentials and absolute URLs
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  // Ensure the URL is absolute and correctly prefixed
  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    // CRITICAL: Ensure cookies/tokens are sent with every request
    credentials: 'include',
    ...options,
    headers: {
      // Allow overriding headers, but keep common ones
      'Content-Type': options.body instanceof FormData ? undefined : 'application/json',
      ...options.headers,
    },
  };

  // If Content-Type was set to undefined (for FormData), remove it
  if (defaultOptions.headers && (defaultOptions.headers as any)['Content-Type'] === undefined) {
    delete (defaultOptions.headers as any)['Content-Type'];
  }

  return fetch(url, defaultOptions);
}
