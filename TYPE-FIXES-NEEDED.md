# Type Errors Summary - Post Migration

## Status: Syntax Errors Fixed ✅, Type Errors Remaining

Total Type Errors: ~40

---

## Critical Type Mismatches (High Priority)

### 1. **Character Relationships Type Mismatch**
**Location**: `src/lib/database/schemas/characters.ts` and related files

**Issue**: Schema defines relationships as:
```typescript
relationships: text('relationships', { mode: 'json' }).$type<
  Array<{ targetId: string; type: string; description?: string }>
>()
```

But Character type expects:
```typescript
relationships?: Array<{
  id: string;
  characterAId: string;
  characterBId: string;
  type: RelationshipType;
  description: string;
  strength: number;
}>
```

**Fix**: Update schema to match Character type OR update Character type to match schema.

---

### 2. **ChapterVersion Type Mismatch**
**Location**: `src/lib/database/schemas/versioning.ts`

**Issue**: Missing fields in Turso schema:
- `summary`
- `status`
- `type`
- `contentHash`
- `wordCount`
- `charCount`

**Fix**: Add these fields to the versioning schema OR make them optional in ChapterVersion type.

---

### 3. **World-Building Type Mismatch**
**Location**: `src/features/world-building/types` vs `src/lib/database/schemas/world-building.ts`

**Issue**: 
- Location type has `projectId` but schema expects `worldBuildingProjectId`
- Culture type has same issue
- Possible undefined returns from service methods

**Fix**: Align field names between types and schemas.

---

### 4. **Branch Type Mismatch**
**Location**: `src/lib/database/schemas/versioning.ts`

**Issue**: Schema uses `projectId` but feature layer expects `chapterId`

**Fix**: Add chapterId field to schema OR update all branch operations to use projectId.

---

## Medium Priority Type Issues

### 5. **Timestamp Type Inconsistency**
- Schema stores as ISO string (`text`)
- Feature layer expects `Date` objects
- Need conversion layer

### 6. **Nullable Handling**
- Many schema fields are nullable but types don't reflect this
- Service methods return `T | null` but callers expect `T | undefined`

### 7. **Unused Variables**
Several unused variable warnings (low priority, easy to fix)

---

## Quick Fixes Applied

✅ Fixed syntax errors in versioning service
✅ Fixed syntax errors in publishing service  
✅ Closed all comment blocks properly

---

## Recommended Approach

### Option A: Update Schemas to Match Types (Recommended)
- Less disruptive to existing feature code
- Schemas are new, easier to change
- Preserves existing type contracts

### Option B: Update Types to Match Schemas
- More changes across codebase
- Might break existing code
- Better long-term if schemas are more correct

### Option C: Hybrid Approach
- Add adapter/mapper layer in services
- Transform between schema types and feature types
- More code but maintains compatibility

---

## Estimated Effort

- **Option A**: 2-3 hours (update schemas + regenerate migrations)
- **Option B**: 4-5 hours (update types across many files)
- **Option C**: 1-2 hours (add mappers, leave types as-is)

**Recommendation**: Start with Option C (add proper mappers), then incrementally fix schemas in next iteration.

---

## Files Needing Updates

### Schemas (if Option A)
- `src/lib/database/schemas/characters.ts`
- `src/lib/database/schemas/versioning.ts`
- `src/lib/database/schemas/world-building.ts`

### Services (all options)
- `src/lib/database/services/character-service.ts`
- `src/lib/database/services/versioning-service.ts`
- `src/lib/database/services/world-building-service.ts`

### Types (if Option B)
- `src/types/index.ts`
- `src/features/world-building/types/index.ts`

---

## Next Steps

1. **Immediate**: Suppress non-critical type errors with `// @ts-expect-error` and comments
2. **Short-term**: Implement mapper functions in service layer
3. **Medium-term**: Align schemas with types properly
4. **Long-term**: Add comprehensive type tests
