# GOAP Implementation Plan - AI Plot Engine Completion
**Date**: January 9, 2026
**Status**: 🚀 EXECUTING
**Strategy**: HYBRID (Sequential → Parallel → Iterative)
**Estimated Duration**: 3-4 days
**Branch**: `feature/automated-implementation-1767939495`

---

## Executive Summary

**Primary Goal**: Complete all pending AI Plot Engine tasks with zero errors/warnings

**Key Challenges**:
- plotGenerationService.ts is 1061 LOC (461 over limit) - MUST refactor first
- AI Gateway integration requires latest best practices research
- Complex dependencies between tasks
- Deployment requires staging environment

**Approach**: Hybrid execution with 4 phases:
1. **Phase 1 (Sequential)**: Refactor plotGenerationService.ts into modules
2. **Phase 2 (Sequential → Parallel)**: AI Gateway integration and features
3. **Phase 3 (Parallel)**: RAG integration + Testing + Documentation
4. **Phase 4 (Iterative)**: Testing cycle for deployment readiness

---

## Task Inventory

### ✅ Completed (42/51 tasks from TODO list)
- Plot analysis services
- Plot storage with Turso
- UI components (all tabs)
- Performance optimization
- Testing infrastructure
- Documentation (guides, deployment, monitoring, troubleshooting)

### 🚧 Pending (9 tasks)

#### High Priority - Code Implementation (P0)
1. **TASK-001**: Integrate PlotGenerationService with API Gateway ⚠️ BLOCKED by refactoring
2. **TASK-002**: Replace static templates with AI-powered generation ⚠️ BLOCKED by TASK-001
3. **TASK-003**: Implement model selection logic ⚠️ BLOCKED by TASK-001
4. **TASK-004**: Add error handling and retry mechanism ⚠️ BLOCKED by TASK-001
5. **TASK-006**: Connect to RAG service for context retrieval 🟢 READY

#### Medium Priority - Deployment & Polish (P1-P2)
6. **TASK-039**: Add inline help text and tooltips (DEFERRED - optional)
7. **TASK-041**: Deploy beta to staging environment
8. **TASK-043**: Test with real user scenarios (depends on TASK-041)
9. **TASK-044**: Fix critical bugs from beta (depends on TASK-043)
10. **TASK-045**: Address beta feedback (depends on TASK-043)
11. **TASK-047**: Production deployment with monitoring

---

## GOAP Analysis

### Complexity Assessment
- **Level**: VERY HIGH
- **Reasons**:
  - Large file refactoring (1061 LOC → 7 modules)
  - AI integration requires research (latest patterns)
  - Multiple P0 tasks with dependencies
  - Quality gates at every phase
  - Deployment infrastructure needed

### Dependency Graph
```
Phase 1: REFACTOR-001 (Refactor plotGenerationService)
           ↓
Phase 2: TASK-001 (AI Gateway Integration) [REQUIRES: web search for best practices]
           ↓
           ├─→ TASK-002 (AI-powered generation)
           ├─→ TASK-003 (Model selection)
           └─→ TASK-004 (Error handling)
           ↓
Phase 3: TASK-006 (RAG integration) [PARALLEL with testing]
           ↓
Phase 4: Testing Loop (ITERATIVE until all pass)
           ↓
Phase 5: Deployment (TASK-041 → TASK-043 → TASK-044/045 → TASK-047)
```

### Resource Allocation
- **Agents Available**: 8 specialized agents
- **Agents Needed**: 6 (refactorer, feature-implementer x2, test-runner, code-reviewer, debugger)
- **Execution Time**: ~3-4 days with quality gates

---

## Phase 1: Refactoring plotGenerationService.ts

**Strategy**: Sequential (blocking all other work)
**Agent**: `refactorer`
**Duration**: 4-6 hours
**Priority**: P0 (BLOCKING)

### Objective
Split `plotGenerationService.ts` (1061 LOC) into 7 focused modules per FILE-SIZE-VIOLATIONS.md plan.

### Tasks

#### REFACTOR-001: Create Modular Structure
**Module Split Plan** (from FILE-SIZE-VIOLATIONS.md):
1. `plot-generation-utils.ts` (~120 LOC) - Utility functions, retry logic
2. `plot-context-retrieval.ts` (~150 LOC) - RAG context gathering
3. `plot-prompt-builder.ts` (~180 LOC) - AI prompt construction
4. `plot-response-parser.ts` (~140 LOC) - Response parsing, validation
5. `plot-suggestions-generator.ts` (~160 LOC) - Suggestion generation
6. `plot-template-generator.ts` (~150 LOC) - Template structures
7. `plotGenerationService.ts` (~350 LOC) - Main orchestrator

**Acceptance Criteria**:
- ✅ All 7 modules created with clear separation of concerns
- ✅ Main service is ~350 LOC (down from 1061)
- ✅ All tests pass (no regressions)
- ✅ Zero lint errors, zero TypeScript errors
- ✅ All modules properly exported and imported
- ✅ Build succeeds

### Quality Gate 1: Refactoring Complete
**Validation**:
```bash
# File size check
npm run check:file-size

# Type checking
npm run lint:ci

# Tests
npm run test

# Build
npm run build
```

**Exit Criteria**:
- ✅ plotGenerationService.ts ≤ 600 LOC
- ✅ All modules < 600 LOC
- ✅ 0 lint errors, 0 lint warnings
- ✅ 0 TypeScript errors
- ✅ All tests passing (no regressions)
- ✅ Build successful

**On Success**: Proceed to Phase 2
**On Failure**: debugger agent diagnoses and fixes, return to refactorer

### Git Operation
```bash
git add src/features/plot-engine/services/plot-*.ts
git commit -m "refactor(plot-engine): split plotGenerationService into 7 focused modules

- Created plot-generation-utils.ts (utilities, retry logic)
- Created plot-context-retrieval.ts (RAG context gathering)
- Created plot-prompt-builder.ts (AI prompt construction)
- Created plot-response-parser.ts (response parsing, validation)
- Created plot-suggestions-generator.ts (suggestion generation)
- Created plot-template-generator.ts (template structures)
- Reduced main service from 1061 LOC to ~350 LOC

All modules under 600 LOC limit, all tests passing.

Task: REFACTOR-001
Source: plans/FILE-SIZE-VIOLATIONS.md
Verified by: analysis-swarm

Co-authored-by: goap-orchestrator"
```

---

## Phase 2: AI Gateway Integration

**Strategy**: Sequential (TASK-001) → Parallel (TASK-002, TASK-003, TASK-004)
**Agents**: feature-implementer x3, test-runner
**Duration**: 1.5-2 days
**Priority**: P0

### Pre-Phase: Research Best Practices

#### RESEARCH-001: AI Gateway Integration Patterns
**Agent**: `gemini-websearch` skill
**Duration**: 30 minutes
**Query Topics**:
1. "OpenRouter API integration best practices 2026"
2. "AI model selection strategies OpenAI Claude GPT-4 2026"
3. "Error handling retry logic AI API calls 2026"
4. "Rate limiting AI gateway integration patterns 2026"

**Deliverables**: Best practices document for Phase 2 implementation

### Task 2.1: TASK-001 - AI Gateway Integration

**Agent**: feature-implementer-01
**Duration**: 4 hours
**Files**:
- `src/features/plot-engine/services/plotGenerationService.ts` (orchestrator)
- `src/features/plot-engine/services/plot-prompt-builder.ts` (prompt construction)
- New: `src/features/plot-engine/services/ai-gateway-client.ts` (optional abstraction)

**Implementation Steps**:
1. Create AI Gateway client abstraction (if needed)
2. Update plotGenerationService to call `/api/ai/generate`
3. Remove static template fallback (or keep as backup)
4. Configure default model selection
5. Add basic error handling

**Acceptance Criteria**:
- ✅ Service calls `/api/ai/generate` endpoint
- ✅ Requests include proper headers (API key, model)
- ✅ Responses are properly typed
- ✅ Basic error handling in place
- ✅ Unit tests for gateway client
- ✅ Integration test with mocked gateway

**Quality Gate 2.1**: AI Gateway Connected
- ✅ Service successfully calls gateway (mocked)
- ✅ Tests pass
- ✅ No lint/TypeScript errors

### Task 2.2: TASK-002 - AI-Powered Plot Generation (PARALLEL)

**Agent**: feature-implementer-02
**Duration**: 6 hours (starts after TASK-001 completes)
**Files**:
- `src/features/plot-engine/services/plot-prompt-builder.ts`
- `src/features/plot-engine/services/plot-response-parser.ts`
- `src/features/plot-engine/services/plotGenerationService.ts`

**Implementation Steps**:
1. Design AI prompts for plot generation
   - Story arc prompts
   - Character development prompts
   - Conflict/resolution prompts
2. Implement prompt templates with variable injection
3. Parse AI responses into structured plot data
4. Validate AI-generated plots for coherence
5. Add fallback to templates if AI fails

**Acceptance Criteria**:
- ✅ AI generates coherent 3-act story structures
- ✅ Generated plots include: setup, conflict, climax, resolution
- ✅ Variety in generated plots (not repetitive)
- ✅ Fallback to templates on AI failure
- ✅ Unit tests for prompt building and parsing
- ✅ Integration tests with sample AI responses

**Quality Gate 2.2**: AI Generation Works
- ✅ AI generates valid plot structures
- ✅ Plots pass validation
- ✅ Tests pass

### Task 2.3: TASK-003 - Model Selection Logic (PARALLEL)

**Agent**: feature-implementer-03
**Duration**: 3 hours (starts after TASK-001 completes)
**Files**:
- New: `src/features/plot-engine/services/model-selector.ts`
- `src/features/plot-engine/services/plotGenerationService.ts`

**Implementation Steps**:
1. Create model selection service
2. Define model capabilities matrix:
   - GPT-4: Complex plots, detailed world-building
   - GPT-3.5-turbo: Quick suggestions, simple structures
   - Claude: Character-focused, nuanced dialogue
3. Implement selection algorithm based on:
   - Task complexity
   - Project size
   - User preferences (settings)
   - Cost optimization
4. Add model override option

**Acceptance Criteria**:
- ✅ Auto-selects appropriate model based on task
- ✅ Supports manual model override
- ✅ Falls back to GPT-3.5-turbo on failure
- ✅ Logs model selection decisions
- ✅ Unit tests for selection logic

**Quality Gate 2.3**: Model Selection Works
- ✅ Correct model selected for different scenarios
- ✅ Tests pass

### Task 2.4: TASK-004 - Error Handling & Retry (PARALLEL)

**Agent**: feature-implementer-02 (after TASK-002)
**Duration**: 4 hours
**Files**:
- `src/features/plot-engine/services/plot-generation-utils.ts`
- `src/features/plot-engine/services/plotGenerationService.ts`

**Implementation Steps**:
1. Implement exponential backoff retry logic
2. Handle specific AI Gateway errors:
   - Rate limits (429) → wait and retry
   - Server errors (500-599) → retry with backoff
   - Auth errors (401, 403) → fail fast with message
   - Timeout → retry once, then fail
3. Add circuit breaker pattern (optional)
4. User-friendly error messages
5. Error logging with context

**Acceptance Criteria**:
- ✅ Retries on transient failures (max 3 attempts)
- ✅ Exponential backoff (1s, 2s, 4s)
- ✅ Fails gracefully without crashing UI
- ✅ User sees clear error messages
- ✅ Errors logged with context
- ✅ Unit tests for retry logic
- ✅ Integration tests for error scenarios

**Quality Gate 2.4**: Error Handling Robust
- ✅ Service handles all error types gracefully
- ✅ Retries work correctly
- ✅ Tests pass (including error scenarios)

### Overall Phase 2 Quality Gate
**Validation**:
```bash
# All Phase 2 tests
npm run test -- src/features/plot-engine/services/__tests__/plotGenerationService
npm run test -- src/features/plot-engine/services/__tests__/model-selector
npm run test -- src/features/plot-engine/services/__tests__/ai-gateway

# Integration tests
npm run test -- src/features/plot-engine/services/__tests__/plotGenerationService.integration.test.ts

# Type checking
npm run lint:ci

# Build
npm run build
```

**Exit Criteria**:
- ✅ All TASK-001 through TASK-004 complete
- ✅ AI Gateway integration working
- ✅ AI-powered plot generation functional
- ✅ Model selection operational
- ✅ Error handling robust
- ✅ All tests passing (unit + integration)
- ✅ 0 lint errors, 0 TypeScript errors
- ✅ Build successful

**On Success**: Proceed to Phase 3
**On Failure**: debugger agent diagnoses, appropriate agent fixes

### Git Operations (4 atomic commits)
```bash
# Commit 1: TASK-001
git add src/features/plot-engine/services/ai-gateway-client.ts
git add src/features/plot-engine/services/plotGenerationService.ts
git commit -m "feat(plot-engine): integrate AI Gateway for plot generation

- Added AI Gateway client abstraction
- Updated plotGenerationService to use /api/ai/generate
- Configured default model selection
- Added basic error handling

Task: TASK-001
Tests: ✓ passing
Lint: ✓ 0 errors
Build: ✓ success

Co-authored-by: goap-orchestrator"

# Commit 2: TASK-002
git add src/features/plot-engine/services/plot-prompt-builder.ts
git add src/features/plot-engine/services/plot-response-parser.ts
git commit -m "feat(plot-engine): implement AI-powered plot generation

- Designed AI prompts for story arc generation
- Implemented structured plot response parsing
- Added validation for AI-generated plots
- Fallback to templates on AI failure

Task: TASK-002
Tests: ✓ passing
Lint: ✓ 0 errors

Co-authored-by: goap-orchestrator"

# Commit 3: TASK-003
git add src/features/plot-engine/services/model-selector.ts
git commit -m "feat(plot-engine): add intelligent model selection

- Created model selection service with capability matrix
- Selects optimal model based on task complexity
- Supports manual override and cost optimization
- Logs selection decisions

Task: TASK-003
Tests: ✓ passing
Lint: ✓ 0 errors

Co-authored-by: goap-orchestrator"

# Commit 4: TASK-004
git add src/features/plot-engine/services/plot-generation-utils.ts
git commit -m "feat(plot-engine): add robust error handling and retry logic

- Implemented exponential backoff retry (max 3 attempts)
- Handles rate limits, server errors, timeouts
- User-friendly error messages
- Error logging with context

Task: TASK-004
Tests: ✓ passing (including error scenarios)
Lint: ✓ 0 errors
Build: ✓ success

Co-authored-by: goap-orchestrator"
```

---

## Phase 3: RAG Integration + Testing

**Strategy**: Parallel
**Agents**: feature-implementer-01, test-runner, code-reviewer
**Duration**: 1 day
**Priority**: P1

### Task 3.1: TASK-006 - RAG Context Retrieval

**Agent**: feature-implementer-01
**Duration**: 4 hours
**Files**:
- `src/features/plot-engine/services/plot-context-retrieval.ts` (already created in Phase 1)
- `src/features/plot-engine/services/plotGenerationService.ts`

**Implementation Steps**:
1. Integrate with existing RAG service (from RAG Phase 3)
2. Retrieve project context:
   - Character profiles
   - Existing chapters
   - World-building details
   - Genre/theme information
3. Assemble context for AI prompts
4. Add context caching (avoid redundant queries)
5. Handle missing context gracefully

**Acceptance Criteria**:
- ✅ Retrieves relevant project context from RAG
- ✅ Context integrated into AI prompts
- ✅ AI suggestions reference existing characters/plot points
- ✅ Context retrieval cached appropriately
- ✅ Unit tests for context assembly
- ✅ Integration tests with RAG service

**Quality Gate 3.1**: RAG Integration Works
- ✅ Context successfully retrieved
- ✅ AI prompts include project context
- ✅ Tests pass

### Task 3.2: Comprehensive Testing (PARALLEL)

**Agent**: test-runner
**Duration**: 4 hours
**Focus**:
- Integration tests for all AI features
- E2E tests for plot generation workflows
- Performance tests (response times)
- Error scenario tests

**Test Suites**:
1. AI Gateway integration tests
2. Plot generation end-to-end tests
3. Model selection tests
4. Error handling tests
5. RAG integration tests

**Quality Gate 3.2**: All Tests Pass
- ✅ Unit tests: 100% passing
- ✅ Integration tests: All passing
- ✅ E2E tests: All critical workflows covered
- ✅ Performance: <3s for plot generation

### Task 3.3: Code Review (PARALLEL)

**Agent**: code-reviewer (analysis-swarm)
**Duration**: 2 hours
**Review Focus**:
- Code quality and maintainability
- Security (API key handling, input validation)
- Performance (caching, unnecessary requests)
- Error handling completeness
- Documentation clarity

**Quality Gate 3.3**: Code Review Approved
- ✅ No critical issues found
- ✅ Best practices followed
- ✅ Documentation complete
- ✅ Ready for deployment

### Overall Phase 3 Quality Gate
**Exit Criteria**:
- ✅ RAG integration complete (TASK-006)
- ✅ All tests passing
- ✅ Code review approved
- ✅ Performance targets met

**On Success**: Proceed to Phase 4
**On Failure**: Appropriate agent fixes issues, re-validate

### Git Operations
```bash
# Commit 5: TASK-006
git add src/features/plot-engine/services/plot-context-retrieval.ts
git commit -m "feat(plot-engine): integrate RAG service for context-aware generation

- Connected to RAG service for project context
- Retrieves characters, chapters, world-building details
- Assembles context for AI prompts
- Added context caching to optimize performance

Task: TASK-006
Tests: ✓ passing (including RAG integration)
Lint: ✓ 0 errors
Build: ✓ success
Verified by: analysis-swarm

Co-authored-by: goap-orchestrator"

# Update plan files ONLY after code-reviewer approval
git add plans/AI-PLOT-ENGINE-TODO-LIST-JAN2026.md
git commit -m "docs(plans): mark TASK-001 through TASK-006 complete

All AI integration tasks complete:
- [x] TASK-001: AI Gateway integration
- [x] TASK-002: AI-powered generation
- [x] TASK-003: Model selection
- [x] TASK-004: Error handling
- [x] TASK-006: RAG integration

43/51 tasks complete (84%)

Co-authored-by: goap-orchestrator"
```

---

## Phase 4: Testing Loop (Iterative)

**Strategy**: Iterative (loop until all pass)
**Agents**: test-runner, debugger, refactorer
**Duration**: 0.5-1 day
**Priority**: P0

### Iteration Cycle
```
1. RUN: test-runner → Execute full test suite
2. ANALYZE: If failures → debugger diagnoses
3. FIX: refactorer or feature-implementer fixes
4. VALIDATE: Re-run tests
5. REPEAT until: All tests pass OR max 3 iterations
```

### Test Categories
1. **Unit Tests**: All plot-engine services
2. **Integration Tests**: AI Gateway + RAG + Storage
3. **E2E Tests**: Complete plot generation workflows
4. **Performance Tests**: Response times, memory usage
5. **Regression Tests**: Ensure no breakage of existing features

### Quality Gate 4: Ready for Deployment
**Exit Criteria**:
- ✅ 100% unit tests passing
- ✅ 100% integration tests passing
- ✅ All E2E tests passing
- ✅ Performance benchmarks met (<3s for 50k words)
- ✅ 0 lint errors, 0 lint warnings
- ✅ 0 TypeScript errors
- ✅ Build successful
- ✅ No regressions in existing features

**Max Iterations**: 3
**On Success**: Proceed to Phase 5 (Deployment)
**On Max Iterations**: Report blockers to user

---

## Phase 5: Deployment & Beta Testing

**Strategy**: Sequential (staged deployment)
**Agents**: Manual + monitoring
**Duration**: Variable (depends on beta testing)
**Priority**: P0

### Task 5.1: TASK-041 - Deploy Beta to Staging

**Prerequisites**:
- Vercel project configured
- Environment variables set
- Database migrations applied

**Steps**:
1. Push to staging branch
2. Trigger Vercel deployment
3. Run smoke tests on staging
4. Verify AI Gateway connectivity
5. Test core workflows manually

**Acceptance Criteria**:
- ✅ Staging deployment successful
- ✅ All features accessible
- ✅ No critical errors in logs

### Task 5.2: TASK-043 - Real User Testing

**Duration**: 1-2 days
**Scenarios** (from PLOT-ENGINE-BETA-TESTING-PLAN.md):
1. New user onboarding
2. Plot generation from scratch
3. AI-powered plot suggestions
4. RAG-assisted context
5. Character relationship mapping
6. Plot hole detection
7. Story arc visualization
8. Export and integration

**Success Metrics**:
- User feedback collected
- Critical bugs identified
- Feature usability validated

### Task 5.3: TASK-044 - Fix Critical Bugs

**Strategy**: Iterative
**Agents**: debugger, feature-implementer, test-runner

**Process**:
1. Triage bugs by severity (P0, P1, P2)
2. Fix P0 bugs immediately
3. Re-deploy to staging
4. Re-test affected workflows
5. Repeat until no P0 bugs remain

### Task 5.4: TASK-045 - Address Beta Feedback

**Strategy**: Sequential
**Focus**: UX improvements, edge cases, documentation

**Process**:
1. Analyze feedback themes
2. Prioritize improvements
3. Implement high-value changes
4. Update documentation
5. Deploy to staging
6. Collect follow-up feedback

### Task 5.5: TASK-047 - Production Deployment

**Prerequisites**:
- All P0 bugs fixed
- Beta testing complete
- Monitoring configured
- Rollback plan ready

**Steps**:
1. Merge to main branch
2. Tag release (v1.0.0)
3. Deploy to production
4. Monitor metrics (response times, error rates)
5. Verify user workflows
6. Announce feature launch

**Quality Gate 5**: Production Deployed
- ✅ Production deployment successful
- ✅ Monitoring active
- ✅ No critical errors
- ✅ User workflows functional

---

## Risk Mitigation

### Risk 1: Refactoring Breaks Tests
**Likelihood**: Medium
**Impact**: High
**Mitigation**:
- Run tests after each module extraction
- Maintain backward compatibility during refactor
- Use debugger agent immediately on test failures

### Risk 2: AI Gateway Rate Limits
**Likelihood**: Medium
**Impact**: Medium
**Mitigation**:
- Implement robust retry logic (Phase 2)
- Add circuit breaker pattern
- Fall back to templates on repeated failures

### Risk 3: RAG Integration Issues
**Likelihood**: Low (RAG already implemented)
**Impact**: Medium
**Mitigation**:
- Use existing RAG service (proven working)
- Add comprehensive error handling
- Cache context to reduce RAG calls

### Risk 4: Performance Degradation
**Likelihood**: Medium
**Impact**: High
**Mitigation**:
- Performance tests in Phase 3
- Profile AI response times
- Optimize prompt sizes
- Add request caching

### Risk 5: Staging Environment Issues
**Likelihood**: Medium
**Impact**: High
**Mitigation**:
- Verify Vercel configuration early
- Test deployment process before Phase 5
- Prepare rollback plan
- Have fallback to local testing

---

## Success Criteria (Overall)

### Technical Metrics
- ✅ All 9 pending tasks complete
- ✅ plotGenerationService.ts ≤ 600 LOC
- ✅ All modules < 600 LOC
- ✅ 0 lint errors, 0 lint warnings
- ✅ 0 TypeScript errors
- ✅ 100% tests passing (unit + integration + E2E)
- ✅ Build successful
- ✅ Performance targets met (<3s for plot generation)

### Feature Metrics
- ✅ AI Gateway integration working
- ✅ AI generates coherent plots
- ✅ Model selection operational
- ✅ Error handling robust (no crashes)
- ✅ RAG context integrated
- ✅ User workflows functional

### Deployment Metrics
- ✅ Beta deployed to staging
- ✅ User feedback collected
- ✅ Critical bugs fixed
- ✅ Production deployed with monitoring

---

## Timeline Estimate

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Phase 1: Refactoring | 4-6 hours | Day 1 |
| Phase 2: AI Integration | 1.5-2 days | Day 2-3 |
| Phase 3: RAG + Testing | 1 day | Day 3-4 |
| Phase 4: Testing Loop | 0.5-1 day | Day 4 |
| Phase 5: Deployment | Variable (2-3 days) | Day 5-7 |

**Total**: 3-4 days (code) + 2-3 days (deployment/testing) = **5-7 days**

---

## Monitoring & Reporting

### Progress Tracking
- Update this plan after each phase completion
- Log all git commits with task references
- Track quality gate results
- Document any deviations from plan

### Reporting Cadence
- **After each phase**: Summary report
- **Daily**: Progress update
- **On completion**: Final summary report

---

## Next Steps

1. ✅ GOAP plan created and documented
2. 🚀 **BEGIN EXECUTION**: Launch refactorer agent for Phase 1
3. Monitor progress and adjust as needed
4. Report back to user on completion

---

**Plan Status**: READY FOR EXECUTION
**First Action**: Launch refactorer agent with REFACTOR-001 task
**Expected Completion**: January 12-16, 2026
