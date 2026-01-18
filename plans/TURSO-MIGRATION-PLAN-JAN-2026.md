# Turso Database Migration Plan

**Goal**: Migrate all localStorage usage to Turso (local or cloud database)

**Date**: January 18, 2026

## Current State Analysis

### Infrastructure Already in Place

- ✅ Turso client (`@libsql/client`) installed
- ✅ Drizzle ORM configured
- ✅ AI preferences module already using Turso with localStorage fallback
- ✅ Database configuration system (`src/lib/database/`)
- ✅ Migration scripts infrastructure

### localStorage Usage Identified

1. **Settings Service** (`src/features/settings/services/settingsService.ts`)
   - Application settings persistence
   - Theme preferences, AI configuration

2. **World-Building Database**
   (`src/features/world-building/services/worldBuildingDb.ts`)
   - Projects, locations, cultures, timelines, lore, research sources, maps

3. **User Context** (`src/contexts/UserContext.tsx`)
   - User session management

4. **Writing Assistant Database**
   (`src/features/writing-assistant/services/writingAssistantDb.ts`)
   - Writing goals, analytics, templates

5. **Projects Database** (`src/features/projects/services/db.ts`)
   - Project metadata and management

6. **Onboarding** (`src/features/onboarding/hooks/useOnboarding.ts`)
   - Onboarding state

7. **Other Components** with localStorage dependencies

## Implementation Strategy

### Phase 1: Database Schema Design (Critical Path)

**Agent**: Database Schema Architect (Agent 1) **Output**: Complete database
schemas for all features **Dependencies**: None **Success Criteria**:

- All localStorage data structures mapped to Turso tables
- Proper indexes and constraints defined
- Migration scripts generated

### Phase 2: Migration Infrastructure (Critical Path)

**Agent**: Migration Specialist (Agent 2) **Output**: Data migration scripts and
utilities **Dependencies**: Phase 1 **Success Criteria**:

- Scripts to migrate existing localStorage data to Turso
- Rollback capabilities
- Data validation after migration

### Phase 3: Feature Services Refactoring (Parallel)

**Agents**: Multiple specialized agents (Agents 3-7) **Output**: Refactored
database services **Dependencies**: Phase 1, Phase 2 **Success Criteria**:

- All localStorage calls replaced with Turso calls
- Proper error handling
- Fallback to localStorage if Turso unavailable

### Phase 4: Component Integration (Parallel)

**Agent**: Integration Specialist (Agent 9) **Output**: Updated components to
use new services **Dependencies**: Phase 3 **Success Criteria**:

- All components using new database services
- No breaking changes to public APIs

### Phase 5: Testing (Parallel with Phase 3-4)

**Agents**: QA Engineer (Agent 10), E2E Test Specialist (Agent 11) **Output**:
Comprehensive test coverage **Dependencies**: Phase 3 **Success Criteria**:

- All existing tests pass
- New tests for database services
- E2E tests validate Turso integration

### Phase 6: Documentation & Configuration (Parallel)

**Agents**: Documentation Specialist (Agent 12), Config Specialist (Agent 13)
**Output**: Setup guides and environment configuration **Dependencies**: Phase 3
**Success Criteria**:

- Clear setup instructions for local Turso
- Clear setup instructions for cloud Turso
- Environment variables documented

### Phase 7: Optimization & Polish (Sequential)

**Agents**: Performance Engineer (Agent 15), Error Handling Specialist
(Agent 14) **Output**: Optimized and production-ready code **Dependencies**:
Phase 4, Phase 5 **Success Criteria**:

- Proper error handling and fallback strategies
- Performance optimizations implemented
- Caching where appropriate

### Phase 8: Build, Test, Commit, Deploy (Sequential)

**Agent**: GOAP Coordinator (Main Agent) **Output**: Successful deployment with
all tests passing **Dependencies**: All phases **Success Criteria**:

- `npm run build` succeeds
- `npm run lint` passes with no errors
- `npm run test` passes all unit tests
- `npm run test:e2e` passes all E2E tests
- Git commit created and pushed
- All GitHub Actions pass

## Agent Coordination Strategy

### Parallel Execution Groups

**Group 1 (Independent, can run in parallel)**:

- Agent 3: Settings Service Refactoring
- Agent 4: World-Building Database Refactoring
- Agent 5: User Context Refactoring
- Agent 6: Writing Assistant Database Refactoring
- Agent 7: Projects Database Refactoring

**Group 2 (Can run in parallel after Group 1)**:

- Agent 9: Component Integration
- Agent 10: Unit Tests
- Agent 12: Documentation
- Agent 13: Environment Configuration

**Group 3 (Sequential, depends on Group 2)**:

- Agent 8: Data Migration Implementation
- Agent 11: E2E Tests (needs all features working)
- Agent 14: Error Handling
- Agent 15: Performance Optimization

### Handoff Coordination

**Phase 1 → Phase 2**:

- Agent 1 provides schema definitions to Agent 2
- Agent 2 validates schemas and generates migration scripts

**Phase 2 → Phase 3 (Parallel)**:

- Agent 2 provides migration utilities to Agents 3-7
- All agents use shared migration infrastructure

**Phase 3 → Phase 4**:

- Agents 3-7 provide updated service APIs to Agent 9
- Agent 9 updates components to use new APIs

**Phase 3 → Phase 5**:

- Agents 3-7 provide service interfaces to Agents 10-11
- Agents 10-11 write tests against new services

**Phase 4 → Phase 6**:

- Agent 9 provides integration notes to Agent 12
- Agent 13 works with Agent 12 on environment docs

**Phase 5 → Phase 7**:

- Agents 10-11 provide test results to Agents 14-15
- Agents 14-15 optimize based on test feedback

**Phase 7 → Phase 8**:

- All agents report completion to main coordinator
- Main agent runs build, lint, test, commit, deploy

## Risk Mitigation

### Risk 1: Data Loss During Migration

**Mitigation**:

- Backup localStorage before migration
- Test migrations on local environment first
- Provide rollback capability
- Validate data integrity after migration

### Risk 2: Turso Unavailability

**Mitigation**:

- Implement graceful fallback to localStorage
- Clear error messages for users
- Offline-first design
- Retry logic for transient failures

### Risk 3: Performance Degradation

**Mitigation**:

- Proper indexing on all tables
- Query optimization
- Caching layer for frequently accessed data
- Batch operations for bulk updates

### Risk 4: Breaking Changes

**Mitigation**:

- Maintain backward compatibility in APIs
- Incremental migration strategy
- Comprehensive test coverage
- Gradual rollout

## Success Criteria

### Functional Requirements

- ✅ All localStorage usage replaced with Turso
- ✅ Data migrations successful
- ✅ All features work as before
- ✅ No data loss

### Non-Functional Requirements

- ✅ Performance equivalent or better than localStorage
- ✅ Proper error handling
- ✅ Fallback to localStorage if Turso unavailable
- ✅ Comprehensive test coverage
- ✅ Clear documentation

### Quality Requirements

- ✅ Build succeeds
- ✅ Lint passes
- ✅ All tests pass
- ✅ No TypeScript errors
- ✅ No console errors

### Deployment Requirements

- ✅ Commit created with descriptive message
- ✅ Push to remote succeeds
- ✅ All GitHub Actions pass

## Timeline Estimates

- **Phase 1**: 2-3 hours
- **Phase 2**: 1-2 hours
- **Phase 3**: 6-8 hours (parallel across 5 agents)
- **Phase 4**: 2-3 hours
- **Phase 5**: 3-4 hours (parallel)
- **Phase 6**: 1-2 hours
- **Phase 7**: 2-3 hours
- **Phase 8**: 1-2 hours

**Total**: ~18-27 hours (with parallel execution)

## Next Steps

1. ✅ Complete current state analysis
2. ✅ Create detailed implementation plan
3. 🔄 Spawn Agent 1 (Database Schema Design)
4. ⏳ Wait for Agent 1 completion
5. 🔄 Spawn Agent 2 (Migration Infrastructure)
6. 🔄 Spawn Agents 3-7 (Feature Services Refactoring)
7. 🔄 Spawn Agents 8-15 (Remaining phases)
8. 🔄 Build, lint, test, commit, deploy
9. 🔄 Monitor GitHub Actions

---

**Agent Coordination Approach**: GOAP-based planning with handoff coordination
between 15 specialized agents.

**Monitoring**: Main coordinator tracks all agent progress and handles
dependencies.

**Quality Gates**: Each phase has clear success criteria before proceeding to
next phase.
