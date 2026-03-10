import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 30000,
    pool: 'threads',
    maxConcurrency: 4,
    isolate: false,
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'tests/brainstorm-server/**',
      '**/file-lock.test.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['**/__tests__/**', '**/*.test.ts', '**/types.ts'],
    },
  },
});
