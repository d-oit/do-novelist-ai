# TypeScript Configuration

TypeScript provides static type checking for better code quality and developer
experience.

## Basic Configuration

Standard `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "verbatimModuleSyntax": true,
    "types": ["vite/client"]
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## Strict Mode Options

### Enable All Strict Checks

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

**What each option does:**

- **`strict`**: Enables all strict mode checking
- **`noUncheckedIndexedAccess`**: Arrays/objects have `undefined` in their type
- **`noImplicitOverride`**: Must use `override` keyword for inherited methods
- **`noImplicitReturns`**: Function must return on all code paths
- **`noFallthroughCasesInSwitch`**: Switch cases must not fall through

### Example: Strict Index Access

```typescript
// With noUncheckedIndexedAccess
const arr = [1, 2, 3];
const item = arr[0]; // Type: number | undefined

// Safe access
if (item !== undefined) {
  console.log(item.toFixed(1)); // OK
}

// Or use optional chaining
console.log(arr[0]?.toFixed(1));
```

## Module Resolution

### Bundler Resolution (Vite, Webpack 5)

```json
{
  "moduleResolution": "bundler",
  "allowImportingTsExtensions": true,
  "noEmit": true
}
```

**Why**: Best for modern bundlers that handle imports natively.

### Node Resolution (CommonJS)

```json
{
  "moduleResolution": "node",
  "module": "commonjs",
  "target": "ES2020",
  "esModuleInterop": true,
  "allowSyntheticDefaultImports": true
}
```

**Why**: For Node.js projects and CommonJS builds.

## Advanced Configuration

### Path Mapping

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@utils/*": ["src/utils/*"]
    }
  }
}
```

**Usage in code:**

```typescript
import Button from '@/components/Button';
import { formatDate } from '@/utils/date';
```

### DOM Library Configuration

```json
{
  "lib": ["ES2022", "DOM", "DOM.Iterable", "WebWorker"]
}
```

**Include only what you use** to improve performance and reduce errors.

### Type Checking Options

```json
{
  "compilerOptions": {
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  }
}
```

## Project References

Split large projects into smaller parts:

### Root `tsconfig.json`

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "references": [{ "path": "./packages/utils" }, { "path": "./packages/api" }]
}
```

### Package `tsconfig.json`

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

## Testing Configuration

### Vitest Type Support

```json
{
  "compilerOptions": {
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  }
}
```

**Why**: Gives you type checking in test files.

### JSDOM Environment

```json
{
  "compilerOptions": {
    "types": ["node", "jsdom"]
  }
}
```

## Build Configuration

### Vite Build

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  }
}
```

### Next.js Configuration

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }]
  }
}
```

## Common Type Patterns

### Generic Constraints

```typescript
// Constrain generic type
function create<T extends { id: string }>(item: T): T {
  return { ...item, id: item.id };
}

// Usage
interface User {
  id: string;
  name: string;
}
const user = create<User>({ id: '1', name: 'Alice' }); // OK

// Error: '2' doesn't have 'id'
create({ id: '2', value: 123 });
```

### Utility Types

```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

// Make properties optional
type PartialUser = Partial<User>;

// Make properties required
type RequiredUser = Required<Pick<User, 'id' | 'name'>>;

// Pick specific properties
type UserSummary = Pick<User, 'id' | 'name'>;

// Exclude properties
type UserWithoutEmail = Omit<User, 'email'>;
```

### Index Signatures

```typescript
// With noUncheckedIndexedAccess
interface Config {
  [key: string]: string;
}

const config: Config = {
  theme: 'dark',
};

const value = config.theme; // Type: string | undefined
const value2 = config.theme!; // Type: string (non-null assertion)

// Safe access
if ('theme' in config) {
  console.log(config.theme); // Type: string
}
```

## Type Checking Commands

```bash
# Check types without emitting
npm run type-check

# Watch mode
tsc --noEmit --watch

# Incremental build check
tsc --build --clean && tsc --build

# Show detailed errors
tsc --noEmit --pretty
```

## Optimization Tips

### Faster Compilation

```json
{
  "compilerOptions": {
    "skipLibCheck": true, // Skip type checking of .d.ts files
    "incremental": true, // Save compiler state between builds
    "tsBuildInfoFile": "./dist/.tsbuildinfo"
  }
}
```

### Smaller Output

```json
{
  "compilerOptions": {
    "lib": ["ES2022", "DOM"], // Only include needed libraries
    "noEmit": true // Don't emit if using bundler
  }
}
```

## Common Errors

### `TS2307: Cannot find module`

```typescript
// Missing file extension or path mapping
import { utils } from '@/utils';

// Solution: Add to tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  }
}
```

### `TS18003: No inputs were found`

```typescript
// Include pattern doesn't match files
{
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### `TS2716: Generic type arguments`

```typescript
// Implicit any in generic
function api<T>(config: any): T {
  return config;
}

// Solution: Use unknown
function api<T>(config: unknown): T {
  return config as T;
}
```

## Best Practices

✓ Enable all strict mode options ✓ Use `noUncheckedIndexedAccess` for safer
array access ✓ Prefer `unknown` over `any` ✓ Use utility types (Pick, Omit,
Partial) ✓ Enable `exactOptionalPropertyTypes` ✓ Use path mapping for cleaner
imports

✗ Don't disable strict mode ✗ Don't use `any` without justification ✗ Don't
import actual files in declaration files ✗ Don't forget to include test files in
`include`

## Type Safety Level Guide

**Conservative (recommended)**:

```json
{ "strict": true, "noUncheckedIndexedAccess": true }
```

**Very Strict**:

```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "exactOptionalPropertyTypes": true,
  "noImplicitReturns": true
}
```

**Permissive** (not recommended):

```json
{
  "strict": false,
  "noImplicitAny": false,
  "strictNullChecks": false
}
```
