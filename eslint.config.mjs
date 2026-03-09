import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['dist/**', 'bridge/**', 'node_modules/**', '**/*.cjs', '**/*.mjs', 'src/features/ccg/**'],
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-require-imports': 'warn',
      'no-control-regex': 'off',
      'no-useless-escape': 'warn',
      'no-useless-catch': 'warn',
      'no-restricted-syntax': [
        'error',
        {
          selector: "MemberExpression[object.name='fs'][property.name=/.*Sync$/]",
          message: 'Avoid synchronous fs operations. Use fs.promises instead to prevent blocking the event loop.',
        },
      ],
    },
  },
  {
    // Test files: relax any and require-imports (mocking patterns are idiomatic)
    files: ['**/__tests__/**/*.ts', '**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'no-restricted-syntax': 'off', // Allow sync fs in tests
    },
  },
  {
    // CLI and installer scripts: sync fs operations are acceptable for simplicity
    files: ['src/cli/**/*.ts', 'src/installer/**/*.ts', 'scripts/**/*.ts'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  {
    // State manager: sync fs allowed (provides both sync and async APIs)
    files: ['src/features/state-manager/**/*.ts', 'src/lib/atomic-write.ts', 'src/lib/file-lock.ts'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  {
    // Security-critical files: sync fs required to prevent TOCTOU races
    files: [
      '**/path-validator.ts',
      '**/python-repl/paths.ts',
      '**/python-repl/bridge-manager.ts',
      '**/ccg/**/*.ts'
    ],
    rules: {
      'no-restricted-syntax': 'off',
    },
  }
);
