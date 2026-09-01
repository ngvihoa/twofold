import { createFileRoute } from '@tanstack/react-router';
import * as React from 'react';
import { BrowserGameTransport } from '../../features/game/session/browser-game-transport';
import {
  readGameSessionId,
  writeGameSessionId,
} from '../../features/game/session/game-session-storage';
import { GameSessionRuntime } from './-GameSessionRuntime';

export const Route = createFileRoute('/play/$id')({
  validateSearch: (search: Record<string, unknown>) => ({
    name: typeof search.name === 'string' ? search.name : 'Người chơi',
    reconnectSessionId:
      typeof search.reconnectSessionId === 'string'
        ? search.reconnectSessionId
        : undefined,
  }),
  component: GameRouteComponent,
});

/** Compose route params, transport và authoritative game actor runtime. */
function GameRouteComponent() {
  const { id: roomId } = Route.useParams();
  const { name, reconnectSessionId } = Route.useSearch();
  const endpoint = (import.meta.env.VITE_GAME_WS_URL as string | undefined) ?? '/api/ws';
  const effectiveSessionId = React.useMemo(
    () => reconnectSessionId ?? readGameSessionId(roomId),
    [reconnectSessionId, roomId]
  );
  const persistSessionId = React.useCallback(
    (sessionId: string | null) => writeGameSessionId(roomId, sessionId),
    [roomId]
  );
  const transport = React.useMemo(
    () => new BrowserGameTransport(endpoint),
    [endpoint]
  );

  return (
    <GameSessionRuntime
      roomId={roomId}
      playerName={name}
      reconnectSessionId={effectiveSessionId ?? undefined}
      onSessionIdChange={persistSessionId}
      transport={transport}
    />
  );
}
