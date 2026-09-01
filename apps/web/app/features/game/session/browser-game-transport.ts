import type { ClientWsMessage } from '@twofold/shared-types';
import type { GameTransport, GameTransportEvent } from './game-transport';

/** Minimal native socket surface used by the transport and injectable in tests. */
export type GameWebSocket = Pick<
  WebSocket,
  | 'readyState'
  | 'onopen'
  | 'onmessage'
  | 'onclose'
  | 'onerror'
  | 'send'
  | 'close'
>;

export type GameWebSocketFactory = (url: string) => GameWebSocket;

const SOCKET_OPEN = 1;
const SOCKET_CONNECTING = 0;

/**
 * Resolve relative HTTP(S) config thành WebSocket URL dựa trên browser origin.
 *
 * @throws Khi dùng relative endpoint ngoài browser hoặc protocol không hợp lệ.
 */
export function resolveGameWebSocketUrl(endpoint: string): string {
  if (/^wss?:\/\//u.test(endpoint)) return endpoint;
  if (typeof window === 'undefined') {
    throw new Error('Relative game WebSocket endpoint chỉ resolve được trong browser.');
  }
  const url = new URL(endpoint, window.location.href);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString();
}

function parseInboundData(data: unknown): unknown {
  if (typeof data !== 'string') return data;
  try {
    return JSON.parse(data) as unknown;
  } catch {
    return data;
  }
}

/** Native browser WebSocket implementation của `GameTransport`. */
export class BrowserGameTransport implements GameTransport {
  private socket: GameWebSocket | null = null;
  private readonly listeners = new Set<(event: GameTransportEvent) => void>();

  constructor(
    private readonly endpoint: string,
    private readonly createSocket: GameWebSocketFactory = (url) => new WebSocket(url)
  ) {}

  /** Mở một socket mới; bỏ qua nếu socket hiện tại đang connecting/open. */
  connect(): void {
    if (
      this.socket?.readyState === SOCKET_CONNECTING ||
      this.socket?.readyState === SOCKET_OPEN
    ) {
      return;
    }

    const socketUrl = resolveGameWebSocketUrl(this.endpoint);
    const socket = this.createSocket(socketUrl);
    this.socket = socket;
    socket.onopen = () => this.emit({ type: 'OPEN' });
    socket.onmessage = ({ data }) =>
      this.emit({ type: 'MESSAGE', message: parseInboundData(data) });
    socket.onerror = () =>
      this.emit({
        type: 'ERROR',
        error: new Error(`Game WebSocket connection error (${socketUrl}).`),
      });
    socket.onclose = ({ reason }) => {
      if (this.socket === socket) this.socket = null;
      this.emit({ type: 'CLOSED', ...(reason ? { reason } : {}) });
    };
  }

  /** Chủ động đóng socket; session machine quyết định có reconnect hay không. */
  disconnect(): void {
    const socket = this.socket;
    if (!socket) return;

    // Release ownership synchronously so React remount/reconnect can create a
    // fresh socket before the old CONNECTING socket emits its delayed close.
    this.socket = null;
    socket.onopen = null;
    socket.onmessage = null;
    socket.onerror = null;
    socket.onclose = null;
    socket.close(1000, 'Client disconnect');
  }

  /**
   * Serialize và gửi một v0.2 client message.
   *
   * @throws Khi socket chưa ở trạng thái open.
   */
  send(message: ClientWsMessage): void {
    if (this.socket?.readyState !== SOCKET_OPEN) {
      throw new Error('Không thể gửi game message khi WebSocket chưa open.');
    }
    this.socket.send(JSON.stringify(message));
  }

  /** Đăng ký listener và trả cleanup function tương ứng. */
  subscribe(listener: (event: GameTransportEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: GameTransportEvent): void {
    this.listeners.forEach((listener) => listener(event));
  }
}
