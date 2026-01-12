# Semantic Search Feature

The Semantic Search feature provides AI-powered content discovery using vector
embeddings, enabling authors to find relevant content by meaning rather than
exact keyword matches.

## Overview

Semantic Search helps authors:

- 🔍 **Find by Meaning** - Search by concepts, not just keywords
- ⚡ **Fast Results** - Intelligent caching and optimized queries
- 🎯 **Contextual Discovery** - Find related characters, chapters, world
  elements
- 📊 **Relevance Ranking** - Results ranked by semantic similarity
- 🔄 **Real-time Sync** - Auto-index new content as it's created
- 💾 **Offline Support** - Cached results available offline

## How It Works

### Vector Embeddings Pipeline

```
Content → Embedding Model → Vector DB → Search Index
   ↓                                         ↑
Write/Edit → Batch Process → Sync Service → Query Cache
```

**Steps**:

1. **Content Processing**: Extract searchable text from chapters, characters,
   etc.
2. **Embedding Generation**: Convert text to vector embeddings using AI
3. **Vector Storage**: Store embeddings in vector database
4. **Query Matching**: Convert search query to vector, find similar embeddings
5. **Result Hydration**: Fetch full entities from database
6. **Cache Results**: Store for fast repeated searches

## Architecture

```
semantic-search/
├── components/              # UI Components
│   ├── SearchModal.tsx             # Main search interface
│   ├── SearchResults.tsx           # Results list
│   ├── SearchResultItem.tsx        # Individual result card
│   └── CacheStats.tsx              # Cache performance metrics
│
└── services/                # Business Logic
    ├── search-service.ts           # High-level search orchestration
    ├── content-processor.ts        # Extract searchable content
    ├── batch-processor.ts          # Batch embedding generation
    ├── sync-service.ts             # Auto-sync new content
    └── query-cache.ts              # Query result caching
```

## Key Components

### SearchModal

Main search interface with keyboard shortcuts.

**Features**:

- Keyboard shortcut trigger (Cmd/Ctrl + K)
- Real-time search as you type
- Filter by entity type (chapters, characters, locations)
- Result preview
- Keyboard navigation
- Recent searches

**Usage**:

```tsx
import { SearchModal } from '@/features/semantic-search';

<SearchModal
  projectId={projectId}
  isOpen={isSearchOpen}
  onClose={() => setIsSearchOpen(false)}
  onResultSelect={result => navigate(result.url)}
/>;
```

**Keyboard Shortcuts**:

- `Cmd/Ctrl + K` - Open search
- `↑/↓` - Navigate results
- `Enter` - Select result
- `Esc` - Close modal

---

### SearchResults

Displays search results with relevance scores.

**Features**:

- Relevance score display
- Entity type badges
- Preview snippets
- Highlighting of matched terms
- Load more pagination
- Empty state handling

**Usage**:

```tsx
import { SearchResults } from '@/features/semantic-search';

<SearchResults
  results={searchResults}
  query={searchQuery}
  onResultClick={result => handleSelect(result)}
  isLoading={isSearching}
/>;
```

---

### CacheStats

Development/debug component showing cache performance.

**Features**:

- Cache hit/miss rates
- Query performance metrics
- Cache size monitoring
- Clear cache controls

**Usage**:

```tsx
import { CacheStats } from '@/features/semantic-search';

<CacheStats projectId={projectId} />;
```

---

## Services

### SearchService

High-level search orchestration.

```typescript
import { SearchService } from '@/features/semantic-search';

const searchService = new SearchService();

// Basic search
const results = await searchService.search('dark forest encounter', projectId);

// Filtered search
const characterResults = await searchService.search('brave hero', projectId, {
  entityTypes: ['character'],
  minScore: 0.7,
  limit: 5,
});

// Search with filters
const filteredResults = await searchService.search(query, projectId, {
  entityTypes: ['chapter', 'character'],
  minScore: 0.6, // Minimum similarity (0-1)
  limit: 20, // Max results
  includeMetadata: true, // Include entity metadata
});
```

**Search Filters**:

```typescript
interface SearchFilters {
  entityTypes?: VectorEntityType[]; // Filter by type
  minScore?: number; // Minimum similarity (0-1)
  limit?: number; // Max results
  includeMetadata?: boolean; // Include extra data
}

type VectorEntityType =
  | 'chapter'
  | 'character'
  | 'location'
  | 'lore'
  | 'culture';
```

---

### ContentProcessor

Extracts and processes searchable content from entities.

```typescript
import { ContentProcessor } from '@/features/semantic-search';

const processor = new ContentProcessor();

// Process chapter content
const processed = await processor.processChapter({
  id: chapterId,
  title: 'Chapter 1',
  content: 'Full chapter text...',
  summary: 'Brief summary...',
});

// Process character
const characterContent = await processor.processCharacter({
  id: characterId,
  name: 'John Doe',
  description: 'Character description...',
  traits: ['brave', 'intelligent'],
});

// Batch process multiple entities
const batch = await processor.processBatch([
  { type: 'chapter', entity: chapter1 },
  { type: 'character', entity: char1 },
]);
```

---

### BatchProcessor

Handles bulk embedding generation with batching and retry logic.

```typescript
import { BatchProcessor } from '@/features/semantic-search';

const batchProcessor = new BatchProcessor();

// Index project content
await batchProcessor.indexProject(projectId);

// Index specific entities
await batchProcessor.indexEntities([
  { type: 'chapter', id: 'ch1' },
  { type: 'chapter', id: 'ch2' },
  { type: 'character', id: 'char1' },
]);

// Check indexing status
const status = await batchProcessor.getIndexingStatus(projectId);
// { indexed: 45, pending: 5, failed: 0 }
```

**Batch Configuration**:

```typescript
const config = {
  batchSize: 10, // Entities per batch
  concurrency: 2, // Parallel batches
  retryAttempts: 3, // Retry failed embeddings
  delayBetweenBatches: 1000, // ms delay
};
```

---

### SyncService

Auto-syncs new and modified content to search index.

```typescript
import { SyncService } from '@/features/semantic-search';

const syncService = new SyncService();

// Start auto-sync (monitors changes)
syncService.start(projectId);

// Manual sync
await syncService.syncProject(projectId);

// Sync specific entity
await syncService.syncEntity({
  type: 'chapter',
  id: chapterId,
  action: 'update', // 'create' | 'update' | 'delete'
});

// Stop auto-sync
syncService.stop();
```

**Sync Triggers**:

- Chapter saved/updated
- Character created/modified
- World element added
- Location updated
- Manual refresh

---

### QueryCache

In-memory LRU cache for search results.

```typescript
import { queryCache } from '@/features/semantic-search';

// Cache automatically used by SearchService
// Manual cache operations:

// Get cached result
const cached = queryCache.get('query-key', projectId);

// Set cache entry
queryCache.set('query-key', projectId, results, {
  ttl: 300000, // 5 minutes
});

// Clear project cache
queryCache.clearProject(projectId);

// Clear all cache
queryCache.clearAll();

// Get cache stats
const stats = queryCache.getStats();
// { hits: 45, misses: 12, hitRate: 0.789 }
```

**Cache Configuration**:

```typescript
const CACHE_CONFIG = {
  maxSize: 100, // Max cached queries
  defaultTTL: 300000, // 5 minutes
  cleanupInterval: 60000, // Cleanup every minute
};
```

---

## Data Flow

### Search Flow

```
User Query → SearchService → Query Cache (check)
                                    ↓
                    (miss) → Vector Search → Similarity Results
                                                      ↓
                           Hydrate Entities ← Database
                                    ↓
                           Cache Results → Return to UI
```

### Indexing Flow

```
Content Change → Sync Service → Content Processor
                                        ↓
                        Extract Text → Generate Embedding
                                        ↓
                        Store Vector → Vector Database
                                        ↓
                        Update Index → Search Ready
```

---

## Vector Database Schema

### Vectors Table

```sql
CREATE TABLE vectors (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,       -- 'chapter' | 'character' | etc.
  entity_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  embedding BLOB NOT NULL,          -- Vector embedding
  content_preview TEXT,             -- First 200 chars
  metadata JSON,                    -- Additional context
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_vectors_entity ON vectors(entity_type, entity_id);
CREATE INDEX idx_vectors_project ON vectors(project_id);
```

---

## Embedding Model

**Model**: OpenAI `text-embedding-3-small` (default)

- Dimensions: 1536
- Max tokens: 8191
- Cost: $0.02 per 1M tokens

**Alternative Models**:

- `text-embedding-3-large` - Higher quality, more expensive
- `text-embedding-ada-002` - Legacy, stable

**Configuration**:

```typescript
const EMBEDDING_CONFIG = {
  model: 'text-embedding-3-small',
  dimensions: 1536,
  batchSize: 100, // Embeddings per API call
  maxTokens: 8000,
};
```

---

## Similarity Scoring

**Cosine Similarity** (0-1 scale):

- 0.9-1.0: Nearly identical
- 0.8-0.9: Very similar
- 0.7-0.8: Similar
- 0.6-0.7: Somewhat related
- <0.6: Not very related

**Default Threshold**: 0.6 (adjustable)

**Example Scores**:

```typescript
// Query: "dark forest encounter"
const results = [
  { score: 0.92, entity: 'Chapter 3: Into the Woods' },
  { score: 0.84, entity: 'Character: Forest Guardian' },
  { score: 0.71, entity: 'Location: Darkwood Forest' },
  { score: 0.58, entity: 'Chapter 7: Mountain Pass' }, // Below threshold
];
```

---

## Performance Optimization

### Caching Strategy

```typescript
// 3-level cache hierarchy
1. In-memory Query Cache (fast, 5min TTL)
2. IndexedDB Result Cache (medium, 1hr TTL)
3. Vector DB (slow, persistent)
```

### Batch Processing

```typescript
// Process entities in batches
const batches = chunk(entities, 10);
for (const batch of batches) {
  await generateEmbeddings(batch);
  await delay(1000); // Rate limiting
}
```

### Debounced Search

```typescript
// Debounce user input (300ms)
const debouncedSearch = debounce(
  query => searchService.search(query, projectId),
  300,
);
```

---

## Testing

### Unit Tests

- `search-service.test.ts` - Search orchestration
- `content-processor.test.ts` - Content extraction
- `query-cache.test.ts` - Cache operations

### Integration Tests

- `search-performance.test.ts` - Performance benchmarks
- End-to-end search flow
- Batch indexing

### E2E Tests

- Search modal interactions
- Keyboard shortcuts
- Result selection

**Run Tests**:

```bash
# All semantic-search tests
npm run test -- semantic-search

# Performance tests
npm run test -- search-performance
```

---

## Performance Targets

| Metric                    | Target           | Current     |
| ------------------------- | ---------------- | ----------- |
| Search latency (cached)   | <50ms            | ~30ms ✅    |
| Search latency (uncached) | <500ms           | ~350ms ✅   |
| Indexing throughput       | 100 entities/min | ~120/min ✅ |
| Cache hit rate            | >70%             | ~78% ✅     |
| Memory usage              | <50MB            | ~35MB ✅    |

---

## Common Use Cases

### Find Similar Chapters

```typescript
const similar = await searchService.search(
  chapter.content.substring(0, 500), // Use chapter excerpt
  projectId,
  { entityTypes: ['chapter'], limit: 5 },
);
```

### Find Relevant Characters

```typescript
const characters = await searchService.search(
  'brave warrior with sword',
  projectId,
  { entityTypes: ['character'], minScore: 0.7 },
);
```

### Cross-Reference World Elements

```typescript
const related = await searchService.search('ancient magic system', projectId, {
  entityTypes: ['lore', 'culture', 'location'],
  minScore: 0.65,
});
```

---

## Configuration

### Environment Variables

```env
# OpenAI API for embeddings
OPENAI_API_KEY=your_key_here

# Embedding model
EMBEDDING_MODEL=text-embedding-3-small

# Feature flags
ENABLE_SEMANTIC_SEARCH=true
ENABLE_AUTO_SYNC=true
```

### Per-Project Settings

```typescript
interface SearchSettings {
  autoSync: boolean; // Auto-index new content
  syncInterval: number; // Sync frequency (ms)
  minScore: number; // Default similarity threshold
  cacheEnabled: boolean; // Enable query cache
  maxResults: number; // Default result limit
}
```

---

## Common Issues & Solutions

### Issue: Search returns no results

**Solution**: Check indexing status and similarity threshold

```typescript
const status = await batchProcessor.getIndexingStatus(projectId);
if (status.indexed === 0) {
  await batchProcessor.indexProject(projectId);
}

// Lower threshold
const results = await searchService.search(query, projectId, {
  minScore: 0.5, // Lower from default 0.6
});
```

### Issue: Slow search performance

**Solution**: Enable caching and reduce result limit

```typescript
// Check cache stats
const stats = queryCache.getStats();
console.log('Hit rate:', stats.hitRate);

// Reduce results
const results = await searchService.search(query, projectId, {
  limit: 10, // Instead of 50
});
```

### Issue: New content not searchable

**Solution**: Trigger manual sync

```typescript
await syncService.syncProject(projectId);
```

---

## Future Enhancements

- [ ] Multi-language embedding support
- [ ] Hybrid search (semantic + keyword)
- [ ] Custom embedding models
- [ ] Search analytics and insights
- [ ] Advanced filtering (date ranges, tags)
- [ ] Search history and saved searches
- [ ] Faceted search navigation
- [ ] Search result explanations (why matched)

---

## Related Features

- **Plot Engine** (`src/features/plot-engine`) - Uses semantic search for RAG
- **Editor** (`src/features/editor`) - Search within chapters
- **Characters** (`src/features/characters`) - Find related characters
- **World Building** (`src/features/world-building`) - Discover world elements

---

## Contributing

When modifying Semantic Search:

1. Maintain backward compatibility with existing embeddings
2. Test performance impact of changes
3. Update cache invalidation logic carefully
4. Document embedding model changes
5. Consider offline functionality
6. Add comprehensive tests

---

## Cost Considerations

### Embedding Generation Costs

- **text-embedding-3-small**: $0.02 per 1M tokens
- **Typical novel** (80k words): ~100k tokens = $0.002
- **Typical character** (500 words): ~700 tokens = $0.000014

**Project Indexing Example**:

- 30 chapters × 3k words = 90k words = ~120k tokens
- 20 characters × 500 words = 10k words = ~14k tokens
- **Total**: ~134k tokens = **$0.0027** (less than a penny)

---

## License

Part of Novelist.ai - See root LICENSE file
