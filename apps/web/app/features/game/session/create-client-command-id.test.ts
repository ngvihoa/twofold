import { describe, expect, it, vi } from 'vitest';
import { createClientCommandId } from './create-client-command-id';

describe('createClientCommandId', () => {
  it('uses crypto.randomUUID when the browser supports it', () => {
    const randomUUID = vi.fn(() => 'native-command-id');

    expect(
      createClientCommandId({
        randomUUID,
        getRandomValues: vi.fn(),
      } as unknown as Crypto)
    ).toBe('native-command-id');
    expect(randomUUID).toHaveBeenCalledOnce();
  });

  it('uses getRandomValues when randomUUID is missing', () => {
    const getRandomValues = vi.fn((bytes: Uint8Array) => {
      bytes.fill(0xab);
      return bytes;
    });

    const commandId = createClientCommandId({
      getRandomValues,
    } as unknown as Crypto);

    expect(commandId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u
    );
    expect(getRandomValues).toHaveBeenCalledOnce();
  });

  it('still creates distinct IDs when the crypto API is unavailable', () => {
    const first = createClientCommandId(null);
    const second = createClientCommandId(null);

    expect(first).toMatch(/^command-/u);
    expect(second).toMatch(/^command-/u);
    expect(second).not.toBe(first);
  });
});
