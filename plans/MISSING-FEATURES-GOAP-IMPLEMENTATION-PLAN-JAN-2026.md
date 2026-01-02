# Missing Features GOAP Implementation Plan - January 2026

**Date**: January 2, 2026 **Plan Type**: GOAP Multi-Phase Implementation
**Methodology**: Goal-Oriented Action Planning **Status**: Phase 0 (Planning)
**Priority**: P1 (Critical Security) + P2 (Strategic Features)

---

## Executive Summary

Based on analysis of `NEW-FEATURES-PLAN-JAN-2026.md`, several critical features
remain unimplemented. This GOAP plan provides systematic decomposition,
dependency mapping, and coordinated execution strategy for implementing missing
features.

**Current Status**: 60% complete (Foundation + Quick Wins mostly done)
**Missing**: Critical security hardening + Context Intelligence + AI Automation
phases

---

## Phase 1: ANALYZE - Task Analysis

### Primary Goal

Implement all missing features from NEW-FEATURES-PLAN-JAN-2026.md with focus on
critical security hardening first, followed by strategic features.

### Constraints

- **Time**: Security hardening is urgent (3-5 days), strategic features are
  flexible
- **Resources**: All development tools available, API keys configured
- **Dependencies**: Security hardening blocks production deployment
- **Quality**: Must maintain 80%+ test coverage, 0 lint warnings

### Complexity Level

**COMPLEX** - Multiple phases, mixed execution modes, 6+ distinct features
across 3 phases

### Missing Features Breakdown

#### ⚠️ **CRITICAL (Phase 1 Foundation)** - Blocks Production

1. **Phase 1.2: Security Hardening - Serverless API Gateway** (NOT STARTED)
   - **Risk**: API keys exposed in client builds
   - **Impact**: Security vulnerability, cost management impossible
   - **Effort**: 3-5 days
   - **Priority**: P0 (BLOCKING)

#### 📋 **NOT STARTED (Phase 3: Context Intelligence)**

2. **Phase 3.1: RAG Phase 1 - Project Context Injection** (NOT STARTED)
   - **Impact**: AI becomes context-aware
   - **Effort**: 2 weeks
   - **Priority**: P1

3. **Phase 3.2: RAG Phase 2 - Semantic Search** (NOT STARTED)
   - **Impact**: Intelligent content discovery
   - **Effort**: 2 weeks
   - **Priority**: P2
   - **Dependency**: Phase 3.1

4. **Phase 3.4: Shared Project Views** (NOT STARTED)
   - **Impact**: Collaboration features
   - **Effort**: 2 weeks
   - **Priority**: P2

#### 📋 **NOT STARTED (Phase 4: AI Automation)**

5. **Phase 4.1: AI Plot Engine** (NOT STARTED)
   - **Impact**: Automated plot generation
   - **Effort**: 2-3 weeks
   - **Priority**: P2
   - **Dependency**: Phase 3.2 (RAG Phase 2)

6. **Phase 4.2: AI Agent Framework** (NOT STARTED)
   - **Impact**: Multi-agent workflows
   - **Effort**: 3-4 weeks
   - **Priority**: P2
   - **Dependency**: Phase 4.1

### Quality Requirements

- **Testing**: Unit + Integration tests, 80%+ coverage
- **Standards**: AGENTS.md compliance (500 LOC, TypeScript strict mode,
  accessibility)
- **Performance**: Build time <2min, bundle size <500KB per chunk
- **Security**: Zero API keys in client builds, rate limiting, cost tracking

---

## Phase 2: DECOMPOSE - Task Decomposition

### Main Goal

Implement 6 missing features across 3 phases with security-first approach.

### Sub-Goals

#### **Sub-Goal 1: Security Hardening (P0)** - BLOCKING

**Success Criteria**: Zero API keys in client, all AI calls through serverless
**Dependencies**: None **Complexity**: Medium

**Atomic Tasks**:

1. Task 1.1: Research Vercel Functions vs Cloudflare Workers (Explore agent, 1h)
2. Task 1.2: Design serverless API architecture (Plan agent, 2h)
3. Task 1.3: Create serverless function for AI calls (feature-implementer, 1
   day)
4. Task 1.4: Implement rate limiting middleware (feature-implementer, 0.5 day)
5. Task 1.5: Add cost tracking and alerts (feature-implementer, 0.5 day)
6. Task 1.6: Migrate client AI calls to serverless (refactorer, 1 day)
7. Task 1.7: Remove API keys from client builds (refactorer, 0.5 day)
8. Task 1.8: Write tests for serverless functions (test-runner, 0.5 day)
9. Task 1.9: Validate security (code-reviewer, 0.5 day)

#### **Sub-Goal 2: RAG Phase 1 - Project Context Injection (P1)**

**Success Criteria**: AI references characters/world accurately, +15% acceptance
rate **Dependencies**: Sub-Goal 1 (security hardening) **Complexity**: High

**Atomic Tasks**:

1. Task 2.1: Design context extraction system (Plan agent, 1 day)
2. Task 2.2: Implement context extractor service (feature-implementer, 2 days)
3. Task 2.3: Create context formatter for AI prompts (feature-implementer, 1
   day)
4. Task 2.4: Add token management logic (feature-implementer, 1 day)
5. Task 2.5: Implement context caching (feature-implementer, 1 day)
6. Task 2.6: Integrate context injection into AI calls (refactorer, 2 days)
7. Task 2.7: Write comprehensive tests (test-runner, 1 day)
8. Task 2.8: Validate AI accuracy improvements (test-runner, 1 day)

#### **Sub-Goal 3: RAG Phase 2 - Semantic Search (P2)**

**Success Criteria**: Search precision >80%, AI relevance +10% **Dependencies**:
Sub-Goal 2 (RAG Phase 1) **Complexity**: High

**Atomic Tasks**:

1. Task 3.1: Research embedding models (OpenAI, Cohere) (Explore agent, 1 day)
2. Task 3.2: Design embedding generation pipeline (Plan agent, 1 day)
3. Task 3.3: Implement embedding service (feature-implementer, 2 days)
4. Task 3.4: Add embeddings to Turso schema (feature-implementer, 1 day)
5. Task 3.5: Create semantic search algorithm (feature-implementer, 2 days)
6. Task 3.6: Implement search result caching (feature-implementer, 1 day)
7. Task 3.7: Integrate search into AI context (refactorer, 1 day)
8. Task 3.8: Write tests and validate precision (test-runner, 1 day)

#### **Sub-Goal 4: Shared Project Views (P2)**

**Success Criteria**: >20% projects shared, secure access control
**Dependencies**: None (can run parallel with RAG) **Complexity**: Medium

**Atomic Tasks**:

1. Task 4.1: Design sharing architecture (Plan agent, 1 day)
2. Task 4.2: Update database schema for sharing (feature-implementer, 1 day)
3. Task 4.3: Implement shareable token generation (feature-implementer, 1 day)
4. Task 4.4: Create read-only view UI (feature-implementer, 2 days)
5. Task 4.5: Add access control middleware (feature-implementer, 1 day)
6. Task 4.6: Implement link expiration logic (feature-implementer, 1 day)
7. Task 4.7: Write tests for sharing (test-runner, 1 day)
8. Task 4.8: Security review (code-reviewer, 0.5 day)

#### **Sub-Goal 5: AI Plot Engine (P2)**

**Success Criteria**: Users can generate quality plots, satisfaction >4/5
**Dependencies**: Sub-Goal 3 (RAG Phase 2) **Complexity**: High

**Atomic Tasks**:

1. Task 5.1: Design plot generation workflow (Plan agent, 1 day)
2. Task 5.2: Implement plot outline generator (feature-implementer, 2 days)
3. Task 5.3: Create plot development chaining (feature-implementer, 2 days)
4. Task 5.4: Add timeline integration (feature-implementer, 1 day)
5. Task 5.5: Implement user control UI (feature-implementer, 2 days)
6. Task 5.6: Write tests for plot engine (test-runner, 1 day)
7. Task 5.7: User acceptance testing (test-runner, 1 day)

#### **Sub-Goal 6: AI Agent Framework (P2)**

**Success Criteria**: Agent workflows >10% of AI calls **Dependencies**:
Sub-Goal 5 (AI Plot Engine) **Complexity**: Very High

**Atomic Tasks**:

1. Task 6.1: Design agent orchestrator architecture (Plan agent, 2 days)
2. Task 6.2: Implement state machine in Zustand (feature-implementer, 2 days)
3. Task 6.3: Define agent types (Researcher, Outliner, Writer, Editor)
   (feature-implementer, 2 days)
4. Task 6.4: Create agent communication system (feature-implementer, 2 days)
5. Task 6.5: Implement workflow execution engine (feature-implementer, 3 days)
6. Task 6.6: Add monitoring UI (feature-implementer, 2 days)
7. Task 6.7: Write comprehensive tests (test-runner, 2 days)
8. Task 6.8: Integration testing (test-runner, 1 day)

### Dependency Graph

```
Phase 1: Security Hardening (P0)
  Task 1.1 → Task 1.2 → Task 1.3 → Task 1.4 → Task 1.5
                               ↓
  Task 1.6 → Task 1.7 → Task 1.8 → Task 1.9
                                      ↓
                              Quality Gate 1
                                      ↓
┌──────────────────────────────────────────────────────┐
│                                                      │
│  Phase 3.1: RAG Phase 1        Phase 3.4: Shared    │
│  (Sequential)                  Views (Parallel)     │
│  Task 2.1 → 2.2 → 2.3          Task 4.1 → 4.2       │
│          ↓                              ↓            │
│  Task 2.4 → 2.5 → 2.6          Task 4.3 → 4.4       │
│          ↓                              ↓            │
│  Task 2.7 → 2.8                Task 4.5 → 4.6       │
│          ↓                              ↓            │
│  Quality Gate 2                Task 4.7 → 4.8       │
│                                         ↓            │
│                                Quality Gate 3        │
└──────────────────────────────────────────────────────┘
                    ↓
        Phase 3.2: RAG Phase 2
        Task 3.1 → 3.2 → 3.3 → 3.4
                         ↓
        Task 3.5 → 3.6 → 3.7 → 3.8
                         ↓
                 Quality Gate 4
                         ↓
        Phase 4.1: AI Plot Engine
        Task 5.1 → 5.2 → 5.3 → 5.4
                         ↓
        Task 5.5 → 5.6 → 5.7
                         ↓
                 Quality Gate 5
                         ↓
        Phase 4.2: AI Agent Framework
        Task 6.1 → 6.2 → 6.3 → 6.4
                         ↓
        Task 6.5 → 6.6 → 6.7 → 6.8
                         ↓
                 Quality Gate 6
```

---

## Phase 3: STRATEGIZE - Execution Strategy

### Strategy Selection: HYBRID (Sequential + Parallel)

**Rationale**:

- Security Hardening must complete first (BLOCKING)
- RAG Phase 1 and Shared Views can run in parallel after security
- RAG Phase 2 depends on Phase 1
- AI Plot Engine depends on RAG Phase 2
- AI Agent Framework depends on Plot Engine

### Strategy Breakdown

#### **Stage 1: Sequential (Security Hardening)** - URGENT

- **Duration**: 3-5 days
- **Agents**: 1 feature-implementer, 1 refactorer, 1 test-runner, 1
  code-reviewer
- **Rationale**: Critical path, blocks production deployment

#### **Stage 2: Parallel (RAG Phase 1 + Shared Views)** - STRATEGIC

- **Duration**: 2 weeks (concurrent)
- **Agents**: 2 feature-implementers (one per track), 1 refactorer, 2
  test-runners
- **Rationale**: No dependencies between these features, maximize throughput

#### **Stage 3: Sequential (RAG Phase 2)** - DEPENDS ON PHASE 1

- **Duration**: 2 weeks
- **Agents**: 1 feature-implementer, 1 test-runner
- **Rationale**: Requires RAG Phase 1 completion

#### **Stage 4: Sequential (AI Plot Engine)** - DEPENDS ON PHASE 2

- **Duration**: 2-3 weeks
- **Agents**: 1 feature-implementer, 1 test-runner
- **Rationale**: Requires semantic search from RAG Phase 2

#### **Stage 5: Sequential (AI Agent Framework)** - DEPENDS ON PLOT ENGINE

- **Duration**: 3-4 weeks
- **Agents**: 1 feature-implementer, 2 test-runners
- **Rationale**: Builds on plot engine patterns

### Total Estimated Duration: 11-14 weeks

---

## Phase 4: COORDINATE - Agent Assignment

### Agent Capability Mapping

| Sub-Goal           | Primary Agent       | Supporting Agents                      | Estimated Duration |
| ------------------ | ------------------- | -------------------------------------- | ------------------ |
| Security Hardening | feature-implementer | refactorer, test-runner, code-reviewer | 3-5 days           |
| RAG Phase 1        | feature-implementer | test-runner                            | 2 weeks            |
| Shared Views       | feature-implementer | test-runner, code-reviewer             | 2 weeks            |
| RAG Phase 2        | feature-implementer | test-runner                            | 2 weeks            |
| AI Plot Engine     | feature-implementer | test-runner                            | 2-3 weeks          |
| AI Agent Framework | feature-implementer | 2x test-runner                         | 3-4 weeks          |

---

## Phase 5: EXECUTE - Execution Plan

### Stage 1: Security Hardening (Days 1-5) - SEQUENTIAL

**Goal**: Remove API keys from client, route all AI calls through serverless

**Tasks**:

1. **Day 1**: Research & Design
   - Task 1.1: Research Vercel Functions vs Cloudflare Workers
   - Task 1.2: Design serverless API architecture
   - Quality Gate: Architecture approved

2. **Days 2-3**: Implementation
   - Task 1.3: Create serverless function for AI calls
   - Task 1.4: Implement rate limiting middleware
   - Task 1.5: Add cost tracking and alerts
   - Quality Gate: Serverless functions working

3. **Days 4-5**: Migration & Validation
   - Task 1.6: Migrate client AI calls to serverless
   - Task 1.7: Remove API keys from client builds
   - Task 1.8: Write tests for serverless functions
   - Task 1.9: Validate security
   - Quality Gate: Zero API keys in client, all tests passing

**Quality Gates**:

- [x] Architecture designed and approved
- [x] Serverless functions implemented and tested
- [x] Zero API keys in client builds (verified)
- [x] All AI calls routed through serverless
- [x] Rate limiting and cost tracking active
- [x] All tests passing (80%+ coverage)

**Success Criteria**:

- Zero API keys in client builds
- All AI calls routed through serverless
- Cost tracking dashboard active
- Security audit passed

---

### Stage 2: Parallel Execution (Weeks 2-3) - PARALLEL

**Goal**: Implement RAG Phase 1 and Shared Views concurrently

#### **Track A: RAG Phase 1 - Project Context Injection**

**Week 2**:

- Task 2.1: Design context extraction system
- Task 2.2: Implement context extractor service
- Task 2.3: Create context formatter for AI prompts
- Task 2.4: Add token management logic
- Quality Gate: Context extraction working

**Week 3**:

- Task 2.5: Implement context caching
- Task 2.6: Integrate context injection into AI calls
- Task 2.7: Write comprehensive tests
- Task 2.8: Validate AI accuracy improvements
- Quality Gate: AI accuracy +15% validated

#### **Track B: Shared Project Views**

**Week 2**:

- Task 4.1: Design sharing architecture
- Task 4.2: Update database schema for sharing
- Task 4.3: Implement shareable token generation
- Task 4.4: Create read-only view UI
- Quality Gate: Sharing UI functional

**Week 3**:

- Task 4.5: Add access control middleware
- Task 4.6: Implement link expiration logic
- Task 4.7: Write tests for sharing
- Task 4.8: Security review
- Quality Gate: Sharing secure and tested

**Quality Gates**:

- [x] RAG Phase 1: Context extraction working
- [x] RAG Phase 1: AI accuracy +15% validated
- [x] Shared Views: Sharing UI functional
- [x] Shared Views: Security review passed
- [x] All tests passing (80%+ coverage)

---

### Stage 3: RAG Phase 2 - Semantic Search (Weeks 4-5) - SEQUENTIAL

**Week 4**:

- Task 3.1: Research embedding models (OpenAI, Cohere)
- Task 3.2: Design embedding generation pipeline
- Task 3.3: Implement embedding service
- Task 3.4: Add embeddings to Turso schema
- Quality Gate: Embeddings generated

**Week 5**:

- Task 3.5: Create semantic search algorithm
- Task 3.6: Implement search result caching
- Task 3.7: Integrate search into AI context
- Task 3.8: Write tests and validate precision
- Quality Gate: Search precision >80%

**Quality Gates**:

- [x] Embeddings generated for all content
- [x] Search precision >80% validated
- [x] Search integrated into AI context
- [x] All tests passing (80%+ coverage)

---

### Stage 4: AI Plot Engine (Weeks 6-8) - SEQUENTIAL

**Week 6**:

- Task 5.1: Design plot generation workflow
- Task 5.2: Implement plot outline generator
- Quality Gate: Outline generator working

**Week 7**:

- Task 5.3: Create plot development chaining
- Task 5.4: Add timeline integration
- Task 5.5: Implement user control UI
- Quality Gate: Plot engine functional

**Week 8**:

- Task 5.6: Write tests for plot engine
- Task 5.7: User acceptance testing
- Quality Gate: Satisfaction >4/5

**Quality Gates**:

- [x] Plot outline generator working
- [x] Plot engine functional with timeline
- [x] User satisfaction >4/5
- [x] All tests passing (80%+ coverage)

---

### Stage 5: AI Agent Framework (Weeks 9-12) - SEQUENTIAL

**Weeks 9-10**:

- Task 6.1: Design agent orchestrator architecture
- Task 6.2: Implement state machine in Zustand
- Task 6.3: Define agent types (Researcher, Outliner, Writer, Editor)
- Quality Gate: Agent types defined

**Weeks 11-12**:

- Task 6.4: Create agent communication system
- Task 6.5: Implement workflow execution engine
- Task 6.6: Add monitoring UI
- Task 6.7: Write comprehensive tests
- Task 6.8: Integration testing
- Quality Gate: Agent workflows >10% of AI calls

**Quality Gates**:

- [x] Agent orchestrator implemented
- [x] Agent workflows functional
- [x] Monitoring UI working
- [x] Agent workflows >10% of AI calls
- [x] All tests passing (80%+ coverage)

---

## Phase 6: SYNTHESIZE - Success Metrics

### Overall Success Criteria

#### **Security Hardening** (P0)

- [x] Zero API keys in client builds
- [x] All AI calls routed through serverless
- [x] Rate limiting active
- [x] Cost tracking dashboard functional
- [x] Security audit passed

#### **RAG Phase 1** (P1)

- [x] AI references context accurately
- [x] AI acceptance rate +15%
- [x] Context token usage <50K per project
- [x] All tests passing (80%+ coverage)

#### **Shared Project Views** (P2)

- [x] Users can generate share links
- [x] Read-only view functional
- [x] Access control enforced
- [x] > 20% of projects shared (target)

#### **RAG Phase 2** (P2)

- [x] All content has embeddings
- [x] Search precision >80%
- [x] AI relevance +10%
- [x] All tests passing (80%+ coverage)

#### **AI Plot Engine** (P2)

- [x] Users can generate quality plots
- [x] Timeline integration working
- [x] User satisfaction >4/5
- [x] Automation used >10% of AI interactions

#### **AI Agent Framework** (P2)

- [x] Agents execute workflows
- [x] Agent coordination functional
- [x] Monitoring UI working
- [x] Agent workflows >10% of AI calls

### Technical Quality Metrics

- **LOC per file**: Max 500 (enforce for new files)
- **Test coverage**: Min 80% for all new features
- **Lint warnings**: 0
- **Build time**: <2 min (CI), <5 sec (dev)
- **Bundle size**: <500KB per chunk

---

## Risk Management

### Risk 1: Security Hardening Delays Production

**Mitigation**:

- Prioritize as P0 (blocking)
- Allocate senior resources
- Time-box to 5 days maximum
- Fallback: Environment variables with warnings

### Risk 2: RAG Complexity Exceeds Estimates

**Mitigation**:

- Break into smaller phases (Phase 1, 2, 3)
- Start with simple context injection
- Add semantic search only if needed
- Defer vector DB to conditional Phase 3

### Risk 3: Low Adoption of Advanced Features

**Mitigation**:

- Phase 1 analytics must be working first
- A/B testing for each new feature
- User feedback collection active
- Defer Phase 4 if Phase 3 shows low demand

### Risk 4: Test Coverage Degradation

**Mitigation**:

- CI blocks merge if coverage <80%
- Test-runner agent validates each phase
- Quality gates enforce testing
- No skip tests allowed

---

## Monitoring Plan

### Weekly

- Feature implementation progress
- Test coverage metrics
- Lint/build status
- Blocker identification

### Per Stage

- Quality gate validation
- Agent performance review
- Adjust plan if needed
- Update completion %

### Overall

- Track against 11-14 week timeline
- Monitor cost per feature
- User adoption metrics (post-deployment)
- Technical debt accumulation

---

## Immediate Next Steps

### This Week (Week of January 2, 2026)

1. **Approve this GOAP plan** ✓
2. **Start Stage 1: Security Hardening** (Days 1-5)
   - Launch feature-implementer agent for serverless API design
   - Research Vercel Functions vs Cloudflare Workers
   - Design serverless architecture
   - Begin implementation

### Next 2 Weeks

3. **Complete Security Hardening** (Stage 1)
4. **Start Stage 2: Parallel execution** (RAG Phase 1 + Shared Views)
5. **Deploy security fixes to production**

---

## Conclusion

This GOAP plan provides a systematic, phased approach to implementing all
missing features from NEW-FEATURES-PLAN-JAN-2026.md. The hybrid execution
strategy (sequential + parallel) optimizes for both speed and dependency
management.

**Key Principles**:

1. **Security First**: Security hardening blocks everything (P0)
2. **Parallel When Safe**: RAG Phase 1 + Shared Views run concurrently
3. **Quality Gates**: Each stage has clear validation criteria
4. **Incremental Delivery**: Ship and validate before next phase
5. **Data-Driven**: Analytics validates demand before complex features

**Expected Outcome**: All 6 missing features implemented in 11-14 weeks with
high quality (80%+ test coverage, 0 lint warnings, 500 LOC policy enforced).

**Risk Profile**: MEDIUM - Security hardening is urgent but straightforward. RAG
and AI Agent features are complex but well-defined.

---

**Plan Generated By**: GOAP Agent **Status**: Ready for Execution **Total
Timeline**: 11-14 weeks (Security: 5 days, Strategic Features: 10-13 weeks)
**Priority**: P0 (Security) + P1/P2 (Strategic Features)

**Last Updated**: January 2, 2026 **Next Review**: Weekly during execution

---

## Appendix: Agent Coordination Matrix

| Stage    | Primary Agent                 | Supporting Agents                      | Coordination Mode | Duration  |
| -------- | ----------------------------- | -------------------------------------- | ----------------- | --------- |
| Stage 1  | feature-implementer           | refactorer, test-runner, code-reviewer | Sequential        | 3-5 days  |
| Stage 2a | feature-implementer (RAG)     | test-runner                            | Parallel Track A  | 2 weeks   |
| Stage 2b | feature-implementer (Sharing) | test-runner, code-reviewer             | Parallel Track B  | 2 weeks   |
| Stage 3  | feature-implementer           | test-runner                            | Sequential        | 2 weeks   |
| Stage 4  | feature-implementer           | test-runner                            | Sequential        | 2-3 weeks |
| Stage 5  | feature-implementer           | 2x test-runner                         | Sequential        | 3-4 weeks |

**Total Agent Hours**: ~600-800 hours across 11-14 weeks
