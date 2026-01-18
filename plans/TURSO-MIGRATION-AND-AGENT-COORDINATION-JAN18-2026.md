# TURSO DATABASE MIGRATION AND AGENT COORDINATION SYSTEM

**Date:** January 18, 2026 **Status:** In Progress

## Current State Analysis

### localStorage Usage Identified

The following files currently use localStorage that needs to be migrated to
Turso:

1. **src/lib/db.ts** - Database config and project storage
   - Storage keys: `novelist_db_config`, `novelist_local_projects`

2. **src/lib/database/config.ts** - Database configuration
   - Storage key: `novelist_db_config`

3. **src/contexts/UserContext.tsx** - User ID management
   - Storage key: `novelist_user_id`

4. **src/features/onboarding/hooks/useOnboarding.ts** - Onboarding state
   - Storage keys: `novelist_onboarding_complete`, `novelist_onboarding_step`

5. **src/features/plot-engine/components/FeedbackCollector.tsx** - Feedback
   storage
   - Storage key: `plot-engine-feedback`

6. **src/features/projects/services/db.ts** - Projects storage
   - Storage keys: `novelist_db_config`, `novelist_local_projects`

7. **src/features/settings/components/SettingsView.tsx** - Theme settings
   - Storage key: `novelist_theme`

### Existing Infrastructure

**Database:**

- Drizzle ORM with Turso/SQLite support already configured
- Schemas exist for: projects, chapters, characters, world-building, plots,
  dialogue, versioning, publishing, writing-assistant, vectors
- Database client factory pattern in place

**Agent System:**

- No existing agent coordination system found
- AgentConsole component exists for visualization
- GOAP planner mentioned in recent commits

## Goal State

1. **Complete Turso Migration:** All localStorage usage replaced with Turso
   database
2. **Agent Coordination System:** 1-19 agents with handoff coordination
   implemented
3. **Quality Gates:** Build, lint, and test all pass without issues
4. **CI/CD Success:** All GitHub Actions pass successfully
5. **Git Operations:** Changes committed, pushed, and monitored via gh CLI

## Action Plan

### Phase 1: Database Schema Design (Preconditions: Codebase analyzed)

**Action 1.1: Create User Settings Schema**

- Preconditions: Existing database infrastructure, localStorage usage patterns
  understood
- Effects: New `user_settings` table in Turso
- Schema fields:
  - `id` (text, primary key)
  - `userId` (text, unique, indexed)
  - `theme` (text)
  - `language` (text)
  - `onboardingComplete` (integer, boolean)
  - `onboardingStep` (text)
  - `createdAt`, `updatedAt` (text, ISO timestamps)
- Estimated cost: 30 minutes

**Action 1.2: Create Agent Coordination Schema**

- Preconditions: User settings schema created
- Effects: New tables for agent coordination
- Schema tables:
  - `agent_instances` - Active agent instances
    - `id`, `agentId`, `agentType`, `status`, `projectId`
    - `currentTask`, `handoffTarget`, `createdAt`, `updatedAt`
  - `agent_tasks` - Task queue and history
    - `id`, `agentId`, `taskType`, `status`, `priority`
    - `inputData`, `outputData`, `errorMessage`, `createdAt`, `completedAt`
  - `agent_handoffs` - Handoff tracking
    - `id`, `fromAgentId`, `toAgentId`, `taskId`, `handoffReason`
    - `contextData`, `timestamp`, `status`
- Estimated cost: 45 minutes

**Action 1.3: Create Feedback Schema**

- Preconditions: Basic database infrastructure
- Effects: New `plot_engine_feedback` table
- Schema fields:
  - `id` (text, primary key)
  - `userId` (text, indexed)
  - `projectId` (text, indexed)
  - `feedbackType` (text)
  - `content` (text, JSON)
  - `createdAt` (text)
- Estimated cost: 20 minutes

### Phase 2: Database Services Layer (Preconditions: Schemas created)

**Action 2.1: Create User Settings Service**

- Preconditions: User settings schema exists
- Effects: Service methods for CRUD operations on user settings
- Methods:
  - `getUserSettings(userId)` - Get user settings
  - `saveUserSettings(userId, settings)` - Save/update settings
  - `getTheme(userId)` - Get theme preference
  - `setTheme(userId, theme)` - Set theme preference
  - `getOnboardingStatus(userId)` - Get onboarding completion
  - `setOnboardingComplete(userId)` - Mark onboarding complete
  - `getOnboardingStep(userId)` - Get current step
  - `setOnboardingStep(userId, step)` - Set current step
- Estimated cost: 60 minutes

**Action 2.2: Create Agent Coordination Service**

- Preconditions: Agent coordination schemas exist
- Effects: Service for managing agents and handoffs
- Methods:
  - `spawnAgent(agentType, projectId)` - Create new agent instance
  - `terminateAgent(agentId)` - Terminate agent
  - `assignTask(agentId, task)` - Assign task to agent
  - `getAgentStatus(agentId)` - Get agent status
  - `initiateHandoff(fromAgentId, toAgentId, taskId, reason, context)` -
    Initiate handoff
  - `completeHandoff(handoffId)` - Mark handoff complete
  - `getActiveAgents(projectId)` - List active agents
  - `getAgentHistory(agentId)` - Get agent task history
- Estimated cost: 90 minutes

**Action 2.3: Create Feedback Service**

- Preconditions: Feedback schema exists
- Effects: Service for managing plot engine feedback
- Methods:
  - `saveFeedback(userId, projectId, feedbackType, content)` - Save feedback
  - `getFeedback(userId)` - Get user feedback
  - `getProjectFeedback(projectId)` - Get project feedback
  - `deleteFeedback(feedbackId)` - Delete feedback
- Estimated cost: 30 minutes

### Phase 3: Agent Coordination System (Preconditions: Agent service created)

**Action 3.1: Create Agent Types System**

- Preconditions: Agent coordination service exists
- Effects: Type definitions for 19 different agent types
- Agent types (1-19):
  1. `planner_agent` - High-level planning
  2. `research_agent` - Research and fact-checking
  3. `character_agent` - Character development
  4. `plot_agent` - Plot structure
  5. `world_building_agent` - World building
  6. `dialogue_agent` - Dialogue writing
  7. `writing_agent` - Content generation
  8. `editing_agent` - Content editing
  9. `feedback_agent` - User feedback processing
  10. `analytics_agent` - Analytics and insights
  11. `publishing_agent` - Publishing workflow
  12. `versioning_agent` - Version management
  13. `consistency_agent` - Consistency checking
  14. `timeline_agent` - Timeline management
  15. `location_agent` - Location management
  16. `culture_agent` - Culture and society
  17. `map_agent` - World mapping
  18. `lore_agent` - Lore management
  19. `coordination_agent` - Master coordinator
- Estimated cost: 60 minutes

**Action 3.2: Create Handoff Mechanism**

- Preconditions: Agent types defined
- Effects: Handoff logic and state machine
- Handoff workflow:
  1. Agent completes current task
  2. Agent determines next required agent type
  3. Agent creates handoff record with context
  4. Target agent accepts handoff
  5. Target agent processes context
  6. Handoff marked complete
- Estimated cost: 90 minutes

**Action 3.3: Create Agent Lifecycle Manager**

- Preconditions: Handoff mechanism exists
- Effects: Agent spawning, monitoring, and termination
- Features:
  - Agent health monitoring
  - Task queue management
  - Automatic cleanup of idle agents
  - Maximum agent limit enforcement (19)
  - Priority-based task assignment
- Estimated cost: 75 minutes

**Action 3.4: Create Agent Console Enhancement**

- Preconditions: Lifecycle manager exists
- Effects: Enhanced UI for agent monitoring
- Features:
  - Real-time agent status display
  - Handoff visualization
  - Task queue view
  - Agent metrics (decisions, success rate, average time)
- Estimated cost: 45 minutes

### Phase 4: Migration Implementation (Preconditions: Services created)

**Action 4.1: Migrate UserContext**

- Preconditions: User settings service exists
- Effects: UserContext uses Turso instead of localStorage
- Changes:
  - Replace `localStorage.getItem('novelist_user_id')` with service call
  - Replace `localStorage.setItem('novelist_user_id', id)` with service call
  - Add error handling for database failures
- Estimated cost: 30 minutes

**Action 4.2: Migrate Onboarding Hooks**

- Preconditions: User settings service exists
- Effects: useOnboarding uses Turso instead of localStorage
- Changes:
  - Replace all localStorage calls with service calls
  - Update storage keys to match schema
  - Add migration logic for existing data
- Estimated cost: 45 minutes

**Action 4.3: Migrate Settings Component**

- Preconditions: User settings service exists
- Effects: SettingsView uses Turso instead of localStorage
- Changes:
  - Replace theme localStorage with service call
  - Add database connection status indicator
- Estimated cost: 30 minutes

**Action 4.4: Migrate Feedback Collector**

- Preconditions: Feedback service exists
- Effects: FeedbackCollector uses Turso instead of localStorage
- Changes:
  - Replace feedback localStorage with service call
  - Add error handling
- Estimated cost: 30 minutes

**Action 4.5: Remove localStorage Fallbacks**

- Preconditions: All migrations complete and tested
- Effects: Clean removal of localStorage fallback code
- Changes:
  - Remove localStorage import and usage from db.ts
  - Remove localStorage from database/config.ts
  - Remove localStorage from projects/services/db.ts
  - Add deprecation warnings if any localStorage calls remain
- Estimated cost: 45 minutes

### Phase 5: Testing & Validation (Preconditions: Implementation complete)

**Action 5.1: Run Type Check**

- Preconditions: All code changes complete
- Effects: TypeScript compilation succeeds
- Command: `pnpm run typecheck`
- Estimated cost: 5 minutes

**Action 5.2: Run ESLint**

- Preconditions: Type check passes
- Effects: No linting errors
- Command: `pnpm run lint:eslint`
- Estimated cost: 5 minutes

**Action 5.3: Run Unit Tests**

- Preconditions: Linting passes
- Effects: All unit tests pass
- Command: `pnpm run test`
- Estimated cost: 10 minutes

**Action 5.4: Run E2E Tests**

- Preconditions: Unit tests pass
- Effects: All E2E tests pass
- Command: `pnpm run test:e2e`
- Estimated cost: 15 minutes

**Action 5.5: Run Build**

- Preconditions: All tests pass
- Effects: Production build succeeds
- Command: `pnpm run build`
- Estimated cost: 10 minutes

### Phase 6: Git Operations (Preconditions: Build and tests pass)

**Action 6.1: Stage Changes**

- Preconditions: All quality gates pass
- Effects: Changes staged for commit
- Command: `git add .`
- Estimated cost: 1 minute

**Action 6.2: Create Commit**

- Preconditions: Changes staged
- Effects: Changes committed with descriptive message
- Command:
  `git commit -m "feat: migrate to Turso and implement agent coordination system"`
- Estimated cost: 1 minute

**Action 6.3: Push to Remote**

- Preconditions: Changes committed
- Effects: Changes pushed to GitHub
- Command: `git push origin main`
- Estimated cost: 2 minutes

**Action 6.4: Monitor GitHub Actions**

- Preconditions: Push complete
- Effects: CI/CD pipeline execution monitored
- Command: `gh run watch`
- Estimated cost: Variable (depends on CI duration)

**Action 6.5: Verify CI Success**

- Preconditions: CI pipeline complete
- Effects: All GitHub Actions verified as successful
- Command: `gh run list --limit 5`
- Estimated cost: 2 minutes

## Risk Assessment

### High-Risk Items

1. **Database Migration Data Loss**
   - Risk: Existing localStorage data could be lost during migration
   - Mitigation: Implement migration logic to preserve existing data
   - Backup: Export localStorage before migration

2. **Agent Coordination Complexity**
   - Risk: 19 agents with handoffs may create race conditions or deadlocks
   - Mitigation: Implement proper locking and state management
   - Testing: Extensive unit and integration tests

3. **Performance Impact**
   - Risk: Turso network calls may be slower than localStorage
   - Mitigation: Implement caching layer for frequently accessed data
   - Monitoring: Add performance metrics

### Medium-Risk Items

1. **Test Failures**
   - Risk: Existing tests may fail due to localStorage removal
   - Mitigation: Update mocks to use Turso service mocks
   - Time buffer: Allocate extra time for test fixes

2. **Build Time Increase**
   - Risk: Additional code may increase build time
   - Mitigation: Code splitting and lazy loading
   - Monitoring: Track build time metrics

### Low-Risk Items

1. **Git Conflicts**
   - Risk: Push may conflict with other changes
   - Mitigation: Pull latest changes before commit
   - Resolution: Standard merge conflict resolution

## Success Criteria

1. ✅ All localStorage usage replaced with Turso database
2. ✅ Agent coordination system supports 1-19 agents with handoff
3. ✅ TypeScript compilation succeeds without errors
4. ✅ ESLint reports zero errors
5. ✅ All unit tests pass
6. ✅ All E2E tests pass
7. ✅ Production build succeeds
8. ✅ Changes committed and pushed to GitHub
9. ✅ All GitHub Actions complete successfully

## Estimated Total Time

- Phase 1 (Schema Design): 95 minutes
- Phase 2 (Services Layer): 180 minutes
- Phase 3 (Agent System): 270 minutes
- Phase 4 (Migration): 180 minutes
- Phase 5 (Testing): 45 minutes
- Phase 6 (Git Operations): Variable (5-30 minutes)

**Total Estimated Time:** ~770 minutes (~13 hours)

## Notes

- Turso local mode (`file:novelist.db`) will be used for development
- Turso cloud mode will be used in production via environment variables
- Agent system designed to be extensible for future agent types
- Handoff mechanism designed for robustness with proper error handling
- All database operations include proper error handling and logging
