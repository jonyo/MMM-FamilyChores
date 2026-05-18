import tsParser from '@typescript-eslint/parser';
import betterTailwindcss from 'eslint-plugin-better-tailwindcss';
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
  betterTailwindcss.configs.correctness,
  {
    files: ['src/admin/**/*.tsx'],
    settings: {
      'better-tailwindcss': {
        entryPoint: 'src/admin/admin.css',
        detectComponentClasses: true,
      },
    },
    rules: {
      'better-tailwindcss/no-unknown-classes': [
        'error',
        {
          // dummy class used in tests
          ignore: ['test-dummy-class'],
        },
      ],
      'better-tailwindcss/enforce-canonical-classes': 'error',
      'better-tailwindcss/no-duplicate-classes': 'error',
      'better-tailwindcss/enforce-consistent-class-order': 'error',
    },
  },
];
