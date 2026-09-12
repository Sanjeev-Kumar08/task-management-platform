import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/server.ts',
        'src/scripts/**',
        'src/config/swagger.docs.ts',
        'src/sockets/**',
        'src/jobs/**',
        'src/modules/**/*.types.ts',
      ],
      thresholds: {
        lines: 60,
        functions: 50,
        branches: 45,
        statements: 60,
      },
    },
  },
});
