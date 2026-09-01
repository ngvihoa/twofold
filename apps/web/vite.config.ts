import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { nitro } from 'nitro/vite';
import { defineConfig } from 'vite';
import { gameWebSocketVitePlugin } from './server/game-websocket-vite-plugin.ts';

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    tanstackStart({
      srcDirectory: 'app',
      server: {
        entry: './server.ts',
      },
    }),
    ...(process.env.VITEST ? [] : [nitro()]),
    gameWebSocketVitePlugin(),
    viteReact(),
  ],
});
