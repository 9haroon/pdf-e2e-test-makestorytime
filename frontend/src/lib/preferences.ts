const SESSION_KEY = "makestory_session_id";

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getSessionId(): string {
  if (typeof window === "undefined") return "server-session";
  const found = window.localStorage.getItem(SESSION_KEY);
  if (found) return found;
  const next = randomId();
  window.localStorage.setItem(SESSION_KEY, next);
  return next;
}
