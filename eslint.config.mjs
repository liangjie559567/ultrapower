import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['dist/**', 'bridge/**', 'node_modules/**', '**/*.cjs', '**/*.mjs'],
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-require-imports': 'warn',
      'no-control-regex': 'off',
      'no-useless-escape': 'warn',
      'no-useless-catch': 'warn',
    },
  }
);
