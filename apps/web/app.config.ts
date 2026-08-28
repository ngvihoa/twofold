import { defineConfig } from '@tanstack/react-start/config';

export default defineConfig({
  server: {
    experimental: {
      websocket: true,
    },
  },
});

