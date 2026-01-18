# Phase 1: Test Coverage Expansion - GOAP Plan

## Executive Summary

**Current State**: 52.55% coverage **Target State**: 55% coverage **Gap**: 2.45%
**Strategy**: Focus on highest ROI files with parallel agent execution (2
agents) **Source of Truth**: gh cli GitHub Action must result in success

---

## File-by-File Analysis

### 1. src/features/gamification/services/gamificationService.ts

**Current Coverage**: 26.66% **Total Lines**: 538 **Estimated Global Impact**:
~0.09% (538 lines / ~600,000 total lines \* 43% improvement)

**Untested Methods/Lines**:

- `checkIn()` - Complex method with multiple branches (~80 lines)
- `checkAchievements()` - Achievement logic (~80 lines)
- `checkMilestones()` - Milestone logic (~45 lines)
- `getStats()` - Stats calculation (~30 lines)
- `calculateXP()`, `calculateLevel()`, `getXPForLevel()` - Math utilities
- `createChallenge()`, `getActiveChallenges()` - Challenge management
- Various private utility methods

**Estimated Tests Needed**: 15-20 tests

- checkIn scenarios: new streak, continuing streak, broken streak (3 tests)
- Achievement unlocking: word_count, daily_streak, chapter_completion (3 tests)
- Stats calculation and milestones (2 tests)
- Challenge creation and retrieval (2 tests)
- Math utilities edge cases (5 tests)
- Error handling (5 tests)

**Potential Coverage Gain**: +43% (26.66% → ~70%) **Estimated Time**: 60-75
minutes **Difficulty**: LOW (pure logic, no external dependencies)

---

### 2. src/features/characters/services/characterService.ts

**Current Coverage**: 3.12% **Total Lines**: 173 **Estimated Global Impact**:
~0.03% (173 lines / ~600,000 total lines \* 57% improvement)

**Untested Methods/Lines**:

- `init()` - Turso service initialization
- `getAll()`, `getById()` - Turso CRUD operations
- `create()` - Character creation with semantic sync
- `update()` - Character update with semantic sync
- `delete()` - Character deletion
- `getRelationships()` - IndexedDB operations (~35 lines)
- `createRelationship()` - IndexedDB operations (~20 lines)
- `deleteRelationship()` - IndexedDB operations (~20 lines)

**Estimated Tests Needed**: 12-15 tests

- Turso service delegation (5 tests)
- IndexedDB relationship operations (7 tests)
- Error handling and edge cases (3 tests)

**Potential Coverage Gain**: +57% (3.12% → ~60%) **Estimated Time**: 90-120
minutes **Difficulty**: HIGH (IndexedDB mocking, Turso dependencies)

---

### 3. src/lib/validation.ts

**Current Coverage**: 61.34% **Total Lines**: 574 **Estimated Global Impact**:
~0.08% (574 lines / ~600,000 total lines \* 19% improvement)

**Untested Methods/Lines**:

- `countWords()` - Private utility method (~4 lines)
- Edge cases in `validateProjectIntegrity()` - Complex validation logic
- Additional cross-field validation scenarios (~10 lines)
- `validateAndFormatContent()` - Max length edge case (~15 lines)

**Estimated Tests Needed**: 5-8 tests

- countWords edge cases (3 tests)
- Project integrity edge cases (2 tests)
- Content validation edge cases (2 tests)

**Potential Coverage Gain**: +19% (61.34% → ~80%) **Estimated Time**: 25-35
minutes **Difficulty**: LOW (mostly pure validation logic)

---

### 4. src/lib/ai-operations.ts

**Current Coverage**: 67.56% **Total Lines**: 670 **Estimated Global Impact**:
~0.07% (670 lines / ~600,000 total lines \* 12% improvement)

**Untested Methods/Lines**:

- Context injection scenarios in: `generateOutline()`, `writeChapterContent()`,
  `analyzeConsistency()`, `developCharacters()`
- Error scenarios with specific HTTP status codes
- Edge cases: empty responses, malformed data, network errors

**Estimated Tests Needed**: 5-6 tests

- Context injection enabled scenarios (2 tests)
- Specific error scenarios (2 tests)
- Edge cases (2 tests)

**Potential Coverage Gain**: +12% (67.56% → ~80%) **Estimated Time**: 30-40
minutes **Difficulty**: MODERATE (API mocking complexity)

---

### 5. src/features/editor/hooks/useGoapEngine.ts

**Current Coverage**: 41.62% **Total Lines**: 538 **Estimated Global Impact**:
~0.11% (538 lines / ~600,000 total lines \* 28% improvement)

**Untested Methods/Lines**:

- `handleRefineChapter()` - ~35 lines
- `handleContinueChapter()` - ~42 lines
- `executeAction()` - Untested action handlers:
  - deepen_plot (~20 lines)
  - develop_characters (~15 lines)
  - build_world (~15 lines)
  - dialogue_doctor (~30 lines)
  - editor_review (~15 lines)
- Auto-pilot loop edge cases
- Action precondition edge cases

**Estimated Tests Needed**: 8-12 tests

- handleRefineChapter (2 tests)
- handleContinueChapter (2 tests)
- Untested action handlers (5 tests)
- Auto-pilot edge cases (3 tests)

**Potential Coverage Gain**: +28% (41.62% → ~70%) **Estimated Time**: 60-80
minutes **Difficulty**: MODERATE (hook testing, React Testing Library)

---

## ROI Analysis (Coverage Gain per Hour)

| File                   | Potential Gain | Time (min) | ROI          | Priority |
| ---------------------- | -------------- | ---------- | ------------ | -------- |
| useGoapEngine.ts       | 0.11%          | 70         | **0.09%/hr** | **P1**   |
| gamificationService.ts | 0.09%          | 70         | 0.08%/hr     | **P1**   |
| validation.ts          | 0.08%          | 30         | **0.16%/hr** | **P1**   |
| ai-operations.ts       | 0.07%          | 35         | 0.12%/hr     | **P2**   |
| characterService.ts    | 0.03%          | 105        | 0.02%/hr     | **P3**   |

---

## Recommended Action Plan

### Sequential Strategy (Minimize Total Time)

**Total Estimated Time**: 70-75 minutes **Expected Coverage**: 52.55% → ~55%

#### Action 1: Agent 1 - validation.ts (30 minutes)

**Preconditions**:

- File exists: `src/lib/validation.ts`
- Test file exists: `src/lib/__tests__/validation.test.ts`
- Test environment configured

**Effects**:

- Add 5-8 edge case tests
- Achieve ~80% coverage
- Gain: +0.08% global coverage

**Test Plan**:

1. `countWords()` edge cases:
   - Empty string
   - Multiple spaces
   - Unicode characters
2. `validateProjectIntegrity()` edge cases:
   - Chapter order index mismatches
   - Duplicate chapter IDs
3. `validateAndFormatContent()` edge cases:
   - Exactly 50,000 characters
   - Special HTML sequences

**Expected Coverage After**: 52.63%

---

#### Action 2: Agent 2 - gamificationService.ts (70 minutes)

**Preconditions**:

- File exists: `src/features/gamification/services/gamificationService.ts`
- No existing test file (need to create:
  `src/features/gamification/services/__tests__/gamificationService.test.ts`)
- Test environment configured

**Effects**:

- Create test file with 15-20 tests
- Achieve ~70% coverage
- Gain: +0.09% global coverage

**Test Plan**:

1. `checkIn()` scenarios (3 tests):
   - First check-in (new streak)
   - Consecutive day check-in (streak continues)
   - Missed day (streak breaks, restarts)
2. Achievement unlocking (3 tests):
   - Word count achievement
   - Daily streak achievement
   - Chapter completion achievement
3. `checkMilestones()` (2 tests):
   - Milestone unlocked
   - Milestone not yet unlocked
4. `getStats()` calculation (2 tests):
   - Stats with existing profile
   - Error when profile not found
5. Challenge operations (2 tests):
   - Create challenge
   - Get active challenges
6. Math utilities (3 tests):
   - XP calculation with/without streak bonus
   - Level calculation
   - XP for level calculation
7. Error handling (5 tests):
   - Profile not found errors
   - Invalid input handling

**Expected Coverage After**: 52.72%

---

#### Action 3: Agent 1 - useGoapEngine.ts (35 minutes - partial)

**Preconditions**:

- File exists: `src/features/editor/hooks/useGoapEngine.ts`
- Test file exists: `src/features/editor/hooks/__tests__/useGoapEngine.test.ts`
- Test environment configured

**Effects**:

- Add 5-6 critical tests
- Achieve ~60% coverage (partial improvement)
- Gain: +0.07% global coverage

**Test Plan**:

1. `handleRefineChapter()` (2 tests):
   - Successful refinement
   - Refinement with error
2. `handleContinueChapter()` (2 tests):
   - Successful continuation
   - Continuation with error
3. `executeAction()` - deepen_plot (1 test):
   - Plot deepening execution

**Expected Coverage After**: 52.79%

---

## Parallel Execution Strategy (2 Agents)

### Phase 1: Parallel Start (Minutes 0-35)

- **Agent 1**: validation.ts tests (30 min) → **Complete at 35 min**
- **Agent 2**: Start gamificationService.ts (35 min progress)

### Phase 2: Agent 1 Takes useGoapEngine (Minutes 35-70)

- **Agent 1**: useGoapEngine.ts tests (35 min) → **Complete at 70 min**
- **Agent 2**: Continue gamificationService.ts (70 min progress)

### Phase 3: Final Push (Minutes 70-75)

- **Agent 2**: Complete gamificationService.ts (5 min remaining)
- **Both**: Verify and run tests

**Total Wall Time**: 75 minutes **Total Agent Time**: 70 + 35 = 105 minutes
**Efficiency**: 40% time savings vs sequential

---

## Alternative Plans

### Plan A: Conservative Approach (Recommended)

**Files**: validation.ts + gamificationService.ts (partial) **Time**: 70 minutes
**Coverage Gain**: +0.17% **Expected Final Coverage**: 52.72% **Risk**: LOW
**Confidence**: 95%

### Plan B: Aggressive Approach

**Files**: validation.ts + gamificationService.ts + useGoapEngine.ts **Time**:
90-100 minutes **Coverage Gain**: +0.25% **Expected Final Coverage**: 52.80%
**Risk**: MEDIUM **Confidence**: 80%

### Plan C: High-Risk Approach

**Files**: characterService.ts (IndexedDB) **Time**: 105 minutes **Coverage
Gain**: +0.03% **Expected Final Coverage**: 52.58% **Risk**: HIGH
**Confidence**: 50% **NOT RECOMMENDED**

---

## Agent Assignment Details

### Agent 1 Responsibilities

1. **validation.ts** - Edge case tests
2. **useGoapEngine.ts** - Action handler tests
3. Final verification and CI/CD preparation

### Agent 2 Responsibilities

1. **gamificationService.ts** - Comprehensive test suite
2. Test file creation and setup
3. Mock implementation for external dependencies

---

## Test Implementation Guidelines

### Testing Standards

- Use Vitest as test runner
- Follow existing test patterns
- Mock external dependencies (fetch, Turso, IndexedDB)
- Include edge cases and error scenarios
- Add `data-testid` attributes for better selectors

### Mock Strategy

- **validation.ts**: Mock `@/types/schemas` and `@/types/guards`
- **gamificationService.ts**: No external dependencies, pure tests
- **useGoapEngine.ts**: Mock AI functions and React hooks

### Success Criteria

1. All new tests pass: `npm run test`
2. Coverage increases by ≥0.2%: `npm run coverage`
3. No lint errors: `npm run lint`
4. GitHub Actions succeed: `gh workflow run`

---

## Risk Assessment

### High Risk Areas

1. **characterService.ts**: IndexedDB complexity
   - **Mitigation**: Do not include in Phase 1
2. **useGoapEngine.ts**: Hook testing complexity
   - **Mitigation**: Focus on critical paths only

### Medium Risk Areas

1. **gamificationService.ts**: Large number of tests
   - **Mitigation**: Prioritize high-impact test scenarios
2. **ai-operations.ts**: API mocking complexity
   - **Mitigation**: Not included in primary plan

### Low Risk Areas

1. **validation.ts**: Well-structured validation logic
   - **Mitigation**: Minimal

---

## Expected Final Coverage After Plan

| Milestone                        | Coverage   | Change            |
| -------------------------------- | ---------- | ----------------- |
| Current                          | 52.55%     | -                 |
| After validation.ts              | 52.63%     | +0.08%            |
| After gamificationService.ts     | 52.72%     | +0.17% cumulative |
| After useGoapEngine.ts (partial) | 52.79%     | +0.24% cumulative |
| **Target**                       | **55.00%** | **+2.45%**        |

**Note**: The calculated gains (0.24%) are lower than the target gap (2.45%).
This suggests either:

1. The target files are not sufficient for the goal
2. Other untested files with larger line counts need to be included
3. The current coverage numbers may have changed

**Recommendation**: Implement the recommended plan first, then reassess. If
additional coverage is needed, include the following files:

### Additional Files for Coverage Expansion

1. **src/lib/db.ts** (42.85% coverage, ~500 lines estimated)
   - Potential gain: +0.04-0.06%
   - Estimated time: 60-90 minutes

2. **src/lib/context/contextCache.ts** (53.7% coverage, ~250 lines estimated)
   - Potential gain: +0.02-0.03%
   - Estimated time: 30-45 minutes

3. **src/features/writing-assistant/services/writingAssistantService.ts**
   (77.92% coverage, ~400 lines estimated)
   - Potential gain: +0.01-0.02%
   - Estimated time: 20-30 minutes

---

## Conclusion

The recommended action plan focuses on **validation.ts** and
**gamificationService.ts** as the highest ROI targets. By executing these in
parallel with 2 agents, we can achieve approximately +0.17% to +0.24% coverage
improvement in 75 minutes.

To reach the full 2.45% target gap, additional files will need to be tested. The
recommended approach is to:

1. Execute the primary plan first
2. Measure actual coverage gain
3. Iterate with additional files as needed

This approach minimizes risk, provides early feedback, and allows for course
correction based on actual results.

---

## Appendix: File Coverage Snapshot

```
gamificationService.ts       26.66%  (0 tests)
characterService.ts          3.12%  (0 tests)
validation.ts               61.34%  (existing tests)
ai-operations.ts            67.56%  (existing tests)
useGoapEngine.ts            41.62%  (6 existing tests)
```

---

_Document Version: 1.0_ _Created: January 17, 2026_ _Status: Draft - Awaiting
Approval_
