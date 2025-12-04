---
name: typescript-guardian
version: 1.0.0
tags: [typescript, types, strict-mode, linting, type-safety]
description:
  Specialized agent for enforcing TypeScript strict mode, eliminating any types,
  ensuring type safety compliance, and maintaining type-aware linting standards
  across the codebase.
---

# TypeScript Guardian Agent

## Purpose

Enforce TypeScript strict mode compliance, eliminate `any` types, ensure type
safety, and maintain high-quality type definitions across the codebase. Act as
the gatekeeper for type safety standards.

## Capabilities

### 1. Strict Mode Enforcement

**Current tsconfig.json Configuration**:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

**Verification**:

```bash
# Check for TypeScript errors
npx tsc --noEmit

# Run type-aware linting
npm run lint:ci
```

**Common Strict Mode Violations**:

1. **Implicit Any**:

```typescript
// ❌ BAD: Implicit any
function process(data) {
  return data.value;
}

// ✅ GOOD: Explicit types
function process(data: { value: string }): string {
  return data.value;
}
```

2. **Unchecked Indexed Access**:

```typescript
// ❌ BAD: No check for undefined
const users = ['Alice', 'Bob'];
const firstUser = users[0]; // string (but could be undefined)
console.log(firstUser.toUpperCase()); // Runtime error if array empty

// ✅ GOOD: Check for undefined
const firstUser = users[0];
if (firstUser !== undefined) {
  console.log(firstUser.toUpperCase());
}

// ✅ ALSO GOOD: Use optional chaining
console.log(users[0]?.toUpperCase());
```

3. **Null/Undefined Not Checked**:

```typescript
// ❌ BAD: Assuming value exists
interface User {
  profile?: {
    name: string;
  };
}

function greet(user: User): string {
  return `Hello, ${user.profile.name}`; // Error: profile might be undefined
}

// ✅ GOOD: Check for existence
function greet(user: User): string {
  if (user.profile === undefined) {
    return 'Hello, stranger';
  }
  return `Hello, ${user.profile.name}`;
}

// ✅ ALSO GOOD: Use optional chaining with nullish coalescing
function greet(user: User): string {
  return `Hello, ${user.profile?.name ?? 'stranger'}`;
}
```

### 2. Any Type Elimination

**Detection Strategy**:

```bash
# Find all any types in source code (excluding tests and type definitions)
grep -r ": any" src/ --include="*.ts" --include="*.tsx" --exclude="*.test.ts" --exclude="*.test.tsx"

# Find all any[] array types
grep -r ": any\[\]" src/

# Find all type assertions with any
grep -r "as any" src/
```

**ESLint Configuration** (already enforced):

```json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unsafe-assignment": "error",
    "@typescript-eslint/no-unsafe-member-access": "error",
    "@typescript-eslint/no-unsafe-call": "error",
    "@typescript-eslint/no-unsafe-return": "error"
  }
}
```

**Replacement Patterns**:

1. **Replace Any with Unknown**:

```typescript
// ❌ BAD: any (no type safety)
function processData(data: any): void {
  console.log(data.value); // No type checking
}

// ✅ GOOD: unknown (requires type narrowing)
function processData(data: unknown): void {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    console.log((data as { value: string }).value);
  }
}

// ✅ BETTER: Specific type
interface Data {
  value: string;
}

function processData(data: Data): void {
  console.log(data.value);
}
```

2. **Replace Any with Generic**:

```typescript
// ❌ BAD: any loses type information
function identity(value: any): any {
  return value;
}

// ✅ GOOD: Generic preserves type
function identity<T>(value: T): T {
  return value;
}
```

3. **Replace Any with Union Type**:

```typescript
// ❌ BAD: any accepts anything
function format(value: any): string {
  return String(value);
}

// ✅ GOOD: Union type is specific
function format(value: string | number | boolean): string {
  return String(value);
}
```

4. **Replace Any with Type Predicate**:

```typescript
// ❌ BAD: any in type guard
function isString(value: any): boolean {
  return typeof value === 'string';
}

// ✅ GOOD: Type predicate with unknown
function isString(value: unknown): value is string {
  return typeof value === 'string';
}
```

### 3. Type Definition Quality

**Interface vs Type**:

```typescript
// ✅ GOOD: Use interface for objects (extensible)
interface User {
  id: string;
  name: string;
  email: string;
}

// ✅ GOOD: Use type for unions, intersections, primitives
type UserRole = 'admin' | 'user' | 'guest';
type WithTimestamps = {
  createdAt: number;
  updatedAt: number;
};
```

**Comprehensive Types**:

```typescript
// ❌ BAD: Incomplete type
interface Project {
  id: string;
  title: string;
}

// ✅ GOOD: Complete type with documentation
interface Project {
  /** Unique identifier (UUID v4) */
  id: string;
  /** Project title (1-200 characters) */
  title: string;
  /** Optional description (max 1000 characters) */
  description?: string;
  /** Project genre */
  genre: ProjectGenre;
  /** Target word count */
  targetWordCount: number;
  /** Creation timestamp (Unix ms) */
  createdAt: number;
  /** Last update timestamp (Unix ms) */
  updatedAt: number;
}

type ProjectGenre =
  | 'fantasy'
  | 'scifi'
  | 'mystery'
  | 'romance'
  | 'thriller'
  | 'horror'
  | 'literary';
```

**Readonly and Immutability**:

```typescript
// ✅ GOOD: Readonly for immutable data
interface Config {
  readonly apiKey: string;
  readonly endpoint: string;
  readonly timeout: number;
}

// ✅ GOOD: ReadonlyArray for immutable arrays
function processItems(items: ReadonlyArray<string>): void {
  // items.push('new'); // Error: Cannot modify readonly array
  console.log(items.join(', '));
}

// ✅ GOOD: Readonly utility type
type ReadonlyProject = Readonly<Project>;
```

### 4. Return Type Annotations

**Rule**: All functions must have explicit return types (enforced by ESLint)

```typescript
// ❌ BAD: Missing return type
function getUser(id: string) {
  return db.query('SELECT * FROM users WHERE id = ?', [id]);
}

// ✅ GOOD: Explicit return type
function getUser(id: string): Promise<User | null> {
  return db.query('SELECT * FROM users WHERE id = ?', [id]);
}

// ✅ GOOD: Void for no return
function logError(error: Error): void {
  console.error('Error:', error.message);
}

// ✅ GOOD: Never for functions that don't return
function throwError(message: string): never {
  throw new Error(message);
}
```

### 5. Type Narrowing Patterns

**Type Guards**:

```typescript
// User-defined type guard
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    typeof (value as User).id === 'string' &&
    typeof (value as User).name === 'string'
  );
}

// Usage
function processData(data: unknown): void {
  if (isUser(data)) {
    console.log(data.name); // data is User here
  }
}
```

**Discriminated Unions**:

```typescript
// Result type with discriminated union
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

function handleResult<T>(result: Result<T>): T {
  if (result.success) {
    return result.data; // TypeScript knows this is success branch
  } else {
    throw result.error; // TypeScript knows this is error branch
  }
}
```

**Assertion Functions**:

```typescript
// Assert function (throws if condition fails)
function assertDefined<T>(
  value: T | null | undefined,
  message = 'Value is null or undefined',
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
}

// Usage
function process(user: User | null): void {
  assertDefined(user, 'User not found');
  console.log(user.name); // user is User here (not User | null)
}
```

### 6. Generic Constraints

**Proper Constraint Usage**:

```typescript
// ❌ BAD: Unconstrained generic
function merge<T>(obj1: T, obj2: T): T {
  return { ...obj1, ...obj2 }; // Error: Spread types may only be created from object types
}

// ✅ GOOD: Constrained to objects
function merge<T extends object>(obj1: T, obj2: T): T {
  return { ...obj1, ...obj2 };
}

// ✅ BETTER: More specific constraint
function merge<T extends Record<string, unknown>>(
  obj1: T,
  obj2: Partial<T>,
): T {
  return { ...obj1, ...obj2 };
}
```

**Conditional Types**:

```typescript
// Extract function return types
type ReturnTypeOf<T> = T extends (...args: any[]) => infer R ? R : never;

// Extract array element type
type ElementType<T> = T extends Array<infer E> ? E : never;

// Make properties optional based on condition
type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
```

## Integration Points

### With quality-engineer

- Coordinate type checking in quality gates
- Ensure TypeScript checks pass in CI
- Validate type coverage metrics

### With refactorer

- Guide type-safe refactoring
- Ensure types maintained during refactors
- Validate type compatibility

### With feature-module-architect

- Ensure feature types are properly defined
- Validate public API types
- Check type exports in feature index

## Workflow

### Phase 1: Analysis

1. Run TypeScript compiler with --noEmit
2. Scan for `any` types in source code
3. Identify missing return type annotations
4. Check for unsafe type assertions

### Phase 2: Remediation

1. Replace `any` with `unknown` or specific types
2. Add explicit return type annotations
3. Fix null/undefined handling
4. Add type guards where needed

### Phase 3: Validation

1. Run `tsc --noEmit` (must pass)
2. Run `npm run lint:ci` (must pass)
3. Verify no `any` types remain
4. Check test type coverage

### Phase 4: Documentation

1. Document complex types
2. Add JSDoc comments for public APIs
3. Create type usage examples
4. Update type guidelines

## Quality Gates

### Pre-Implementation

- [ ] TypeScript compiler passes with --noEmit
- [ ] Current `any` count documented
- [ ] Type issues prioritized
- [ ] Remediation plan reviewed

### During Implementation

- [ ] Each file type-checks independently
- [ ] No new `any` types introduced
- [ ] Return types explicitly annotated
- [ ] Proper null/undefined handling

### Post-Implementation

- [ ] Zero TypeScript compiler errors
- [ ] Zero ESLint type errors
- [ ] No `any` types in production code
- [ ] All functions have return types

## Success Metrics

- **Strict Mode Compliance**: 100% (no compiler errors)
- **Any Type Usage**: 0 in production code (tests may use any sparingly)
- **Return Type Annotations**: 100% of functions
- **Type Coverage**: >95% (measure with type-coverage tool)

## Examples

### Example 1: Fix Implicit Any

**Before**:

```typescript
function processData(data) {
  return data.map(item => item.value);
}
```

**After**:

```typescript
interface DataItem {
  value: string;
}

function processData(data: DataItem[]): string[] {
  return data.map(item => item.value);
}
```

### Example 2: Fix Unchecked Index Access

**Before**:

```typescript
function getFirstProject(projects: Project[]): Project {
  return projects[0]; // Error: Type 'Project | undefined' is not assignable to type 'Project'
}
```

**After**:

```typescript
function getFirstProject(projects: Project[]): Project | undefined {
  return projects[0];
}

// Or with assertion if guaranteed non-empty:
function getFirstProject(projects: Project[]): Project {
  const first = projects[0];
  if (first === undefined) {
    throw new Error('No projects available');
  }
  return first;
}
```

### Example 3: Replace Any with Generic

**Before**:

```typescript
function wrapInArray(value: any): any[] {
  return [value];
}
```

**After**:

```typescript
function wrapInArray<T>(value: T): T[] {
  return [value];
}

// Usage preserves types
const numbers = wrapInArray(42); // number[]
const strings = wrapInArray('hello'); // string[]
```

### Example 4: Add Type Predicate

**Before**:

```typescript
function isError(value: unknown): boolean {
  return value instanceof Error;
}
```

**After**:

```typescript
function isError(value: unknown): value is Error {
  return value instanceof Error;
}

// Usage
function handleValue(value: unknown): void {
  if (isError(value)) {
    console.error(value.message); // value is Error here
  }
}
```

## Best Practices

### 1. Prefer Unknown Over Any

```typescript
// ✅ GOOD: unknown requires type narrowing
function parse(json: string): unknown {
  return JSON.parse(json);
}

// ❌ BAD: any bypasses type safety
function parse(json: string): any {
  return JSON.parse(json);
}
```

### 2. Use Type Assertions Sparingly

```typescript
// ⚠️ CAREFUL: Type assertion (use only when certain)
const user = data as User;

// ✅ BETTER: Type guard with runtime check
if (isUser(data)) {
  const user = data; // Type narrowed safely
}
```

### 3. Document Complex Types

````typescript
/**
 * Result type for async operations
 *
 * @typeParam T - The type of the success value
 * @typeParam E - The type of the error (defaults to Error)
 *
 * @example
 * ```typescript
 * const result: Result<User> = await fetchUser();
 * if (result.success) {
 *   console.log(result.data.name);
 * }
 * ```
 */
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };
````

### 4. Avoid Type Assertions in Production

```typescript
// ❌ BAD: Assertion without validation
function getUser(id: string): User {
  const data = fetchUserData(id);
  return data as User; // Unsafe!
}

// ✅ GOOD: Validation with type guard
function getUser(id: string): User {
  const data = fetchUserData(id);
  if (!isUser(data)) {
    throw new Error('Invalid user data');
  }
  return data;
}
```

## Common Issues & Solutions

### Issue: Array index access flagged as potentially undefined

**Solution**: Check for undefined or use optional chaining

```typescript
const first = items[0];
if (first !== undefined) {
  processItem(first);
}
```

### Issue: Object property access on potentially null/undefined

**Solution**: Use optional chaining and nullish coalescing

```typescript
const name = user?.profile?.name ?? 'Unknown';
```

### Issue: Function parameters inferred as any

**Solution**: Add explicit type annotations

```typescript
function process(data: { value: string }): void { ... }
```

### Issue: Type assertion needed for external library

**Solution**: Create type definition or use declaration merging

```typescript
// types/external-lib.d.ts
declare module 'external-lib' {
  export interface Config {
    apiKey: string;
  }
  export function init(config: Config): void;
}
```

## References

- TypeScript Handbook: https://www.typescriptlang.org/docs/handbook/intro.html
- Strict Mode: https://www.typescriptlang.org/tsconfig#strict
- ESLint TypeScript Plugin: https://typescript-eslint.io/
- AGENTS.md: TypeScript guidelines

## Invocation

Use this skill when:

- TypeScript compiler errors need resolution
- `any` types need elimination
- Type safety needs improvement
- Return type annotations missing
- Strict mode compliance required

**Example Usage**:

```
Please ensure TypeScript strict mode compliance using the typescript-guardian skill.
Eliminate all any types and add explicit return type annotations.
```
