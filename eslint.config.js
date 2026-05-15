import tsParser from '@typescript-eslint/parser';
import solid from 'eslint-plugin-solid';

export default [
  {
    files: ['src/admin/**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      solid,
    },
    rules: {
      'solid/reactivity': 'error',
    },
    settings: {
      solid: {
        typescript: true,
      },
    },
    linterOptions: {
      noInlineConfig: true,
    },
  },
];
