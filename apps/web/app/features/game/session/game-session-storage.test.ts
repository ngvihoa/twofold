import { describe, expect, it } from 'vitest';
import { readGameSessionId, writeGameSessionId } from './game-session-storage';

class MemorySessionStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

describe('game session storage', () => {
  it('persists a versioned token per room and removes it explicitly', () => {
    const storage = new MemorySessionStorage();

    writeGameSessionId('ROOM-A', 'session-a', storage);
    writeGameSessionId('ROOM-B', 'session-b', storage);
    expect(readGameSessionId('ROOM-A', storage)).toBe('session-a');
    expect(readGameSessionId('ROOM-B', storage)).toBe('session-b');

    writeGameSessionId('ROOM-A', null, storage);
    expect(readGameSessionId('ROOM-A', storage)).toBeNull();
    expect(readGameSessionId('ROOM-B', storage)).toBe('session-b');
  });

  it('ignores malformed or unknown-version values', () => {
    const storage = new MemorySessionStorage();
    storage.setItem('twofold:game-session:v1:ROOM-A', '{invalid');
    storage.setItem(
      'twofold:game-session:v1:ROOM-B',
      JSON.stringify({ version: 2, sessionId: 'old-session' })
    );

    expect(readGameSessionId('ROOM-A', storage)).toBeNull();
    expect(readGameSessionId('ROOM-B', storage)).toBeNull();
  });
});
