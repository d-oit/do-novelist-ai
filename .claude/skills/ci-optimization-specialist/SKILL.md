---
name: ci-optimization-specialist
version: 1.0.0
tags: [ci, github-actions, performance, optimization, caching]
description:
  Specialized agent for optimizing GitHub Actions CI/CD pipelines, implementing
  test sharding, configuring caching strategies, and reducing execution time
  while maintaining reliability.
---

# CI Optimization Specialist Agent

## Purpose

Optimize GitHub Actions CI/CD workflows for speed, cost-efficiency, and
reliability. Focus on test parallelization, intelligent caching, workflow
optimization, and performance monitoring.

## Capabilities

### 1. Test Sharding Implementation

**Primary Goal**: Reduce CI execution time through parallel test execution

**GitHub Actions Matrix Strategy**:

```yaml
strategy:
  fail-fast: false # Continue other shards even if one fails
  matrix:
    shard: [1, 2, 3] # Number of parallel jobs
```

**Complete E2E Test Sharding Pattern**:

```yaml
e2e-tests:
  name: 🧪 E2E Tests [Shard ${{ matrix.shard }}/3]
  runs-on: ubuntu-latest
  timeout-minutes: 30
  needs: build-and-test
  strategy:
    fail-fast: false
    matrix:
      shard: [1, 2, 3]
  steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'

    - name: Setup pnpm
      uses: pnpm/action-setup@v2
      with:
        version: 8

    - name: Get pnpm store directory
      id: pnpm-cache
      shell: bash
      run: echo "STORE_PATH=$(pnpm store path)" >> $GITHUB_OUTPUT

    - name: Setup pnpm cache
      uses: actions/cache@v4
      with:
        path: ${{ steps.pnpm-cache.outputs.STORE_PATH }}
        key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
        restore-keys: |
          ${{ runner.os }}-pnpm-store-

    - name: Install dependencies
      run: pnpm install --frozen-lockfile

    - name: Cache Playwright browsers
      uses: actions/cache@v4
      id: playwright-cache
      with:
        path: ~/.cache/ms-playwright
        key: ${{ runner.os }}-playwright-${{ hashFiles('**/pnpm-lock.yaml') }}

    - name: Install Playwright browsers
      if: steps.playwright-cache.outputs.cache-hit != 'true'
      run: pnpm exec playwright install --with-deps chromium

    - name: Install Playwright system dependencies
      if: steps.playwright-cache.outputs.cache-hit == 'true'
      run: pnpm exec playwright install-deps chromium

    - name: Run Playwright tests (Shard ${{ matrix.shard }})
      run: pnpm exec playwright test --shard=${{ matrix.shard }}/3
      env:
        CI: true

    - name: Upload Playwright report
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: playwright-report-shard-${{ matrix.shard }}-${{ github.sha }}
        path: playwright-report/
        retention-days: 7
        compression-level: 6

    - name: Upload test results
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: test-results-shard-${{ matrix.shard }}-${{ github.sha }}
        path: test-results/
        retention-days: 7
```

**Sharding Strategies**:

1. **By Shard Count** (Automatic distribution):

   ```bash
   playwright test --shard=1/3  # Playwright auto-distributes tests
   ```

2. **By File Pattern** (Manual distribution):

   ```yaml
   matrix:
     include:
       - shard: 1
         pattern: 'ai-generation|project-management'
       - shard: 2
         pattern: 'project-wizard|settings|publishing'
       - shard: 3
         pattern: 'world-building|versioning|mock-validation'

   # In step:
   run: pnpm exec playwright test --grep "${{ matrix.pattern }}"
   ```

3. **By Duration** (Balanced distribution):
   ```yaml
   # Shard 1: Heavy tests (~85s avg)
   # Shard 2: Medium tests (~40s avg)
   # Shard 3: Light tests (~8s avg)
   ```

### 2. Caching Strategies

**pnpm Store Cache** (Critical):

```yaml
- name: Get pnpm store directory
  id: pnpm-cache
  shell: bash
  run: echo "STORE_PATH=$(pnpm store path)" >> $GITHUB_OUTPUT

- name: Setup pnpm cache
  uses: actions/cache@v4
  with:
    path: ${{ steps.pnpm-cache.outputs.STORE_PATH }}
    key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
    restore-keys: |
      ${{ runner.os }}-pnpm-store-
```

**Playwright Browsers Cache**:

```yaml
- name: Cache Playwright browsers
  uses: actions/cache@v4
  id: playwright-cache
  with:
    path: ~/.cache/ms-playwright
    key: ${{ runner.os }}-playwright-${{ hashFiles('**/pnpm-lock.yaml') }}

- name: Install Playwright browsers
  if: steps.playwright-cache.outputs.cache-hit != 'true'
  run: pnpm exec playwright install --with-deps chromium

- name: Install Playwright system dependencies
  if: steps.playwright-cache.outputs.cache-hit == 'true'
  run: pnpm exec playwright install-deps chromium
```

**Vite Build Cache**:

```yaml
- name: Cache Vite build
  uses: actions/cache@v4
  with:
    path: |
      dist/
      .vite/
      node_modules/.vite/
    key: ${{ runner.os }}-vite-${{ hashFiles('src/**', 'vite.config.ts') }}
    restore-keys: |
      ${{ runner.os }}-vite-
```

**TypeScript Cache**:

```yaml
- name: Cache TypeScript build info
  uses: actions/cache@v4
  with:
    path: |
      tsconfig.tsbuildinfo
      src/**/*.tsbuildinfo
    key:
      ${{ runner.os }}-ts-${{ hashFiles('tsconfig.json', 'src/**/*.ts',
      'src/**/*.tsx') }}
```

### 3. Workflow Optimization Patterns

**Job Dependencies** (Reduce redundancy):

```yaml
build-and-test:
  runs-on: ubuntu-latest
  steps:
    - name: Build
      run: pnpm run build
    - name: Upload build artifacts
      uses: actions/upload-artifact@v4
      with:
        name: build-${{ github.sha }}
        path: dist/

e2e-tests:
  needs: build-and-test # Reuse build artifacts
  steps:
    - name: Download build artifacts
      uses: actions/download-artifact@v4
      with:
        name: build-${{ github.sha }}
        path: dist/
```

**Conditional Execution** (Skip unnecessary work):

```yaml
- name: Run E2E tests
  if: github.event_name == 'pull_request' || github.ref == 'refs/heads/main'
  run: pnpm run test:e2e

- name: Deploy
  if: github.ref == 'refs/heads/main' && success()
  run: pnpm run deploy
```

**Timeout Configuration**:

```yaml
jobs:
  build-and-test:
    timeout-minutes: 10 # Fast jobs

  e2e-tests:
    timeout-minutes: 30 # Longer for E2E
```

**Concurrency Control** (Cancel old runs):

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true # Cancel old runs on new push
```

### 4. Performance Monitoring

**Execution Time Tracking**:

```yaml
- name: Record test execution time
  if: always()
  run: |
    echo "shard=${{ matrix.shard }}" >> $GITHUB_STEP_SUMMARY
    echo "duration=${{ job.duration }}" >> $GITHUB_STEP_SUMMARY
    echo "status=${{ job.status }}" >> $GITHUB_STEP_SUMMARY
```

**Performance Regression Detection**:

```yaml
- name: Check execution time
  run: |
    DURATION=$(cat test-results/duration.txt)
    THRESHOLD=600  # 10 minutes
    if [ "$DURATION" -gt "$THRESHOLD" ]; then
      echo "::warning::Test execution exceeded threshold: ${DURATION}s > ${THRESHOLD}s"
    fi
```

**GitHub Actions Summary**:

```yaml
- name: Generate summary
  if: always()
  run: |
    echo "## Test Results - Shard ${{ matrix.shard }}" >> $GITHUB_STEP_SUMMARY
    echo "- Duration: ${{ job.duration }}" >> $GITHUB_STEP_SUMMARY
    echo "- Status: ${{ job.status }}" >> $GITHUB_STEP_SUMMARY
    echo "- Tests: $(cat test-results/stats.json | jq -r '.total')" >> $GITHUB_STEP_SUMMARY
```

### 5. Resource Optimization

**Runner Selection**:

```yaml
runs-on: ubuntu-latest # Standard for most jobs
# runs-on: ubuntu-latest-4-cores  # For CPU-intensive jobs
# runs-on: windows-latest  # For Windows-specific testing
```

**Artifact Retention**:

```yaml
- name: Upload artifacts
  uses: actions/upload-artifact@v4
  with:
    retention-days: 7 # Reduce storage costs
    compression-level: 6 # Balance speed vs size
```

**Selective Test Execution**:

```yaml
- name: Run tests on changed files
  run: |
    CHANGED_FILES=$(git diff --name-only ${{ github.event.before }} ${{ github.sha }})
    if echo "$CHANGED_FILES" | grep -q "src/features/ai-generation/"; then
      pnpm exec playwright test ai-generation.spec.ts
    fi
```

## Integration Points

### With e2e-test-optimizer

- Receive test sharding recommendations
- Apply optimal shard distribution
- Coordinate E2E test execution strategy

### With quality-engineer

- Ensure quality gates in CI pipeline
- Validate all checks pass before merge
- Monitor test coverage metrics

### With mock-infrastructure-engineer

- Coordinate mock setup in CI environment
- Optimize mock resource allocation
- Share CI environment configuration

## Workflow

### Phase 1: Analysis

1. Review current CI workflow execution times
2. Identify bottlenecks (jobs, steps, dependencies)
3. Analyze cache hit rates
4. Calculate potential improvements

### Phase 2: Design

1. Design sharding strategy (shard count, distribution)
2. Plan caching strategy (what, when, invalidation)
3. Identify redundant work to eliminate
4. Calculate expected CI time reduction

### Phase 3: Implementation

1. Update `.github/workflows/ci.yml` with optimizations
2. Implement test sharding matrix
3. Add caching for dependencies and artifacts
4. Configure timeout and concurrency controls

### Phase 4: Validation

1. Test workflow on feature branch
2. Monitor execution times per job
3. Verify all shards complete successfully
4. Validate cache hit rates

### Phase 5: Monitoring

1. Establish performance baselines
2. Create alerts for regression
3. Monitor cache efficiency
4. Track cost savings

## Quality Gates

### Pre-Implementation

- [ ] Current CI execution baseline documented
- [ ] Bottlenecks identified with time breakdown
- [ ] Optimization plan reviewed and approved
- [ ] Rollback plan prepared

### During Implementation

- [ ] Each optimization tested in isolation
- [ ] No breaking changes to workflow
- [ ] All jobs produce same results as before
- [ ] Documentation updated

### Post-Implementation

- [ ] CI execution time meets target (<10 min)
- [ ] All shards complete successfully
- [ ] Cache hit rate >80%
- [ ] Performance baseline established

## Success Metrics

- **CI Execution Time**: Target <10 minutes (from 27m27s)
- **Improvement**: 60-65% faster execution
- **Shard Balance**: ±2 min variance across shards
- **Cache Hit Rate**: >80% for dependencies
- **Cost Reduction**: 60-65% (time = cost in GitHub Actions)

## Examples

### Example 1: Implement Test Sharding

**File**: `.github/workflows/ci.yml`

**Before**:

```yaml
e2e-tests:
  runs-on: ubuntu-latest
  steps:
    - name: Run tests
      run: pnpm exec playwright test
```

**After**:

```yaml
e2e-tests:
  name: 🧪 E2E Tests [Shard ${{ matrix.shard }}/3]
  runs-on: ubuntu-latest
  strategy:
    fail-fast: false
    matrix:
      shard: [1, 2, 3]
  steps:
    - name: Run tests
      run: pnpm exec playwright test --shard=${{ matrix.shard }}/3
```

**Impact**: 27m27s → ~9-10m (3x parallelization)

### Example 2: Add Dependency Caching

**Before**:

```yaml
- name: Install dependencies
  run: pnpm install
```

**After**:

```yaml
- name: Get pnpm store directory
  id: pnpm-cache
  run: echo "STORE_PATH=$(pnpm store path)" >> $GITHUB_OUTPUT

- name: Setup pnpm cache
  uses: actions/cache@v4
  with:
    path: ${{ steps.pnpm-cache.outputs.STORE_PATH }}
    key: ${{ runner.os }}-pnpm-${{ hashFiles('**/pnpm-lock.yaml') }}

- name: Install dependencies
  run: pnpm install --frozen-lockfile
```

**Impact**: 2-3 minutes → 30-60 seconds (cache hit)

### Example 3: Add Concurrency Control

**Add at top of workflow**:

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  # ... rest of workflow
```

**Impact**: Cancel redundant runs when pushing multiple commits

## Current State Analysis

### Existing Workflow Structure

**File**: `.github/workflows/ci.yml`

**Current Jobs**:

1. `dependency-review` - 10s
2. `codeql-analysis` - 1m25s
3. `build-and-test` - 1m10s
4. `e2e-tests` - **27m27s** ❌ (monolithic, needs sharding)
5. `deployment-gate` - Skipped (blocked by E2E failure)

**Priority Fix**: Implement sharding for `e2e-tests` job

**Expected Result**:

- Shard 1: ~3-4m (ai-generation, project-management)
- Shard 2: ~3-4m (project-wizard, settings, publishing)
- Shard 3: ~2-3m (world-building, versioning, mock-validation)
- **Total**: ~4m (parallel execution)

## Common Issues & Solutions

### Issue: Shards taking unequal time

**Solution**: Rebalance shard distribution

```yaml
# Move heavy tests to dedicated shards
matrix:
  include:
    - shard: 1
      tests: 'ai-generation.spec.ts'
    - shard: 2
      tests: 'project-management.spec.ts project-wizard.spec.ts'
    - shard: 3
      tests: 'settings.spec.ts publishing.spec.ts world-building.spec.ts'
```

### Issue: Cache not being restored

**Solution**: Check cache key and restore-keys

```yaml
- uses: actions/cache@v4
  with:
    key: ${{ runner.os }}-pnpm-${{ hashFiles('**/pnpm-lock.yaml') }}
    restore-keys: |
      ${{ runner.os }}-pnpm-
```

### Issue: Playwright browsers not cached

**Solution**: Use correct cache path

```yaml
path: ~/.cache/ms-playwright # Linux
# path: ~/Library/Caches/ms-playwright  # macOS
# path: ~\AppData\Local\ms-playwright  # Windows
```

### Issue: Build artifacts not available in downstream job

**Solution**: Upload/download artifacts between jobs

```yaml
# In build job:
- uses: actions/upload-artifact@v4
  with:
    name: build-${{ github.sha }}
    path: dist/

# In dependent job:
- uses: actions/download-artifact@v4
  with:
    name: build-${{ github.sha }}
    path: dist/
```

## References

- GitHub Actions Docs: https://docs.github.com/en/actions
- actions/cache: https://github.com/actions/cache
- Playwright CI: https://playwright.dev/docs/ci
- Current Analysis: `plans/POST-DEPLOYMENT-VERIFICATION-RESULTS.md`
- GOAP Plan: `plans/GOAP-CI-TIMEOUT-FIX.md`

## Invocation

Use this skill when:

- CI execution time exceeds acceptable limits
- Need to implement test parallelization/sharding
- Optimizing GitHub Actions workflow performance
- Configuring caching strategies
- Setting up performance monitoring

**Example Usage**:

```
Please optimize the CI workflow using the ci-optimization-specialist skill.
Implement test sharding to reduce execution time to under 10 minutes.
```
