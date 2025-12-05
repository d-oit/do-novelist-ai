# ESLint Configuration

ESLint enforces code quality rules, especially for React and TypeScript.

## Installation

```bash
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D eslint-plugin-react-hooks eslint-plugin-react-refresh
```

## Basic Configuration

Create `.eslintrc.cjs`:

```javascript
/* eslint-env node */
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
};
```

## React-Specific Rules

### React Hooks Rules

```javascript
{
  "rules": {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

**Why**: Ensures React hooks are called correctly and dependencies are tracked.

### Component Export Rules

```javascript
{
  "plugins": ["react-refresh"],
  "rules": {
    "react-refresh/only-export-components": [
      "warn",
      { allowConstantExport: true }
    ]
  }
}
```

**Why**: Only allows component exports in files with `.tsx` or `.jsx`
extensions.

## TypeScript Rules

### Type Safety

```javascript
{
  "rules": {
    "@typescript-eslint/no-unused-vars": [
      "error",
      { "argsIgnorePattern": "^_" }
    ],
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off"
  }
}
```

### Async/Await Rules

```javascript
{
  "rules": {
    "@typescript-eslint/promise-function-async": "error",
    "no-return-await": "off",
    "@typescript-eslint/return-await": "error"
  }
}
```

## Advanced Configuration

### Strict Configuration

```javascript
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:react-hooks/recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json',
  },
  rules: {
    // TypeScript
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unsafe-assignment': 'warn',
    '@typescript-eslint/no-unsafe-member-access': 'warn',
    '@typescript-eslint/no-unsafe-call': 'warn',
    '@typescript-eslint/no-unsafe-return': 'warn',

    // React
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // General
    'prefer-const': 'error',
    'no-var': 'error',
    'no-console': 'warn',
  },
};
```

### Accessibility Rules

```bash
npm install -D eslint-plugin-jsx-a11y
```

```javascript
{
  "extends": [
    "plugin:jsx-a11y/recommended"
  ],
  "plugins": ["jsx-a11y"]
}
```

## Rule Customization

### Allow underscore prefix for unused args

```javascript
{
  "@typescript-eslint/no-unused-vars": [
    "error",
    { "argsIgnorePattern": "^_" }
  ]
}
```

```typescript
function handleEvent(event: MouseEvent, _unused: string) {
  // _unused is allowed but marked as intentionally unused
}
```

### Disable explicit return types (for concise code)

```javascript
{
  "@typescript-eslint/explicit-function-return-type": "off",
  "@typescript-eslint/explicit-module-boundary-types": "off"
}
```

### Allow any in test files

```javascript
{
  "overrides": [
    {
      "files": ["**/*.test.ts", "**/*.test.tsx"],
      "rules": {
        "@typescript-eslint/no-explicit-any": "off"
      }
    }
  ]
}
```

## Integration with Biome

**Rule of thumb:**

- Biome: Formatting, import organization, basic linting
- ESLint: React-specific rules, complex logic checks

### Avoid Conflicts

In `.eslintrc.cjs`:

```javascript
module.exports = {
  rules: {
    // Disable rules that Biome handles
    quotes: 'off',
    semi: 'off',
    'comma-dangle': 'off',
    'no-unused-vars': 'off',

    // Use TypeScript-specific versions
    '@typescript-eslint/quotes': ['error', 'single'],
    '@typescript-eslint/semi': ['error', 'always'],
    '@typescript-eslint/no-unused-vars': ['error'],
  },
};
```

## Common Commands

```bash
# Lint all files
npm run lint

# Fix automatically fixable issues
npm run lint:fix

# CI mode (no auto-fix, fail on warnings)
npm run lint:ci

# Lint specific file
npx eslint src/App.tsx

# Debug lint issues
npx eslint src/App.tsx --debug
```

## Suppressing Rules

### File-level

```javascript
/* eslint-disable @typescript-eslint/no-explicit-any */
// Code here...
/* eslint-enable @typescript-eslint/no-explicit-any */
```

### Line-level

```typescript
const data: any = response; // eslint-disable-line @typescript-eslint/no-explicit-any
```

### Disable rule for next line

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = response;
```

## Best Practices

✓ Use TypeScript-eslint rules instead of base ESLint rules ✓ Enable React hooks
rules ✓ Configure `argsIgnorePattern` for intentionally unused params ✓ Use
`no-console` in production builds ✓ Add jsx-a11y for accessibility checks

✗ Don't disable rules globally without reason ✗ Don't use `any` type in
production code ✗ Don't mix Biome formatting with ESLint formatting rules ✗
Don't ignore TypeScript errors

## Common Errors

### `no-unused-vars`

```typescript
// Bad: Unused parameter
function handleClick(event: MouseEvent) {
  console.log('clicked');
}

// Good: Mark as unused
function handleClick(event: MouseEvent, _unused: string) {
  console.log('clicked');
}

// Or better: Use the parameter
function handleClick(event: MouseEvent) {
  console.log('clicked', event.target);
}
```

### `no-explicit-any`

```typescript
// Bad: Explicit any
function processData(data: any): any {
  return data;
}

// Good: Unknown with type guard
function processData(data: unknown): unknown {
  if (typeof data === 'string') {
    return data.toUpperCase();
  }
  return data;
}
```

### `react-hooks/exhaustive-deps`

```typescript
// Bad: Missing dependency
useEffect(() => {
  fetchData(id);
}, []); // Missing 'id'

// Good: Include all dependencies
useEffect(() => {
  fetchData(id);
}, [id]);
```
