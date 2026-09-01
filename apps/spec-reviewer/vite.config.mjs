import { cp, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const root = import.meta.dirname;

export default defineConfig({
  root,
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        atlas: resolve(root, 'index.html'),
        shortlist: resolve(root, 'shortlist.html'),
        notes: resolve(root, 'notes/index.html'),
        game: resolve(root, 'game-flow-demo/ui.html'),
      },
    },
  },
  plugins: [
    {
      name: 'copy-reviewer-runtime-data',
      async closeBundle() {
        await mkdir(resolve(root, 'dist/data'), { recursive: true });
        await cp(resolve(root, 'data'), resolve(root, 'dist/data'), {
          recursive: true,
        });
        await mkdir(resolve(root, 'dist/assets'), { recursive: true });
        await cp(resolve(root, 'assets'), resolve(root, 'dist/assets'), {
          recursive: true,
        });
      },
    },
  ],
});
