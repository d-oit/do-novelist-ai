# RAG Phase 2+: Enhancement & Optimization Plan

**Date**: January 7, 2026  
**Owner**: GOAP Agent  
**Status**: 📋 Planning  
**Priority**: P2 (High Value, Not Blocking)  
**Estimated Effort**: 1-2 weeks

---

## Executive Summary

**Current State**: RAG Phases 1-3 are **100% COMPLETE** ✅

- ✅ Phase 1: Vector DB, Embeddings, Similarity (Complete)
- ✅ Phase 2: Content Processing, Sync, Batch Processing (Complete)
- ✅ Phase 3: Search API, UI Components, Testing (Complete)

**What's Working:**

- 9/9 semantic search tests passing
- Vector database with SQLite storage
- Embedding generation via OpenRouter
- SearchModal with Cmd+K shortcut
- Entity hydration and RAG context assembly
- Performance: <500ms searches, <2s for 100 results

**This Plan**: Enhance the existing implementation with production-grade
features:

1. Query result caching (80% redundancy reduction)
2. Hybrid search (vector + keyword)
3. Advanced ranking algorithms
4. Performance monitoring & analytics
5. UI/UX improvements

---

## Gap Analysis

### ✅ What's Already Built

| Component         | Status      | Quality                         |
| ----------------- | ----------- | ------------------------------- |
| Vector Database   | ✅ Complete | Production-ready                |
| Embedding Service | ✅ Complete | OpenAI via OpenRouter           |
| Similarity Search | ✅ Complete | Cosine, Euclidean, Manhattan    |
| Sync Service      | ✅ Complete | Auto-sync on content changes    |
| Search API        | ✅ Complete | Result hydration + RAG assembly |
| Search UI         | ✅ Complete | Cmd+K modal, keyboard nav       |
| Tests             | ✅ Complete | 9 unit + 6 performance tests    |

### 🎯 Enhancement Opportunities

Based on the Phase 3 recommendations and roadmap:

| Enhancement                | Impact | Effort | Priority |
| -------------------------- | ------ | ------ | -------- |
| **Query Caching**          | High   | 2 days | P1       |
| **Hybrid Search**          | High   | 3 days | P1       |
| **Advanced Ranking**       | Medium | 2 days | P2       |
| **Performance Monitoring** | Medium | 2 days | P2       |
| **UI/UX Polish**           | Medium | 2 days | P2       |
| **Query Suggestions**      | Low    | 2 days | P3       |

**Total Estimated Effort**: 13 days (2 weeks with testing/buffer)

---

## Enhancement 1: Query Result Caching

**Priority**: P1 (High Impact)  
**Effort**: 2 days  
**Impact**: 80% reduction in redundant queries, faster response times

### Problem Statement

- Same queries are executed multiple times (e.g., "Who is Elara?" asked
  repeatedly)
- Embedding generation costs money (OpenAI API)
- Vector similarity computation is expensive for large datasets
- No caching layer exists for search results

### Solution Design

#### Architecture

```typescript
// New file: src/features/semantic-search/services/query-cache.ts
interface QueryCacheEntry {
  query: string;
  projectId: string;
  results: HydratedSearchResult[];
  embedding: number[]; // Cache the query embedding too
  timestamp: number;
  hitCount: number;
}

class QueryCache {
  private cache = new Map<string, QueryCacheEntry>();
  private readonly TTL_MS = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_ENTRIES = 100;

  // Cache key: hash of (query + projectId)
  get(query: string, projectId: string): HydratedSearchResult[] | null;
  set(
    query: string,
    projectId: string,
    results: HydratedSearchResult[],
    embedding: number[],
  ): void;
  invalidateProject(projectId: string): void;
  getStats(): CacheStats;
}
```

#### Implementation Steps

**Day 1: Core Caching**

1. Create `query-cache.ts` service
   - LRU cache with TTL (5 min default)
   - Cache key: `${projectId}:${queryHash}`
   - Store: `{ query, results, embedding, timestamp, hitCount }`

2. Integrate into `searchService.search()`

   ```typescript
   async search(query: string, projectId: string) {
     // Check cache first
     const cached = queryCache.get(query, projectId);
     if (cached) return cached;

     // Generate embedding
     const embedding = await generateEmbedding(query);

     // Perform search
     const results = await vectorService.semanticSearch(...);

     // Cache results + embedding
     queryCache.set(query, projectId, results, embedding);

     return results;
   }
   ```

3. Cache invalidation triggers
   - When content changes (character updated, chapter edited)
   - On project deletion
   - Manual cache clear option

**Day 2: Testing & Monitoring**

4. Write tests
   - Cache hit/miss tracking
   - TTL expiration
   - Invalidation on content changes
   - LRU eviction

5. Add cache statistics to UI
   - Hit rate display in SearchModal footer
   - Admin panel for cache stats
   - Clear cache button

#### Success Metrics

- ✅ 80%+ cache hit rate after warm-up
- ✅ <50ms response time for cached queries
- ✅ Proper invalidation on content changes
- ✅ All tests passing

---

## Enhancement 2: Hybrid Search (Vector + Keyword)

**Priority**: P1 (High Impact)  
**Effort**: 3 days  
**Impact**: Better search accuracy, especially for exact matches

### Problem Statement

- Pure vector search sometimes misses exact keyword matches
- Users expect traditional keyword search behavior
- Vector embeddings may not capture exact terminology (e.g., character names,
  place names)

### Solution Design

#### Architecture

```typescript
// Extend search-service.ts
interface HybridSearchOptions {
  vectorWeight: number; // 0-1, default 0.7
  keywordWeight: number; // 0-1, default 0.3
  minKeywordScore: number; // default 0.1
  minVectorScore: number; // default 0.5
}

class SearchService {
  async hybridSearch(
    query: string,
    projectId: string,
    options?: HybridSearchOptions,
  ): Promise<HydratedSearchResult[]> {
    // 1. Vector search (semantic)
    const vectorResults = await this.search(query, projectId);

    // 2. Keyword search (text matching)
    const keywordResults = await this.keywordSearch(query, projectId);

    // 3. Merge and re-rank
    return this.mergeResults(vectorResults, keywordResults, options);
  }
}
```

#### Implementation Steps

**Day 1: Keyword Search**

1. Implement `keywordSearch()` method

   ```typescript
   // Uses SQLite FTS (Full-Text Search) on vectors table
   // Or in-memory keyword matching on entity content
   async keywordSearch(query: string, projectId: string) {
     // Tokenize query
     const tokens = tokenize(query);

     // Search in all entity types
     const [characters, chapters, locations] = await Promise.all([
       characterService.search(tokens),
       editorService.searchChapters(tokens),
       worldBuildingService.searchLocations(tokens),
     ]);

     // Score by keyword relevance (TF-IDF or simple term frequency)
     return scoreKeywordResults([...characters, ...chapters, ...locations]);
   }
   ```

2. Add tokenization and scoring utilities
   - Remove stop words ("the", "a", "an")
   - Stem words (optional, using stemmer library)
   - Calculate TF-IDF scores

**Day 2: Result Merging & Re-ranking**

3. Implement hybrid ranking algorithm
   ```typescript
   mergeResults(
     vectorResults: Result[],
     keywordResults: Result[],
     options: HybridSearchOptions
   ) {
     // Create map of entityId -> combined score
     const scoreMap = new Map<string, number>();

     // Add vector scores (normalized 0-1)
     for (const r of vectorResults) {
       scoreMap.set(r.entityId, r.score * options.vectorWeight);
     }

     // Add keyword scores (normalized 0-1)
     for (const r of keywordResults) {
       const existing = scoreMap.get(r.entityId) || 0;
       scoreMap.set(r.entityId, existing + r.score * options.keywordWeight);
     }

     // Sort by combined score
     return Array.from(scoreMap.entries())
       .sort((a, b) => b[1] - a[1])
       .map(([entityId, score]) => ({ entityId, score }));
   }
   ```

**Day 3: UI Integration & Testing**

4. Add search mode toggle to UI
   - Radio buttons: "Semantic" | "Keyword" | "Hybrid" (default)
   - Store preference in localStorage

5. Write tests
   - Keyword search accuracy
   - Hybrid ranking correctness
   - Edge cases (empty query, no matches)

#### Success Metrics

- ✅ Exact name matches always appear in top 3 results
- ✅ Hybrid search accuracy >80% (user feedback)
- ✅ All tests passing

---

## Enhancement 3: Advanced Ranking Algorithms

**Priority**: P2 (Medium Impact)  
**Effort**: 2 days  
**Impact**: More relevant results, better user experience

### Problem Statement

- Current ranking is purely based on vector similarity score
- No consideration for recency, popularity, or entity type
- No personalization based on user context

### Solution Design

#### Multi-Factor Ranking

```typescript
interface RankingFactors {
  vectorSimilarity: number; // 0-1, from cosine similarity
  recency: number; // 0-1, how recently modified
  popularity: number; // 0-1, view count / reference count
  entityTypeBoost: number; // Boost certain types (e.g., characters)
  contextRelevance: number; // Relevance to current chapter/scene
}

const RANKING_WEIGHTS = {
  vectorSimilarity: 0.5,
  recency: 0.1,
  popularity: 0.1,
  entityTypeBoost: 0.2,
  contextRelevance: 0.1,
};

function calculateFinalScore(factors: RankingFactors): number {
  return Object.entries(RANKING_WEIGHTS).reduce((score, [key, weight]) => {
    return score + factors[key] * weight;
  }, 0);
}
```

#### Implementation Steps

**Day 1: Add Ranking Metadata**

1. Extend vector service to track metadata
   - `lastModified` timestamp
   - `viewCount` (increment on access)
   - `referenceCount` (how often referenced in other entities)

2. Update vector schema (optional migration)
   ```sql
   ALTER TABLE vectors ADD COLUMN last_modified INTEGER;
   ALTER TABLE vectors ADD COLUMN view_count INTEGER DEFAULT 0;
   ALTER TABLE vectors ADD COLUMN reference_count INTEGER DEFAULT 0;
   ```

**Day 2: Implement Advanced Ranking**

3. Create `ranking-service.ts`
   - Calculate recency score (exponential decay)
   - Calculate popularity score (log scale)
   - Apply entity type boosts
   - Calculate context relevance (if current chapter provided)

4. Integrate into search service
   ```typescript
   async search(query: string, projectId: string, context?) {
     const rawResults = await vectorService.semanticSearch(...);

     // Apply advanced ranking
     const rankedResults = await rankingService.rank(
       rawResults,
       { currentChapter: context?.chapterId }
     );

     return rankedResults;
   }
   ```

#### Success Metrics

- ✅ Recently modified content appears higher in results
- ✅ Popular entities (frequently referenced) ranked higher
- ✅ Context-aware ranking improves relevance

---

## Enhancement 4: Performance Monitoring & Analytics

**Priority**: P2 (Medium Impact)  
**Effort**: 2 days  
**Impact**: Data-driven optimization, identify bottlenecks

### Solution Design

#### Analytics Dashboard

```typescript
interface SearchAnalytics {
  // Query metrics
  totalQueries: number;
  avgResponseTime: number;
  cacheHitRate: number;

  // Popular queries
  topQueries: { query: string; count: number }[];

  // Performance breakdown
  embeddingTime: number;
  searchTime: number;
  hydrationTime: number;

  // User behavior
  clickThroughRate: number;
  avgResultsPerQuery: number;
  noResultsRate: number;
}
```

#### Implementation Steps

**Day 1: Instrumentation**

1. Add performance tracking to search service
   ```typescript
   async search(query: string, projectId: string) {
     const startTime = performance.now();

     // Track embedding generation time
     const embeddingStart = performance.now();
     const embedding = await generateEmbedding(query);
     const embeddingTime = performance.now() - embeddingStart;

     // Track search time
     const searchStart = performance.now();
     const results = await vectorService.semanticSearch(...);
     const searchTime = performance.now() - searchStart;

     // Track hydration time
     const hydrationStart = performance.now();
     const hydrated = await this.hydrateResults(results);
     const hydrationTime = performance.now() - hydrationStart;

     // Log analytics
     analyticsService.trackSearch({
       query,
       projectId,
       resultCount: results.length,
       totalTime: performance.now() - startTime,
       embeddingTime,
       searchTime,
       hydrationTime,
     });

     return hydrated;
   }
   ```

**Day 2: Analytics UI**

2. Create analytics dashboard component
   - Display in Settings or Admin panel
   - Show cache hit rate, avg response time
   - Popular queries list
   - Performance breakdown chart

3. Add to existing analytics infrastructure
   - Integrate with `analyticsService.ts`
   - Store metrics in IndexedDB or send to backend

#### Success Metrics

- ✅ All search operations instrumented
- ✅ Analytics dashboard shows real-time metrics
- ✅ Identify slow queries for optimization

---

## Enhancement 5: UI/UX Polish

**Priority**: P2 (Medium Impact)  
**Effort**: 2 days  
**Impact**: Better user experience, more discoverable

### Improvements

#### A. Search Shortcuts & Discoverability

1. **Add global keyboard shortcut hint**
   - Show "Press Cmd+K to search" tooltip on first visit
   - Display in navbar or header

2. **Search command palette**
   - Add command categories: "Characters", "Locations", "Chapters"
   - Quick actions: "Find similar to current chapter"

#### B. Result Enhancements

3. **Rich result previews**
   - Show longer context snippets
   - Highlight matching terms
   - Add entity thumbnails/icons

4. **Result actions**
   - "Go to entity" button
   - "Add to context" button (for AI generation)
   - "View related" button

#### C. Search History

5. **Recent searches**
   - Show last 5 searches when modal opens
   - One-click to re-run

6. **Saved searches**
   - Pin frequently used queries
   - Name and organize saved searches

#### Implementation Steps

**Day 1: Keyboard Shortcuts & Command Palette**

1. Add command palette structure

   ```typescript
   interface SearchCommand {
     id: string;
     label: string;
     category: 'character' | 'chapter' | 'location' | 'action';
     action: () => void;
   }
   ```

2. Implement command filtering
   - Type-ahead matching
   - Category icons

**Day 2: Result Enhancements & History**

3. Enhanced result cards
   - Add thumbnails/icons per entity type
   - Highlight query terms in content preview
   - Action buttons with icons

4. Search history service
   ```typescript
   class SearchHistoryService {
     private history: SearchHistoryEntry[] = [];

     add(query: string, resultCount: number): void;
     getRecent(limit = 5): SearchHistoryEntry[];
     clear(): void;
   }
   ```

#### Success Metrics

- ✅ Users discover Cmd+K shortcut within first session
- ✅ Result previews are clear and informative
- ✅ Search history improves repeat query speed

---

## Enhancement 6: Query Suggestions (Optional)

**Priority**: P3 (Low Impact)  
**Effort**: 2 days  
**Impact**: Help users formulate better queries

### Solution Design

#### Auto-complete & Suggestions

```typescript
interface QuerySuggestion {
  text: string;
  type: 'entity' | 'question' | 'action';
  confidence: number;
}

async function getSuggestions(
  partialQuery: string,
  projectId: string,
): Promise<QuerySuggestion[]> {
  // 1. Entity name suggestions
  const entitySuggestions = await getEntityNameSuggestions(partialQuery);

  // 2. Common question templates
  const questionSuggestions = [
    'Who is [character]?',
    'What happened in [chapter]?',
    'Describe [location]',
  ];

  // 3. Previous query suggestions
  const historySuggestions = searchHistory.filter(q =>
    q.startsWith(partialQuery),
  );

  return [...entitySuggestions, ...questionSuggestions, ...historySuggestions];
}
```

#### Implementation

1. Add suggestion dropdown to SearchModal
2. Implement prefix matching on entity names
3. Show template questions
4. Display as user types (debounced)

---

## Implementation Timeline

### Week 1: Core Enhancements

| Day     | Tasks                         | Deliverables              |
| ------- | ----------------------------- | ------------------------- |
| **Mon** | Query caching implementation  | `query-cache.ts` service  |
| **Tue** | Cache testing & monitoring    | Tests, cache stats UI     |
| **Wed** | Keyword search implementation | `keywordSearch()` method  |
| **Thu** | Hybrid search merging         | Ranking algorithm         |
| **Fri** | Hybrid search UI & tests      | Search mode toggle, tests |

### Week 2: Polish & Analytics

| Day     | Tasks                       | Deliverables                    |
| ------- | --------------------------- | ------------------------------- |
| **Mon** | Advanced ranking metadata   | Schema updates, ranking service |
| **Tue** | Ranking integration & tests | Updated search service          |
| **Wed** | Performance instrumentation | Analytics tracking              |
| **Thu** | Analytics dashboard         | UI components                   |
| **Fri** | UI/UX polish                | Enhanced SearchModal            |

### Optional: Week 3 (Query Suggestions)

| Day         | Tasks                  | Deliverables          |
| ----------- | ---------------------- | --------------------- |
| **Mon-Tue** | Query suggestions      | Autocomplete dropdown |
| **Wed-Fri** | Buffer & final testing | Full test suite, docs |

---

## Success Criteria

### Technical Metrics

- ✅ Cache hit rate: >80%
- ✅ Hybrid search accuracy: >80% relevant results in top 5
- ✅ Response time: <100ms for cached, <500ms for uncached
- ✅ All tests passing: 20+ new tests
- ✅ 0 lint errors, 0 TypeScript errors

### User Experience Metrics

- ✅ Search discoverability: Users find Cmd+K within 5 minutes
- ✅ Result relevance: >90% of searches find what they're looking for
- ✅ Repeat usage: 50%+ of users use search multiple times per session

### Code Quality

- ✅ Modular design with clear separation of concerns
- ✅ Comprehensive test coverage (>90%)
- ✅ Documentation for all new services
- ✅ Performance benchmarks for all features

---

## Risks & Mitigations

| Risk                        | Impact | Likelihood | Mitigation                                    |
| --------------------------- | ------ | ---------- | --------------------------------------------- |
| **Cache invalidation bugs** | High   | Medium     | Comprehensive tests, clear invalidation rules |
| **Keyword search accuracy** | Medium | Medium     | Hybrid weighting adjustable by user           |
| **Performance regression**  | High   | Low        | Benchmarks on every change, rollback plan     |
| **Complexity creep**        | Medium | Medium     | Keep enhancements modular, optional flags     |

---

## Dependencies

### External Dependencies

- ✅ OpenRouter API (already integrated)
- ✅ SQLite/Turso database (already set up)
- ✅ Existing vector service (complete)

### Internal Dependencies

- ✅ Character service
- ✅ Chapter/editor service
- ✅ World-building service
- ✅ Analytics service

**No blockers - ready to start immediately.**

---

## Testing Strategy

### Unit Tests (20+ new tests)

1. **Query Cache**
   - Hit/miss tracking
   - TTL expiration
   - LRU eviction
   - Project invalidation

2. **Hybrid Search**
   - Keyword matching accuracy
   - Result merging correctness
   - Weight configuration

3. **Advanced Ranking**
   - Recency calculation
   - Popularity scoring
   - Entity type boosts

4. **Analytics**
   - Metric tracking
   - Performance measurement

### Integration Tests

5. **End-to-End Search**
   - Cache → Search → Hydration flow
   - Hybrid search workflow
   - Analytics tracking

### Performance Tests

6. **Benchmarks**
   - Cached query: <50ms
   - Uncached query: <500ms
   - Hybrid search: <800ms
   - 100 concurrent queries: <2s

---

## Documentation

### Required Documentation

1. **Technical Docs**
   - `src/features/semantic-search/README.md` (update)
   - API documentation for new services
   - Architecture diagrams

2. **User Guides**
   - Search tips and best practices
   - Keyboard shortcuts reference
   - Search mode explanations

3. **Admin Guides**
   - Cache management
   - Performance monitoring
   - Troubleshooting guide

---

## Rollout Plan

### Phase 1: Internal Testing (Days 1-10)

- Enable features behind feature flags
- Test with development data
- Gather internal feedback

### Phase 2: Beta Release (Days 11-14)

- Enable for beta users
- Monitor performance metrics
- Collect user feedback

### Phase 3: Full Release (Day 15+)

- Enable for all users
- Announce new features
- Monitor adoption metrics

---

## Future Enhancements (Post Phase 2+)

### Phase 3: Collaborative Context (Roadmap Item)

- Multi-user search
- Shared context workspaces
- Team collaboration features

### Phase 4: Advanced AI Integration

- Search result summaries (AI-generated)
- Question answering over search results
- Automatic context suggestions

### Phase 5: Cross-Project Search

- Search across multiple novels
- Series-wide character tracking
- Universe building tools

---

## Conclusion

This enhancement plan builds on the solid RAG foundation (Phases 1-3) to deliver
production-grade semantic search with:

1. **Performance**: Query caching reduces latency and costs
2. **Accuracy**: Hybrid search improves result relevance
3. **Intelligence**: Advanced ranking adapts to user behavior
4. **Visibility**: Analytics provide insights for optimization
5. **Usability**: Polished UI makes search delightful

**Recommendation**: Start with **Enhancements 1 & 2** (caching + hybrid search)
for maximum impact in 5 days.

---

**Next Steps:**

1. Review and approve this plan
2. Create feature flags for gradual rollout
3. Set up performance benchmarks baseline
4. Begin Enhancement 1: Query Caching

**Ready to begin implementation upon approval.** ✅
