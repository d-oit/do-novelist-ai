import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import security from 'eslint-plugin-security';
import prettierConfig from 'eslint-config-prettier';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import pluginReactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import pluginCss from '@eslint/css';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '.claude/**',
      '.opencode/**',
      '.factory/**',
      '*.config.js',
      '*.config.ts',
      'coverage/**',
      '.nyc_output/**',
      '.vscode/**',
      '.idea/**',
      '*.min.js',
      '*.bundle.js',
      'build/**',
      'public/**',
      'playwright-report/**',
      'test-results/**',
      'index.tsx', // Exclude root index.tsx to avoid project service conflict
      'types.ts', // Exclude root types.ts to avoid project service conflict
      'src/assets/styles.css', // Exclude Tailwind CSS files with @apply directives
      'src/index.css', // Exclude Tailwind CSS files with @apply directives
    ],
  },
  js.configs.recommended,
  // Disable type-aware linting for performance
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      security,
      react: pluginReact,
      'react-hooks': pluginReactHooks,
      'react-refresh': pluginReactRefresh,
    },
    languageOptions: {
      parserOptions: {
        // Disable type-aware linting for performance
        project: false,
        tsconfigRootDir: import.meta.dirname,
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.es2022,
        React: true,
        JSX: true,
      },
    },
    settings: {
      'import-x/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
      react: {
        version: 'detect',
      },
    },
    rules: {
      'no-console': 'off',
      'no-undef': 'off',
      // Client-side security rules - less strict for development
      'security/detect-object-injection': 'off',
      'security/detect-non-literal-fs-filename': 'off',
      'security/detect-non-literal-regexp': 'off',
      'security/detect-unsafe-regex': 'off',
      'security/detect-buffer-noassert': 'off',
      'security/detect-child-process': 'off',
      'security/detect-disable-mustache-escape': 'off',
      'security/detect-eval-with-expression': 'error',
      'security/detect-no-csrf-before-method-override': 'off',
      'security/detect-non-literal-require': 'off',
      'security/detect-possible-timing-attacks': 'off',
      'security/detect-pseudoRandomBytes': 'off',
      // Basic TypeScript rules (non-type-aware)
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          args: 'after-used',
          vars: 'all',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      'no-case-declarations': 'off',
      'no-useless-escape': 'off',
      'no-control-regex': 'off',
      // React-specific rules
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      'react/jsx-uses-vars': 'error',
      'react/jsx-key': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-undef': 'error',
      'react/jsx-pascal-case': 'error',
      'react/no-children-prop': 'error',
      'react/no-danger-with-children': 'error',
      'react/no-deprecated': 'warn',
      'react/no-direct-mutation-state': 'error',
      'react/no-find-dom-node': 'error',
      'react/no-is-mounted': 'error',
      'react/no-render-return-value': 'error',
      'react/no-string-refs': 'error',
      'react/no-unknown-property': 'error',
      'react/require-render-return': 'error',
      'react/self-closing-comp': 'warn',
      'react/function-component-definition': [
        'error',
        {
          namedComponents: 'arrow-function',
          unnamedComponents: 'arrow-function',
        },
      ],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },
  // Configuration for Node.js files
  {
    files: [
      '**/*.config.{js,ts}',
      '**/scripts/**/*.{js,ts}',
      '**/*.mjs',
      '**/*.cjs',
      'vite.config.ts',
      'playwright.config.ts',
      'vitest.config.ts',
      'tailwind.config.js',
      'postcss.config.js',
      'prettier.config.js',
    ],
    languageOptions: {
      parserOptions: {
        project: false,
        sourceType: 'commonjs',
      },
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    rules: {
      'no-console': 'off',
      'no-undef': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  // Configuration for test files
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: false,
      },
      globals: {
        ...globals.browser,
        ...globals.es2022,
        ...globals.vitest,
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        vi: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
      'no-debugger': 'off',
      'security/detect-object-injection': 'off',
      'security/detect-non-literal-regexp': 'off',
      'security/detect-unsafe-regex': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          args: 'after-used',
          vars: 'all',
          ignoreRestSiblings: true,
        },
      ],
      'no-empty': 'off',
      'no-empty-function': 'off',
      'no-magic-numbers': 'off',
      'no-unused-expressions': 'off',
      'no-useless-constructor': 'off',
      'react/display-name': 'off',
      'react/prop-types': 'off',
      'react/no-unescaped-entities': 'off',
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'max-lines-per-function': 'off',
      'max-statements': 'off',
      complexity: 'off',
    },
  },
  // Configuration for Playwright E2E test files
  {
    files: ['tests/**/*.spec.ts', 'tests/**/*.spec.js'],
    languageOptions: {
      parserOptions: {
        project: false,
      },
      globals: {
        ...globals.node,
        ...globals.es2022,
        ...globals.playwright,
        test: 'readonly',
        expect: 'readonly',
        describe: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
      'no-debugger': 'off',
      'security/detect-object-injection': 'off',
      'security/detect-non-literal-regexp': 'off',
      'security/detect-unsafe-regex': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          args: 'after-used',
          vars: 'all',
          ignoreRestSiblings: true,
        },
      ],
      'no-empty': 'off',
      'no-empty-function': 'off',
      'no-magic-numbers': 'off',
      'no-unused-expressions': 'off',
      'no-useless-constructor': 'off',
      'no-await-in-loop': 'off',
      'max-lines-per-function': 'off',
      'max-statements': 'off',
      complexity: 'off',
      'prefer-promise-reject-errors': 'off',
    },
  },
  // Configuration for test setup and utility files
  {
    files: [
      'src/test/**/*.{ts,tsx,js,jsx}',
      'tests/utils/**/*.{ts,tsx,js,jsx}',
      '**/mock*.{ts,tsx,js,jsx}',
      '**/*mock*.{ts,tsx,js,jsx}',
    ],
    languageOptions: {
      parserOptions: {
        project: false,
      },
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.es2022,
        vi: 'readonly',
        global: 'writable',
      },
    },
    rules: {
      'no-console': 'off',
      'no-undef': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          args: 'after-used',
          vars: 'all',
          ignoreRestSiblings: true,
        },
      ],
    },
  },
);
