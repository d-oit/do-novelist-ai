# Test Sharding

Configure parallel test execution by sharding tests across multiple workers for
faster CI/CD.

## Overview

Test sharding splits test suite into subsets that run in parallel, significantly
reducing total CI execution time.

## How Sharding Works

### Without Sharding (Sequential)

```
┌─────────────────────────────┐
│  Test Suite (100 tests)   │
│  Total time: 60 minutes    │
│  Workers: 1               │
└─────────────────────────────┘
```

**Problem**: Single worker runs all tests sequentially.

### With Sharding (Parallel)

```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Shard 0   │ │ Shard 1   │ │ Shard 2   │ │ Shard 3   │
│ (25 tests)│ │ (25 tests)│ │ (25 tests)│ │ (25 tests)│
│ 15 min    │ │ 15 min    │ │ 15 min    │ │ 15 min    │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
                Total time: 15 minutes (4x speedup)
```

**Benefit**: Multiple workers run subsets in parallel.

## Sharding Configuration

### GitHub Actions Matrix Strategy

```yaml
name: Run E2E Tests

strategy:
  matrix:
    shard_index: [0, 1, 2, 3]
    total_shards: [4]
    os: [ubuntu-latest]

jobs:
  test:
    runs-on: ${{ matrix.os }}
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Install dependencies
        run: pnpm install

      - name: Run sharded tests
        run: |
          pnpm exec playwright test \
            --project=chromium \
            --shard=${{ matrix.shard_index }}/${{ matrix.total_shards }} \
            --retries=2 \
            --timeout=30000 \
            --workers=2

      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report-shard-${{ matrix.shard_index }}
          path: playwright-report/
```

### Dynamic Sharding Configuration

Calculate optimal shard count based on test count:

```yaml
- name: Calculate sharding
  id: sharding
  run: |
    TEST_COUNT=$(pnpm exec playwright test --list 2>/dev/null | grep -c '›')
    SHARD_COUNT=4
    echo "test_count=$TEST_COUNT" >> $GITHUB_OUTPUT
    echo "shard_count=$SHARD_COUNT" >> $GITHUB_OUTPUT

- name: Run sharded tests
  run: |
    for i in $(seq 0 $((SHARD_COUNT - 1))); do
      echo "Running shard $i/$SHARD_COUNT"
      pnpm exec playwright test \
        --project=chromium \
        --shard=$i/$SHARD_COUNT \
        --output=test-results/shard-$i
    done
  env:
    SHARD_COUNT: ${{ steps.sharding.outputs.shard_count }}
```

## Playwright Sharding Commands

### Basic Sharding

```bash
# Run specific shard
pnpm exec playwright test --shard=1/4

# Shard 1/4: Runs tests 1-25 (out of 100)
# Shard 2/4: Runs tests 26-50 (out of 100)
# Shard 3/4: Runs tests 51-75 (out of 100)
# Shard 4/4: Runs tests 76-100 (out of 100)
```

### Sharding with Workers

```bash
# Each shard runs with its own workers
pnpm exec playwright test \
  --shard=0/4 \
  --workers=2 \
  # Shard 0 uses 2 workers internally
```

### Sharding All Projects

```bash
# Shard across all browser projects
pnpm exec playwright test \
  --project=chromium \
  --project=firefox \
  --project=webkit \
  --shard=0/2
```

## Optimal Shard Count

### Calculate Based on Test Count

```bash
# Rule of thumb: 20-30 tests per shard
TEST_COUNT=$(pnpm exec playwright test --list | grep -c '›')
OPTIMAL_SHARDS=$((TEST_COUNT / 25))

# Example: 100 tests / 25 per shard = 4 shards
```

### Calculate Based on Parallel Jobs

```yaml
# GitHub Actions parallel jobs
strategy:
  matrix:
    shard_index: [0, 1, 2, 3, 4, 5, 6, 7]
    total_shards: [8]

# 8 parallel jobs, each running a shard
```

### Consider CI Resources

```yaml
# Adjust based on runner resources
# Free GitHub runner: 2 CPU cores → 2-4 workers
# Self-hosted runner: 8 CPU cores → 8-16 workers
```

## Sharding Patterns

### Pattern 1: By Feature

Split tests by feature folder:

```bash
# Shard 0: Accessibility tests
pnpm exec playwright test tests/specs/accessibility.spec.ts --shard=0/4

# Shard 1: Navigation tests
pnpm exec playwright test tests/specs/navigation.spec.ts --shard=1/4

# Shard 2: Settings tests
pnpm exec playwright test tests/specs/settings.spec.ts --shard=2/4

# Shard 3: All other tests
pnpm exec playwright test tests/specs/ --shard=3/4
```

**Pros**: Predictable execution time per shard **Cons**: Hard to balance if
feature test counts vary

### Pattern 2: Automatic (Recommended)

Let Playwright automatically balance:

```bash
pnpm exec playwright test --shard=0/4 --shard=suite
```

**Pros**: Automatic load balancing **Cons**: Harder to predict which tests run
where

### Pattern 3: By Priority

Run critical tests in first shard:

```bash
# Shard 0: Smoke tests (critical path)
pnpm exec playwright test --grep="smoke|critical" --shard=0/4

# Shards 1-3: All other tests
pnpm exec playwright test --grep="(?!smoke|critical)" --shard=1/4
```

## Result Merging

### Merge HTML Reports

```yaml
- name: Merge test reports
  run: |
    pnpm exec playwright merge-reports \
      playwright-report/shard-0 \
      playwright-report/shard-1 \
      playwright-report/shard-2 \
      playwright-report/shard-3 \
      --reporter=html \
      --dir=playwright-report/merged
```

### Upload Merged Report

```yaml
- name: Upload merged report
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report-merged
    path: playwright-report/merged/
```

### Consolidate JSON Results

```yaml
- name: Consolidate test results
  run: |
    # Combine JSON results from all shards
    jq -s 'add' playwright-report/shard-0/results.json \
      playwright-report/shard-1/results.json \
      playwright-report/shard-2/results.json \
      playwright-report/shard-3/results.json \
      > playwright-report/combined-results.json
```

## Performance Monitoring

### Track Shard Execution Time

```typescript
// Add to test setup
test.beforeAll(async () => {
  console.log(`Starting shard: ${process.env.SHARD}`);
  console.log(`Total shards: ${process.env.TOTAL_SHARDS}`);
});

test.afterAll(async () => {
  const duration = Date.now() - testStartTime;
  console.log(`Shard duration: ${duration}ms`);
});
```

### Identify Imbalance

```bash
# Compare shard execution times
for shard in shard-0 shard-1 shard-2 shard-3; do
  time=$(grep -o '"duration":[0-9]*' $shard/results.json)
  echo "$shard: ${time}ms"
done

# If shards vary significantly (>20%), adjust test order or split
```

## Optimization Strategies

### Strategy 1: Parallel Jobs + Sharded Tests

```yaml
jobs:
  test:
    strategy:
      matrix:
        shard_index: [0, 1, 2, 3]
        total_shards: [4]
    steps:
      - name: Run tests
        run: |
          pnpm exec playwright test \
            --shard=${{ matrix.shard_index }}/${{ matrix.total_shards }} \
            --workers=2

# Result: 8 parallel test processes (4 jobs × 2 workers)
```

### Strategy 2: Shard by Speed

```bash
# Profile test execution time first
pnpm exec playwright test --reporter=json > timing.json

# Then sort tests by execution time
jq -r '.tests[] | "\(.title): \(.duration)"' timing.json \
  | sort -t: -k2 -n -r

# Create shards with balanced mix of fast/slow tests
```

### Strategy 3: Smoke Tests Separate

```yaml
- name: Run smoke tests
  run: |
    pnpm exec playwright test --grep="smoke"

- name: Run sharded full suite
  strategy:
    matrix:
      shard_index: [0, 1, 2, 3]
  run: |
    pnpm exec playwright test \
      --shard=${{ matrix.shard_index }}/4 \
      --grep="(?!smoke)"
```

## Common Issues and Solutions

### Issue 1: Flaky Tests on Some Shards

**Problem**: Test passes on one shard, fails on another

**Root cause**: Test depends on previous test state

**Solution**: Ensure proper cleanup

```typescript
test.afterEach(async ({ page }) => {
  // Clear cookies, localStorage, session storage
  await page.context().clearCookies();
  await page.evaluate(() => localStorage.clear());
  await page.evaluate(() => sessionStorage.clear());
});
```

### Issue 2: Resource Contention

**Problem**: Multiple shards accessing same resources (database, port)

**Solution**: Use unique resources per shard

```typescript
const shard = process.env.SHARD_INDEX || '0';
const databaseFile = `test-db-shard-${shard}.sqlite`;
```

### Issue 3: Shard Imbalance

**Problem**: Some shards take much longer than others

**Diagnosis**:

```bash
# Check shard times
for i in {0..3}; do
  grep '"duration"' playwright-report/shard-$i/results.json | \
    jq '.tests | length, .tests | map(.duration) | add'
done
```

**Solution**: Reorder tests to balance

```typescript
// Playwright automatically balances, but you can help:
test.describe.configure({ mode: 'parallel' });
// This hints at parallel execution optimization
```

## Best Practices

### DO

- Use matrix strategy for parallel jobs
- Balance shard size (20-30 tests per shard)
- Merge reports after all shards complete
- Monitor shard execution times
- Clean up state between tests
- Use unique resources per shard

### DON'T

- Run too many shards for few tests (overhead > benefit)
- Skip merging reports
- Ignore shard imbalance
- Share resources between shards
- Overlap test coverage across shards

## Sharding Checklist

Before enabling sharding:

- [ ] Test suite runs successfully without sharding
- [ ] All tests have proper isolation (cleanup)
- [ ] No test depends on test execution order
- [ ] Configured matrix strategy in CI
- [ ] Set up report merging workflow
- [ ] Resource conflicts resolved (database, ports)

After enabling sharding:

- [ ] All shards run successfully
- [ ] Execution time reduced as expected
- [ ] Reports merge correctly
- [ ] No flaky tests due to sharding
- [ ] Shard times are balanced (<20% variance)

## Quick Reference

```yaml
# Basic 4-shard setup
strategy:
  matrix:
    shard_index: [0, 1, 2, 3]
    total_shards: [4]

# Run command
pnpm exec playwright test \
  --project=chromium \
  --shard=${{ matrix.shard_index }}/${{ matrix.total_shards }} \
  --workers=2
```

Sharding transforms long sequential test runs into fast parallel execution.
