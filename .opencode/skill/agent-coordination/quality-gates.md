# Quality Gates

Verification checkpoints that must be passed before proceeding to the next task
or phase.

## Why Quality Gates Matter

- **Early Detection**: Catch issues before they cascade
- **Consistency**: Ensure all work meets standards
- **Traceability**: Know exactly where issues occur
- **Automation**: Enforce quality automatically
- **Confidence**: Proceed with verified work

## Required Quality Gates

### 1. Lint Gate

**Purpose**: Ensure code quality and maintainability

**Command**:

```bash
npm run lint
```

**What It Checks**:

- ESLint rules compliance
- TypeScript strict mode errors
- Code style consistency
- Best practices adherence
- No console.log/error in production code

**Pass Criteria**:

- Exit code: 0
- Warnings: 0 (max-warnings 0)
- Output: Clean

**Failure Handling**:

- **Never skip lint** - Always fix before proceeding
- Auto-fix with `npm run lint:fix` when possible
- Manual fixes required for complex issues
- Document fixes in handoff

### 2. Type Check Gate

**Purpose**: Ensure type safety and catch type errors

**Command**:

```bash
tsc --noEmit
```

**What It Checks**:

- Type correctness
- Interface compliance
- Generic type usage
- Strict null checks
- No implicit any types

**Pass Criteria**:

- Exit code: 0
- Errors: 0

**Failure Handling**:

- Fix type errors explicitly
- Don't use `@ts-ignore` or `any` type
- Update interfaces if needed
- Run after fixing to verify

### 3. Unit Test Gate

**Purpose**: Verify functionality with unit tests

**Command**:

```bash
npm run test
```

**What It Checks**:

- All unit tests pass
- No test failures
- No test timeouts
- Coverage targets met (if configured)

**Pass Criteria**:

- Exit code: 0
- Tests: 2036/2036 (or all tests pass)
- Failures: 0
- Timeouts: 0

**Failure Handling**:

- Analyze test failures
- Fix root causes, not symptoms
- Add tests for edge cases
- Verify no regressions

### 4. E2E Test Gate

**Purpose**: Verify integration and user flows

**Command**:

```bash
npm run test:e2e
```

**What It Checks**:

- All E2E tests pass
- No flaky test failures
- No timeouts
- Accessibility violations checked
- User flows work end-to-end

**Pass Criteria**:

- Exit code: 0
- Tests: All passed
- Retries: Minimal (< 10% of tests)
- Accessibility: 0 violations

**Failure Handling**:

- Use e2e-test-optimizer to fix timeouts
- Remove anti-patterns (waitForTimeout)
- Fix accessibility violations
- Optimize test reliability

### 5. Build Gate

**Purpose**: Ensure production-ready code

**Command**:

```bash
npm run build
```

**What It Checks**:

- Production build succeeds
- No build errors
- No critical warnings
- Bundle sizes acceptable
- Assets generated correctly

**Pass Criteria**:

- Exit code: 0
- Build: Success
- Warnings: Only informational (no errors)
- Chunks: Under size limits (optional)

**Failure Handling**:

- Fix build errors first
- Optimize chunk sizes if warnings
- Verify dependencies
- Check configuration

## Gate Implementation

### Basic Gate Runner

```typescript
interface QualityGate {
  name: string;
  command: string;
  timeout?: number; // milliseconds
  retries?: number;
  onSuccess?: (output: string) => void;
  onFailure?: (error: Error, output: string) => void;
}

async function runQualityGate(gate: QualityGate): Promise<void> {
  const startTime = Date.now();
  console.log(`\n=== Running Quality Gate: ${gate.name} ===`);

  const result = await runCommand(gate.command, gate.timeout || 120000);

  const duration = Date.now() - startTime;

  if (result.exitCode !== 0) {
    console.error(`\n❌ Quality Gate FAILED: ${gate.name}`);
    console.error(`Duration: ${duration}ms`);
    console.error(`Output:\n${result.stderr}`);

    if (gate.onFailure) {
      gate.onFailure(new Error('Quality gate failed'), result.stderr);
    }

    throw new Error(`Quality gate ${gate.name} failed`);
  }

  console.log(`\n✅ Quality Gate PASSED: ${gate.name}`);
  console.log(`Duration: ${duration}ms`);
  console.log(`Output:\n${result.stdout}`);

  if (gate.onSuccess) {
    gate.onSuccess(result.stdout);
  }
}

// Usage
await runQualityGate({
  name: 'Lint',
  command: 'npm run lint',
  onSuccess: output => console.log('Lint clean!'),
  onFailure: (error, output) => {
    console.error('Lint failed, running auto-fix...');
    runCommand('npm run lint:fix');
  },
});
```

### Gate with Retry

```typescript
async function runGateWithRetry(
  gate: QualityGate,
  maxRetries = 2,
): Promise<void> {
  let attempts = 0;
  let lastError: Error | null = null;

  while (attempts <= maxRetries) {
    try {
      if (attempts > 0) {
        console.log(`\n🔄 Retry attempt ${attempts} for ${gate.name}`);
      }

      await runQualityGate(gate);
      return; // Success
    } catch (error) {
      lastError = error as Error;
      attempts++;

      if (attempts > maxRetries) {
        console.error(
          `\n❌ Gate ${gate.name} failed after ${maxRetries} retries`,
        );
        throw lastError;
      }

      // Attempt auto-fix if available
      await attemptAutoFix(gate);
    }
  }
}
```

### Gate Chain

```typescript
async function runGateChain(gates: QualityGate[]): Promise<void> {
  const results: Array<{ name: string; passed: boolean; duration: number }> =
    [];

  for (const gate of gates) {
    const startTime = Date.now();

    try {
      await runQualityGate(gate);
      results.push({
        name: gate.name,
        passed: true,
        duration: Date.now() - startTime,
      });
    } catch (error) {
      results.push({
        name: gate.name,
        passed: false,
        duration: Date.now() - startTime,
      });

      console.error(`\n❌ Gate chain stopped at: ${gate.name}`);
      console.error('\nSummary:');
      results.forEach(r => {
        const icon = r.passed ? '✅' : '❌';
        console.log(`  ${icon} ${r.name} (${r.duration}ms)`);
      });

      throw error;
    }
  }

  console.log('\n✅ All quality gates passed!');
  results.forEach(r => {
    const icon = r.passed ? '✅' : '❌';
    console.log(`  ${icon} ${r.name} (${r.duration}ms)`);
  });
}
```

## Gate Strategies

### Strategy 1: Sequential Gates

Run gates one after another, stop on first failure.

```typescript
const gates = [
  { name: 'Lint', command: 'npm run lint' },
  { name: 'Type Check', command: 'tsc --noEmit' },
  { name: 'Unit Tests', command: 'npm run test' },
  { name: 'E2E Tests', command: 'npm run test:e2e' },
  { name: 'Build', command: 'npm run build' },
];

await runGateChain(gates);
```

### Strategy 2: Parallel Gates

Run independent gates in parallel for speed.

```typescript
// Gates that can run in parallel
const parallelGates = [
  { name: 'Lint', command: 'npm run lint' },
  { name: 'Type Check', command: 'tsc --noEmit' },
];

// Gates that require previous to pass
const sequentialGates = [
  { name: 'Unit Tests', command: 'npm run test' },
  { name: 'E2E Tests', command: 'npm run test:e2e' },
  { name: 'Build', command: 'npm run build' },
];

// Run parallel gates
await Promise.all(parallelGates.map(gate => runQualityGate(gate)));

// Run sequential gates
await runGateChain(sequentialGates);
```

### Strategy 3: Adaptive Gates

Choose gates based on task type.

```typescript
interface TaskTypeGates {
  codeChanges: QualityGate[];
  testChanges: QualityGate[];
  documentationChanges: QualityGate[];
  configurationChanges: QualityGate[];
}

const gateSets: TaskTypeGates = {
  codeChanges: [
    { name: 'Lint', command: 'npm run lint' },
    { name: 'Type Check', command: 'tsc --noEmit' },
    { name: 'Unit Tests', command: 'npm run test' },
  ],
  testChanges: [
    { name: 'Unit Tests', command: 'npm run test' },
    { name: 'E2E Tests', command: 'npm run test:e2e' },
  ],
  documentationChanges: [{ name: 'Build', command: 'npm run build' }],
  configurationChanges: [
    { name: 'Lint', command: 'npm run lint' },
    { name: 'Build', command: 'npm run build' },
  ],
};

function selectGates(taskType: keyof TaskTypeGates): QualityGate[] {
  return gateSets[taskType];
}

// Usage
const gates = selectGates('codeChanges');
await runGateChain(gates);
```

## Gate Customization

### Custom Gate Criteria

```typescript
interface CustomGate extends QualityGate {
  customCheck?: (output: string) => Promise<boolean>;
  expectedOutput?: RegExp | string;
  maxDuration?: number;
}

async function runCustomGate(gate: CustomGate): Promise<void> {
  const startTime = Date.now();

  // Run standard gate
  await runQualityGate(gate);

  const duration = Date.now() - startTime;

  // Check custom criteria
  if (gate.maxDuration && duration > gate.maxDuration) {
    throw new Error(
      `Gate ${gate.name} took too long: ${duration}ms > ${gate.maxDuration}ms`,
    );
  }

  if (gate.customCheck) {
    const passed = await gate.customCheck(gate.stdout);
    if (!passed) {
      throw new Error(`Custom check failed for gate ${gate.name}`);
    }
  }

  console.log(`✅ Custom gate ${gate.name} passed`);
}

// Usage
await runCustomGate({
  name: 'Unit Tests',
  command: 'npm run test',
  maxDuration: 120000, // 2 minutes
  customCheck: async output => {
    return output.includes('2036 passed');
  },
});
```

### Accessibility Gate

```typescript
async function runAccessibilityGate(): Promise<void> {
  console.log('\n=== Running Quality Gate: Accessibility ===');

  // Run E2E tests with a11y check
  const result = await runCommand('npm run test:e2e');

  // Extract accessibility violations from output
  const violations = extractA11yViolations(result.stdout);

  if (violations.length > 0) {
    console.error('\n❌ Accessibility Gate FAILED');
    console.error(`Found ${violations.length} violations:`);

    violations.forEach(v => {
      console.error(`  - ${v.id} (${v.impact}): ${v.description}`);
      console.error(`    Affected nodes: ${v.nodes}`);
    });

    throw new Error('Accessibility gate failed');
  }

  console.log('\n✅ Accessibility Gate PASSED');
  console.log('No accessibility violations found');
}

function extractA11yViolations(output: string): any[] {
  // Parse a11y report from test output
  const match = output.match(/Accessibility Report: (.+?}summary)/s);
  if (!match) return [];

  const report = JSON.parse(match[1]);
  return report.violations || [];
}
```

## Gate Automation

### Pre-Commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "Running quality gates..."

# Run lint
npm run lint
if [ $? -ne 0 ]; then
  echo "❌ Lint failed, commit blocked"
  exit 1
fi

# Run type check
tsc --noEmit
if [ $? -ne 0 ]; then
  echo "❌ Type check failed, commit blocked"
  exit 1
fi

echo "✅ All quality gates passed"
exit 0
```

### CI/CD Integration

```yaml
# .github/workflows/quality-gates.yml
name: Quality Gates

on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint Gate
        run: npm run lint

      - name: Type Check Gate
        run: tsc --noEmit

      - name: Unit Tests Gate
        run: npm run test

      - name: E2E Tests Gate
        run: npm run test:e2e

      - name: Build Gate
        run: npm run build
```

## Best Practices

### ✅ Do

- **NEVER skip lint** - Always run and fix issues
- Run gates after each significant change
- Use gate chains for comprehensive verification
- Implement custom gates for specific needs
- Automate gates in CI/CD
- Document gate failures with context
- Set appropriate timeouts for each gate
- Use retries for flaky gates

### ❌ Don't

- Skip gates to save time
- Use `@ts-ignore` to bypass type checking
- Commit code that fails gates
- Ignore gate warnings
- Run gates without understanding their purpose
- Forget to fix gate failures
- Over-gate (unnecessary checks)
- Under-gate (skip critical checks)

## Performance Metrics

- **Gate execution time**:
  - Lint: 10-30s
  - Type check: 15-40s
  - Unit tests: 30-90s
  - E2E tests: 120-300s
  - Build: 30-60s

- **Total gate time**: 3-8 minutes for all gates
- **Gate failure rate**: < 10% (most failures are fixed on first try)
- **Retry success rate**: 80-90% (flaky gates often pass on retry)

## Examples

### Example 1: Full Gate Chain for Bug Fix

```typescript
async function verifyBugFix(): Promise<void> {
  console.log('\n=== Running Full Quality Gate Chain ===\n');

  const gates = [
    { name: 'Lint', command: 'npm run lint' },
    { name: 'Type Check', command: 'tsc --noEmit' },
    { name: 'Unit Tests', command: 'npm run test' },
    { name: 'E2E Tests', command: 'npm run test:e2e' },
    { name: 'Build', command: 'npm run build' },
  ];

  await runGateChain(gates);

  console.log('\n✅ All quality gates passed! Bug fix verified.');
}
```

### Example 2: Adaptive Gates for Task Type

```typescript
async function verifyBasedOnTask(task: string): Promise<void> {
  let gates: QualityGate[];

  if (task.includes('test') || task.includes('e2e')) {
    gates = [
      { name: 'Lint', command: 'npm run lint' },
      { name: 'Unit Tests', command: 'npm run test' },
      { name: 'E2E Tests', command: 'npm run test:e2e' },
    ];
  } else if (task.includes('performance')) {
    gates = [
      { name: 'Lint', command: 'npm run lint' },
      { name: 'Build', command: 'npm run build' },
      { name: 'Performance Audit', command: 'npm run perf:audit' },
    ];
  } else {
    // Default gates for code changes
    gates = [
      { name: 'Lint', command: 'npm run lint' },
      { name: 'Type Check', command: 'tsc --noEmit' },
      { name: 'Unit Tests', command: 'npm run test' },
      { name: 'Build', command: 'npm run build' },
    ];
  }

  await runGateChain(gates);
}
```

### Example 3: GitHub Actions with Quality Gates

```typescript
async function pushAndVerify(): Promise<void> {
  // Stage and commit changes
  await runCommand('git add .');
  await runCommand('git commit -m "fix: resolve issues"');

  // Push to trigger GitHub Actions
  await runCommand('git push');

  console.log('\nWaiting for GitHub Actions to complete...');

  // Monitor workflow until all gates pass
  await waitForSuccessfulGitHubActions();

  console.log('\n✅ GitHub Actions passed! All quality gates verified.');
}
```

## Enforce quality gates to ensure consistent, high-quality work.
