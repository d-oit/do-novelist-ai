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
  ...tseslint.configs.recommended,
  prettierConfig,
  // Type-aware configuration for TypeScript files only
  ...tseslint.configs.recommendedTypeChecked.map(config => ({
    ...config,
    files: ['**/*.{ts,tsx}'],
  })),
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
        // Performance optimizations for type-aware linting
        projectService: {
          allowDefaultProject: ['src/index.tsx'], // Include this specific file
          maximumDefaultProjectFileMatchCount_thisProject: 1000,
        },
        tsconfigRootDir: import.meta.dirname,
        // Cache parser results for better performance
        cacheLifetime: {
          glob: 300, // 5 minutes
        },
        // Reduce parser overhead
        ecmaVersion: 'latest',
        sourceType: 'module',
        // Performance: disable expensive features when not needed
        warnOnUnsupportedTypeScriptVersion: false,
        // Enable JSX parsing for React
        ecmaFeatures: {
          jsx: true,
        },
        // Additional performance optimizations
        extraFileExtensions: ['.svelte', '.vue'],
        // Optimize for large codebases
        programs: undefined, // Let TypeScript-ESLint handle program management
      },
      // Browser environment globals for React components
      globals: {
        ...globals.browser,
        ...globals.es2022,
        React: true,
        JSX: true,
      },
    },
    settings: {
      // Performance optimizations for import plugin
      'import-x/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
      // React settings
      react: {
        version: 'detect', // Automatically detect React version
      },
    },
    rules: {
      'no-console': 'off', // Allow console for development
      'no-undef': 'off', // Globals are handled by languageOptions.globals
      // Client-side security rules - less strict for development
      'security/detect-object-injection': 'off', // Too many false positives
      'security/detect-non-literal-fs-filename': 'off', // Not relevant for client-side
      'security/detect-non-literal-regexp': 'off', // Too many false positives
      'security/detect-unsafe-regex': 'off',
      'security/detect-buffer-noassert': 'off', // Not relevant for client-side
      'security/detect-child-process': 'off', // Not relevant for client-side
      'security/detect-disable-mustache-escape': 'off', // Not relevant for client-side
      'security/detect-eval-with-expression': 'error',
      'security/detect-no-csrf-before-method-override': 'off', // Not relevant for client-side
      'security/detect-non-literal-require': 'off', // Not relevant for client-side
      'security/detect-possible-timing-attacks': 'off', // Too many false positives
      'security/detect-pseudoRandomBytes': 'off', // Not relevant for client-side
      // Strict TypeScript rules for enhanced type safety
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/explicit-member-accessibility': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'error',
      // Disallow any types in production code
      '@typescript-eslint/no-explicit-any': 'error',
      // Allow empty catch blocks for development
      'no-empty': 'off',
      // Enhanced unused variables handling with underscore patterns
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
      // Allow case declarations
      'no-case-declarations': 'off',
      // Allow useless escapes in regex
      'no-useless-escape': 'off',
      // Allow control characters in regex for validation
      'no-control-regex': 'off',
      // Strict type checking rules
      '@typescript-eslint/no-unsafe-function-type': 'error',
      '@typescript-eslint/no-empty-object-type': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',

      // React-specific rules for modern React 17+ development
      // React 17+ doesn't require React import for JSX
      'react/react-in-jsx-scope': 'off',
      // Enforce modern React patterns
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
      'react/no-unescaped-entities': 'off',
      'react/no-unknown-property': 'error',
      'react/require-render-return': 'error',
      'react/self-closing-comp': 'warn',
      // Component definition consistency - allow both function declarations and arrow functions
      'react/function-component-definition': [
        'error',
        {
          namedComponents: 'arrow-function',
          unnamedComponents: 'arrow-function',
        },
      ],
      // Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'off',
      // React refresh for Vite HMR - enabled with proper configuration
      'react-refresh/only-export-components': [
        'warn',
        {
          allowConstantExport: true,
          allowExportNames: [
            'default',
            'Loader2',
            'Database',
            'Plus',
            'LayoutDashboard',
            'Folder',
            'Settings',
            'Menu',
            'X',
            'motion',
            'cva',
            'cn',
            'Button',
            'buttonVariants',
          ],
        },
      ],
    },
  },
  // React-specific configuration for component files
  {
    files: ['**/*.{jsx,tsx}'],
    plugins: {
      'react-refresh': pluginReactRefresh,
    },
    rules: {
      'react-refresh/only-export-components': [
        'warn',
        {
          allowConstantExport: true,
          allowExportNames: [
            'default',
            'Loader2',
            'Database',
            'Plus',
            'LayoutDashboard',
            'Folder',
            'Settings',
            'Menu',
            'X',
            'motion',
            'cva',
            'cn',
            'Button',
            'buttonVariants',
            'ErrorBoundary',
            'PageErrorBoundary',
            'SectionErrorBoundary',
            'ComponentErrorBoundary',
            'withErrorBoundary',
            'useErrorHandler',
            'EditorErrorBoundary',
            'ProjectsErrorBoundary',
            'AIServiceErrorBoundary',
          ],
        },
      ],
    },
  },
  // Configuration for non-component TypeScript files (utilities, types, services)
  {
    files: [
      '**/*.ts',
      '!**/*.d.ts',
      '!**/*.test.ts',
      '!**/*.spec.ts',
      '!src/**/*.config.{js,ts}',
      '!scripts/**/*',
      '!vite.config.ts',
      '!playwright.config.ts',
      '!vitest.config.ts',
      '!tailwind.config.js',
      '!postcss.config.js',
      '!prettier.config.js',
    ],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  // Configuration for Node.js files (build scripts, config files, etc.)
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
      'no-undef': 'off', // Globals are handled by languageOptions.globals
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-member-accessibility': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
    },
  },
  // Configuration for Vitest unit test files
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        // Disable type-aware linting for test files to improve performance
        project: false,
      },
      globals: {
        ...globals.browser,
        ...globals.es2022,
        ...globals.vitest,
        // Additional test globals
        vi: 'readonly',
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
      // Console and debugging
      'no-console': 'off',
      'no-debugger': 'off',

      // Security - relaxed for testing
      'security/detect-object-injection': 'off',
      'security/detect-non-literal-regexp': 'off',
      'security/detect-unsafe-regex': 'off',

      // TypeScript - more lenient for tests
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-member-accessibility': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/prefer-optional-chain': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      // Additional unsafe type rules for tests
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/restrict-plus-operands': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-unnecessary-type-constraint': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-floating-promises': 'off',

      // General JavaScript - relaxed for testing
      'no-empty': 'off',
      'no-empty-function': 'off',
      'no-magic-numbers': 'off',
      'no-unused-expressions': 'off',
      'no-useless-constructor': 'off',

      // Unused variables - allow underscore prefixes
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

      // React - relaxed for test components
      'react/display-name': 'off',
      'react/prop-types': 'off',
      'react/no-unescaped-entities': 'off',
      'react/jsx-props-no-spreading': 'off',
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',

      // Testing patterns
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
        // Additional Playwright globals
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
      // Console and debugging - essential for E2E debugging
      'no-console': 'off',
      'no-debugger': 'off',

      // Security - relaxed for E2E testing
      'security/detect-object-injection': 'off',
      'security/detect-non-literal-regexp': 'off',
      'security/detect-unsafe-regex': 'off',

      // TypeScript - more lenient for E2E tests
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-member-accessibility': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/prefer-optional-chain': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      // Additional unsafe type rules for E2E tests
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/restrict-plus-operands': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-unnecessary-type-constraint': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-floating-promises': 'off',

      // General JavaScript - relaxed for E2E testing
      'no-empty': 'off',
      'no-empty-function': 'off',
      'no-magic-numbers': 'off',
      'no-unused-expressions': 'off',
      'no-useless-constructor': 'off',
      'no-await-in-loop': 'off', // Common in E2E tests

      // Unused variables - allow underscore prefixes
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

      // E2E specific patterns
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
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-member-accessibility': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/prefer-optional-chain': 'off',
      // Additional unsafe type rules for test setup
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/restrict-plus-operands': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-unnecessary-type-constraint': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      'no-empty': 'off',
      'no-empty-function': 'off',
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
