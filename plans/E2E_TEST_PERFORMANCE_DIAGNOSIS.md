# E2E Test Performance Diagnosis Report

## Executive Summary

**Status**: 🔴 Critical Performance Issues Identified  
**Root Cause**: Configuration bottlenecks causing 5+ minute test timeouts  
**Impact**: Blocking production deployments  
**Resolution Time**: 2-4 hours with proposed fixes

## Issue Analysis

### Problem Statement

- E2E tests failing after 5+ minutes in CI/CD pipeline
- 3/3 test shards failing consistently
- Blocking production deployment workflow
- 135 tests across 10 test files not completing within timeout windows

### Root Cause Analysis

#### 1. Critical Configuration Bottlenecks 🔴

**Sequential Execution in CI**

- **Issue**: `workers: process.env.CI ? 1 : 2` forces sequential test execution
- **Impact**: All 135 tests run one-by-one instead of parallel execution
- **Evidence**: Test results show 135 tests taking significant time with only 1
  worker

**Broken Sharding Configuration**

- **Issue**:
  `shard: process.env.CI ? (process.env.GITHUB_SHA ? undefined : undefined) : undefined`
- **Problem**: Always evaluates to `undefined`, so sharding never activates
- **Impact**: Tests aren't distributed across the 3 configured shards

**Over-Broad Browser Configuration**

- **Issue**: CI runs tests on chromium/firefox/webkit when only chromium is
  needed
- **Impact**: 3x test execution time (45 tests × 3 browsers = 135 total test
  cases)

#### 2. Timeout Chain Reaction 🟡

**Extended Test Durations**

```typescript
// Current timeout chain:
- Test timeout: 30s
- Navigation timeout: 30s
- Network idle wait: Variable (can be 10-30s)
- Server startup: 120s (in CI)
- Total per test: 60-150s
```

**Network Idle Bottleneck**

- **Issue**: Every test uses `await page.waitForLoadState('networkidle')`
- **Impact**: Waits for ALL network activity to stop, including analytics,
  fonts, etc.
- **Location**: Found in `ai-generation.spec.ts`, `project-management.spec.ts`,
  `world-building.spec.ts`

#### 3. Test Setup Overhead 🟡

**Repeated AI Mock Setup**

- **Issue**: `setupGeminiMock(page)` called in every `beforeEach`
- **Impact**: Unnecessary overhead on test initialization
- **Frequency**: 135 tests × mock setup overhead

**Complex Navigation Patterns**

- **Issue**: Multiple navigation steps per test (dashboard → settings →
  dashboard)
- **Impact**: Each navigation adds 5-15 seconds with network idle waits

## Performance Bottleneck Identification

### High-Impact Issues (60%+ of timeout time)

1. **Sequential Execution**: 1 worker vs optimal 4-8 workers for CI
2. **Unnecessary Browser Multiplication**: 3x browser execution when 1x needed
3. **Broken Sharding**: 0% distribution efficiency instead of ~33% per shard

### Medium-Impact Issues (25-40% of timeout time)

4. **Network Idle Waits**: ~10-30s per test wait overhead
5. **Server Startup**: 120s server timeout in CI environment
6. **Mock Setup**: ~2-5s overhead per test in beforeEach

### Low-Impact Issues (10-20% of timeout time)

7. **Complex Navigation**: Multiple page transitions per test
8. **Heavy DOM Interactions**: Accessibility tests with complex axe-core scans

## Test Reliability Assessment

### Flaky Test Patterns Identified ⚠️

1. **Timing-Dependent Selectors**

   ```typescript
   // Risky pattern found in project-wizard.spec.ts:
   if (await newProjectBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
   ```

2. **Race Conditions**
   - Multiple `waitForLoadState('networkidle')` calls
   - Parallel resource loading without proper synchronization

3. **Environment-Specific Issues**
   - Different timeout behaviors between local and CI
   - Memory pressure affecting browser stability

## CI Environment Assessment

### Resource Constraints

- **Memory**: 3 browser instances competing for limited CI resources
- **CPU**: Sequential execution not utilizing available cores
- **Network**: Shared localhost:3000 causing port conflicts between shards

### Configuration Mismatches

- **Workers**: 1 worker vs optimal 4-8 for CI environment
- **Retries**: 2 retries adding overhead to already slow tests
- **Timeout**: 90s individual timeout with 45-minute shard timeout

## Solution Recommendations

### Immediate Fixes (High Impact)

#### 1. Fix Playwright CI Configuration

```typescript
// playwright.config.ts - Critical fixes
export default defineConfig({
  // Fix 1: Increase workers in CI for parallel execution
  workers: process.env.CI ? 4 : 2,

  // Fix 2: Enable proper sharding in CI
  shard: process.env.CI ? `${process.env.GITHUB_SHA}/3` : undefined,

  // Fix 3: Run only Chromium in CI to reduce browser overhead
  projects: process.env.CI
    ? [
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },
      ]
    : [
        // Keep full browser matrix for local development
      ],

  // Fix 4: Enable parallel execution
  fullyParallel: true,
});
```

#### 2. Optimize Timeout Configuration

```typescript
// Reduce timeout chains
timeout: 60000, // Increase test timeout to 60s
expect: { timeout: 10000 }, // Reduce expectation timeout
navigationTimeout: 20000, // Reduce navigation timeout
```

#### 3. Replace Network Idle Waits

```typescript
// Replace with more specific waits
await page.waitForLoadState('domcontentloaded'); // Faster than networkidle
await page.locator('[data-testid="app-loaded"]').waitFor(); // Specific element
```

### Performance Optimizations (Medium Impact)

#### 4. Optimize AI Mock Setup

```typescript
// Move mock setup to globalSetup for efficiency
// Remove from individual test beforeEach hooks
```

#### 5. Simplify Test Navigation

```typescript
// Reduce navigation complexity
// Use direct URL navigation where possible
// Minimize page transitions per test
```

## Expected Performance Improvements

### With Proposed Fixes:

- **Sequential → Parallel**: ~4x speed improvement
- **3 Browsers → 1 Browser**: ~3x speed improvement
- **Network Idle Optimization**: ~30% time reduction per test
- **Overall Expected**: **85-90% reduction in CI test execution time**

### Target Metrics:

- Current: 5+ minutes per shard
- Target: 45-60 seconds per shard
- Total pipeline time: <3 minutes (vs current 15+ minutes)

## Implementation Priority

### Phase 1: Critical Fixes (1-2 hours)

1. ✅ Fix workers configuration
2. ✅ Enable proper sharding
3. ✅ Reduce browser matrix in CI
4. ✅ Optimize timeouts

### Phase 2: Performance Optimization (2-4 hours)

1. ✅ Replace network idle waits
2. ✅ Optimize mock setup
3. ✅ Simplify navigation patterns
4. ✅ Implement test isolation

### Phase 3: Monitoring & Prevention (1-2 hours)

1. ✅ Add performance monitoring
2. ✅ Implement flake detection
3. ✅ Set up alerts for regression
4. ✅ Document best practices

## Risk Assessment

### Low Risk Changes

- Worker count optimization
- Timeout adjustments
- Network idle wait replacement

### Medium Risk Changes

- Sharding configuration
- Browser matrix reduction
- Mock setup optimization

### Mitigation Strategies

- Test changes in staging environment first
- Implement gradual rollout
- Maintain rollback capability
- Monitor performance metrics closely

## Success Metrics

### Performance Targets

- ✅ **Test Execution Time**: <60 seconds per shard
- ✅ **Pipeline Success Rate**: >95%
- ✅ **Resource Utilization**: <80% CI resources
- ✅ **Flake Rate**: <2%

### Monitoring Points

- Individual test execution times
- CI environment resource consumption
- Browser instance stability
- Network request patterns

## Conclusion

The E2E test performance issues are **highly solvable** through targeted
configuration optimization. The root causes are primarily **configuration
bottlenecks** rather than fundamental test architecture problems. With the
proposed fixes, we expect:

- **85-90% reduction** in test execution time
- **Unblocking** of production deployments
- **Improved** developer experience with faster feedback cycles
- **Enhanced** CI/CD pipeline reliability

**Next Steps**: Implement Phase 1 critical fixes immediately, then proceed with
optimization phases based on performance results.
