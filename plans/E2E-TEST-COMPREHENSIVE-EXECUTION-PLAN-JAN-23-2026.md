# E2E Test Comprehensive Optimization Plan

**Date**: January 23, 2026 **Status**: In Progress **Goal**: Fix all 38 expected
E2E test failures and optimize execution time

---

## Current State

- **Total E2E Tests**: 107 tests
- **Expected Failures**: 38 tests
- **Test Suite Status**: Times out during execution
- **Completed Phases**: 1-2 (anti-pattern removal)
- **Pending Phases**: 3-6 (this execution)

---

## Execution Strategy

### Phase 3: Browser-Specific Optimizations (Agents 1-2)

**Pattern**: Parallel Execution - Independent tasks

**Agent 1**: Apply BrowserCompatibility class across all tests

- Update all 16 spec files to extend BrowserCompatibility
- Apply Firefox 1.5x timeout multiplier
- Apply WebKit 1.3x timeout multiplier
- Add browser-specific localStorage workarounds
- Target files: `tests/specs/*.spec.ts`

**Agent 2**: Add browser-specific test helpers

- Create/Update: `tests/utils/browser-helpers.ts`
- Firefox localStorage async workarounds
- WebKit animation detection improvements
- Chrome-specific timing adjustments
- Cross-browser wait strategies
- Apply to all spec files

### Phase 4: Mock Optimization (Agents 3-4)

**Pattern**: Parallel Execution - Independent tasks

**Agent 3**: Optimize mock setup

- Create global mock registry
- Use `beforeAll` for one-time mock initialization
- Cache mock configurations
- Only reset routes when needed
- Target: `tests/fixtures/mocks.ts` (create)

**Agent 4**: Optimize mock reset

- Only reset changed routes
- Preserve common mocks between tests
- Use page context for isolation
- Implement smart mock cleanup
- Track mock state
- Target: `tests/utils/test-cleanup.ts` (update)

### Phase 5: Test Consolidation (Agents 5-6)

**Pattern**: Parallel Execution - Independent tasks

**Agent 5**: Consolidate similar tests

- Merge `project-wizard.spec.ts` and `project-management.spec.ts`
- Extract common navigation to `tests/utils/navigation-helpers.ts`
- Create shared test suites
- Remove duplicate test cases
- Consolidate test data factories

**Agent 6**: Extract common test patterns

- Create `tests/utils/test-patterns.ts`
- Modal interaction patterns
- Form submission patterns
- Navigation patterns
- Error handling patterns
- Loading state patterns
- Apply to all spec files

### Phase 6: Test Fix & Verification (Agents 7-8)

**Pattern**: Sequential Execution - Dependencies on Agents 1-6

**Agent 7**: Fix identified test failures

- Fix modal overlay blocking interactions
- Fix timing/async issues with waitFor
- Add proper cleanup between tests
- Fix database initialization errors
- Fix accessibility violations (aria-required-parent)
- Target files with known failures

**Agent 8**: Run full E2E suite and generate report

- Execute `npm run test:e2e` (all browsers)
- Capture test results (pass/fail/skip)
- Analyze failure patterns
- Measure execution time improvements
- Generate comprehensive report
- Save to: `plans/E2E-TEST-FINAL-COMPLETION-REPORT-JAN-23-2026.md`

---

## Execution Timeline

```
Phase 3-5 (Agents 1-6):  Parallel  ~30 minutes
Phase 6 (Agent 7):      Sequential ~20 minutes
Phase 6 (Agent 8):      Sequential ~15 minutes

Total Estimated Time:   ~65 minutes
```

---

## Quality Gates

### Gate 1: After Agents 1-6 (Phase 3-5)

- [ ] BrowserCompatibility used consistently
- [ ] Mock setup optimized with beforeAll
- [ ] Test consolidation complete
- [ ] Common patterns extracted

### Gate 2: After Agent 7 (Phase 6 - Fix)

- [ ] All 38 test failures addressed
- [ ] Modal overlay blocking fixed
- [ ] Timing issues resolved
- [ ] Cleanup implemented

### Gate 3: After Agent 8 (Phase 6 - Verification)

- [ ] All 107 E2E tests passing (0 failures)
- [ ] Execution time reduced by >20%
- [ ] Comprehensive report generated

---

## Success Criteria

✅ BrowserCompatibility class used consistently across all tests ✅ Mock setup
optimized with beforeAll ✅ Test consolidation complete (duplicate tests merged)
✅ Common patterns extracted to helpers ✅ All 38 test failures addressed ✅ All
107 E2E tests passing (or issues clearly documented) ✅ Comprehensive completion
report generated ✅ Execution time reduced by >20%

---

## Dependencies

- **Agents 1-6**: No dependencies (can run in parallel)
- **Agent 7**: Depends on completion of Agents 1-6
- **Agent 8**: Depends on completion of Agent 7

---

## Handoff Documentation

Each agent will generate a handoff document:

- **Context**: What was done
- **Changes**: Files modified/created
- **Tests Run**: Results of test runs
- **Issues Found**: Problems encountered
- **Next Steps**: Recommendations for next phase

---

## Risk Mitigation

### Risk 1: Agent failures

- **Mitigation**: Continue with other agents, document issues

### Risk 2: Test suite still times out

- **Mitigation**: Enable test sharding, reduce worker count

### Risk 3: Browser-specific issues persist

- **Mitigation**: Document in report, create separate browser-specific tests

### Risk 4: Mock optimization breaks existing tests

- **Mitigation**: Rollback changes, analyze root cause

---

## Monitoring & Progress

Progress will be tracked via:

- Handoff documents in `plans/` folder
- Agent completion status
- Test run results
- Quality gate verification

---

## Next Steps

1. Execute Agents 1-6 in parallel
2. Verify Gate 1 completion
3. Execute Agent 7
4. Verify Gate 2 completion
5. Execute Agent 8
6. Verify Gate 3 completion
7. Generate final report
