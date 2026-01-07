# GOAP Execution Plan: E2E Test Failure Remediation

**Generated**: 2026-01-07 **Goal**: Fix all 140+ failing E2E tests, eliminate 6
skipped tests, achieve 100% pass rate (204/204 tests) **Strategy**: Hybrid
(Parallel P0 fixes + Sequential validation gates + Iterative accessibility
improvements)

---

## Phase 1: GOAP Analysis ✓

### Primary Goal

**All 204 E2E tests must pass with zero skips across all browsers (Chromium,
Firefox, Webkit)**

### Current State

- **Passing**: 45+ tests (22%)
- **Failing**: 140+ tests (68%)
- **Skipped**: 6 tests (3%)
- **Test Infrastructure**: ✓ Working (Playwright, mocks, DB)

### Constraints

- **Time**: Urgent (all fixes must be completed in this session)
- **Quality**: Must maintain existing passing tests (no regressions)
- **Standards**: AGENTS.md compliance, WCAG 2.1 AA compliance
- **Testing**: Each fix must be validated before proceeding

### Complexity Assessment

**Very Complex** - Requires:

- 5 major component areas (Navigation, Search, Settings, Plot Engine,
  Accessibility)
- Multiple execution modes (parallel investigation + sequential fixes)
- Quality gates between phases
- Cross-cutting concerns (accessibility affects all components)

---

## Phase 2: Task Decomposition

### Main Components

#### Component 1: Navigation & Routing (P0 - CRITICAL)

**Impact**: Blocks Settings, Plot Engine, World Building tests (30+ tests)

**Atomic Tasks**:

1. **Task 1.1**: Investigate router configuration
   - Agent: Explore
   - Action: Find and analyze router config file
   - Success: Route definitions documented

2. **Task 1.2**: Verify Settings route exists
   - Agent: debugger
   - Action: Check `/settings` route registration
   - Success: Route found or issue identified

3. **Task 1.3**: Verify Plot Engine route exists
   - Agent: debugger
   - Action: Check `/plot-engine` route registration
   - Success: Route found or issue identified

4. **Task 1.4**: Verify World Building route exists
   - Agent: debugger
   - Action: Check `/world-building` route registration
   - Success: Route found or issue identified

5. **Task 1.5**: Fix missing/broken routes
   - Agent: feature-implementer
   - Action: Add or repair route configurations
   - Success: All routes properly registered

6. **Task 1.6**: Add data-testid to navigation elements
   - Agent: feature-implementer
   - Action: Add test identifiers to nav links
   - Success: All navigation elements have data-testid

**Dependencies**: 1.1 → 1.2, 1.3, 1.4 (parallel) → 1.5 → 1.6

---

#### Component 2: Semantic Search Modal (P0 - CRITICAL)

**Impact**: Blocks 10 semantic search tests

**Atomic Tasks**:

1. **Task 2.1**: Investigate SearchModal component
   - Agent: Explore
   - Action: Find and analyze SearchModal implementation
   - Success: Component structure documented

2. **Task 2.2**: Debug keyboard shortcut handler
   - Agent: debugger
   - Action: Verify Cmd+K / Ctrl+K event listener
   - Success: Handler found or issue identified

3. **Task 2.3**: Fix keyboard shortcut registration
   - Agent: feature-implementer
   - Action: Implement or repair keyboard shortcut handler
   - Success: Shortcut opens modal

4. **Task 2.4**: Fix modal state management
   - Agent: feature-implementer
   - Action: Verify/fix isOpen state and z-index
   - Success: Modal visible when opened

5. **Task 2.5**: Fix Escape key handler
   - Agent: feature-implementer
   - Action: Implement Escape key to close modal
   - Success: Escape closes modal

6. **Task 2.6**: Add search modal ARIA labels
   - Agent: feature-implementer
   - Action: Add aria-label, role, aria-modal attributes
   - Success: Modal has proper accessibility attributes

**Dependencies**: 2.1 → 2.2 → 2.3, 2.4, 2.5 (parallel) → 2.6

---

#### Component 3: Settings Panel (P0 - CRITICAL)

**Impact**: Blocks 11 settings tests

**Atomic Tasks**:

1. **Task 3.1**: Investigate SettingsView component
   - Agent: Explore
   - Action: Find and analyze SettingsView implementation
   - Success: Component location and structure documented

2. **Task 3.2**: Fix Settings navigation access
   - Agent: feature-implementer
   - Action: Ensure Settings nav link is accessible with data-testid
   - Dependency: Task 1.6
   - Success: Settings link clickable in tests

3. **Task 3.3**: Verify Settings sub-components render
   - Agent: debugger
   - Action: Check all settings sections load properly
   - Success: All sections identified and rendering

4. **Task 3.4**: Fix Settings panel rendering issues
   - Agent: feature-implementer
   - Action: Fix any missing imports or async loading issues
   - Success: All settings sections display

5. **Task 3.5**: Add Settings form accessibility
   - Agent: feature-implementer
   - Action: Add labels, aria-labels to all form inputs
   - Success: All forms have proper labels

**Dependencies**: (Task 1.5, 1.6) → 3.1 → 3.2 → 3.3 → 3.4, 3.5 (parallel)

---

#### Component 4: Plot Engine Dashboard (P1 - HIGH)

**Impact**: Blocks 12 plot engine tests, prevents unskipping 2 tests

**Atomic Tasks**:

1. **Task 4.1**: Investigate PlotEngineDashboard component
   - Agent: Explore
   - Action: Find and analyze PlotEngineDashboard implementation
   - Success: Component location and structure documented

2. **Task 4.2**: Fix Plot Engine navigation access
   - Agent: feature-implementer
   - Action: Ensure Plot Engine nav link accessible with data-testid
   - Dependency: Task 1.6
   - Success: Plot Engine link clickable in tests

3. **Task 4.3**: Verify Plot Engine component rendering
   - Agent: debugger
   - Action: Check component loads and displays
   - Success: Component renders in test environment

4. **Task 4.4**: Fix Plot Engine tab navigation
   - Agent: feature-implementer
   - Action: Ensure tabs work and have proper data-testid
   - Success: Tabs switch content properly

5. **Task 4.5**: Add Plot Engine data-testid attributes
   - Agent: feature-implementer
   - Action: Add test identifiers to all interactive elements
   - Success: All elements have data-testid

6. **Task 4.6**: Add Plot Engine ARIA labels
   - Agent: feature-implementer
   - Action: Add aria-labels to dashboard elements
   - Success: Dashboard has proper accessibility

7. **Task 4.7**: Unskip Plot Engine accessibility tests
   - Agent: feature-implementer
   - Action: Remove `.skip` from lines 231, 249
   - Success: Tests run and pass

**Dependencies**: (Task 1.5, 1.6) → 4.1 → 4.2 → 4.3 → 4.4, 4.5, 4.6 (parallel) →
4.7

---

#### Component 5: World Building (P1 - HIGH)

**Impact**: Blocks 2 world building tests

**Atomic Tasks**:

1. **Task 5.1**: Investigate WorldBuilding components
   - Agent: Explore
   - Action: Find and analyze world building implementation
   - Success: Component location documented

2. **Task 5.2**: Fix World Building navigation access
   - Agent: feature-implementer
   - Action: Ensure World Building nav link accessible
   - Dependency: Task 1.6
   - Success: Link clickable in tests

3. **Task 5.3**: Verify World Building route works
   - Agent: debugger
   - Action: Test navigation to world building view
   - Success: Route accessible and component renders

**Dependencies**: (Task 1.5, 1.6) → 5.1 → 5.2 → 5.3

---

#### Component 6: Accessibility Compliance (P0 - CRITICAL, Cross-cutting)

**Impact**: Blocks 11 accessibility tests, affects all components

**Atomic Tasks**:

1. **Task 6.1**: Audit existing ARIA implementation
   - Agent: code-reviewer
   - Action: Review all components for accessibility
   - Success: Issues documented with locations

2. **Task 6.2**: Add ARIA labels to interactive elements (Global)
   - Agent: refactorer
   - Action: Add aria-label to all buttons, links, inputs
   - Success: All interactive elements labeled

3. **Task 6.3**: Add landmark roles
   - Agent: feature-implementer
   - Action: Add role="main", "navigation", "banner" to layout
   - Success: Proper page structure with landmarks

4. **Task 6.4**: Implement skip links
   - Agent: feature-implementer
   - Action: Add "Skip to main content" link
   - Success: Skip link functional for keyboard navigation

5. **Task 6.5**: Fix focus indicators
   - Agent: refactorer
   - Action: Ensure visible focus styles on all interactive elements
   - Success: Focus visible when tabbing through page

6. **Task 6.6**: Fix color contrast issues
   - Agent: refactorer
   - Action: Adjust colors to meet WCAG AA standards
   - Success: All text meets 4.5:1 contrast ratio

7. **Task 6.7**: Add ARIA live regions
   - Agent: feature-implementer
   - Action: Add aria-live for dynamic content updates
   - Success: Screen readers announce changes

8. **Task 6.8**: Implement proper heading hierarchy
   - Agent: refactorer
   - Action: Ensure h1, h2, h3 used correctly
   - Success: Logical heading structure

9. **Task 6.9**: Add form labels and fieldsets
   - Agent: feature-implementer
   - Action: Ensure all forms have proper labels
   - Success: All form inputs have associated labels

10. **Task 6.10**: Implement focus trap for modals
    - Agent: feature-implementer
    - Action: Add focus trap to SearchModal and other modals
    - Success: Focus stays within modal, Escape closes

**Dependencies**: 6.1 → 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10 (parallel
execution)

---

## Phase 3: Strategy Selection

### Chosen Strategy: **HYBRID EXECUTION**

**Rationale**:

- **Parallel Phase 1**: Independent investigation tasks (Tasks 1.1, 2.1, 3.1,
  4.1, 5.1, 6.1) can run simultaneously
- **Sequential Phase 2**: Navigation fixes must complete before component fixes
  (dependency chain)
- **Parallel Phase 3**: Once navigation is fixed, component fixes can run in
  parallel
- **Sequential Phase 4**: Accessibility fixes run after components are working
- **Iterative Validation**: Test after each phase, adjust if needed

### Execution Timeline

```
Phase 1: Investigation (Parallel) - 6 agents
  ├─ Navigation routing (Task 1.1)
  ├─ Search modal (Task 2.1)
  ├─ Settings (Task 3.1)
  ├─ Plot Engine (Task 4.1)
  ├─ World Building (Task 5.1)
  └─ Accessibility audit (Task 6.1)
  Quality Gate: All investigations complete, issues documented

Phase 2: Navigation Fixes (Sequential) - Critical Path
  └─ Fix all routes (Tasks 1.2-1.6)
  Quality Gate: Navigation tests pass, routes accessible

Phase 3: Component Fixes (Parallel) - 3 agents
  ├─ Search modal fixes (Tasks 2.2-2.6)
  ├─ Settings fixes (Tasks 3.2-3.5)
  └─ Plot Engine fixes (Tasks 4.2-4.7)
  └─ World Building fixes (Tasks 5.2-5.3)
  Quality Gate: Component-specific tests pass

Phase 4: Accessibility Fixes (Parallel) - 10 subtasks
  └─ Global accessibility (Tasks 6.2-6.10)
  Quality Gate: Accessibility tests pass

Phase 5: Final Validation
  └─ Run full E2E suite
  Quality Gate: 204/204 tests pass, 0 skipped
```

---

## Phase 4: Agent Assignment

| Agent Type                   | Tasks Assigned                                                                                      | Capabilities Needed                |
| ---------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------- |
| **Explore (x6)**             | 1.1, 2.1, 3.1, 4.1, 5.1, 6.1                                                                        | Codebase navigation, documentation |
| **debugger (x4)**            | 1.2, 1.3, 1.4, 2.2, 3.3, 4.3, 5.3                                                                   | Issue diagnosis, verification      |
| **feature-implementer (x5)** | 1.5, 1.6, 2.3, 2.4, 2.5, 2.6, 3.2, 3.4, 3.5, 4.2, 4.4, 4.5, 4.6, 4.7, 5.2, 6.3, 6.4, 6.7, 6.9, 6.10 | Feature implementation, bug fixes  |
| **refactorer (x3)**          | 6.2, 6.5, 6.6, 6.8                                                                                  | Code improvements, style fixes     |
| **code-reviewer (x1)**       | 6.1, Phase 5 validation                                                                             | Quality assurance, compliance      |
| **test-runner (x1)**         | After each phase                                                                                    | Test execution, validation         |

---

## Phase 5: Detailed Execution Plan

### **PHASE 1: INVESTIGATION** (Parallel - 6 Agents)

**Objective**: Understand current state, identify root causes

**Agents**:

1. **Explore Agent A** → Task 1.1: Investigate router configuration
2. **Explore Agent B** → Task 2.1: Investigate SearchModal component
3. **Explore Agent C** → Task 3.1: Investigate SettingsView component
4. **Explore Agent D** → Task 4.1: Investigate PlotEngineDashboard component
5. **Explore Agent E** → Task 5.1: Investigate WorldBuilding components
6. **code-reviewer** → Task 6.1: Audit accessibility implementation

**Quality Gate 1**:

- [ ] All component locations documented
- [ ] Router configuration understood
- [ ] Accessibility issues catalogued
- [ ] Root causes identified for each failure

**Estimated Duration**: 10-15 minutes (parallel)

---

### **PHASE 2: NAVIGATION FIXES** (Sequential - Critical Path)

**Objective**: Fix all routing and navigation issues

**Tasks** (Sequential execution):

1. **debugger** → Tasks 1.2, 1.3, 1.4: Verify all routes exist
2. **feature-implementer** → Task 1.5: Fix missing/broken routes
3. **feature-implementer** → Task 1.6: Add data-testid to navigation

**Quality Gate 2**:

- [ ] All routes registered and accessible
- [ ] Navigation elements have data-testid
- [ ] Manual navigation test successful
- [ ] Run: `npx playwright test tests/specs/settings.spec.ts:18` (Settings
      access test)
- [ ] Test PASSES

**Estimated Duration**: 15-20 minutes

---

### **PHASE 3A: SEMANTIC SEARCH FIXES** (Sequential)

**Objective**: Fix search modal functionality

**Tasks**:

1. **debugger** → Task 2.2: Debug keyboard shortcut handler
2. **feature-implementer** → Tasks 2.3, 2.4, 2.5 (parallel): Fix shortcuts,
   state, Escape
3. **feature-implementer** → Task 2.6: Add ARIA labels

**Quality Gate 3A**:

- [ ] Cmd+K / Ctrl+K opens modal
- [ ] Escape closes modal
- [ ] Modal has proper accessibility attributes
- [ ] Run: `npx playwright test tests/specs/semantic-search.spec.ts:19` (Modal
      open test)
- [ ] Test PASSES

**Estimated Duration**: 15 minutes

---

### **PHASE 3B: SETTINGS FIXES** (Sequential, depends on Phase 2)

**Objective**: Fix Settings panel

**Tasks**:

1. **feature-implementer** → Task 3.2: Fix Settings navigation access
2. **debugger** → Task 3.3: Verify sub-components render
3. **feature-implementer** → Tasks 3.4, 3.5 (parallel): Fix rendering, add
   accessibility

**Quality Gate 3B**:

- [ ] Settings view accessible via navigation
- [ ] All settings sections display
- [ ] Forms have proper labels
- [ ] Run: `npx playwright test tests/specs/settings.spec.ts` (first 3 tests)
- [ ] Tests PASS

**Estimated Duration**: 15 minutes

---

### **PHASE 3C: PLOT ENGINE FIXES** (Sequential, depends on Phase 2)

**Objective**: Fix Plot Engine Dashboard

**Tasks**:

1. **feature-implementer** → Task 4.2: Fix navigation access
2. **debugger** → Task 4.3: Verify component rendering
3. **feature-implementer** → Tasks 4.4, 4.5, 4.6 (parallel): Fix tabs, add
   testids, ARIA
4. **feature-implementer** → Task 4.7: Unskip accessibility tests

**Quality Gate 3C**:

- [ ] Plot Engine dashboard accessible
- [ ] Tabs work properly
- [ ] All elements have data-testid and ARIA labels
- [ ] Run: `npx playwright test tests/specs/plot-engine.spec.ts:18` (Dashboard
      display test)
- [ ] Test PASSES
- [ ] Accessibility tests unskipped and passing

**Estimated Duration**: 20 minutes

---

### **PHASE 3D: WORLD BUILDING FIXES** (Sequential, depends on Phase 2)

**Objective**: Fix World Building access

**Tasks**:

1. **feature-implementer** → Task 5.2: Fix navigation access
2. **debugger** → Task 5.3: Verify route works

**Quality Gate 3D**:

- [ ] World Building accessible via navigation
- [ ] Component renders properly
- [ ] Run: `npx playwright test tests/specs/world-building.spec.ts`
- [ ] Tests PASS

**Estimated Duration**: 10 minutes

**Note**: Phases 3A, 3B, 3C, 3D can run in PARALLEL after Phase 2 completes

---

### **PHASE 4: ACCESSIBILITY FIXES** (Parallel)

**Objective**: Achieve WCAG 2.1 AA compliance

**Tasks** (Parallel execution with 10 subtasks):

1. **refactorer A** → Task 6.2: Add ARIA labels globally
2. **feature-implementer A** → Task 6.3: Add landmark roles
3. **feature-implementer B** → Task 6.4: Implement skip links
4. **refactorer B** → Task 6.5: Fix focus indicators
5. **refactorer C** → Task 6.6: Fix color contrast
6. **feature-implementer C** → Task 6.7: Add ARIA live regions
7. **refactorer A** → Task 6.8: Fix heading hierarchy
8. **feature-implementer A** → Task 6.9: Add form labels
9. **feature-implementer D** → Task 6.10: Implement focus trap for modals

**Quality Gate 4**:

- [ ] All interactive elements have ARIA labels
- [ ] Landmark roles present (main, nav, banner)
- [ ] Skip links functional
- [ ] Focus visible on all elements
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] ARIA live regions announce changes
- [ ] Heading hierarchy logical (h1 → h2 → h3)
- [ ] All forms have labels
- [ ] Modals trap focus properly
- [ ] Run: `npx playwright test tests/specs/accessibility.spec.ts`
- [ ] ALL tests PASS

**Estimated Duration**: 25-30 minutes (parallel)

---

### **PHASE 5: FINAL VALIDATION**

**Objective**: Verify all 204 tests pass

**Tasks**:

1. **test-runner** → Run full E2E suite: `npm run test:e2e`
2. **code-reviewer** → Review results, ensure no regressions

**Success Criteria**:

- [ ] 204/204 tests PASSING
- [ ] 0 tests SKIPPED
- [ ] 0 tests FAILING
- [ ] All browsers: Chromium ✓, Firefox ✓, Webkit ✓
- [ ] No regressions in previously passing tests

**Quality Gate 5 (FINAL)**:

- [ ] Test report shows 100% pass rate
- [ ] Documentation updated (this plan marked complete)
- [ ] Changes committed with proper message

**Estimated Duration**: 10-15 minutes (full suite run)

---

## Phase 6: Execution Start

### Execution Order

**Wave 1: Investigation (Parallel)** - Launch now

- 6 Explore/review agents investigate simultaneously

**Wave 2: Navigation Fixes (Sequential)** - After Wave 1

- Fix critical path (routing) before proceeding

**Wave 3: Component Fixes (Parallel)** - After Wave 2

- 4 feature-implementer agents fix components simultaneously

**Wave 4: Accessibility (Parallel)** - After Wave 3

- 4-5 agents address accessibility in parallel

**Wave 5: Validation** - After Wave 4

- Final test run and verification

---

## Error Handling & Contingencies

### If Navigation Fixes Fail (Phase 2)

**Action**:

- Pause all subsequent phases
- Re-investigate router configuration
- Check for feature flags or conditional routing
- Manually test navigation in browser

### If Component Tests Still Fail (Phase 3)

**Action**:

- Check test selectors match actual component structure
- Verify mocks are configured correctly
- Run tests with Playwright headed mode for debugging
- Check for timing issues (add explicit waits)

### If Accessibility Tests Fail (Phase 4)

**Action**:

- Use axe-core automated testing
- Manually test with keyboard navigation
- Check browser accessibility inspector
- Validate ARIA attributes with ARIA validator

### If Final Tests Fail (Phase 5)

**Action**:

- Identify specific failing tests
- Re-run individual test suites
- Check for race conditions or timing issues
- Verify no conflicting changes

---

## Success Metrics

### Planning Quality

- [x] Clear decomposition into 50+ atomic tasks
- [x] Realistic time estimates (2-3 hours total)
- [x] Hybrid strategy with parallel optimization
- [x] Well-defined quality gates

### Execution Quality

- [ ] All quality gates passed
- [ ] No major re-work required
- [ ] Efficient parallel execution
- [ ] 100% test pass rate achieved

### Learning Outcomes

- [ ] Document what worked well
- [ ] Identify improvement areas
- [ ] Update patterns for future use

---

## Monitoring & Progress Tracking

**Use TodoWrite to track progress through phases**:

- Phase 1: Investigation (6 tasks)
- Phase 2: Navigation (6 tasks)
- Phase 3A: Search (6 tasks)
- Phase 3B: Settings (5 tasks)
- Phase 3C: Plot Engine (7 tasks)
- Phase 3D: World Building (3 tasks)
- Phase 4: Accessibility (10 tasks)
- Phase 5: Validation (1 task)

**Total**: 44 atomic tasks

---

## Next Action

**COMMENCE PHASE 1: INVESTIGATION**

Launch 6 parallel agents to investigate all failing test suites simultaneously.
This maximizes efficiency and provides comprehensive understanding before making
changes.

**Command**: Execute Phase 1 investigation agents

---

**Plan Status**: READY TO EXECUTE **Expected Completion**: 2-3 hours **Final
Goal**: 204/204 E2E tests passing, 0 skipped ✓
