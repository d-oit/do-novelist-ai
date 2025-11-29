# GOAP Plan: Vercel AI Gateway Migration

**Date:** 2025-11-29
**Branch:** feature/vercel-ai-gateway-migration-1764430608
**Strategy:** Hybrid (Sequential setup → Parallel implementation → Sequential integration)
**Estimated Duration:** 1-2 weeks

---

## Phase 1: ANALYZE - Task Analysis

### Primary Goal
Migrate do-novelist-ai from direct Google Gemini API integration to Vercel AI Gateway, enabling multi-provider support (8+ providers, 100+ models) with user-selectable AI providers, automatic fallbacks, cost optimization, and preference persistence in Turso DB.

### Constraints
- **Time**: Normal (1-2 weeks acceptable)
- **Resources**: Multiple specialized agents available
- **Dependencies**: Existing Gemini integration must remain functional during migration
- **Quality**: Zero test failures, zero TypeScript errors, production-ready code

### Complexity Level
**Complex**:
- 4+ agents required (feature-implementer, test-runner, code-reviewer, debugger)
- Multiple execution modes (parallel + sequential)
- Database schema changes
- API migration across 10+ files
- UI component development
- Comprehensive testing required

### Quality Requirements
- **Testing**: All 458 unit tests must pass + new tests for AI Gateway
- **Standards**: AGENTS.md compliance, TypeScript strict mode
- **Documentation**: Updated API docs, migration guide
- **Performance**: No degradation in response times
- **Build**: Zero TypeScript errors, successful production build

### Success Criteria
- [ ] Vercel AI SDK integrated and working
- [ ] Database schema created and tested
- [ ] All Gemini API calls migrated to AI Gateway
- [ ] User can select from 8+ providers and 100+ models
- [ ] Automatic fallbacks working
- [ ] Preferences persist in Turso DB
- [ ] All tests passing (458/458 unit tests + new tests)
- [ ] Zero TypeScript errors
- [ ] Production build successful
- [ ] Documentation complete

---

## Phase 2: DECOMPOSE - Task Breakdown

### Main Goal Components

1. **Infrastructure Setup** (P0) - Sequential
2. **Database Layer** (P0) - Sequential
3. **Core Services** (P1) - Parallel
4. **UI Components** (P1) - Parallel
5. **Migration & Integration** (P2) - Sequential
6. **Testing & Validation** (P2) - Sequential
7. **Documentation** (P3) - Parallel

### Atomic Tasks with Dependencies

#### Component 1: Infrastructure Setup (P0)
- **Task 1.1**: Install Vercel AI SDK packages (Agent: feature-implementer, Deps: none)
- **Task 1.2**: Update environment variables schema (Agent: feature-implementer, Deps: 1.1)
- **Task 1.3**: Configure TypeScript types (Agent: feature-implementer, Deps: 1.2)
- **Quality Gate**: Build succeeds, no errors

#### Component 2: Database Layer (P0)
- **Task 2.1**: Create AI provider preferences schema (Agent: feature-implementer, Deps: 1.3)
- **Task 2.2**: Create provider capabilities table (Agent: feature-implementer, Deps: 2.1)
- **Task 2.3**: Create usage analytics table (Agent: feature-implementer, Deps: 2.1)
- **Task 2.4**: Implement database service layer (Agent: feature-implementer, Deps: 2.2, 2.3)
- **Task 2.5**: Write database tests (Agent: test-runner, Deps: 2.4)
- **Quality Gate**: Database tests passing

#### Component 3: Core Services (P1)
- **Task 3.1**: Implement AI Gateway service (Agent: feature-implementer-A, Deps: 2.4)
- **Task 3.2**: Implement provider config manager (Agent: feature-implementer-B, Deps: 2.4)
- **Task 3.3**: Implement cost optimizer (Agent: feature-implementer-C, Deps: 2.4)
- **Task 3.4**: Write service tests (Agent: test-runner, Deps: 3.1, 3.2, 3.3)
- **Quality Gate**: Service tests passing

#### Component 4: UI Components (P1)
- **Task 4.1**: Build ProviderSelector component (Agent: feature-implementer-D, Deps: 3.2)
- **Task 4.2**: Build AISettings component (Agent: feature-implementer-E, Deps: 3.2)
- **Task 4.3**: Build UsageAnalytics component (Agent: feature-implementer-F, Deps: 3.3)
- **Task 4.4**: Write component tests (Agent: test-runner, Deps: 4.1, 4.2, 4.3)
- **Quality Gate**: Component tests passing

#### Component 5: Migration & Integration (P2)
- **Task 5.1**: Migrate gemini.ts to ai-gateway.ts (Agent: feature-implementer, Deps: 3.1)
- **Task 5.2**: Update all import statements (Agent: refactorer, Deps: 5.1)
- **Task 5.3**: Update writing assistant service (Agent: feature-implementer, Deps: 5.2)
- **Task 5.4**: Integration testing (Agent: test-runner, Deps: 5.3)
- **Quality Gate**: All existing tests passing

#### Component 6: Testing & Validation (P2)
- **Task 6.1**: Run full unit test suite (Agent: test-runner, Deps: 5.4)
- **Task 6.2**: TypeScript strict mode check (Agent: refactorer, Deps: 5.4)
- **Task 6.3**: Production build verification (Agent: feature-implementer, Deps: 6.2)
- **Task 6.4**: Code review and quality audit (Agent: code-reviewer, Deps: 6.3)
- **Quality Gate**: All quality checks passing

#### Component 7: Documentation (P3)
- **Task 7.1**: Update API documentation (Agent: feature-implementer-G, Deps: 5.3)
- **Task 7.2**: Write migration guide (Agent: feature-implementer-H, Deps: 5.3)
- **Task 7.3**: Update README with new features (Agent: feature-implementer-I, Deps: 7.1)
- **Quality Gate**: Documentation complete and accurate

### Dependency Graph
```
Task 1.1 → 1.2 → 1.3
              ↓
Task 2.1 → 2.2, 2.3 → 2.4 → 2.5
                        ↓
              ┌─────────┴──────────┐
              ↓                    ↓
Task 3.1, 3.2, 3.3 (parallel) → 3.4
     ↓                            ↓
Task 4.1, 4.2, 4.3 (parallel) → 4.4
              ↓
Task 5.1 → 5.2 → 5.3 → 5.4
              ↓
Task 6.1 → 6.2 → 6.3 → 6.4
              ↓
Task 7.1, 7.2, 7.3 (parallel)
```

---

## Phase 3: STRATEGIZE - Execution Strategy

### Strategy: HYBRID

**Rationale**: The migration requires a mix of:
- **Sequential phases** for foundational work (infrastructure, database)
- **Parallel execution** for independent components (services, UI)
- **Sequential integration** for migration and validation

### Execution Pattern
```
Phase 1 (Sequential): Infrastructure Setup
  ↓
Phase 2 (Sequential): Database Layer
  ↓
Phase 3 (Parallel): Core Services [3 agents]
  ↓
Phase 4 (Parallel): UI Components [3 agents]
  ↓
Phase 5 (Sequential): Migration & Integration
  ↓
Phase 6 (Sequential): Testing & Validation
  ↓
Phase 7 (Parallel): Documentation [3 agents]
```

### Estimated Speedup
- Sequential only: ~20 days
- Hybrid approach: ~5-7 days (3-4x speedup)

---

## Phase 4: COORDINATE - Agent Assignment

### Agent Allocation

| Phase | Agent Type | Tasks | Parallel? |
|-------|-----------|-------|-----------|
| **Phase 1** | feature-implementer | 1.1, 1.2, 1.3 | No |
| **Phase 2** | feature-implementer + test-runner | 2.1-2.5 | No |
| **Phase 3** | feature-implementer-A,B,C + test-runner | 3.1-3.4 | Yes (3 parallel) |
| **Phase 4** | feature-implementer-D,E,F + test-runner | 4.1-4.4 | Yes (3 parallel) |
| **Phase 5** | feature-implementer + refactorer + test-runner | 5.1-5.4 | No |
| **Phase 6** | test-runner + refactorer + code-reviewer | 6.1-6.4 | No |
| **Phase 7** | feature-implementer-G,H,I | 7.1-7.3 | Yes (3 parallel) |

### Quality Gates per Phase
1. **Phase 1**: Build succeeds, no TypeScript errors
2. **Phase 2**: Database tests passing, schema validated
3. **Phase 3**: Service tests passing, integration tested
4. **Phase 4**: Component tests passing, UI functional
5. **Phase 5**: All 458 existing tests passing
6. **Phase 6**: Zero TypeScript errors, build success, code review approved
7. **Phase 7**: Documentation complete and accurate

---

## Phase 5: EXECUTE - Execution Plan

### Phase 1: Infrastructure Setup (Sequential)
**Duration**: 2-3 hours
**Agent**: feature-implementer

**Tasks**:
1. Install `ai`, `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google-generative-ai`
2. Update `package.json` and environment variable schema
3. Configure TypeScript types for new SDK

**Quality Gate**:
- ✅ `npm install` succeeds
- ✅ `npm run build` succeeds
- ✅ `npm run lint` shows 0 errors

**Deliverables**:
- Updated `package.json`
- Updated `.env.example` with new variables
- TypeScript configuration updated

---

### Phase 2: Database Layer (Sequential)
**Duration**: 4-6 hours
**Agent**: feature-implementer + test-runner

**Tasks**:
1. Create `src/lib/db/ai-config-schema.ts` with Turso DB schema
2. Create `src/lib/db/ai-config.ts` with database service
3. Implement CRUD operations for preferences, capabilities, analytics
4. Write comprehensive tests for database layer

**Quality Gate**:
- ✅ Database schema created successfully
- ✅ All database tests passing
- ✅ TypeScript types correct

**Deliverables**:
- `src/lib/db/ai-config-schema.ts`
- `src/lib/db/ai-config.ts`
- `src/lib/db/__tests__/ai-config.test.ts`

---

### Phase 3: Core Services (Parallel - 3 agents)
**Duration**: 6-8 hours
**Agents**: feature-implementer-A, feature-implementer-B, feature-implementer-C, test-runner

**Tasks**:
- **Agent A**: Implement `src/lib/ai-gateway.ts` (main service)
- **Agent B**: Implement `src/lib/ai-provider-config.ts` (config manager)
- **Agent C**: Implement `src/lib/ai-cost-optimizer.ts` (cost optimization)
- **test-runner**: Write tests for all services

**Quality Gate**:
- ✅ All service implementations complete
- ✅ Service tests passing
- ✅ Integration between services working

**Deliverables**:
- `src/lib/ai-gateway.ts`
- `src/lib/ai-provider-config.ts`
- `src/lib/ai-cost-optimizer.ts`
- `src/lib/__tests__/ai-gateway.test.ts`
- `src/lib/__tests__/ai-provider-config.test.ts`

---

### Phase 4: UI Components (Parallel - 3 agents)
**Duration**: 6-8 hours
**Agents**: feature-implementer-D, feature-implementer-E, feature-implementer-F, test-runner

**Tasks**:
- **Agent D**: Build `src/components/ai/ProviderSelector.tsx`
- **Agent E**: Build `src/components/ai/AISettings.tsx`
- **Agent F**: Build `src/components/ai/UsageAnalytics.tsx`
- **test-runner**: Write component tests

**Quality Gate**:
- ✅ All components functional
- ✅ Component tests passing
- ✅ UI follows AGENTS.md patterns

**Deliverables**:
- `src/components/ai/ProviderSelector.tsx`
- `src/components/ai/AISettings.tsx`
- `src/components/ai/UsageAnalytics.tsx`
- `src/components/ai/__tests__/ProviderSelector.test.tsx`
- `src/components/ai/__tests__/AISettings.test.tsx`

---

### Phase 5: Migration & Integration (Sequential)
**Duration**: 4-6 hours
**Agents**: feature-implementer, refactorer, test-runner

**Tasks**:
1. Create new `src/lib/ai.ts` using AI Gateway (replaces gemini.ts)
2. Update all imports from `gemini.ts` to `ai.ts`
3. Update writing assistant service to use new AI Gateway
4. Run integration tests

**Quality Gate**:
- ✅ All existing tests passing (458/458)
- ✅ No breaking changes
- ✅ Backwards compatibility maintained

**Deliverables**:
- `src/lib/ai.ts` (new)
- `src/lib/gemini.ts` (deprecated, kept for reference)
- Updated import statements across codebase

---

### Phase 6: Testing & Validation (Sequential)
**Duration**: 3-4 hours
**Agents**: test-runner, refactorer, code-reviewer

**Tasks**:
1. Run full unit test suite (`npm test`)
2. Run TypeScript check (`npm run lint`)
3. Run production build (`npm run build`)
4. Code review and quality audit

**Quality Gate**:
- ✅ 458/458 unit tests passing
- ✅ Zero TypeScript errors
- ✅ Production build successful
- ✅ Code review approved

**Deliverables**:
- Test results report
- Build verification
- Code review approval

---

### Phase 7: Documentation (Parallel - 3 agents)
**Duration**: 2-3 hours
**Agents**: feature-implementer-G, feature-implementer-H, feature-implementer-I

**Tasks**:
- **Agent G**: Update API documentation
- **Agent H**: Write migration guide
- **Agent I**: Update README with new features

**Quality Gate**:
- ✅ All documentation complete
- ✅ Examples working
- ✅ Migration guide accurate

**Deliverables**:
- Updated `docs/API.md`
- `docs/MIGRATION-GUIDE.md`
- Updated `README.md`

---

## Phase 6: SYNTHESIZE - Success Metrics

### Completion Checklist
- [ ] All 7 phases complete
- [ ] All quality gates passed
- [ ] 458/458 unit tests passing
- [ ] Zero TypeScript errors
- [ ] Production build successful
- [ ] Code review approved
- [ ] Documentation complete

### Performance Metrics
- **Parallel Speedup**: 3-4x (20 days → 5-7 days)
- **Test Coverage**: Maintain 100% (458/458 passing)
- **Quality**: Zero errors, zero warnings

### Risk Mitigation
- **If Phase 3 fails**: Retry with single agent (sequential)
- **If tests fail**: debugger agent investigates and fixes
- **If build fails**: refactorer agent fixes TypeScript issues
- **If quality gate fails**: Re-run phase with fixes

---

## Execution Timeline

| Phase | Duration | Start | End |
|-------|----------|-------|-----|
| Phase 1: Infrastructure | 2-3 hours | Day 1 AM | Day 1 AM |
| Phase 2: Database | 4-6 hours | Day 1 PM | Day 1 PM |
| Phase 3: Core Services | 6-8 hours | Day 2 AM | Day 2 PM |
| Phase 4: UI Components | 6-8 hours | Day 2 PM | Day 3 AM |
| Phase 5: Migration | 4-6 hours | Day 3 AM | Day 3 PM |
| Phase 6: Validation | 3-4 hours | Day 3 PM | Day 3 PM |
| Phase 7: Documentation | 2-3 hours | Day 4 AM | Day 4 AM |

**Total Estimated Duration**: 3-4 days (aggressive) or 5-7 days (comfortable)

---

## Next Steps

1. **Execute Phase 1**: Install Vercel AI SDK and dependencies
2. **Quality Gate Check**: Verify build succeeds
3. **Execute Phase 2**: Create database schema
4. **Quality Gate Check**: Verify database tests pass
5. **Continue sequentially** through all phases

---

**Plan Status**: ✅ READY FOR EXECUTION
**Confidence Level**: HIGH
**Risk Level**: LOW (comprehensive plan with quality gates)

*This GOAP plan provides a systematic, validated approach to migrating from Google Gemini API to Vercel AI Gateway with multi-provider support.*
