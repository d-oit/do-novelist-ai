# E2E Test Timeout Fix - 2025-11-29
**Problem:** E2E tests cancelled due to 20-minute CI timeout

---

## 🔍 **Root Cause Analysis**

### **Current Configuration Issues:**
1. **CI Timeout**: 20 minutes maximum
2. **Playwright Timeout**: 2 minutes per test (120,000ms)
3. **Test Count**: 34 E2E tests
4. **Sequential Execution**: 1 worker in CI
5. **Minimum Required Time**: 34 × 2min = 68 minutes

### **Calculation:**
```
34 tests × 2 minutes each = 68 minutes minimum
+ Setup time (~5 minutes)
+ Browser installation (~3 minutes)
+ Report generation (~2 minutes)
Total needed: ~78 minutes
```

**Result:** Tests will always timeout (20min < 78min needed)

---

## 🛠️ **Comprehensive Fix**

### **1. Increase CI Timeout**
```yaml
# .github/workflows/ci.yml
e2e-tests:
  name: 🧪 E2E Tests
  runs-on: ubuntu-latest
- timeout-minutes: 20
+ timeout-minutes: 45  # Increased to accommodate all tests
```

### **2. Optimize Playwright Configuration**
```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
- retries: process.env.CI ? 2 : 0,
- workers: process.env.CI ? 1 : '50%',
+ retries: process.env.CI ? 1 : 0,  # Reduce retries in CI
+ workers: process.env.CI ? 4 : '50%', # Use 4 workers in CI
- timeout: 120000, // 2 minutes
+ timeout: 60000,  // 1 minute per test (faster failure)
+ expect: {
+   timeout: 10000, // 10 seconds for assertions
+ },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
```

### **3. Add Test Prioritization**
```typescript
// playwright.config.ts
export default defineConfig({
  // ... existing config
  projects: [
    {
      name: 'critical-path',
      testMatch: '**/app.spec.ts', // Smoke test only
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'full-suite',
      testIgnore: '**/app.spec.ts', // All other tests
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

### **4. Optimized CI Workflow**
```yaml
# .github/workflows/ci.yml
e2e-tests:
  name: 🧪 E2E Tests
  runs-on: ubuntu-latest
  timeout-minutes: 45
  needs: build-and-test
  strategy:
    matrix:
      shard: [1, 2, 3, 4]  # Run tests in parallel shards
  steps:
    - name: Checkout code
      uses: actions/checkout@v6
    
    # ... existing setup steps ...
    
    - name: Run Playwright tests (shard ${{ matrix.shard }})
      run: |
        pnpm exec playwright test --shard=${{ matrix.shard }}/4
      
    - name: Upload Playwright report
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: playwright-report-shard-${{ matrix.shard }}-${{ github.sha }}
        path: playwright-report/
        retention-days: 7
```

---

## ⚡ **Quick Fix (Immediate)**

### **Option 1: Reduce Test Scope (Fastest)**
```yaml
# Run only critical smoke tests in CI
- name: Run Playwright tests
  run: |
    pnpm exec playwright test tests/app.spec.ts
```

### **Option 2: Increase Timeout Only (Easiest)**
```yaml
e2e-tests:
  name: 🧪 E2E Tests
  runs-on: ubuntu-latest
+ timeout-minutes: 60  # Increase from 20 to 60 minutes
```

### **Option 3: Parallel Workers (Balanced)**
```typescript
// playwright.config.ts
export default defineConfig({
  workers: process.env.CI ? 8 : '50%', // Use 8 workers in CI
  timeout: 45000, // 45 seconds per test
  // ... rest of config
});
```

---

## 🎯 **Recommended Solution**

### **Phase 1: Immediate Fix (Today)**
```yaml
# Increase timeout to 45 minutes
timeout-minutes: 45

# Use 4 workers in CI
workers: process.env.CI ? 4 : '50%'

# Reduce individual test timeout to 60 seconds
timeout: 60000
```

### **Phase 2: Optimization (Next Sprint)**
1. **Implement test sharding** for parallel execution
2. **Add test prioritization** (critical vs full suite)
3. **Fix failing selectors** to reduce test execution time
4. **Optimize test data** for faster setup/teardown

---

## 📊 **Expected Results**

### **After Fix:**
- **Total Execution Time**: ~15-20 minutes
- **CI Success Rate**: 95%+
- **Test Reliability**: Stable and predictable
- **Developer Experience**: Fast feedback loop

### **Performance Improvements:**
- **4× faster** with parallel workers
- **50% reduction** in individual test timeout
- **2× faster** CI feedback
- **Stable test execution** within limits

---

## 🚀 **Implementation Steps**

### **Step 1: Apply Quick Fix**
```bash
# Edit playwright.config.ts
workers: process.env.CI ? 4 : '50%'
timeout: 60000

# Edit .github/workflows/ci.yml  
timeout-minutes: 45
```

### **Step 2: Test Locally**
```bash
# Verify tests run faster
npm run test:e2e

# Should complete in ~15-20 minutes
```

### **Step 3: Deploy Fix**
```bash
git add .
git commit -m "fix: resolve E2E test timeout issues"
git push
```

### **Step 4: Monitor CI**
- Check GitHub Actions for successful run
- Verify execution time is under 45 minutes
- Confirm all tests pass or fail appropriately

---

## 📋 **Files to Modify**

1. **playwright.config.ts**
   - Increase workers in CI: `workers: process.env.CI ? 4 : '50%'`
   - Reduce timeout: `timeout: 60000`
   - Add expect timeout: `expect: { timeout: 10000 }`

2. **.github/workflows/ci.yml**
   - Increase timeout: `timeout-minutes: 45`
   - (Optional) Add test sharding strategy

---

## ✅ **Verification**

After applying fixes:
```bash
# Local verification
npm run test:e2e  # Should complete in 15-20 minutes

# CI verification
git push  # Should see successful GitHub Actions run
```

---

**Fix Priority:** HIGH (blocking CI/CD pipeline)  
**Implementation Time:** 30 minutes  
**Expected Impact:** E2E tests will complete successfully within CI limits  
**Risk Level:** LOW (configuration changes only)

---

*This fix addresses the root cause of E2E test timeouts while maintaining test quality and reliability.*