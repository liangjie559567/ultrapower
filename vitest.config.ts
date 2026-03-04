import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 30000,
    pool: 'forks',
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'tests/brainstorm-server/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['**/__tests__/**', '**/*.test.ts', '**/types.ts'],
    },
  },
});
