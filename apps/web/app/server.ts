import { createServerEntry } from '@tanstack/react-start/server-entry';
import {
  createStartHandler,
  defaultStreamHandler,
} from '@tanstack/react-start/server';

const startEntry = createServerEntry({
  fetch: createStartHandler(defaultStreamHandler),
});

/**
 * HTTP entry của TanStack Start. WebSocket `/api/ws` được Nitro route xử lý
 * riêng khi `features.websocket` được bật trong Vite config.
 */
export default startEntry;
