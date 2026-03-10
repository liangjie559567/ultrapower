import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 30000,
    pool: 'forks',
    poolMatchGlobs: [
      ['**/*.test.ts', 'forks'],
    ],
    maxConcurrency: 2,
    isolate: true,
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
