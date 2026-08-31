import type { ClientWsMessage } from '@twofold/shared-types';

/** Raw transport notifications; protocol validation belongs to the session boundary. */
export type GameTransportEvent =
  | { readonly type: 'OPEN' }
  | { readonly type: 'MESSAGE'; readonly message: unknown }
  | { readonly type: 'CLOSED'; readonly reason?: string }
  | { readonly type: 'ERROR'; readonly error: unknown };

/**
 * Connection port consumed by the game session machine.
 *
 * Browser WebSocket and deterministic test transports implement this contract;
 * neither React components nor the state machine depend on a concrete socket.
 */
export interface GameTransport {
  connect(): void;
  disconnect(): void;
  send(message: ClientWsMessage): void;
  subscribe(listener: (event: GameTransportEvent) => void): () => void;
}
