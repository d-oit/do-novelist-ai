# AI Plot Engine Completion Plan

**Created**: January 5, 2026 **Owner**: Development Team **Status**: 🚧 In
Progress **Priority**: P1 (High) **Estimated Effort**: 2-3 weeks **Completion
Target**: January 26, 2026

---

## Executive Summary

The AI Plot Engine feature is **30% complete** with foundational services
implemented and tested. This plan outlines the remaining 70% of work needed to
deliver a production-ready feature integrated with the AI Gateway, complete UI
implementation, comprehensive testing, and user documentation.

**Current Progress**: 16 files, 3,332 lines of code, 23 passing tests, 0
TypeScript errors

---

## Current State Assessment

### Complete ✅

**Core Services (Foundation)**

- ✅ `PlotAnalysisService` - Story structure & pacing analysis
- ✅ `PlotHoleDetector` - Continuity & consistency checking (382 lines)
- ✅ `CharacterGraphService` - Relationship mapping (356 lines)
- ✅ `PlotGenerationService` - Template-based plot generation (505 lines)
- ✅ Type definitions - Complete type system (254 lines)
- ✅ All TypeScript errors resolved

**Testing**

- ✅ 23 unit tests passing (9 for PlotAnalysis, 14 for PlotGeneration)
- ✅ Test coverage for core service logic
- ✅ Mock data setup for testing

**UI Components (Partial)**

- ✅ `PlotEngineDashboard` - Main dashboard shell
- ✅ `PlotAnalyzer` - Basic analysis UI with TODO for service integration
- ✅ `StoryArcVisualizer` - Component structure
- ✅ `PlotHoleDetectorView` - Component structure
- ✅ `CharacterGraphView` - Component structure

**Infrastructure Available**

- ✅ API Gateway client (`/api/ai/generate`)
- ✅ OpenRouter service integration
- ✅ Logger service for error tracking
- ✅ Existing RAG infrastructure (Phase 1-3 complete)

### Incomplete ❌

**Critical - AI Integration**

- ❌ **AI Gateway integration** - PlotGenerationService uses hardcoded templates
  instead of calling AI APIs
- ❌ No actual AI-powered plot generation - all outputs are static templates
- ❌ No RAG integration for context-aware suggestions
- ❌ No model selection logic (GPT-4 vs GPT-3.5 vs Claude)

**Service Layer**

- ❌ PlotAnalyzer UI uses mock data instead of calling actual services
- ❌ Missing React hooks:
  - `usePlotAnalysis` - Plot analysis logic
  - `usePlotGeneration` - Plot generation logic
  - `useCharacterGraph` - Character relationship tracking
- ❌ No service orchestration layer

**Data Persistence** (UPDATED: Using Turso)

- ✅ Turso SQL schema designed for plot data (replaces IndexedDB)
- ❌ No caching layer for analysis results (Turso TTL-based)
- ❌ Plot structures not persisted (Turso embedded replica)
- ❌ Character relationships not stored (Turso tables)

**UI Implementation**

- ❌ Incomplete service integration in all UI components
- ❌ Missing loading states and error boundaries
- ❌ Limited accessibility attributes
- ❌ No responsive design validation
- ❌ StoryArcVisualizer needs interactive implementation

**Testing**

- ❌ No E2E tests for UI workflows
- ❌ No integration tests between services
- ❌ No tests for AI Gateway integration
- ❌ Missing tests for PlotHoleDetector and CharacterGraphService

**Performance**

- ❌ No Web Workers for heavy computation
- ❌ No debouncing for real-time analysis
- ❌ No lazy loading for visualizations
- ❌ No performance monitoring

**Documentation**

- ❌ No user documentation
- ❌ No API documentation
- ❌ No feature guide
- ❌ No examples or tutorials

---

## Complete Feature Breakdown

### 1. AI Integration Layer

**Required Components:**

- Integrate with API Gateway (`/api/ai/generate`)
- Implement AI-powered plot generation (replacing static templates)
- Add RAG context integration for project-aware suggestions
- Model selection logic based on task complexity
- Fallback mechanism for AI failures

**Key Integrations:**

- OpenRouter API for model access
- RAG service for context retrieval
- Rate limiting and cost tracking

### 2. Service Layer Completion

**Missing Services:**

- React hooks for service orchestration
- Service layer for UI integration
- Error handling and retry logic
- Response caching

**Hook Implementations:**

- `usePlotAnalysis(projectId)` - Analyze story structure
- `usePlotGeneration(request)` - Generate plot with AI
- `useCharacterGraph(projectId)` - Build relationship graph

### 3. Data Persistence Layer (UPDATED: Turso SQL)

**Database:** Turso with Embedded Replicas (Local + Cloud Sync)

**SQL Schema:**

```sql
-- 1. Plot Structures
CREATE TABLE plot_structures (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  acts TEXT NOT NULL,  -- JSON column
  climax TEXT,  -- JSON column
  resolution TEXT,  -- JSON column
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_plot_structures_project ON plot_structures(project_id);

-- 2. Plot Holes
CREATE TABLE plot_holes (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  type TEXT NOT NULL,
  severity TEXT NOT NULL,
  affected_chapters TEXT,  -- JSON array
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_plot_holes_project ON plot_holes(project_id);

-- 3. Character Graphs
CREATE TABLE character_graphs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  nodes TEXT NOT NULL,  -- JSON array
  edges TEXT NOT NULL,  -- JSON array
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_character_graphs_project ON character_graphs(project_id);

-- 4. Analysis Results (with TTL)
CREATE TABLE analysis_results (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  analysis_type TEXT NOT NULL,
  result_data TEXT NOT NULL,  -- JSON column
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_analysis_results_project ON analysis_results(project_id);
CREATE INDEX idx_analysis_results_expires ON analysis_results(expires_at);

-- 5. Plot Suggestions
CREATE TABLE plot_suggestions (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  placement TEXT,
  impact TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_plot_suggestions_project ON plot_suggestions(project_id);
```

**Features:**

- **Embedded Replica**: Local SQLite file syncs with Turso cloud
- **Local-first**: Zero-latency reads from local file
- **Auto-sync**: Configurable sync interval (60s default)
- **Offline support**: Works without network, syncs when online
- **TTL cleanup**: Automatic cache expiration via SQL queries
- **Read-your-writes**: Consistency guarantee

### 4. UI Component Completion

**Component Status & Work:**

| Component            | Status | Remaining Work                              |
| -------------------- | ------ | ------------------------------------------- |
| PlotEngineDashboard  | 60%    | Integrate all tabs, proper navigation state |
| PlotAnalyzer         | 40%    | Connect to services, add loading states     |
| StoryArcVisualizer   | 30%    | Interactive timeline, drag-drop, export     |
| PlotHoleDetectorView | 30%    | Complete UI, filtering, severity sorting    |
| CharacterGraphView   | 30%    | Graph visualization, interactive nodes      |
| PlotGenerator        | 0%     | New component needed for plot generation    |

### 5. Testing Strategy

**Test Coverage Goals:**

- Unit tests: 90%+ coverage
- Integration tests: Service-to-service communication
- E2E tests: Critical user workflows
- Accessibility tests: WCAG 2.1 AA compliance

**Test Suites Needed:**

- PlotHoleDetector tests
- CharacterGraphService tests
- React hooks tests
- Integration tests (AI Gateway + PlotGenerationService)
- E2E tests for all user workflows
- Accessibility audit with axe-core

---

## Phased Approach

### Week 1: AI Gateway Integration & Service Completion

**Days 1-2: AI Gateway Integration**

- Integrate PlotGenerationService with API Gateway
- Replace static templates with AI-powered generation
- Implement model selection logic
- Add error handling and retry mechanism
- **Deliverable**: Working AI plot generation

**Days 3-4: RAG Integration**

- Connect to RAG service for context retrieval
- Pass project context to AI prompts
- Implement context-aware suggestions
- Test with real project data
- **Deliverable**: Context-aware plot generation

**Day 5: Service Hooks**

- Implement `usePlotAnalysis` hook
- Implement `usePlotGeneration` hook
- Implement `useCharacterGraph` hook
- Add loading and error states
- **Deliverable**: React hooks ready for UI

**Success Criteria:**

- ✅ Plot generation produces coherent, AI-generated plots
- ✅ RAG integration provides project-aware suggestions
- ✅ Hooks tested and documented
- ✅ Error handling prevents UI crashes

**Risks:**

- AI API rate limits may throttle development
- RAG context may not improve suggestions initially
- Model selection needs tuning for quality

### Week 2: UI Completion & Database Integration (UPDATED: Turso)

**Days 6-7: Database Schema & Persistence (Turso Embedded Replica)**

- Create Turso SQL schema for plot data
- Implement plotStorageService with embedded replica (local + cloud sync)
- Implement CRUD operations via SQL queries
- Implement TTL-based cache cleanup for analysis results
- Add SQL indexes and query optimization
- **Deliverable**: Working Turso storage layer with offline support
- **Update**: Using Turso embedded replicas instead of IndexedDB for better sync
  and consistency

**Days 8-9: UI Component Integration**

- Connect PlotAnalyzer to actual services (remove mocks)
- Implement StoryArcVisualizer with interactive features
- Complete PlotHoleDetectorView with filtering
- Build CharacterGraphView with D3.js visualization
- Add loading states and error boundaries
- **Deliverable**: Fully functional UI components

**Day 10: Performance Optimization**

- Implement Web Workers for heavy computation
- Add debouncing for real-time analysis
- Lazy load visualizations
- Add performance monitoring
- **Deliverable**: Optimized performance (<3s for 50k words)

**Success Criteria:**

- ✅ All UI components use real services (no mocks)
- ✅ Plot data persists across sessions
- ✅ Analysis completes in <3s for 50k words
- ✅ No performance regressions

**Risks:**

- Database schema may need iteration
- Performance optimization may require refactoring
- Visualization complexity may impact performance

### Week 3: Testing, Documentation & Beta

**Days 11-12: Comprehensive Testing**

- Add PlotHoleDetector unit tests
- Add CharacterGraphService unit tests
- Add React hooks tests
- Implement integration tests (services + AI Gateway)
- Write E2E tests for critical workflows
- Run accessibility audit with axe-core
- **Deliverable**: 95%+ test coverage

**Day 13: User Documentation**

- Write user guide for Plot Engine
- Create quick start tutorial
- Add inline help text and tooltips
- Document all features and best practices
- **Deliverable**: Complete user documentation

**Day 14: Beta & Feedback Loop**

- Deploy beta to staging
- Set up user feedback collection
- Test with real user scenarios
- Fix critical bugs identified
- **Deliverable**: Beta ready for user testing

**Day 15: Final Polish & Deployment**

- Address beta feedback
- Final code review
- Performance validation
- Security audit
- Deploy to production
- **Deliverable**: Production-ready feature

**Success Criteria:**

- ✅ 95%+ test coverage achieved
- ✅ All critical user flows tested
- ✅ Documentation complete and helpful
- ✅ Beta feedback incorporated
- ✅ Zero critical bugs in production

**Risks:**

- Test writing may be time-consuming
- User feedback may require significant changes
- Production deployment may reveal issues

---

## Success Criteria

### Technical Requirements

**Functionality**

- ✅ AI generates coherent plot structures
- ✅ Analysis identifies plot holes with 80%+ accuracy
- ✅ Character relationships tracked across chapters
- ✅ All data persists across sessions
- ✅ Integration with RAG for context-aware suggestions

**Performance**

- ✅ Plot generation completes in <5s
- ✅ Analysis completes in <3s for 50k words
- ✅ UI responds within 100ms of user interaction
- ✅ Memory usage stable during long sessions

**Quality**

- ✅ 95%+ test coverage
- ✅ 0 TypeScript errors
- ✅ 0 lint errors
- ✅ All accessibility standards met (WCAG 2.1 AA)

**Reliability**

- ✅ AI failures handled gracefully with fallbacks
- ✅ Network errors don't crash UI
- ✅ Data corruption prevented
- ✅ Rate limits respected

### User Experience

**Usability**

- ✅ Clear visual feedback for all actions
- ✅ Helpful error messages with actionable guidance
- ✅ Intuitive navigation between features
- ✅ Responsive design works on all screen sizes

**Features**

- ✅ Plot generation creates usable story structures
- ✅ Analysis provides actionable insights
- ✅ Visualizations are interactive and informative
- ✅ Suggestions improve with use

---

## Risk Assessment

### High Priority Risks

| Risk                                          | Impact | Probability | Mitigation                                                                           |
| --------------------------------------------- | ------ | ----------- | ------------------------------------------------------------------------------------ |
| **AI-generated plots lack coherence**         | High   | Medium      | Implement multi-step generation, use GPT-4 for complex tasks, provide manual editing |
| **Performance degradation with large novels** | High   | Medium      | Web Workers, caching, incremental analysis, lazy loading                             |
| **RAG context doesn't improve suggestions**   | Medium | High        | A/B test with/without context, fine-tune context window, manual fallback             |
| **Database schema requires iteration**        | Medium | Medium      | Use migrations, version schema, backup data before changes                           |
| **E2E tests flaky due to AI latency**         | Medium | Medium      | Mock AI responses in tests, use test fixtures, add retry logic                       |

### Medium Priority Risks

| Risk                                         | Impact | Probability | Mitigation                                                           |
| -------------------------------------------- | ------ | ----------- | -------------------------------------------------------------------- |
| **Visualizations too complex to implement**  | Medium | Low         | Use existing libraries (D3.js, Recharts), keep MVP simple            |
| **User feedback requires major refactoring** | Medium | Medium      | Involve users earlier, rapid prototyping, modular design             |
| **Production deployment reveals issues**     | High   | Low         | Comprehensive staging, feature flags, gradual rollout                |
| **Documentation time exceeds estimate**      | Low    | Medium      | Write alongside development, use templates, prioritize critical docs |

### Low Priority Risks

| Risk                                   | Impact | Probability | Mitigation                                             |
| -------------------------------------- | ------ | ----------- | ------------------------------------------------------ |
| **Rate limits slow development**       | Medium | High        | Use local fallbacks, batch requests, caching           |
| **Accessibility compliance difficult** | Low    | Low         | Use axe-core, follow existing patterns, manual testing |
| **Third-party library deprecation**    | Medium | Low         | Choose stable libraries, keep dependencies updated     |

---

## Dependencies

### External Dependencies

**Required (Already Available)**

- ✅ API Gateway (`/api/ai/generate`)
- ✅ OpenRouter service
- ✅ RAG infrastructure (Phase 1-3)
- ✅ Logger service
- ✅ UI components library (shadcn/ui)
- ✅ React 18+
- ✅ TypeScript 5+
- ✅ **Turso / @libsql/client** - For database (local + cloud sync)

**New Dependencies (To Be Added)**

- 📦 D3.js (already in package.json) - For graph visualization
- 📦 @axe-core/react (if not present) - For accessibility testing
- 📦 vitest (already present) - For unit testing
- 📦 @playwright/test (already present) - For E2E testing
- ~~📦 dexie~~ - **REMOVED**: Using Turso instead of IndexedDB

### Internal Dependencies

**Blocking Dependencies**

- AI Gateway must be stable and documented
- RAG Phase 1-3 must remain stable
- User authentication must work

**Parallel Work**

- Database schema design (Week 2)
- UI component polishing (Week 2)
- Documentation drafting (Week 3)

---

## Technical Decisions

### AI Model Selection

**Model Strategy:**

- **Plot Generation**: GPT-4 (high quality, creative)
- **Plot Suggestions**: GPT-3.5-turbo (fast, cost-effective)
- **Plot Hole Detection**: Claude-3.5-sonnet (analytical, detailed)
- **Character Analysis**: GPT-3.5-turbo (speed optimization)

**Fallback Strategy:**

- Primary model unavailable → Try alternative model
- All AI unavailable → Use template-based generation (current implementation)
- Rate limited → Cache results, implement exponential backoff

### Database Design (UPDATED: Turso Embedded Replicas)

**Turso with Embedded Replicas:**

- **Local-first**: SQLite file (`file:plot-engine.db`) for zero-latency reads
- **Cloud sync**: Automatic sync with Turso cloud database
- **Offline-capable**: Works without network, syncs when available
- **Read-your-writes**: Consistency guarantee after writes
- **Auto-sync**: Configurable interval (60s default)
- **SQL queries**: Full SQL power instead of IndexedDB API
- **Automatic migrations**: SQL schema versioning

**Cache Strategy (TTL-based):**

- Analysis results: 5-minute TTL (via `expires_at` column)
- Plot structures: Persistent (no expiration)
- Character graphs: 10-minute TTL
- Automatic cleanup: SQL query deletes expired rows

**Architecture Pattern:**

```javascript
import { createClient } from '@libsql/client/web';

const plotClient = createClient({
  url: 'file:plot-engine.db',
  syncUrl: process.env.VITE_TURSO_DATABASE_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN,
  syncInterval: 60000, // 60s
});
```

**Benefits over IndexedDB:**

- ✅ Simpler API (SQL vs callbacks)
- ✅ Cloud sync built-in
- ✅ Consistent with existing codebase (`src/lib/db.ts`)
- ✅ No type serialization issues

### Visualization Libraries

**Decisions:**

- **Graph Visualization**: D3.js (flexible, powerful)
- **Charts**: Recharts (React-friendly, accessible)
- **Timeline**: Custom React component (full control)

**Accessibility:**

- All charts support keyboard navigation
- Screen reader labels provided
- Color contrast meets WCAG AA
- Alternative text for visualizations

---

## Monitoring & Observability

### Metrics to Track

**Performance Metrics**

- Plot generation time (P50, P95, P99)
- Analysis completion time (P50, P95, P99)
- Database query latency
- UI render time

**Quality Metrics**

- AI response coherence (user ratings)
- Plot hole detection accuracy (user feedback)
- Analysis result acceptance rate
- Feature usage statistics

**Error Metrics**

- AI API failure rate
- Network error rate
- Database error rate
- UI crash rate

### Logging Strategy

**Log Events:**

- All AI API calls (model, tokens, cost, latency)
- Analysis requests (projectId, type, duration)
- Database operations (type, success/failure)
- User interactions (feature used, duration)

**Log Levels:**

- ERROR: Critical failures requiring attention
- WARN: Issues that don't block functionality
- INFO: Normal operations and milestones
- DEBUG: Detailed information for troubleshooting

---

## Rollout Plan

### Phase 1: Internal Testing (Days 1-10)

- Development team uses feature
- Fix critical bugs
- Performance optimization
- **Status Gate**: All tests passing, performance benchmarks met

### Phase 2: Beta (Days 11-14)

- Select users access beta
- Collect feedback
- Address high-priority issues
- **Status Gate**: User satisfaction >80%, zero critical bugs

### Phase 3: Public Rollout (Day 15)

- Feature available to all users
- Monitor metrics closely
- Ready to rollback if issues arise
- **Status Gate**: Stable for 48 hours, no critical issues

### Phase 4: Post-Launch (Ongoing)

- Weekly metrics review
- Monthly user feedback sessions
- Quarterly feature enhancements
- **Status Gate**: Continuous improvement based on feedback

---

## Post-Launch Support

### Maintenance Tasks

**Weekly**

- Monitor error logs and metrics
- Address high-priority bugs
- Review user feedback

**Monthly**

- Analyze feature usage statistics
- Review AI costs and optimize
- Update documentation based on questions

**Quarterly**

- Performance optimization review
- Feature enhancement planning
- User satisfaction survey

### Future Enhancements

**Short Term (Next 3 months)**

- Export plot structures to PDF/Markdown
- Import plot templates
- Collaborative plot editing
- Version history for plots

**Medium Term (3-6 months)**

- Multi-story plot management
- Plot structure templates library
- Advanced character arc tracking
- Predictive narrative suggestions

**Long Term (6+ months)**

- AI co-writing assistance
- Narrative style analysis
- Market-aware plot suggestions
- Cross-platform synchronization

---

## Appendix

### File Structure

```
src/features/plot-engine/
├── components/
│   ├── PlotAnalyzer.tsx           ✅ Complete (needs integration)
│   ├── PlotGenerator.tsx          ❌ New component needed
│   ├── StoryArcVisualizer.tsx     🚧 Partial (needs interactivity)
│   ├── PlotHoleDetectorView.tsx   🚧 Partial (needs features)
│   ├── CharacterGraphView.tsx     🚧 Partial (needs visualization)
│   └── PlotEngineDashboard.tsx    ✅ Complete (needs integration)
├── hooks/
│   ├── usePlotAnalysis.ts         ❌ Not implemented
│   ├── usePlotGeneration.ts       ❌ Not implemented
│   └── useCharacterGraph.ts       ❌ Not implemented
├── services/
│   ├── plotAnalysisService.ts     ✅ Complete (tested)
│   ├── plotGenerationService.ts   ✅ Complete (needs AI integration)
│   ├── plotHoleDetector.ts        ✅ Complete (needs tests)
│   ├── characterGraphService.ts   ✅ Complete (needs tests)
│   └── plotStorageService.ts      ❌ Not implemented (database)
├── types/
│   └── index.ts                   ✅ Complete
└── index.ts                       ✅ Complete
```

### Testing Matrix

| Component             | Unit Tests      | Integration Tests | E2E Tests      | Status  |
| --------------------- | --------------- | ----------------- | -------------- | ------- |
| PlotAnalysisService   | ✅ 9/9          | ❌ 0/3            | ❌ 0/2         | 30%     |
| PlotGenerationService | ✅ 14/14        | ❌ 0/5            | ❌ 0/3         | 30%     |
| PlotHoleDetector      | ❌ 0/10         | ❌ 0/2            | ❌ 0/1         | 0%      |
| CharacterGraphService | ❌ 0/8          | ❌ 0/2            | ❌ 0/1         | 0%      |
| React Hooks           | ❌ 0/6          | ❌ 0/0            | ❌ 0/0         | 0%      |
| UI Components         | ❌ 0/5          | ❌ 0/0            | ✅ 1/3         | 15%     |
| **Overall**           | **23/52** (44%) | **0/12** (0%)     | **1/10** (10%) | **23%** |

### Task Dependency Graph

```
┌─────────────────┐
│ AI Gateway     │
│ Integration    │
└────────┬────────┘
         │
         ├─────────────┐
         │             │
         ▼             ▼
┌──────────────┐  ┌──────────────┐
│ Plot         │  │ RAG          │
│ Generation   │  │ Integration  │
│ Service      │  └──────┬───────┘
└──────┬───────┘         │
       │                 │
       ▼                 ▼
┌──────────────────────────────┐
│ React Hooks                  │
│ (usePlotAnalysis, etc.)     │
└──────┬───────────────────────┘
       │
       ├────────────────────┐
       │                    │
       ▼                    ▼
┌──────────────┐    ┌──────────────┐
│ UI Components │    │ Database     │
│ Integration  │    │ Layer        │
└──────┬───────┘    └──────┬───────┘
       │                   │
       └────────┬──────────┘
                ▼
       ┌────────────────┐
       │ Testing        │
       │ & Documentation│
       └────────┬───────┘
                ▼
       ┌────────────────┐
       │ Production     │
       │ Deployment    │
       └────────────────┘
```

---

**Last Updated**: January 5, 2026 **Next Review**: Daily during development
weeks **Owner**: Development Team
