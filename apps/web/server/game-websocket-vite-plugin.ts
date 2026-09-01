import nodeAdapter from 'crossws/adapters/node';
import type { Hooks } from 'crossws';
import type { IncomingMessage } from 'node:http';
import type { Duplex } from 'node:stream';
import type { Plugin, ViteDevServer } from 'vite';

type ViteHttpServer = ViteDevServer['httpServer'];

function attachGameWebSocket(
  server: ViteHttpServer,
  path: string,
  hooks: Partial<Hooks>
): void {
  if (!server) return;
  const adapter = nodeAdapter({ hooks });
  const handleUpgrade = (
    request: IncomingMessage,
    socket: Duplex,
    head: Buffer
  ) => {
      const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
      if (pathname !== path) return;
      void adapter.handleUpgrade(request, socket, head);
    };

  server.on('upgrade', handleUpgrade);
  server.once('close', () => {
    server.off('upgrade', handleUpgrade);
    void adapter.close(1001, 'Vite server stopped');
  });
}

/** Gắn `/api/ws` vào HTTP server của Vite dev. */
export function gameWebSocketVitePlugin(): Plugin {
  return {
    name: 'twofold-game-websocket',
    apply: 'serve',
    async configureServer(server) {
      const module = await server.ssrLoadModule('/server/game-websocket.ts') as {
        GAME_WEBSOCKET_PATH: string;
        gameWebSocketHooks: Partial<Hooks>;
      };
      attachGameWebSocket(
        server.httpServer,
        module.GAME_WEBSOCKET_PATH,
        module.gameWebSocketHooks
      );
    },
  };
}
