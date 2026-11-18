import { newSession, type Session } from "./types";

// In-memory session store. The browser only ever holds the session ID,
// so it cannot edit `verified` or any other field.
const sessions = new Map<string, Session>();

export function getOrCreateSession(id: string | null): Session {
  const existing = id ? sessions.get(id) : undefined;
  if (existing) return existing;

  // Unknown or missing ID: always a fresh, unverified session with a server-made ID.
  const session = newSession(crypto.randomUUID());
  sessions.set(session.id, session);
  return session;
}

export function clearSessions(): void {
  sessions.clear();
}
