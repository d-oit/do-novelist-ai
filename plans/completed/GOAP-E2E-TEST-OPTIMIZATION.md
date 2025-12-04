# GOAP Plan: E2E Test Optimization & CI Fix

## Executive Summary

**Goal**: Fix CI E2E test timeout (exceeds 60 minutes) and optimize test
execution **Strategy**: Hybrid execution (parallel analysis + sequential fixes)
**Estimated Time**: 15-25 minutes **Quality Gates**: 3 checkpoints

---

## Phase 1: Analysis & Diagnosis (Parallel)

### Agent 1: Test Architecture Analyzer

**Task**: Analyze test suite structure and identify bottlenecks

- Review all 8 active test specs
- Identify slow tests (>10s)
- Map dependencies and parallelization opportunities
- Document UI/UX patterns from codebase

**Deliverables**:

- Test performance analysis
- Bottleneck identification
- Parallelization recommendations

### Agent 2: Playwright Configuration Auditor

**Task**: Review Playwright config for optimization opportunities

- Analyze `playwright.config.ts` settings
- Check worker configuration (CI: 2 workers)
- Review timeout settings (60s per test, 3600s global)
- Identify redundant or slow operations

**Deliverables**:

- Configuration optimization recommendations
- Timeout tuning suggestions

### Agent 3: CI Pipeline Analyzer

**Task**: Review GitHub Actions workflow for E2E optimization

- Analyze `.github/workflows/ci.yml`
- Check resource allocation and caching
- Identify pipeline bottlenecks
- Review artifact handling

**Deliverables**:

- CI pipeline optimization plan
- Resource allocation recommendations

**Quality Gate 1**: All analyses complete with actionable recommendations

---

## Phase 2: Implementation (Hybrid: Parallel + Sequential)

### Parallel Track A: Test Optimization

#### Agent 4: Test Performance Engineer (playwright-skill)

**Task**: Optimize slow tests and improve parallelization

- Reduce test redundancy
- Optimize waits and assertions
- Improve test isolation
- Add smart test grouping

**Success Criteria**:

- Average test time <5s
- All tests maintain coverage
- No flaky tests introduced

### Parallel Track B: Configuration Optimization

#### Agent 5: Config Optimizer

**Task**: Update Playwright and CI configurations

- Optimize worker count for CI (increase from 2 to 4)
- Tune timeouts appropriately
- Enable test sharding if beneficial
- Update CI job timeout if needed

**Success Criteria**:

- Configurations validated
- No breaking changes
- Performance improved

### Sequential Track: Quality Validation

#### Agent 6: Test Runner & Validator

**Task**: Run tests locally and validate improvements

- Execute full test suite locally
- Measure performance improvements
- Validate all tests pass
- Check for regressions

**Success Criteria**:

- All 55+ tests pass
- Total time <20 minutes locally
- No flaky behavior

**Quality Gate 2**: All implementations complete, local tests pass

---

## Phase 3: Integration & CI Validation (Sequential)

### Agent 7: CI Integration Specialist

**Task**: Validate fixes in CI environment

- Push changes to branch
- Monitor CI execution
- Validate E2E tests pass in <30 minutes
- Check all quality gates

**Success Criteria**:

- CI E2E tests pass
- Execution time <30 minutes
- All artifacts uploaded successfully

**Quality Gate 3**: CI pipeline passes, ready for merge

---

## Execution Strategy: Hybrid

### Phase 1 (Parallel): 3 agents analyze simultaneously

```
Agent 1 (Test Analyzer) ──┐
Agent 2 (Config Auditor) ─┼→ Quality Gate 1
Agent 3 (CI Analyzer) ────┘
```

### Phase 2 (Hybrid): Parallel tracks + Sequential validation

```
Track A: Agent 4 (Test Optimizer) ──┐
                                     ├→ Quality Gate 2
Track B: Agent 5 (Config Optimizer) ┘
                ↓
     Agent 6 (Test Validator)
```

### Phase 3 (Sequential): Final validation

```
Agent 7 (CI Integration) → Quality Gate 3
```

---

## Specific Optimizations to Implement

### Test Suite Optimizations

1. **Reduce test count**: Combine similar test cases
2. **Parallel sharding**: Use `--shard` for CI
3. **Smart grouping**: Group related tests for better caching
4. **Remove redundant waits**: Use efficient selectors and assertions

### Configuration Optimizations

1. **Increase CI workers**: 2 → 4 workers
2. **Optimize timeouts**:
   - Test timeout: 60s → 30s (most tests are <5s)
   - Global timeout: Keep at 3600s as safety net
3. **Enable test sharding**: Split across CI matrix if needed
4. **Reduce retries**: CI retries 2 → 1 (if tests are stable)

### CI Pipeline Optimizations

1. **Parallel browser caching**: Ensure Playwright cache works
2. **Artifact optimization**: Only upload on failure
3. **Test result streaming**: Use line reporter for faster feedback
4. **Consider test splitting**: Multiple CI jobs if needed

---

## Success Metrics

### Performance Targets

- **Local execution**: <15 minutes (currently unknown, likely 20-30min)
- **CI execution**: <30 minutes (currently >60 minutes)
- **Per-test average**: <5 seconds
- **Parallel efficiency**: 70%+ utilization

### Quality Targets

- **Test pass rate**: 100%
- **Flaky test rate**: 0%
- **Coverage maintained**: 100%
- **No breaking changes**: All existing tests work

---

## Risk Mitigation

### Risk 1: Tests fail after optimization

**Mitigation**: Agent 6 validates all tests locally before CI push

### Risk 2: New configuration breaks CI

**Mitigation**: Incremental changes, validate each step

### Risk 3: Still timeout after optimization

**Fallback**: Implement test sharding across multiple CI jobs

---

## Contingency Plans

### If Phase 2 doesn't achieve <30min target:

1. Implement test sharding (multiple E2E jobs)
2. Increase CI timeout to 40 minutes as intermediate step
3. Archive less critical tests to reduce suite size

### If tests become flaky:

1. Increase test stability with better waits
2. Add retry logic for specific flaky tests
3. Use Playwright trace on failures for debugging

---

## Timeline

| Phase                   | Duration      | Agents       |
| ----------------------- | ------------- | ------------ |
| Phase 1: Analysis       | 3-5 min       | 3 parallel   |
| Phase 2: Implementation | 8-12 min      | 3 hybrid     |
| Phase 3: CI Validation  | 4-8 min       | 1 sequential |
| **Total**               | **15-25 min** | **7 total**  |

---

## Agent Assignment Summary

1. **Explore agent** → Test architecture analysis
2. **Explore agent** → Playwright config audit
3. **Explore agent** → CI pipeline analysis
4. **playwright-skill** → Test optimization
5. **general-purpose** → Config optimization
6. **general-purpose** → Local test validation
7. **general-purpose** → CI integration

---

## Expected Outcomes

### Immediate

- ✅ CI E2E tests pass in <30 minutes
- ✅ All 55+ tests passing
- ✅ PR unblocked for merge

### Long-term

- ✅ Faster feedback loop for developers
- ✅ More reliable CI pipeline
- ✅ Foundation for scaling test suite
- ✅ Improved test maintainability
