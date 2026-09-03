import { describe, expect, it, vi } from 'vitest';
import { copyTextToClipboard } from './copy-text-to-clipboard';

describe('copyTextToClipboard', () => {
  it('uses the Clipboard API when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const legacyCopy = vi.fn(() => true);

    await expect(
      copyTextToClipboard('ABC123', { writeText, legacyCopy })
    ).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith('ABC123');
    expect(legacyCopy).not.toHaveBeenCalled();
  });

  it('falls back when the Clipboard API is rejected', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('NotAllowedError'));
    const legacyCopy = vi.fn(() => true);

    await expect(
      copyTextToClipboard('ABC123', { writeText, legacyCopy })
    ).resolves.toBe(true);
    expect(legacyCopy).toHaveBeenCalledWith('ABC123');
  });

  it('reports failure when neither copy mechanism succeeds', async () => {
    await expect(
      copyTextToClipboard('ABC123', {
        legacyCopy: () => false,
      })
    ).resolves.toBe(false);
  });
});
