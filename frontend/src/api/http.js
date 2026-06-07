const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export function getToken() {
  return localStorage.getItem("token");
}

export async function apiRequest(path, options = {}) {
  const token = getToken();
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers ?? {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof data === "string" ? data : (data?.message || data?.error);
    const fallbackMessage = response.status === 401 || response.status === 403
      ? "Bạn cần đăng nhập hoặc phiên đăng nhập đã hết hạn."
      : "Không thể kết nối tới backend";
    const error = new Error(message || fallbackMessage);
    error.status = response.status;
    throw error;
  }

  return data;
}
