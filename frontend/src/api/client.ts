/**
 * Typed API client for AI Assurance Platform backend.
 *
 * Auth rule (fixed 2026-10-27): a 401 means the token is missing,
 * expired (120 min), or signed with a different SECRET_KEY. It is
 * NOT an "offline" fallback case. On 401 this client clears the
 * stored token/user and sends the user to /login, once, instead of
 * letting every service silently fall back to stale localStorage
 * data while the backend log fills with 401s.
 */

const BASE_URL = "/api/v1";

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

function handleUnauthorized(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("assure_token");
  localStorage.removeItem("assure_user");
  // Do not loop: if we are already on /login, just stop here.
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem("assure_token");

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = "An unexpected error occurred";
    let errorData = null;
    try {
      errorData = await response.json();
      errorDetail = errorData.detail || errorData.message || errorDetail;
    } catch {
      // Body not JSON
    }
    if (response.status === 401) {
      handleUnauthorized();
    }
    throw new ApiError(errorDetail, response.status, errorData);
  }

  return response.json() as Promise<T>;
}
