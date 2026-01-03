# RAG Phase 1 Implementation Plan - January 2026

**Date**: January 3, 2026  
**Status**: 🚧 In Progress  
**Timeline**: 2 weeks (Full Implementation)  
**Priority**: HIGH

---

## 🎯 Overview

RAG (Retrieval-Augmented Generation) Phase 1 will make the AI context-aware by
automatically injecting relevant project information into all AI requests. This
ensures consistent, accurate, and context-aware content generation.

---

## 📊 Current State Analysis

### ✅ What Already Exists

**Infrastructure Built (70% Complete)**:

1. ✅ **Context Extraction Service** (`src/lib/context/contextExtractor.ts`)
   - Extracts project metadata, characters, world-building, chapters
   - Token estimation and trimming
   - Caching support
   - Tests: ✅ 13 tests passing

2. ✅ **Context Injection Service** (`src/lib/context/contextInjector.ts`)
   - Injects context into prompts
   - System/user prompt placement options
   - `ContextAwarePrompts` class for specific operations
   - Tests: ✅ 15 tests passing

3. ✅ **Context Cache** (`src/lib/context/cache.ts`)
   - Hit/miss tracking (NEW from TODO work!)
   - Hash-based invalidation
   - Stats API
   - Tests: ✅ 7 tests passing

4. ✅ **Type Definitions** (`src/lib/context/types.ts`)
   - ContextPriority, ContextType enums
   - ContextChunk, ProjectContext interfaces
   - OperationContext for specific use cases

### ❌ What's Missing (30%)

**Integration Gaps**:

1. ❌ **API Endpoint Integration** - Context not used in any AI endpoints
2. ❌ **UI Controls** - No way to enable/disable context injection
3. ❌ **Context Preview** - Can't see what context will be sent
4. ❌ **Usage Tracking** - No metrics on context injection effectiveness
5. ❌ **Token Budget Management** - No dynamic token allocation

---

## 🏗️ Implementation Phases

### Phase 1: API Integration (Week 1, Days 1-4)

**Goal**: Integrate context injection into all AI endpoints

#### Day 1-2: Core API Integration

- [ ] Add context injection to `api/ai/generate.ts`
- [ ] Add context injection to `api/ai/chapter.ts`
- [ ] Add context injection to `api/ai/outline.ts`
- [ ] Add context injection to `api/ai/characters.ts`
- [ ] Add context injection to `api/ai/world.ts`

**Implementation Pattern**:

```typescript
// Before
const response = await openai.chat.completions.create({
  messages: [{ role: 'user', content: prompt }],
});

// After
import { injectProjectContext } from '@/lib/context';

const enhanced = await injectProjectContext(project, prompt, systemPrompt, {
  includeContext: enableContext,
});

const response = await openai.chat.completions.create({
  messages: [
    { role: 'system', content: enhanced.systemPrompt },
    { role: 'user', content: enhanced.userPrompt },
  ],
});
```

#### Day 3: Endpoint Configuration

- [ ] Add `enableContext` parameter to all AI endpoints
- [ ] Add context options configuration
- [ ] Update API request/response types
- [ ] Add context usage to cost tracking

#### Day 4: Testing & Validation

- [ ] Test each endpoint with context enabled
- [ ] Verify context quality and relevance
- [ ] Check token usage stays within limits
- [ ] Validate caching behavior

---

### Phase 2: UI Controls (Week 1, Days 5-7)

**Goal**: Allow users to control context injection

#### Day 5: Settings Panel

- [ ] Add "AI Context" section to Settings
- [ ] Toggle: Enable/Disable context injection
- [ ] Slider: Max context tokens (2000-8000)
- [ ] Checkboxes: Include characters, world-building, chapters, timeline
- [ ] Save preferences to localStorage/DB

#### Day 6: Context Preview Component

- [ ] Create `ContextPreview.tsx` component
- [ ] Show formatted context that will be sent
- [ ] Display token count estimate
- [ ] Real-time updates when project changes
- [ ] Expandable/collapsible sections

#### Day 7: In-Editor Context Controls

- [ ] Add context toggle to chapter editor
- [ ] Show context indicator when enabled
- [ ] Quick context preview tooltip
- [ ] Per-generation context override

---

### Phase 3: Advanced Features (Week 2, Days 8-12)

**Goal**: Optimize and enhance context injection

#### Day 8-9: Smart Context Selection

- [ ] Implement relevance scoring for context chunks
- [ ] Prioritize recent chapters over old ones
- [ ] Include only relevant characters based on current chapter
- [ ] Dynamic token budget allocation

#### Day 10: Context Analytics

- [ ] Track context injection usage per endpoint
- [ ] Measure impact on generation quality
- [ ] Monitor token usage overhead
- [ ] Add to metrics dashboard

#### Day 11: Context Management UI

- [ ] "Manage Context" button in project dashboard
- [ ] View extracted context
- [ ] Manually include/exclude items
- [ ] Reset context cache

#### Day 12: Performance Optimization

- [ ] Optimize context extraction performance
- [ ] Implement incremental updates
- [ ] Add background context refresh
- [ ] Reduce cache miss rate

---

### Phase 4: Testing & Documentation (Week 2, Days 13-14)

#### Day 13: Comprehensive Testing

- [ ] Unit tests for new integrations
- [ ] Integration tests for AI endpoints
- [ ] E2E tests for context-aware generation
- [ ] Performance benchmarks

#### Day 14: Documentation

- [ ] User guide for context features
- [ ] API documentation
- [ ] Architecture documentation
- [ ] Migration guide

---

## 🎨 UI Components to Build

### 1. AI Context Settings Panel

```typescript
interface AIContextSettings {
  enabled: boolean;
  maxTokens: number;
  includeCharacters: boolean;
  includeWorldBuilding: boolean;
  includeChapters: boolean;
  includeTimeline: boolean;
  contextPlacement: 'system' | 'before' | 'after';
}
```

**Location**: Settings → AI Settings → Context Injection

**Features**:

- Master toggle (Enable/Disable)
- Token budget slider (2000-8000)
- Context type checkboxes
- Placement strategy selector
- Preview button

---

### 2. Context Preview Component

```typescript
<ContextPreview
  project={currentProject}
  options={contextSettings}
  showTokenCount={true}
  collapsible={true}
/>
```

**Features**:

- Formatted markdown display
- Section collapsing (Characters, World, Chapters)
- Token count per section
- Total token estimate
- "Copy Context" button
- "Refresh Context" button

---

### 3. Context Indicator Badge

```typescript
<ContextBadge
  enabled={contextEnabled}
  tokenCount={estimatedTokens}
  onClick={showContextPreview}
/>
```

**Location**: Chapter editor toolbar, generation dialogs

**Features**:

- Green badge when enabled
- Token count display
- Click to preview context
- Tooltip with quick info

---

## 📊 Success Metrics

### Technical Metrics

- **Context Injection Rate**: >80% of AI requests use context
- **Cache Hit Rate**: >70% (already tracking!)
- **Average Context Tokens**: 3000-5000 per request
- **Context Extraction Time**: <100ms per request
- **Token Overhead**: <30% increase in request size

### Quality Metrics

- **Consistency Score**: Character names, places consistent
- **Relevance Score**: AI references project context
- **User Satisfaction**: Feedback on generation quality
- **Error Rate**: <5% context-related errors

### Performance Metrics

- **API Response Time**: <5s with context (was <4s without)
- **Cache Performance**: Monitored in metrics dashboard
- **Memory Usage**: <50MB for context cache
- **Token Costs**: Tracked in PostHog analytics

---

## 🔧 Technical Architecture

### Data Flow

```
┌─────────────┐
│   User      │
│  Request    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Check     │
│   Cache     │ ◄─── Cache Hit? Return cached context
└──────┬──────┘
       │ Cache Miss
       ▼
┌─────────────┐
│   Extract   │
│   Context   │ ◄─── Project data, characters, world, chapters
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Format    │
│  & Inject   │ ◄─── Apply token limits, format for AI
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  AI API     │
│  Request    │ ◄─── Enhanced prompt with context
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Cache     │
│   Result    │ ◄─── Store context for reuse
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Response   │
│  to User    │
└─────────────┘
```

### Token Budget Allocation

```typescript
Total Request Budget: 128k tokens (OpenRouter models)

Breakdown:
- System Prompt: 500-1000 tokens
- Context Injection: 3000-5000 tokens  ← RAG Phase 1
- User Prompt: 500-2000 tokens
- Response: 2000-4000 tokens
- Buffer: 2000 tokens (safety)

Context Token Budget (5000 max):
- Project Metadata: 500 tokens (10%)
- Characters: 1500 tokens (30%)
- World Building: 1000 tokens (20%)
- Chapters: 1500 tokens (30%)
- Timeline: 500 tokens (10%)
```

---

## 🎯 Implementation Priority

### Must Have (Week 1)

1. ✅ Basic context injection in all AI endpoints
2. ✅ Enable/disable toggle in settings
3. ✅ Context caching integration
4. ✅ Token limit enforcement

### Should Have (Week 2)

5. ⭐ Context preview component
6. ⭐ Smart context selection
7. ⭐ Context analytics
8. ⭐ Performance optimization

### Nice to Have (Future)

9. 🔮 Semantic search for relevant context
10. 🔮 User-defined context priorities
11. 🔮 A/B testing with/without context
12. 🔮 Context version history

---

## 🚧 Risks & Mitigation

### Risk 1: Token Budget Overruns

**Mitigation**:

- Strict token limits enforced
- Dynamic trimming based on priority
- Context preview before sending

### Risk 2: Context Staleness

**Mitigation**:

- Hash-based cache invalidation (already implemented)
- TTL of 5 minutes (already implemented)
- Manual refresh option

### Risk 3: Performance Impact

**Mitigation**:

- Aggressive caching (70%+ hit rate expected)
- Lazy context extraction
- Background refresh

### Risk 4: Poor Context Quality

**Mitigation**:

- User controls to customize context
- Preview before sending
- Iterative refinement based on feedback

---

## 📚 Dependencies

### External

- ✅ OpenRouter SDK (already integrated)
- ✅ PostHog analytics (already integrated)
- ✅ Vercel serverless functions (already deployed)

### Internal

- ✅ Context extraction service (built)
- ✅ Context injection service (built)
- ✅ Context cache with stats (built)
- ✅ Metrics dashboard (just built!)
- ❌ Settings persistence (need to build)
- ❌ Context UI components (need to build)

---

## 🎉 Expected Benefits

### For Users

- **Better AI Consistency**: Characters stay in character
- **Fewer Errors**: AI remembers plot points
- **Higher Quality**: Context-aware generation
- **Time Savings**: Less manual prompting needed

### For System

- **Reusability**: Cached context reduces extraction overhead
- **Observability**: Metrics on context usage
- **Scalability**: Efficient token usage
- **Maintainability**: Centralized context logic

---

## 📅 Timeline Summary

```
Week 1: API Integration + UI Controls
├── Day 1-2: Integrate all AI endpoints
├── Day 3: Configuration & params
├── Day 4: Testing & validation
├── Day 5: Settings panel
├── Day 6: Context preview
└── Day 7: Editor controls

Week 2: Advanced Features + Polish
├── Day 8-9: Smart selection
├── Day 10: Analytics
├── Day 11: Management UI
├── Day 12: Optimization
├── Day 13: Testing
└── Day 14: Documentation
```

---

## ✅ Next Steps

**Immediate (Today)**:

1. Review and approve this plan
2. Start Day 1-2: API Integration
3. Update TODO list with specific tasks

**Short Term (This Week)**: 4. Complete API integration 5. Build settings
panel 6. Test with real projects

**Medium Term (Next Week)**: 7. Advanced features 8. Performance tuning 9.
Documentation

---

## 📊 Progress Tracking

Current Status: **30% Complete** (Infrastructure built, not integrated)

```
[██████░░░░░░░░░░░░░░░░] 30%

Completed:
✅ Context extraction service
✅ Context injection service
✅ Context caching
✅ Type definitions
✅ Unit tests
✅ Metrics dashboard (for monitoring)

In Progress:
🚧 Implementation plan (this document)

Pending:
⏳ API endpoint integration
⏳ UI components
⏳ Settings persistence
⏳ Context preview
⏳ Analytics
⏳ Documentation
```

---

**Plan Created**: January 3, 2026  
**Plan Owner**: Rovo Dev  
**Review Status**: Ready for approval  
**Estimated Completion**: January 17, 2026
