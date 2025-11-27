# Feature Architecture Completion Plan

## Objective

Bring all 7 features into **100% compliance** with Feature-First Architecture requirements by creating missing index.ts barriers, extracting hooks/services, and properly organizing type definitions.

---

## Current Compliance Status

| Feature | Compliance | Missing Elements |
|---------|-----------|------------------|
| analytics | ✅ 100% | None (exemplary) |
| publishing | ✅ 100% | None (exemplary) |
| versioning | ✅ 100% | None (exemplary) |
| **editor** | ⚠️ 60% | types/, services/ |
| **characters** | ❌ 20% | index.ts, hooks/, types/, services/ |
| **projects** | ⚠️ 40% | hooks/, types/, services/ |
| **settings** | ⚠️ 40% | hooks/, types/, services/ |

**Target:** All features at 100% compliance

---

## Priority 1: Characters Feature (CRITICAL)

### Current State
```
src/features/characters/
└── components/
    └── CharacterManager.tsx (837 LOC) ❌
```

### Target State
```
src/features/characters/
├── index.ts ⭐ CREATE
├── hooks/
│   ├── useCharacters.ts ⭐ CREATE
│   └── useCharacterValidation.ts ⭐ CREATE
├── types/
│   └── index.ts ⭐ MOVE from /src/types/character-*
├── services/
│   └── characterService.ts ⭐ CREATE
└── components/
    ├── CharacterManager.tsx (REFACTOR to 180 LOC)
    ├── CharacterGrid.tsx ⭐ EXTRACT
    ├── CharacterCard.tsx ⭐ EXTRACT
    ├── CharacterEditor.tsx ⭐ EXTRACT
    └── CharacterFilters.tsx ⭐ EXTRACT
```

### Step-by-Step Implementation

#### Step 1: Create Public Export Barrier (30 minutes)

**File:** `src/features/characters/index.ts`

```typescript
/**
 * Characters Feature
 *
 * Manages character creation, editing, validation, and relationship tracking
 * for the Novelist GOAP engine.
 */

// Types
export type {
  Character,
  CharacterRole,
  CharacterArc,
  CharacterTrait,
  CharacterRelationship,
  CharacterValidationResult,
  CharacterFilters
} from './types';

// Hooks
export { useCharacters } from './hooks/useCharacters';
export { useCharacterValidation } from './hooks/useCharacterValidation';

// Services (rarely used externally, but available if needed)
export { characterService } from './services/characterService';

// Components
export { CharacterManager } from './components/CharacterManager';
export { CharacterCard } from './components/CharacterCard';
export { CharacterEditor } from './components/CharacterEditor';
```

---

#### Step 2: Move Type Definitions (1 hour)

**Source Files to Consolidate:**
- `/src/types/character-schemas.ts`
- `/src/types/character-guards.ts`
- `/src/types/index.ts` (character-related types)

**Target:** `src/features/characters/types/index.ts`

```typescript
import { z } from 'zod';

// ============================================================================
// Character Core Types
// ============================================================================

export const CharacterRoleSchema = z.enum([
  'protagonist',
  'antagonist',
  'supporting',
  'mentor',
  'foil',
  'love-interest',
  'comic-relief'
]);

export type CharacterRole = z.infer<typeof CharacterRoleSchema>;

export const CharacterArcSchema = z.enum([
  'change',
  'growth',
  'fall',
  'flat',
  'corruption',
  'redemption'
]);

export type CharacterArc = z.infer<typeof CharacterArcSchema>;

// ============================================================================
// Character Trait System
// ============================================================================

export const CharacterTraitSchema = z.object({
  category: z.enum(['personality', 'physical', 'skill', 'flaw', 'strength']),
  name: z.string().min(1).max(50),
  description: z.string().max(500),
  intensity: z.number().min(1).max(10)
});

export type CharacterTrait = z.infer<typeof CharacterTraitSchema>;

// ============================================================================
// Character Relationships
// ============================================================================

export const CharacterRelationshipSchema = z.object({
  id: z.string(),
  characterAId: z.string(),
  characterBId: z.string(),
  type: z.enum([
    'family',
    'romantic',
    'friendship',
    'rivalry',
    'mentor-student',
    'enemy',
    'ally'
  ]),
  description: z.string().max(500),
  strength: z.number().min(1).max(10)
});

export type CharacterRelationship = z.infer<typeof CharacterRelationshipSchema>;

// ============================================================================
// Main Character Schema
// ============================================================================

export const CharacterSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  name: z.string().min(1).max(100),
  role: CharacterRoleSchema,
  arc: CharacterArcSchema,

  // Core Attributes
  age: z.number().min(0).max(200).optional(),
  gender: z.string().max(50).optional(),
  occupation: z.string().max(100).optional(),

  // Character Development
  motivation: z.string().min(10).max(1000),
  goal: z.string().min(10).max(1000),
  conflict: z.string().min(10).max(1000),
  backstory: z.string().max(5000).optional(),

  // Traits
  traits: z.array(CharacterTraitSchema).max(20),

  // Relationships
  relationships: z.array(z.string().uuid()), // IDs of related characters

  // Metadata
  createdAt: z.number(),
  updatedAt: z.number(),
  imageUrl: z.string().url().optional()
});

export type Character = z.infer<typeof CharacterSchema>;

// ============================================================================
// Validation Results
// ============================================================================

export interface CharacterValidationIssue {
  field: string;
  severity: 'error' | 'warning' | 'suggestion';
  message: string;
  suggestion?: string;
}

export interface CharacterValidationResult {
  isValid: boolean;
  score: number; // 0-100
  issues: CharacterValidationIssue[];
  strengths: string[];
}

// ============================================================================
// Filter Types
// ============================================================================

export interface CharacterFilters {
  search: string;
  roles: CharacterRole[];
  arcs: CharacterArc[];
  validationStatus: 'all' | 'valid' | 'warnings' | 'errors';
}

// ============================================================================
// Type Guards
// ============================================================================

export function isCharacter(value: unknown): value is Character {
  return CharacterSchema.safeParse(value).success;
}

export function isCharacterRole(value: unknown): value is CharacterRole {
  return CharacterRoleSchema.safeParse(value).success;
}

export function isCharacterArc(value: unknown): value is CharacterArc {
  return CharacterArcSchema.safeParse(value).success;
}
```

**Cleanup Actions:**
1. Delete `/src/types/character-schemas.ts`
2. Delete `/src/types/character-guards.ts`
3. Remove character types from `/src/types/index.ts`
4. Update imports in CharacterManager.tsx

---

#### Step 3: Create Service Layer (2 hours)

**File:** `src/features/characters/services/characterService.ts`

```typescript
import type { Character, CharacterRelationship } from '../types';

/**
 * Character Service
 *
 * Handles all character data persistence using IndexedDB.
 * Singleton pattern ensures single database connection.
 */
class CharacterService {
  private dbName = 'novelist-characters';
  private version = 1;
  private db: IDBDatabase | null = null;

  /**
   * Initialize the database
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Characters store
        if (!db.objectStoreNames.contains('characters')) {
          const store = db.createObjectStore('characters', { keyPath: 'id' });
          store.createIndex('projectId', 'projectId', { unique: false });
          store.createIndex('role', 'role', { unique: false });
        }

        // Relationships store
        if (!db.objectStoreNames.contains('relationships')) {
          const relStore = db.createObjectStore('relationships', { keyPath: 'id' });
          relStore.createIndex('characterAId', 'characterAId', { unique: false });
          relStore.createIndex('characterBId', 'characterBId', { unique: false });
        }
      };
    });
  }

  /**
   * Get all characters for a project
   */
  async getAll(projectId: string): Promise<Character[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['characters'], 'readonly');
      const store = transaction.objectStore('characters');
      const index = store.index('projectId');
      const request = index.getAll(projectId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get a single character by ID
   */
  async getById(id: string): Promise<Character | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['characters'], 'readonly');
      const store = transaction.objectStore('characters');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Create a new character
   */
  async create(character: Character): Promise<Character> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['characters'], 'readwrite');
      const store = transaction.objectStore('characters');
      const request = store.add(character);

      request.onsuccess = () => resolve(character);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update an existing character
   */
  async update(id: string, data: Partial<Character>): Promise<Character> {
    if (!this.db) await this.init();

    const existing = await this.getById(id);
    if (!existing) throw new Error(`Character ${id} not found`);

    const updated: Character = {
      ...existing,
      ...data,
      updatedAt: Date.now()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['characters'], 'readwrite');
      const store = transaction.objectStore('characters');
      const request = store.put(updated);

      request.onsuccess = () => resolve(updated);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete a character
   */
  async delete(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['characters'], 'readwrite');
      const store = transaction.objectStore('characters');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get relationships for a character
   */
  async getRelationships(characterId: string): Promise<CharacterRelationship[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['relationships'], 'readonly');
      const store = transaction.objectStore('relationships');
      const indexA = store.index('characterAId');
      const indexB = store.index('characterBId');

      const resultsA: CharacterRelationship[] = [];
      const resultsB: CharacterRelationship[] = [];

      const requestA = indexA.getAll(characterId);
      const requestB = indexB.getAll(characterId);

      requestA.onsuccess = () => {
        resultsA.push(...requestA.result);
        requestB.onsuccess = () => {
          resultsB.push(...requestB.result);
          // Combine and deduplicate
          const allRelationships = [...resultsA, ...resultsB];
          const unique = Array.from(new Map(allRelationships.map(r => [r.id, r])).values());
          resolve(unique);
        };
      };

      requestA.onerror = () => reject(requestA.error);
      requestB.onerror = () => reject(requestB.error);
    });
  }

  /**
   * Create a relationship between two characters
   */
  async createRelationship(relationship: CharacterRelationship): Promise<CharacterRelationship> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['relationships'], 'readwrite');
      const store = transaction.objectStore('relationships');
      const request = store.add(relationship);

      request.onsuccess = () => resolve(relationship);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete a relationship
   */
  async deleteRelationship(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['relationships'], 'readwrite');
      const store = transaction.objectStore('relationships');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Singleton export
export const characterService = new CharacterService();
```

---

#### Step 4: Create Hooks (3 hours)

**File:** `src/features/characters/hooks/useCharacters.ts`

```typescript
import { useEffect } from 'react';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { characterService } from '../services/characterService';
import type { Character, CharacterFilters } from '../types';

interface CharactersState {
  // Data
  characters: Character[];
  selectedId: string | null;
  filters: CharacterFilters;

  // UI State
  isLoading: boolean;
  isEditing: boolean;
  error: string | null;

  // Actions
  init: () => Promise<void>;
  load: (projectId: string) => Promise<void>;
  create: (character: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  update: (id: string, data: Partial<Character>) => Promise<void>;
  delete: (id: string) => Promise<void>;
  select: (id: string | null) => void;
  setFilters: (filters: Partial<CharacterFilters>) => void;
  setEditing: (isEditing: boolean) => void;
}

export const useCharacters = create<CharactersState>()(
  devtools(
    (set, get) => ({
      // Initial State
      characters: [],
      selectedId: null,
      filters: {
        search: '',
        roles: [],
        arcs: [],
        validationStatus: 'all'
      },
      isLoading: false,
      isEditing: false,
      error: null,

      // Initialize service
      init: async () => {
        try {
          set({ isLoading: true });
          await characterService.init();
          set({ isLoading: false });
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'Failed to initialize',
            isLoading: false
          });
        }
      },

      // Load characters
      load: async (projectId: string) => {
        try {
          set({ isLoading: true, error: null });
          const characters = await characterService.getAll(projectId);
          set({ characters, isLoading: false });
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'Failed to load characters',
            isLoading: false
          });
        }
      },

      // Create character
      create: async (characterData) => {
        try {
          set({ isLoading: true, error: null });
          const newCharacter: Character = {
            ...characterData,
            id: crypto.randomUUID(),
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
          await characterService.create(newCharacter);
          set(state => ({
            characters: [...state.characters, newCharacter],
            isLoading: false,
            isEditing: false
          }));
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'Failed to create character',
            isLoading: false
          });
        }
      },

      // Update character
      update: async (id, data) => {
        try {
          set({ isLoading: true, error: null });
          const updated = await characterService.update(id, data);
          set(state => ({
            characters: state.characters.map(c => c.id === id ? updated : c),
            isLoading: false,
            isEditing: false
          }));
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'Failed to update character',
            isLoading: false
          });
        }
      },

      // Delete character
      delete: async (id) => {
        try {
          set({ isLoading: true, error: null });
          await characterService.delete(id);
          set(state => ({
            characters: state.characters.filter(c => c.id !== id),
            selectedId: state.selectedId === id ? null : state.selectedId,
            isLoading: false
          }));
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'Failed to delete character',
            isLoading: false
          });
        }
      },

      // Select character
      select: (id) => {
        set({ selectedId: id });
      },

      // Set filters
      setFilters: (newFilters) => {
        set(state => ({
          filters: { ...state.filters, ...newFilters }
        }));
      },

      // Set editing mode
      setEditing: (isEditing) => {
        set({ isEditing });
      }
    }),
    { name: 'CharactersStore' }
  )
);
```

**File:** `src/features/characters/hooks/useCharacterValidation.ts`

```typescript
import { useMemo } from 'react';
import { characterValidationService } from '@/lib/character-validation';
import type { Character, CharacterValidationResult } from '../types';

export function useCharacterValidation(character: Character | null) {
  const validationResult = useMemo<CharacterValidationResult | null>(() => {
    if (!character) return null;

    return characterValidationService.validate(character);
  }, [character]);

  const isValid = validationResult?.isValid ?? false;
  const score = validationResult?.score ?? 0;
  const issues = validationResult?.issues ?? [];
  const strengths = validationResult?.strengths ?? [];

  return {
    isValid,
    score,
    issues,
    strengths,
    validate: characterValidationService.validate.bind(characterValidationService)
  };
}
```

---

### Estimated Time: Characters Feature
**Total:** 12 hours

- Step 1 (index.ts): 0.5 hours
- Step 2 (types migration): 1 hour
- Step 3 (service layer): 2 hours
- Step 4 (hooks): 3 hours
- Step 5 (component refactoring): 5.5 hours (covered in Component Refactoring Plan)

---

## Priority 2: Editor Feature

### Current State
```
src/features/editor/
├── index.ts ✓
├── hooks/
│   └── useGoapEngine.ts ✓
└── components/ ✓
```

### Missing Elements
- `types/` directory
- `services/` directory

### Implementation

#### Step 1: Create Types Directory (1 hour)

**File:** `src/features/editor/types/index.ts`

```typescript
import { z } from 'zod';

// ============================================================================
// Refine Options
// ============================================================================

export const RefineOptionsSchema = z.object({
  tone: z.enum(['formal', 'casual', 'balanced', 'dramatic', 'humorous']),
  length: z.enum(['shorter', 'maintain', 'longer']),
  focusArea: z.enum(['overall', 'dialogue', 'description', 'pacing', 'clarity'])
});

export type RefineOptions = z.infer<typeof RefineOptionsSchema>;

// ============================================================================
// Editor State
// ============================================================================

export interface EditorContent {
  summary: string;
  content: string;
  wordCount: number;
  lastSaved: number | null;
}

export interface EditorUIState {
  isSidebarOpen: boolean;
  isFocusMode: boolean;
  showVersionHistory: boolean;
  showVersionComparison: boolean;
  showAnalytics: boolean;
}

// ============================================================================
// Image Generation
// ============================================================================

export interface ImageGenerationOptions {
  prompt: string;
  style: 'realistic' | 'illustration' | 'anime' | 'sketch';
  aspectRatio: '16:9' | '4:3' | '1:1';
}

export interface GeneratedImage {
  url: string;
  prompt: string;
  generatedAt: number;
}

// Export all
export type { RefineOptions, EditorContent, EditorUIState, ImageGenerationOptions, GeneratedImage };
```

#### Step 2: Create Service Layer (Optional - 2 hours)

**File:** `src/features/editor/services/editorService.ts`

```typescript
/**
 * Editor Service
 *
 * Handles content persistence, auto-save, and draft management.
 */
class EditorService {
  private dbName = 'novelist-drafts';
  private db: IDBDatabase | null = null;

  async init(): Promise<void> { /* ... */ }

  async saveDraft(chapterId: string, content: string, summary: string): Promise<void> { /* ... */ }

  async loadDraft(chapterId: string): Promise<{ content: string; summary: string } | null> { /* ... */ }

  async deleteDraft(chapterId: string): Promise<void> { /* ... */ }
}

export const editorService = new EditorService();
```

### Estimated Time: Editor Feature
**Total:** 3 hours

---

## Priority 3: Projects Feature

### Current State
```
src/features/projects/
├── index.ts ✓
└── components/ ✓
```

### Target State
```
src/features/projects/
├── index.ts
├── hooks/
│   └── useProjects.ts ⭐ CREATE
├── types/
│   └── index.ts ⭐ CREATE
├── services/
│   └── projectService.ts ⭐ CREATE
└── components/
```

### Implementation

**Hook:** `useProjects.ts` - Project CRUD operations
**Service:** `projectService.ts` - IndexedDB persistence
**Types:** Project-specific schemas and interfaces

### Estimated Time: Projects Feature
**Total:** 5 hours

---

## Priority 4: Settings Feature

### Current State
```
src/features/settings/
├── index.ts ✓
└── components/ ✓
```

### Target State
```
src/features/settings/
├── index.ts
├── hooks/
│   └── useSettings.ts ⭐ CREATE
├── types/
│   └── index.ts ⭐ CREATE
├── services/
│   └── settingsService.ts ⭐ CREATE
└── components/
```

### Implementation

**Hook:** `useSettings.ts` - Settings state management
**Service:** `settingsService.ts` - LocalStorage persistence
**Types:** Settings schemas with Zod validation

### Estimated Time: Settings Feature
**Total:** 3 hours

---

## Summary

### Total Effort Breakdown

| Feature | Current % | Missing Work | Time (hours) |
|---------|-----------|--------------|--------------|
| characters | 20% | index, hooks, types, services, components | 12 |
| editor | 60% | types, services (optional) | 3 |
| projects | 40% | hooks, types, services | 5 |
| settings | 40% | hooks, types, services | 3 |
| **TOTAL** | | | **23** |

### Implementation Order

**Week 1:**
1. Characters feature (Days 1-3)
2. Editor feature (Day 4)

**Week 2:**
3. Projects feature (Days 1-2)
4. Settings feature (Day 3)
5. Testing & validation (Days 4-5)

---

## Success Criteria

- ✓ All 7 features have index.ts export barriers
- ✓ All features have hooks/ for business logic
- ✓ All features have types/ with Zod schemas or TS interfaces
- ✓ All features have services/ for data persistence
- ✓ All features maintain <500 LOC per file
- ✓ Zero cross-feature dependencies (maintain isolation)
- ✓ 100% type safety across all features

---

**Status:** Ready for implementation
**Dependencies:** Should run AFTER component refactoring
**Risk:** Low (adding structure, not changing behavior)
