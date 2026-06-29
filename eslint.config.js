import js from '@eslint/js';

export default [
  {
    ignores: ['node_modules/**', 'coverage/**', 'tests/fixtures/**'],
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        URL: 'readonly',
      },
    },
  },
];
