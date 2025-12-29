let csrfToken: string | null = null;

async function ensureCsrfToken() {
  if (csrfToken) return csrfToken;
  const response = await fetch("/api/csrf", { credentials: "include" });
  if (!response.ok) {
    throw new Error("Failed to get CSRF token");
  }
  const data = await response.json();
  csrfToken = data.csrfToken;
  return csrfToken;
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const method = options.method?.toUpperCase() ?? "GET";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined)
  };

  if (method !== "GET" && method !== "HEAD") {
    const token = await ensureCsrfToken();
    headers["X-CSRF-Token"] = token;
  }

  const response = await fetch(path, {
    credentials: "include",
    headers,
    ...options
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody?.message || "Request failed";
    throw new Error(message);
  }

  if (response.status === 204) {
    return {};
  }

  return response.json();
}

export async function downloadFile(path: string) {
  const response = await fetch(path, { credentials: "include" });
  if (!response.ok) {
    throw new Error("Failed to download");
  }
  return response.blob();
}
