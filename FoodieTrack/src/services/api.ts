/**
 * API Service Layer
 * 
 * This layer abstracts all HTTP communication with the backend.
 * It handles:
 * - Base URL configuration
 * - Auth token injection (from Auth0)
 * - Error handling
 * - Type-safe requests/responses
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface ApiError {
  detail?: string;
  message?: string;
  status: number;
}

class ApiService {
  /**
   * Helper method to make authenticated requests
   * @param endpoint - API endpoint path (e.g., "/preferences")
   * @param options - Fetch options (method, body, etc.)
   * @param token - Auth0 access token for authorization
   */
  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    token?: string
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(typeof options.headers === "object" && options.headers !== null
        ? Object.fromEntries(Object.entries(options.headers))
        : {}),
    };

    // Add Authorization header if token provided
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error: ApiError = {
          status: response.status,
        };
        try {
          const data = await response.json();
          error.detail = data.detail || data.message;
        } catch {
          error.message = response.statusText;
        }
        throw error;
      }

      // Return empty for 204 No Content responses
      if (response.status === 204) {
        return undefined as T;
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error calling ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Prefer using this for multipart data (like audio files)
   */
  async requestMultipart<T>(
    endpoint: string,
    formData: FormData,
    token?: string
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: formData,
      });

      if (!response.ok) {
        const error: ApiError = {
          status: response.status,
        };
        try {
          const data = await response.json();
          error.detail = data.detail || data.message;
        } catch {
          error.message = response.statusText;
        }
        throw error;
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error calling ${endpoint}:`, error);
      throw error;
    }
  }
}

export const apiService = new ApiService();
