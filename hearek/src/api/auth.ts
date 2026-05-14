import { getStore, newId } from "./store";
import type { Session, User } from "./types";

export function createSession(userId: string): Session {
  const store = getStore();
  const session: Session = {
    token: newId("tok") + newId("k").replace("k_", ""),
    userId,
    createdAt: new Date().toISOString(),
  };
  store.sessions.set(session.token, session);
  return session;
}

export function getUserByToken(token: string | null | undefined): User | null {
  if (!token) return null;
  const store = getStore();
  const session = store.sessions.get(token);
  if (!session) return null;
  return store.users.get(session.userId) ?? null;
}

export function tokenFromRequest(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const m = /^Bearer\s+(.+)$/i.exec(header);
  return m ? m[1].trim() : null;
}

export function requireUser(request: Request): User {
  const user = getUserByToken(tokenFromRequest(request));
  if (!user) {
    throw new HttpError(401, "Unauthorized");
  }
  return user;
}

export function requireRole(request: Request, role: User["role"]): User {
  const user = requireUser(request);
  if (user.role !== role) throw new HttpError(403, "Forbidden");
  return user;
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
