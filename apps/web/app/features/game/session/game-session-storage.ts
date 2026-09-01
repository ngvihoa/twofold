interface SessionStoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const SESSION_KEY_PREFIX = 'twofold:game-session:v1:';

function getBrowserSessionStorage(): SessionStoragePort | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function sessionKey(roomId: string): string {
  return `${SESSION_KEY_PREFIX}${roomId}`;
}

/** Read a versioned reconnect token scoped to one room and browser tab. */
export function readGameSessionId(
  roomId: string,
  storage: SessionStoragePort | null = getBrowserSessionStorage()
): string | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(sessionKey(roomId));
    if (!raw) return null;
    const value = JSON.parse(raw) as { version?: unknown; sessionId?: unknown };
    return value.version === 1
      && typeof value.sessionId === 'string'
      && value.sessionId.length > 0
      ? value.sessionId
      : null;
  } catch {
    return null;
  }
}

/** Persist a reconnect token, or remove it when the server rejects the session. */
export function writeGameSessionId(
  roomId: string,
  sessionId: string | null,
  storage: SessionStoragePort | null = getBrowserSessionStorage()
): void {
  if (!storage) return;
  const key = sessionKey(roomId);
  try {
    if (sessionId === null) {
      storage.removeItem(key);
      return;
    }
    storage.setItem(key, JSON.stringify({ version: 1, sessionId }));
  } catch {
    // Storage may be unavailable under restrictive browser privacy policies.
  }
}
