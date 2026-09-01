import { createServerEntry } from '@tanstack/react-start/server-entry';
import {
  createStartHandler,
  defaultStreamHandler,
} from '@tanstack/react-start/server';
import { plugin as websocketPlugin } from 'crossws/server/node';
import { gameWebSocketHooks } from '../server/game-websocket';

const startEntry = createServerEntry({
  fetch: createStartHandler(defaultStreamHandler),
});

/**
 * Production srvx entry: HTTP dùng TanStack Start, WebSocket dùng cùng server
 * process qua crossws. Vite dev gắn cùng hooks bằng plugin trong vite.config.
 */
export default {
  ...startEntry,
  plugins: [websocketPlugin(gameWebSocketHooks)],
};
