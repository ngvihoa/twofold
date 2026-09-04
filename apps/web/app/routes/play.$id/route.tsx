import { createFileRoute } from '@tanstack/react-router';
import * as React from 'react';
import { BrowserGameTransport } from '../../features/game/session/browser-game-transport';
import {
  readGameSessionId,
  writeGameSessionId,
} from '../../features/game/session/game-session-storage';
import { GameSessionRuntime } from './-GameSessionRuntime';
import { FirstTurnPreview } from './-FirstTurnPreview';

export const Route = createFileRoute('/play/$id')({
  validateSearch: (search: Record<string, unknown>) => ({
    name: typeof search.name === 'string' ? search.name : 'Người chơi',
    reconnectSessionId:
      typeof search.reconnectSessionId === 'string'
        ? search.reconnectSessionId
        : undefined,
    preview: search.preview === 'FIRST_TURN' ? ('FIRST_TURN' as const) : undefined,
    seat: search.seat === 'B' ? ('B' as const) : ('A' as const),
  }),
  component: GameRouteComponent,
});

/** Compose route params, transport và authoritative game actor runtime. */
function GameRouteComponent() {
  const { id: roomId } = Route.useParams();
  const { name, reconnectSessionId, preview, seat } = Route.useSearch();
  if (preview === 'FIRST_TURN') {
    return <FirstTurnPreview roomId={roomId} playerName={name} seat={seat} />;
  }
  return (
    <AuthoritativeGameRoute
      roomId={roomId}
      playerName={name}
      reconnectSessionId={reconnectSessionId}
    />
  );
}

function AuthoritativeGameRoute({
  roomId,
  playerName,
  reconnectSessionId,
}: {
  readonly roomId: string;
  readonly playerName: string;
  readonly reconnectSessionId?: string;
}) {
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
      playerName={playerName}
      reconnectSessionId={effectiveSessionId ?? undefined}
      onSessionIdChange={persistSessionId}
      transport={transport}
    />
  );
}
