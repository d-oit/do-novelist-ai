# GOAP Plan: Fix PR #31 CI Failures

## Phase 1: Analysis - COMPLETED

### Root Causes Identified

**CRITICAL ISSUE 1: Missing pnpm setup in quality-gates workflow**

- Error: `Unable to locate executable file: pnpm`
- Location: `.github/workflows/performance-integration.yml` line 38
- Impact: Quality Gates & Fast Tests job fails immediately

**CRITICAL ISSUE 2: NODE_ENV=production prevents devDependencies**

- Error: `sh: 1: vite: not found`, `sh: 1: vitest: not found`
- Location: Multiple workflow jobs set `NODE_ENV: production`
- Impact: Build tools (vite, vitest) not installed, causing failures in:
  - Bundle Size Analysis & Monitoring
  - Accessibility Compliance Check
  - All Cross-Browser Performance Checks

**CRITICAL ISSUE 3: Invalid Playwright option**

- Error: `error: unknown option '--output-file=perf-firefox.json'`
- Location: `.github/workflows/performance-monitoring.yml` lines 269-271
- Correct flag: `--reporter=json` with `PLAYWRIGHT_JSON_OUTPUT_NAME` env var

**CRITICAL ISSUE 4: Performance Regression pnpm-lock.yaml path**

- Error: `Dependencies lock file is not found`
- Location: Performance Regression Analysis job
- Cause: Job checks out to subdirectories (base/, pr/) but pnpm cache looks in
  root

## Phase 2: Execution Strategy - SEQUENTIAL

Sequential execution required due to dependencies:

1. Fix pnpm setup → enables dep installation
2. Remove NODE_ENV=production → allows devDeps
3. Fix Playwright flags → correct test execution
4. Fix performance regression paths → correct cache usage

## Phase 3: Task Decomposition

### Task 1: Add pnpm setup to quality-gates job

**File**: `.github/workflows/performance-integration.yml` **Change**: Add pnpm
setup step after checkout, before Node.js setup **Priority**: P0 (blocks all
quality gates)

### Task 2: Remove NODE_ENV=production from workflows

**Files**:

- `.github/workflows/performance-monitoring.yml`
- `.github/workflows/performance-integration.yml` **Change**: Remove
  `NODE_ENV: production` from env sections **Priority**: P0 (blocks build tools)

### Task 3: Fix Playwright reporter flags

**File**: `.github/workflows/performance-monitoring.yml` **Lines**: 267-271
(cross-browser jobs) **Change**: Replace `--output-file=` with proper JSON
reporter syntax **Priority**: P1 (blocks E2E tests)

### Task 4: Fix performance-regression pnpm cache

**File**: `.github/workflows/performance-monitoring.yml` **Lines**: 309-323
(base/pr build steps) **Change**: Update cache path or working directory for
pnpm **Priority**: P1 (blocks regression analysis)

## Phase 4: Quality Gates

**Gate 1: Syntax validation**

- YAML linting passes
- No shellcheck errors

**Gate 2: Local verification**

- Files modified correctly
- No merge conflicts

**Gate 3: CI execution**

- Push changes
- Monitor gh pr checks

**Gate 4: Success criteria**

- All 7 failing checks pass
- No new failures introduced

## Phase 5: Execution Plan

### Step 1: Fix performance-integration.yml pnpm setup

```yaml
# Add after line 30 (checkout)
- name: Setup pnpm
  uses: pnpm/action-setup@v4
  with:
    version: 9

# Update line 38 to use pnpm cache
- name: Install dependencies
  run: pnpm install --frozen-lockfile
```

### Step 2: Remove NODE_ENV=production globally

```yaml
# Remove from both workflows
env:
  FORCE_COLOR: 1
  # NODE_ENV: production <- DELETE THIS
```

### Step 3: Fix Playwright output-file option

```yaml
# Replace lines 267-271 in all 3 cross-browser jobs
- name: Run performance E2E tests
  run: |
    npm run test:e2e -- --project=${{ matrix.browser }} \
      tests/specs/debug.spec.ts --reporter=json
  env:
    PLAYWRIGHT_JSON_OUTPUT_NAME: perf-${{ matrix.browser }}.json
```

### Step 4: Fix performance-regression pnpm paths

```yaml
# Lines 309-323, update to specify path context
- name: Build base branch
  working-directory: base
  run: |
    pnpm install --frozen-lockfile
    pnpm run build
    ...
```

## Phase 6: Contingency Plans

**If pnpm setup still fails:**

- Verify pnpm-lock.yaml exists in repo
- Check pnpm/action-setup version compatibility

**If NODE_ENV removal breaks builds:**

- Set NODE_ENV only for specific build steps
- Use `pnpm install --prod=false`

**If Playwright JSON output fails:**

- Fall back to line reporter
- Check Playwright version compatibility

**If performance regression still fails:**

- Simplify to single checkout
- Use relative paths instead

## Phase 7: Success Metrics

**Immediate**:

- All workflow YAML files validate
- No syntax errors in modified files

**Short-term** (< 5 minutes):

- CI jobs start successfully
- pnpm install completes
- Build tools (vite/vitest) found

**Final** (< 15 minutes):

- All 7 failing checks turn green
- No new failures introduced
- PR ready for merge
