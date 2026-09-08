let fallbackSequence = 0;

type ClientCrypto = Pick<Crypto, 'getRandomValues' | 'randomUUID'>;

/** Tạo command ID trên cả browser mới và browser chưa có crypto.randomUUID. */
export function createClientCommandId(
  cryptoApi: ClientCrypto | null = globalThis.crypto
): string {
  if (typeof cryptoApi?.randomUUID === 'function') {
    return cryptoApi.randomUUID();
  }

  if (typeof cryptoApi?.getRandomValues === 'function') {
    const bytes = cryptoApi.getRandomValues(new Uint8Array(16));
    bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
    bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'));
    return [
      hex.slice(0, 4).join(''),
      hex.slice(4, 6).join(''),
      hex.slice(6, 8).join(''),
      hex.slice(8, 10).join(''),
      hex.slice(10).join(''),
    ].join('-');
  }

  fallbackSequence += 1;
  return [
    'command',
    Date.now().toString(36),
    fallbackSequence.toString(36),
    Math.random().toString(36).slice(2),
  ].join('-');
}
