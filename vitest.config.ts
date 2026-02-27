import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Increase default timeout to handle slow tests in parallel execution
    testTimeout: 30000,
    // Use forks pool for better isolation between test files
    pool: 'forks',
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      // brainstorm-server uses Node assert (not Vitest) - run standalone
      'tests/brainstorm-server/**',
    ],
  },
});
