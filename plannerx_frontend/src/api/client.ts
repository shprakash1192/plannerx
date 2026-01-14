const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

export class ApiError extends Error {
  status: number;
  detail?: unknown;
  constructor(status: number, message: string, detail?: unknown) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

function getErrorMessage(detail: unknown): string {
  if (typeof detail === "string") return detail;
  if (detail && typeof detail === "object" && "detail" in detail) {
    const d = (detail as { detail?: unknown }).detail;
    if (typeof d === "string") return d;
  }
  return "Request failed";
}

export async function api<T>(
  path: string,
  opts: RequestInit & { token?: string } = {}
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers = new Headers(opts.headers);

  if (!headers.has("Content-Type") && opts.body) {
    headers.set("Content-Type", "application/json");
  }
  if (opts.token) headers.set("Authorization", `Bearer ${opts.token}`);

  const res = await fetch(url, { ...opts, headers });

  // Try parse JSON (even for errors)
  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok) {
    throw new ApiError(res.status, getErrorMessage(data ?? text), data ?? text);
  }

  return (data as T) ?? ({} as T);
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}