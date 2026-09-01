import { defineWebSocketHandler } from 'nitro';
import { gameWebSocketHooks } from '../game-websocket';

/** Native Nitro route dùng chung cho Vite dev và production `/api/ws`. */
export default defineWebSocketHandler(gameWebSocketHooks);
