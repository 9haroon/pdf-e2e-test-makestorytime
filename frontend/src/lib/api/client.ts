import { getSessionId } from "../preferences";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-session-id": getSessionId(),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({ error: { message: "Request failed." } }))) as {
      error?: { message?: string };
    };
    throw new Error(body.error?.message ?? "Request failed.");
  }
  if (res.status === 204) return {} as T;
  return (await res.json()) as T;
}
