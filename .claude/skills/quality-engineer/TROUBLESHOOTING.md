# Troubleshooting Guide

Common issues and solutions for code quality setup.

## Biome Issues

### Issue: Import Organization Not Working

**Symptoms:** Imports are not sorted as expected

**Solution:**

```bash
# Check if organizeImports is enabled
cat biome.json | grep organizeImports

# Ensure it's true
# Run manually to test
npx biome check --write --organize-imports src/
```

**Config Check:**

```json
{
  "organizeImports": {
    "enabled": true
  }
}
```

### Issue: Biome and ESLint Conflicts

**Symptoms:** Conflicting rules, double formatting

**Solution:**

1. Use Biome only for formatting
2. Use ESLint only for React-specific rules
3. Disable overlapping rules in ESLint

**In `.eslintrc.cjs`:**

```javascript
module.exports = {
  rules: {
    // Disable rules Biome handles
    quotes: 'off',
    semi: 'off',
    'no-unused-vars': 'off',

    // Use TypeScript-eslint versions
    '@typescript-eslint/quotes': ['error', 'single'],
    '@typescript-eslint/semi': ['error', 'always'],
    '@typescript-eslint/no-unused-vars': ['error'],
  },
};
```

### Issue: Slow Performance

**Symptoms:** Biome takes too long to run

**Solution:**

```json
{
  "linter": {
    "enabled": true,
    "ignore": ["node_modules/**", "dist/**", "coverage/**"]
  }
}
```

**Or use jobs flag:**

```bash
npx biome check --jobs=4 .
```

### Issue: "File not found" Errors

**Symptoms:** Biome can't find files

**Solution:**

```bash
# Check file paths (use forward slashes)
# Bad: src\components\Button.tsx
# Good: src/components/Button.tsx

# Run on specific directory
npx biome check src/
```

## ESLint Issues

### Issue: "Parser not found"

**Symptoms:** `parser` error in ESLint output

**Solution:**

```bash
# Install TypeScript parser
npm install -D @typescript-eslint/parser

# Check .eslintrc.cjs has parser
module.exports = {
  parser: '@typescript-eslint/parser',
};
```

### Issue: TypeScript Errors in ESLint

**Symptoms:** ESLint can't find TypeScript definitions

**Solution:**

```javascript
module.exports = {
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json', // Add this
  },
};
```

**Or disable type checking:**

```javascript
extends: [
  'plugin:@typescript-eslint/recommended', // Remove -recommended-requiring-type-checking
];
```

### Issue: React Refresh Not Working

**Symptoms:** Fast refresh doesn't work in development

**Solution:**

1. Install plugin:

```bash
npm install -D eslint-plugin-react-refresh
```

2. Configure in `.eslintrc.cjs`:

```javascript
plugins: ['react-refresh'],
rules: {
  'react-refresh/only-export-components': 'warn',
},
```

3. Check file naming (must end with `.tsx` or `.jsx`)

### Issue: "No-else-return"

**Symptoms:** ESLint warns about unnecessary else

**Solution:**

```typescript
// Bad
function test(x: number) {
  if (x > 0) {
    return 'positive';
  } else {
    return 'negative';
  }
}

// Good
function test(x: number) {
  if (x > 0) {
    return 'positive';
  }
  return 'negative';
}
```

### Issue: Too Many Warnings

**Symptoms:** Many warnings but no errors

**Solution:**

```bash
# Fail CI on warnings
npm run lint:ci

# In package.json
{
  "scripts": {
    "lint:ci": "eslint . --ext ts,tsx --max-warnings 0"
  }
}
```

## TypeScript Issues

### Issue: "Cannot find module"

**Symptoms:** `TS2307: Cannot find module '@/utils'`

**Solution:**

1. Check `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"]
}
```

2. Verify Vite config (`vite.config.ts`):

```typescript
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Issue: "Property does not exist on type"

**Symptoms:** TypeScript says property doesn't exist

**Solution:**

```typescript
// Check for undefined
if (obj && obj.property) {
  console.log(obj.property.toFixed(2));
}

// Or use optional chaining
console.log(obj?.property?.toFixed(2));

// With noUncheckedIndexedAccess
const value = arr[0]; // Type: number | undefined
if (value !== undefined) {
  console.log(value.toFixed(1));
}
```

### Issue: "Type is not assignable"

**Symptoms:** Type mismatch errors

**Solution:**

```typescript
// Use type assertion (carefully)
const element = document.getElementById('button') as HTMLButtonElement;

// Or use type guard
function isButton(el: HTMLElement): el is HTMLButtonElement {
  return el.tagName === 'BUTTON';
}

const el = document.getElementById('button');
if (isButton(el)) {
  el.click(); // TypeScript knows it's a button
}
```

### Issue: Slow Type Checking

**Symptoms:** `tsc` takes too long

**Solution:**

1. Enable incremental builds:

```json
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": "./dist/.tsbuildinfo"
  }
}
```

2. Skip lib check:

```json
{
  "compilerOptions": {
    "skipLibCheck": true
  }
}
```

3. Use `tsc --noEmit --skipLibCheck`

### Issue: "Implicit any" Errors

**Symptoms:** TypeScript reports implicit any

**Solution:**

```typescript
// Bad - implicit any
function test(x) {
  return x.value;
}

// Good - explicit type
function test(x: { value: string }): string {
  return x.value;
}

// Or use unknown
function test(x: unknown): unknown {
  if (typeof x === 'object' && x !== null && 'value' in x) {
    return (x as { value: string }).value;
  }
}
```

## Pre-commit Hook Issues

### Issue: Hooks Not Running

**Symptoms:** Pre-commit hooks don't execute

**Solution:**

```bash
# Check if hooks exist
ls -la .husky/

# Reinstall hooks
rm -rf .husky
npx husky init

# Make executable
chmod +x .husky/pre-commit

# Verify content
cat .husky/pre-commit
```

### Issue: Hook Fails But Should Pass

**Symptoms:** Pre-commit fails on warnings

**Solution:**

```bash
# Run manually to see errors
npm run lint:ci

# Fix issues
npm run lint:fix

# Or allow warnings in CI (not recommended)
# In package.json
{
  "scripts": {
    "lint:ci": "eslint . --ext ts,tsx --max-warnings 5"
  }
}
```

### Issue: Lint-staged Too Slow

**Symptoms:** Long delays before commit

**Solution:**

1. Use `--no-errors-on-unmatched`:

```json
{
  "*.{ts,tsx}": ["biome check --write --no-errors-on-unmatched"]
}
```

2. Check file patterns:

```json
{
  "*.{ts,tsx}": "biome check --write"
}
```

3. Enable caching:

```json
{
  "*.{ts,tsx}": ["biome check --write --no-errors-on-unmatched --cache"]
}
```

## Test Issues

### Issue: Vitest "Module not found"

**Symptoms:** Can't import tested modules

**Solution:**

1. Check `tsconfig.json` includes tests:

```json
{
  "include": ["src", "tests"]
}
```

2. Check path mapping:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

3. Configure Vitest alias:

```typescript
// vitest.config.ts
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
```

### Issue: "Text does not match" in Tests

**Symptoms:** Screen testing fails

**Solution:**

```typescript
// Bad - exact match
expect(screen.getByText('Click Me')).toBeInTheDocument();

// Good - use regex
expect(screen.getByText(/click me/i)).toBeInTheDocument();

// Or query by role
expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
```

### Issue: Playwright Timeout

**Symptoms:** E2E tests timeout

**Solution:**

```typescript
// playwright.config.ts
export default defineConfig({
  test: {
    timeout: 60000, // Increase test timeout
    expect: {
      timeout: 10000,
    },
  },
  webServer: {
    timeout: 120000, // Increase server startup timeout
  },
});
```

### Issue: "Element not found" in E2E Tests

**Symptoms:** Can't locate elements

**Solution:**

```typescript
// Use data-testid for stable selectors
<button data-testid="submit-button">Submit</button>

// Test
test('submit form', async ({ page }) => {
  await page.click('[data-testid=submit-button]');
});

// Or use role and name
await page.getByRole('button', { name: 'Submit' }).click();
```

## CI/CD Issues

### Issue: Tests Pass Locally but Fail in CI

**Symptoms:** Different behavior in CI

**Solution:**

1. Check Node version:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20' # Match local version
```

2. Install dependencies:

```yaml
- run: npm ci # Use ci, not install
```

3. Increase timeout:

```typescript
// playwright.config.ts
export default defineConfig({
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined, // Sequential in CI
});
```

### Issue: Coverage Too Low

**Symptoms:** Coverage threshold not met

**Solution:**

1. Check what's not covered:

```bash
npm run test:coverage
open coverage/index.html  # View report
```

2. Write tests for uncovered code
3. Adjust thresholds if reasonable:

```typescript
coverage: {
  thresholds: {
    global: {
      branches: 70,  // Lower threshold
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
}
```

## General Issues

### Issue: "Command not found"

**Symptoms:** npm script fails

**Solution:**

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check script exists
cat package.json | grep '"scripts"'
```

### Issue: Git Ignore Not Working

**Symptoms:** Files committed that should be ignored

**Solution:**

```bash
# Check .gitignore
cat .gitignore

# Clear git cache
git rm -r --cached .
git add .
git commit -m "Update git cache"

# Verify
git status
```

### Issue: Multiple Versions of TypeScript

**Symptoms:** Conflicting TypeScript versions

**Solution:**

```bash
# Check TypeScript version
npx tsc --version

# Install globally (not recommended)
npm install -g typescript

# Use consistent version
npm install -D typescript@latest
```

### Issue: VS Code Not Recognizing Path Aliases

**Symptoms:** Import paths show errors in editor

**Solution:**

1. Install TypeScript resolve plugin:

```bash
npm install -D @types/node
```

2. Restart TypeScript server in VS Code:

- Command Palette → "TypeScript: Restart TS Server"

3. Or create `jsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

## Error Message Patterns

### "Failed to parse TypeScript"

**Cause:** Syntax error in `.ts` or `.tsx` file

**Fix:**

```bash
# Find syntax error
npx tsc --noEmit
```

### "Element type is invalid"

**Cause:** Not exporting component correctly

**Fix:**

```typescript
// Bad
export default { Button };

// Good
export const Button = () => <button>Click</button>;
export default Button;
```

### "Cannot access before initialization"

**Cause:** Temporal dead zone (const/let hoisting)

**Fix:**

```typescript
// Bad
console.log(x);
const x = 1;

// Good
const x = 1;
console.log(x);
```

## Getting Help

### Enable Verbose Output

```bash
# ESLint debug
npx eslint src/App.tsx --debug

# Vitest debug
npm run test -- --reporter=verbose

# Playwright debug
npx playwright test --debug
```

### Check Tool Versions

```bash
node --version
npm --version
npx biome --version
npx eslint --version
npx tsc --version
npx vitest --version
npx playwright --version
```

### Clear Caches

```bash
# Clear all caches
rm -rf node_modules/.cache
rm -rf dist
rm -rf coverage
rm -rf .eslintcache
rm -rf .biome

# Reinstall
npm install
```

### Reset Everything

```bash
# Nuclear option
rm -rf node_modules package-lock.json
npm install
npx husky init
```

## Quick Fixes Reference

```bash
# Format code
npm run format

# Fix linting
npm run lint:fix

# Type check
npm run type-check

# Run tests
npm run test

# Run E2E tests
npm run test:e2e

# Full quality check
npm run lint && npm run type-check && npm run test

# Rebuild everything
rm -rf node_modules package-lock.json && npm install
```
