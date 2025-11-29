import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import security from 'eslint-plugin-security';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '.claude/**',
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
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      security,
    },
    languageOptions: {
      parserOptions: {
        // Performance optimizations
        projectService: {
          allowDefaultProject: ['src/index.tsx'], // Include this specific file
          maximumDefaultProjectFileMatchCount_thisProject: 1000,
        },
        tsconfigRootDir: import.meta.dirname,
        // Cache parser results
        cacheLifetime: {
          glob: 300, // 5 minutes
        },
        // Reduce parser overhead
        ecmaVersion: 'latest',
        sourceType: 'module',
        // Performance: disable expensive features when not needed
        warnOnUnsupportedTypeScriptVersion: false,
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
    },
    rules: {
      'no-console': 'off', // Allow console for development
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
      // Allow some any types for development flexibility
      '@typescript-eslint/no-explicit-any': 'off',
      // Allow empty catch blocks for development
      'no-empty': 'off',
      // Unused vars rule with comprehensive ignore patterns
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // Allow case declarations
      'no-case-declarations': 'off',
      // Allow useless escapes in regex for now
      'no-useless-escape': 'off',
      // Allow control characters in regex for validation
      'no-control-regex': 'off',
      // Allow unsafe function types for flexibility
      '@typescript-eslint/no-unsafe-function-type': 'off',
      // Allow empty object types
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
  // Configuration for test files - more lenient for better performance
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}'],
    rules: {
      'no-console': 'off',
      'security/detect-object-injection': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  }
);
