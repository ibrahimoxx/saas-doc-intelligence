/**
 * DocPilot AI — API Client
 *
 * Centralized HTTP client for backend API communication.
 * Handles auth tokens, error formatting, and base URL.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface ApiError {
  code: string;
  message: string;
  details: Record<string, unknown>;
  request_id: string;
}

interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // Add auth token if available
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  async get<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>("GET", path);
  }

  async post<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>("POST", path, body);
  }

  async patch<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>("PATCH", path, body);
  }

  async delete<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>("DELETE", path);
  }

  async uploadFile<T>(path: string, formData: FormData): Promise<ApiResponse<T>> {
    try {
      const headers: HeadersInit = {};
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("access_token");
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
      }

      const response = await fetch(`${this.baseUrl}${path}`, {
        method: "POST",
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { error: errorData.error };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return {
        error: {
          code: "network_error",
          message: "Erreur de connexion au serveur.",
          details: {},
          request_id: "unknown",
        },
      };
    }
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { error: errorData.error };
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return { data: undefined as T };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return {
        error: {
          code: "network_error",
          message: "Erreur de connexion au serveur.",
          details: {},
          request_id: "unknown",
        },
      };
    }
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export type { ApiError, ApiResponse };
