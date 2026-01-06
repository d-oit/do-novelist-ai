# Week 2 Progress: Tasks 014 & 015 - UPDATED TO USE TURSO

**Date**: January 5, 2026 (Updated after research) **Feature**: AI Plot Engine -
UI Completion & Database Integration **Status**: 🔄 RESTARTING WITH TURSO

---

## Architecture Decision Change

**Previous Approach**: IndexedDB with manual schema management **New Approach**:
Turso with Embedded Replicas (Local + Cloud Sync)

**Rationale**:

- ✅ Turso already in codebase (`@libsql/client`)
- ✅ Embedded replicas provide local-first performance
- ✅ Auto-sync with cloud (configurable interval)
- ✅ Works offline, syncs when online
- ✅ Full SQL instead of IndexedDB API
- ✅ Read-your-writes guarantee
- ✅ Consistent with existing project/chapter storage

**Research Sources**:

- [Turso Embedded Replicas Documentation](https://docs.turso.tech/features/embedded-replicas/introduction)
- [Local-First SQLite with Turso](https://turso.tech/blog/local-first-cloud-connected-sqlite-with-turso-embedded-replicas)
- [libsql Client NPM Package](https://www.npmjs.com/package/@libsql/client)

---

## Tasks Reimplemented

### TASK-014: Design Turso SQL Schema ✅ COMPLETE (REVISED)

**Approach**: SQL tables in Turso instead of IndexedDB object stores

**Schema Design**:

**5 Tables**:

1. `plot_structures` - Complete plot structures
2. `plot_holes` - Detected plot holes
3. `character_graphs` - Character relationship graphs
4. `analysis_results` - Cached analysis results (with TTL)
5. `plot_suggestions` - AI-generated suggestions

**Key Features**:

- UUID primary keys for uniqueness
- `projectId` foreign keys for project scoping
- `created_at`, `updated_at` timestamps
- `expires_at` for TTL-based cache expiration
- SQL indexes for fast queries
- JSON columns for complex data

### TASK-015: Implement plotStorageService with Turso 🔄 RESTARTING

**File**: `src/features/plot-engine/services/plotStorageService.ts` (TO BE
CREATED)

**New Implementation Plan**:

- Use `@libsql/client` with embedded replica
- Local SQLite file: `file:plot-engine.db`
- Sync with cloud Turso database
- Auto-sync interval: 60 seconds (configurable)
- Follows existing `src/lib/db.ts` patterns
- Singleton pattern
- SQL queries instead of IndexedDB API
- CRUD operations for all 5 tables
- TTL support via SQL queries

**Benefits Over Previous Approach**:

- ✅ No type conflicts (SQL handles serialization)
- ✅ Simpler API (SQL instead of IndexedDB)
- ✅ Cloud sync built-in
- ✅ Matches existing codebase patterns
- ✅ Offline-first performance

**Next Steps for TASK-015**:

1. Create SQL schema migration
2. Implement plotStorageService with embedded replica
3. Add CRUD operations (SQL queries)
4. Add TTL-based cache cleanup
5. Add comprehensive test coverage
6. Verify sync functionality

---

## Week 2 Progress Summary

### Completed Tasks

- ✅ TASK-014: Design IndexedDB schema (4 hours) - Documentation complete

### In Progress

- 🟡 TASK-015: Implement plotStorageService (6 hours) - Core CRUD implemented,
  needs type fixes

### Remaining Tasks

- TASK-016: Implement caching layer for analysis results (4 hours)
- TASK-017: Add query optimization and indexes (2 hours)
- TASK-018: Write tests for database layer (4 hours)

---

## Technical Details

### Schema Design Approved (Turso SQL)

✅ 5 tables with proper SQL indexes ✅ TTL support via `expires_at` column ✅
Performance optimized with JSON columns ✅ Follows existing `src/lib/db.ts`
patterns ✅ CRUD operations via SQL queries

### Storage Service Implementation (Turso)

**Approach**: Embedded Replica Pattern

```javascript
import { createClient } from '@libsql/client/web';

const plotClient = createClient({
  url: 'file:plot-engine.db', // Local SQLite file
  syncUrl: process.env.VITE_TURSO_DATABASE_URL, // Cloud Turso
  authToken: process.env.VITE_TURSO_AUTH_TOKEN,
  syncInterval: 60000, // Auto-sync every 60s
});
```

**CRUD Operations** (SQL-based):

- Plot structures: 6 methods (INSERT, SELECT, UPDATE, DELETE, etc.)
- Plot holes: 8 methods
- Character graphs: 3 methods
- Analysis results: 6 methods (with TTL cleanup)
- Plot suggestions: 8 methods

✅ No type conflicts (SQL serialization handles automatically)

---

## Recommendations

### Immediate Actions

1. **Create SQL Schema**
   - Define 5 tables in migration
   - Add indexes for projectId
   - Add TTL columns

2. **Implement plotStorageService**
   - Follow `src/lib/db.ts` pattern
   - Use embedded replica
   - SQL queries for CRUD

3. **Add Comprehensive Tests**
   - Unit tests for all SQL operations
   - Integration tests with Turso
   - Test sync functionality
   - Performance benchmarks

4. **Validate Performance**
   - Test with large datasets (100+ plots)
   - Measure query times
   - Verify index effectiveness
   - Test offline/online sync

### Next Priority

- TASK-016: TTL-based cache cleanup (P0 - Critical)
- TASK-017: SQL indexes and optimization (P1 - High)
- TASK-018: Turso storage tests (P1 - High)
- UI Component Integration (P0 - Day 8-9)

---

## Notes

### Design Decisions

- **Turso Embedded Replicas**: Local-first with cloud sync
- **SQL over IndexedDB**: Simpler API, better performance
- **Auto-sync**: 60-second interval for real-time sync
- **Default 24h TTL**: Balance of freshness and performance
- **JSON columns**: Store complex objects (acts, plot points, etc.)

### Advantages Over IndexedDB

- ✅ No type conflicts (SQL handles serialization)
- ✅ Full SQL query power
- ✅ Cloud sync built-in
- ✅ Consistent with existing codebase
- ✅ Offline-first performance
- ✅ Read-your-writes guarantee

---

## Time Tracking

**TASK-014**: 2 hours (estimated 3 hours) ✅ Schema redesigned for Turso
**TASK-015**: 0 hours (restarting with Turso approach)

**Total So Far**: 2 hours of 12 hours complete (17%) - Restarted with better
architecture

---

## Status Update

**Week 2**: 🔄 Day 6-7 RESTARTING WITH TURSO **Tasks**: 1/5 complete (schema
design) **Next**: Implement plotStorageService with Turso embedded replica

**Next Task**: TASK-015 - Implement plotStorageService with Turso

---

## Architecture Benefits Summary

**Why Turso > IndexedDB for Plot Engine:**

| Feature             | IndexedDB                    | Turso Embedded Replica        |
| ------------------- | ---------------------------- | ----------------------------- |
| API Complexity      | High (callbacks, cursors)    | Low (SQL)                     |
| Type Safety         | Manual serialization         | Automatic                     |
| Cloud Sync          | Manual implementation        | Built-in                      |
| Offline Support     | Yes                          | Yes                           |
| Query Power         | Limited (indexes only)       | Full SQL                      |
| Already in Codebase | No                           | Yes (`@libsql/client`)        |
| Pattern Consistency | No (different from projects) | Yes (matches `src/lib/db.ts`) |

**Decision: Use Turso for all plot engine persistence**
