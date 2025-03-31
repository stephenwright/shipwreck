import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import globals from 'globals';

export default defineConfig([
  {
    files: ['**/*.js'],
    plugins: {
      js,
    },
    languageOptions: {
      globals: globals.browser,
    },
    extends: ['js/recommended'],
    rules: {
      // 'no-undef': 'warn',
    },
  },
]);
