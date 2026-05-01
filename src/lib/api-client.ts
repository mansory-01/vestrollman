/**
 * Unified API Client for VestRoll.
 * Handles fetch requests, error normalization (RFC 7807), and type-safe responses.
 */

export interface ApiError {
  type?: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  errors?: Record<string, string[]>;
}

export class RequestError extends Error {
  public status: number;
  public details: ApiError;

  constructor(details: ApiError) {
    super(details.detail || details.title);
    this.name = "RequestError";
    this.status = details.status;
    this.details = details;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("json");

  let data: any = null;
  let rawText = "";

  if (isJson) {
    try {
      data = await response.json();
    } catch (e) {
      console.error("Failed to parse JSON response:", e);
    }
  } else {
    try {
      rawText = await response.text();
    } catch (e) {}
  }

  if (!response.ok) {
    if (data) {
      const errorDetail =
        data.detail || data.message || data.title || "An error occurred";
      throw new RequestError({
        title: data.title || response.statusText || "Error",
        status: data.status || response.status,
        detail: errorDetail,
        errors: data.errors,
      });
    }

    throw new RequestError({
      title: response.statusText || "Unknown Error",
      status: response.status,
      detail: rawText
        ? `Server Error: ${rawText.substring(0, 100)}`
        : "An unexpected error occurred while communicating with the server.",
    });
  }

  // The backend ApiResponse.success wraps data in a { success: true, message: string, data: T } envelope
  return (data?.data ?? data) as T;
}

export const apiClient = {
  async get<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      ...options,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });
    return handleResponse<T>(response);
  },

  async post<T>(url: string, body?: any, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      ...options,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  },

  async put<T>(url: string, body?: any, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      ...options,
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  },

  async delete<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      ...options,
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });
    return handleResponse<T>(response);
  },

  async patch<T>(url: string, body?: any, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      ...options,
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  },
};
