import type { ApiError } from "./types.js";

export interface ClientConfig {
  apiKey: string;
  baseUrl: string;
}

export interface ApiClient {
  get<T>(
    path: string,
    params?: Record<string, string | number | undefined>
  ): Promise<T>;
  post<T>(path: string, body: Record<string, unknown>): Promise<T>;
  patch<T>(path: string, body: Record<string, unknown>): Promise<T>;
  delete<T>(
    path: string,
    params?: Record<string, string | number | undefined>
  ): Promise<T>;
  /** JSON-body mutation for arbitrary methods (screenshot tools). `body` omitted when undefined. */
  request<T>(
    method: "POST" | "PUT" | "PATCH" | "DELETE",
    path: string,
    body?: unknown
  ): Promise<T>;
}

export class SonarApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "SonarApiError";
  }
}

export function createClient(config: ClientConfig): ApiClient {
  const { apiKey, baseUrl } = config;

  // Validate base URL: only HTTPS, except localhost over HTTP for dev.
  let parsed: URL;
  try {
    parsed = new URL(baseUrl);
  } catch {
    throw new Error(`Invalid SONAR_API_URL: "${baseUrl}". Must be a valid URL.`);
  }
  if (
    parsed.protocol !== "https:" &&
    !parsed.hostname.match(/^(localhost|127\.0\.0\.1)$/)
  ) {
    throw new Error(
      `SONAR_API_URL must use HTTPS (got ${parsed.protocol}). Only localhost is allowed over HTTP.`
    );
  }

  async function perform<T>(url: URL, init?: RequestInit): Promise<T> {
    let response: Response;
    try {
      response = await fetch(url.toString(), {
        ...init,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
          ...(init?.headers ?? {}),
        },
      });
    } catch (err) {
      if (err instanceof TypeError) {
        throw new SonarApiError(
          0,
          "network_error",
          `Could not connect to ${url.origin}. Check your network and SONAR_API_URL.`
        );
      }
      throw err;
    }

    if (response.ok) {
      return (await response.json()) as T;
    }

    let body: ApiError | null = null;
    try {
      body = (await response.json()) as ApiError;
    } catch {
      // body is not JSON
    }

    throw new SonarApiError(
      response.status,
      body?.error?.code ?? defaultCodeForStatus(response.status),
      body?.error?.message ?? defaultMessageForStatus(response.status)
    );
  }

  return {
    async get<T>(
      path: string,
      params?: Record<string, string | number | undefined>
    ): Promise<T> {
      const url = new URL(path, baseUrl);
      if (params) {
        for (const [key, value] of Object.entries(params)) {
          if (value !== undefined && value !== null) {
            url.searchParams.set(key, String(value));
          }
        }
      }
      return perform<T>(url);
    },

    async post<T>(path: string, body: Record<string, unknown>): Promise<T> {
      const url = new URL(path, baseUrl);
      return perform<T>(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    },

    async patch<T>(path: string, body: Record<string, unknown>): Promise<T> {
      const url = new URL(path, baseUrl);
      return perform<T>(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    },

    async delete<T>(
      path: string,
      params?: Record<string, string | number | undefined>
    ): Promise<T> {
      const url = new URL(path, baseUrl);
      if (params) {
        for (const [key, value] of Object.entries(params)) {
          if (value !== undefined && value !== null) {
            url.searchParams.set(key, String(value));
          }
        }
      }
      return perform<T>(url, { method: "DELETE" });
    },

    async request<T>(
      method: "POST" | "PUT" | "PATCH" | "DELETE",
      path: string,
      body?: unknown
    ): Promise<T> {
      const url = new URL(path, baseUrl);
      return perform<T>(url, {
        method,
        ...(body !== undefined
          ? {
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            }
          : {}),
      });
    },
  };
}

function defaultCodeForStatus(status: number): string {
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 429) return "rate_limited";
  if (status >= 500) return "server_error";
  return "request_failed";
}

function defaultMessageForStatus(status: number): string {
  if (status === 401)
    return "Authentication failed. Check your SONAR_API_KEY.";
  if (status === 403)
    return "Access denied. This endpoint may require a Full plan subscription.";
  if (status === 404) return "Resource not found.";
  if (status === 429) return "Rate limit exceeded. Please retry later.";
  if (status >= 500) return "Server error. Please try again later.";
  return `Request failed with status ${status}.`;
}
