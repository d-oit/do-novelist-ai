# GOAP Execution Quick Reference

## Overview

Implement file size refactors (7 files) + E2E test fixes to achieve 100% CI/CD
success.

## Critical Metrics

- Files to refactor: 7 (6,876 LOC total)
- Target: All files < 600 LOC
- E2E tests: Verify 107/107 passing
- Timeline: 4-6 hours
- Agents: 12-15 specialized agents

## Execution Phases

### Phase 0: Preparation (5 min)

- Create feature branch: `git checkout -b fix/file-size-violations-e2e-fixes`
- Verify current state (lint, tests, build)

### Phase 1: Parallel Refactoring (2-3 hours)

**Repository Files (3 parallel teams)**

1. PlotRepository.ts (1,189 LOC) → 3 files
2. CharacterRepository.ts (978 LOC) → 2 files
3. publishingAnalyticsService.ts (843 LOC) → 3 files

**Test Files (4 parallel teams)** 4. validation.test.ts (1,060 LOC) → 4 files 5.
useGoapEngine.test.ts (1,005 LOC) → 4 files 6.
plotGenerationService.integration.test.ts (953 LOC) → 2 files 7.
gamificationService.test.ts (848 LOC) → 3 files

**Quality Gates After Each**:

```bash
npm run lint
npm run test
```

### Phase 2: E2E Verification (45-120 min)

1. Run E2E suite: `npm run test:e2e`
2. Analyze failures (if any)
3. Fix failures (if any)
4. Verify all pass: `npm run test:e2e`

### Phase 3: Quality Gates (20-30 min)

1. Lint: `npm run lint`
2. Unit tests: `npm run test`
3. Build: `npm run build`
4. CI verification: `gh workflow run fast-ci.yml && gh run watch --exit-status`

### Phase 4: Git Workflow (25-40 min)

1. Stage: `git add .`
2. Commit: `git commit -m "refactor: reduce file sizes..."`
3. Push + PR: `git push -u origin fix/... && gh pr create ...`
4. Monitor: `gh run watch --exit-status`

## Agent Assignments

### Repository Refactors (3 teams × 2 agents)

- Team 1: PlotRepository.ts (Feature Module Architect + TypeScript Guardian)
- Team 2: CharacterRepository.ts (Feature Module Architect + TypeScript
  Guardian)
- Team 3: publishingAnalyticsService.ts (Feature Module Architect + TypeScript
  Guardian)

### Test Refactors (4 teams × 2-3 agents)

- Team 4: validation.test.ts (QA Engineer + Testing Anti-patterns + TypeScript
  Guardian)
- Team 5: useGoapEngine.test.ts (QA Engineer + Testing Anti-patterns +
  TypeScript Guardian)
- Team 6: plotGenerationService.integration.test.ts (QA Engineer + Testing
  Anti-patterns)
- Team 7: gamificationService.test.ts (QA Engineer + Testing Anti-patterns +
  TypeScript Guardian)

### E2E & QA (3 agents)

- QA Engineer (orchestration)
- E2E Test Optimizer (reliability)
- Debugger (fixes)

### CI/CD & Quality (3 agents)

- Code Quality Management (lint gates)
- CI Optimization Specialist (GitHub Actions)
- Goap Agent (coordination)

## Success Criteria

✅ All 7 files refactored to < 600 LOC ✅ All unit tests passing (2023/2023) ✅
All E2E tests passing (107/107) ✅ Zero lint errors ✅ All GitHub Actions
passing ✅ Clean git status

## Key Commands

```bash
# Lint
npm run lint

# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Build
npm run build

# Git workflow
git checkout -b fix/file-size-violations-e2e-fixes
git add .
git commit -m "refactor: reduce file sizes to meet 600 LOC limit and fix E2E tests"
git push -u origin fix/file-size-violations-e2e-fixes
gh pr create --title "..." --body "..."
gh run watch --exit-status
```

## File Refactoring Strategy

### Repository Files (Domain Split)

```
Original: XRepository.ts (> 600 LOC)
New:
├── XRepository.ts (exports only, ~40 LOC)
├── XRepository.core.ts (interface + CRUD, ~500 LOC)
├── XRepository.queries.ts (complex queries, ~450 LOC)
└── XRepository.goap.ts (GOAP integration, ~400 LOC)
```

### Test Files (Scenario Split)

```
Original: feature.test.ts (> 600 LOC)
New:
├── feature.basic.test.ts (basic functionality, ~300 LOC)
├── feature.actions.test.ts (action management, ~270 LOC)
├── feature.planning.test.ts (planning logic, ~310 LOC)
└── feature.integration.test.ts (integration tests, ~300 LOC)
```

## Risk Mitigation

- **E2E Flakiness**: Run twice, use smart waits, stabilize selectors
- **Dependency Breaks**: Type checking, full test suite after each refactor
- **CI Timeout**: Optimize tests, split PR if needed

## Handoff Protocol

When completing a task, provide:

1. ✅ Success confirmation
2. 📊 Results summary (metrics, counts)
3. 📝 Changes made (files added/modified)
4. ⚠️ Any issues encountered
5. 🎯 Next action recommended

## Timeline Summary

```
Phase 0:  5 min   (setup)
Phase 1:  55 min  (parallel refactors)
Phase 2:  45-120 min (E2E verification)
Phase 3:  20-30 min (quality gates)
Phase 4:  25-40 min (git workflow)
─────────────────────
Total:    2.5-4.5 hours
```

**See full plan**: `GOAP-EXECUTION-PLAN-FILE-SIZE-E2E-FIXES.md`
