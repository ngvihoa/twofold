import { createFileRoute } from '@tanstack/react-router';
import { AlertTriangle } from 'lucide-react';
import * as React from 'react';
import { BrowserGameTransport } from '../../features/game/session/browser-game-transport';
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
  const endpoint = import.meta.env.VITE_GAME_WS_URL as string | undefined;
  const transport = React.useMemo(
    () => (endpoint ? new BrowserGameTransport(endpoint) : null),
    [endpoint]
  );

  if (transport === null) {
    return (
      <section className="mx-auto flex w-full max-w-xl flex-1 items-center justify-center p-6 text-center">
        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-8">
          <AlertTriangle className="mx-auto h-8 w-8 text-amber-400" />
          <h1 className="mt-3 text-xl font-bold text-slate-100">
            Chưa cấu hình game server
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Đặt `VITE_GAME_WS_URL` để kết nối room {roomId} và nhận player view
            v0.2. Client không chạy game-core thay cho authoritative server.
          </p>
        </div>
      </section>
    );
  }

  return (
    <GameSessionRuntime
      roomId={roomId}
      playerName={name}
      reconnectSessionId={reconnectSessionId}
      transport={transport}
    />
  );
}
