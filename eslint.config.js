import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import pluginImportX from 'eslint-plugin-import-x';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import pluginReactRefresh from 'eslint-plugin-react-refresh';
import security from 'eslint-plugin-security';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '.claude/**',
      '.opencode/**',
      '.factory/**',
      'coverage/**',
      '.nyc_output/**',
      '.vscode/**',
      '.idea/**',
      '*.min.js',
      '*.bundle.js',
      '*.backup',
      'build/**',
      'public/**',
      'playwright-report/**',
      'test-results/**',
      'types.ts',
      'src/assets/styles.css',
      'src/index.css',
    ],
  },

  // Shared configuration for React files
  {
    files: ['**/*.{js,jsx,mjs,cjs,ts,tsx}'],
    plugins: {
      react: pluginReact,
      'react-hooks': pluginReactHooks,
      'react-refresh': pluginReactRefresh,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },

  // Configuration files that need CommonJS/Node.js globals
  {
    files: ['**/*.cjs'],
    languageOptions: {
      globals: {
        ...globals.node,
        module: 'readonly',
        require: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'no-undef': 'off',
    },
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,

  // Configuration for Node.js files (before general TypeScript rules)
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
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  // Configuration for TypeScript source files (excluding bootstrap files)
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    ignores: ['src/index.tsx', 'src/index.ts'],
    plugins: {
      security,
      'import-x': pluginImportX,
    },
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
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
        node: {
          extensions: ['.ts', '.tsx', '.js', '.jsx'],
        },
      },
    },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-undef': 'off',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'JSXAttribute[name.name="className"] TemplateLiteral',
          message:
            'Do not use template literals for className. Use the cn() utility from @/lib/utils instead.',
        },
      ],
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
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'separate-type-imports',
        },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      'no-case-declarations': 'off',
      'no-useless-escape': 'off',
      'no-control-regex': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      'react/jsx-uses-vars': 'error',
      'react/jsx-key': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-undef': 'error',
      'react/jsx-pascal-case': 'error',
      'react/jsx-no-target-blank': 'error',
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
      'react/hook-use-state': 'warn',
      'react/function-component-definition': [
        'error',
        {
          namedComponents: 'arrow-function',
          unnamedComponents: 'arrow-function',
        },
      ],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': 'off',

      // Import optimization rules
      'import-x/order': [
        'error',
        {
          groups: [
            'builtin', // Node.js built-in modules
            'external', // External packages
            'internal', // Internal modules using alias paths
            'parent', // Parent directory imports
            'sibling', // Same directory imports
            'index', // Index file imports
          ],
          pathGroups: [
            {
              pattern: '@/**',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '@shared/**',
              group: 'internal',
              position: 'before',
            },
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
      // Enabled after import path migration phase to guide future changes without blocking
      'import-x/no-relative-parent-imports': 'error',
      'import-x/no-duplicates': 'error',
      'import-x/first': 'error',
      'import-x/newline-after-import': 'error',
    },
  },

  // Configuration for bootstrap files (no type-aware linting)
  {
    files: ['src/index.tsx', 'src/index.ts'],
    plugins: {
      security,
    },
    languageOptions: {
      parserOptions: {
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
    rules: {
      'no-console': 'off',
      'no-undef': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      'react/jsx-uses-vars': 'error',
      'react/jsx-key': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-undef': 'error',
      'react/jsx-pascal-case': 'error',
      'react/jsx-no-target-blank': 'error',
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
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': 'off',
    },
  },

  // Configuration for JavaScript source files
  {
    files: ['src/**/*.js', 'src/**/*.jsx'],
    plugins: {
      security,
    },
    languageOptions: {
      parserOptions: {
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

    rules: {
      'no-console': 'off',
      'no-undef': 'off',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'JSXAttribute[name.name="className"] TemplateLiteral',
          message:
            'Do not use template literals for className. Use the cn() utility from @/lib/utils instead.',
        },
      ],
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
      'no-unused-vars': 'error',
      'no-explicit-any': 'off',
      'no-floating-promises': 'error',
      'await-thenable': 'error',
      'no-misused-promises': 'error',
      'no-case-declarations': 'off',
      'no-useless-escape': 'off',
      'no-control-regex': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      'react/jsx-uses-vars': 'error',
      'react/jsx-key': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-undef': 'error',
      'react/jsx-pascal-case': 'error',
      'react/jsx-no-target-blank': 'error',
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
      'react/hook-use-state': 'warn',
      'react/function-component-definition': [
        'error',
        {
          namedComponents: 'arrow-function',
          unnamedComponents: 'arrow-function',
        },
      ],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': 'off',
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
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/await-thenable': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
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
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/await-thenable': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
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
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/await-thenable': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
    },
  },

  // Configuration for logging infrastructure files
  {
    files: ['src/lib/errors/logging.ts'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-unused-vars': 'error',
    },
  },
);
