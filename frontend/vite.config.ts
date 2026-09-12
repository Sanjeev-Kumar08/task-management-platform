/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:4000',
      '/socket.io': {
        target: 'http://localhost:4000',
        ws: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/lib/validators.ts',
        'src/stores/boardStore.ts',
        'src/stores/uiStore.ts',
        'src/features/boards/**',
        'src/utils/cn.ts',
        'src/utils/id.ts',
        'src/utils/storage.ts',
        'src/utils/normalize.ts',
      ],
      thresholds: {
        lines: 60,
        functions: 40,
        branches: 45,
        statements: 60,
      },
    },
  },
});
