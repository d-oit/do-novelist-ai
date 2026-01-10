# Debugger Skill

Systematically diagnose and fix runtime issues, test failures, and bugs.

## Quick Usage

```
Use the debugger skill when you need to:
- Fix runtime errors or exceptions
- Debug test failures
- Resolve TypeScript type errors
- Fix logic bugs or incorrect behavior
- Diagnose performance issues
- Resolve async/await problems
```

## 6-Phase Process

1. **Gather Evidence** - Collect error messages, stack traces, logs
2. **Reproduce** - Create minimal reproduction steps
3. **Investigate** - Read code, trace execution, check data
4. **Root Cause** - Identify fundamental issue, not just symptoms
5. **Fix** - Targeted, minimal fix with safeguards
6. **Validate** - Ensure original issue resolved, tests pass, no regressions

## Common Bug Types

- **TypeScript Errors**: Type mismatches, missing properties, possibly undefined
- **Test Failures**: Mock issues, async timeouts, assertion errors
- **Runtime Errors**: Null reference, unhandled promises, function undefined
- **Performance**: Infinite loops, re-renders, memory leaks
- **Race Conditions**: State after unmount, async timing issues

## Quick Examples

### Async/Await in useEffect

```typescript
// ❌ Error
useEffect(() => {
  const data = await fetchData();
}, []);

// ✅ Fixed
useEffect(() => {
  const load = async () => {
    const data = await fetchData();
    setData(data);
  };
  void load();
}, []);
```

### Null Handling

```typescript
// ❌ Error: possibly undefined
const name = user.name;

// ✅ Fixed
const name = user?.name ?? 'Anonymous';
```

### Mock Issues

```typescript
// ❌ Test timeout
mock.fn(() => ({ data: 'test' }));

// ✅ Fixed - return promise
mock.fn(() => Promise.resolve({ data: 'test' }));
```

## Project-Specific

### Novelist.ai Requirements

- Use Logger service (NOT console.log)
- Follow AGENTS.md guidelines
- Vitest for unit tests
- Playwright for E2E tests
- Check LocalStorage vs Turso sync

### Validation Commands

```bash
npm run lint    # Check for linting errors
npm run test    # Run all tests
npm run build   # Verify build succeeds
```

## Output Format

Always provide a debug report with:

- Issue summary (what, where, severity)
- Reproduction steps
- Root cause explanation
- Solution description
- Files modified
- Validation checklist

See SKILL.md for full documentation and methodology.
