import { defineConfig, globalIgnores } from 'eslint/config';
import expoConfig from 'eslint-config-expo/flat.js';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import reactCompiler from 'eslint-plugin-react-compiler';
import reactNativeA11y from 'eslint-plugin-react-native-a11y';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
// TODO: Re-enable when eslint-plugin-tailwindcss has stable Tailwind v4 support
// import tailwind from 'eslint-plugin-tailwindcss';
import testingLibrary from 'eslint-plugin-testing-library';
import unusedImports from 'eslint-plugin-unused-imports';
import { parser } from 'typescript-eslint';

export default defineConfig([
  globalIgnores([
    'dist/*',
    'node_modules',
    '.expo',
    '.expo-shared',
    '.agent',
    '.agents',
    '.cursor',
    '.windsurf',
    '.kiro',
    '.maestro',
    '.codex',
    '.github',
    'android',
    'ios',
    'coverage',
    'tmp',
    '**/*.d.ts',
  ]),
  expoConfig,
  eslintConfigPrettier,
  {
    plugins: {
      prettier: eslintPluginPrettier,
    },
    rules: {
      'prettier/prettier': 'error',
    },
  },
  // ...tailwind.configs['flat/recommended'],

  reactCompiler.configs.recommended,
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
      'unused-imports': unusedImports,
      'react-native-a11y': reactNativeA11y,
    },
    rules: {
      'max-params': ['error', 3],
      // 'tailwindcss/classnames-order': ['warn', { officialSorting: true }],
      // 'tailwindcss/no-custom-classname': 'off',
      'react/display-name': 'off',
      'react/destructuring-assignment': 'off',
      'react/require-default-props': 'off',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'import/prefer-default-export': 'off',
      // a11y: modern rules only (removed legacy iOS-only traits/component-type)
      'react-native-a11y/has-accessibility-hint': 'warn',
      'react-native-a11y/has-accessibility-props': 'error',
      'react-native-a11y/has-valid-accessibility-actions': 'error',
      'react-native-a11y/has-valid-accessibility-descriptors': 'error',
      'react-native-a11y/has-valid-accessibility-role': 'error',
      'react-native-a11y/has-valid-accessibility-state': 'error',
      'react-native-a11y/has-valid-accessibility-value': 'error',
      'react-native-a11y/no-nested-touchables': 'error',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: parser,
      parserOptions: {
        project: './tsconfig.json',
        sourceType: 'module',
      },
    },
    settings: {
      'import/ignore': ['node_modules', '\\.agents?'],
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
          disallowTypeAnnotations: true,
        },
      ],
    },
  },
  // Test files - exempt from max-lines-per-function
  {
    files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
    plugins: { 'testing-library': testingLibrary },
    rules: {
      ...testingLibrary.configs.react.rules,
      'testing-library/no-wait-for-multiple-assertions': 'off',
      'max-params': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
]);
