# State Management Migration - Zustand Integration

## Objective

Eliminate "useState hell" by migrating complex state to Zustand stores and implementing proper state management patterns across the application.

---

## Current State Issues

### Critical Problems

| Hook/Component | useState Count | Issue | Severity |
|----------------|----------------|-------|----------|
| usePublishingAnalytics | 15 | Massive state fragmentation | CRITICAL |
| useAnalytics | 12 | Complex interdependent states | CRITICAL |
| BookViewer | 12 | UI state explosion | HIGH |
| useVersioning | 6 | Borderline complexity | MEDIUM |

**Guideline Violation:** "Avoid useState hell (max 3 per component). Use Zustand or useReducer for complex state."

---

## Phase 1: Install Zustand

### Step 1: Add Dependency

```bash
npm install zustand@^5.0.0
npm install -D @types/node
```

### Step 2: Create Store Infrastructure

**File:** `src/lib/stores/index.ts`
```typescript
// Central export point for all stores
export { useAnalyticsStore } from './analyticsStore';
export { usePublishingStore } from './publishingStore';
export { useEditorStore } from './editorStore';
export { useVersioningStore } from './versioningStore';
```

**Estimated Time:** 0.5 hours

---

## Phase 2: Analytics Store Migration (PRIORITY 1)

### Current State (useAnalytics.ts - 12 useState calls)

```typescript
const [currentSession, setCurrentSession] = useState<WritingSession | null>(null);
const [isTracking, setIsTracking] = useState(false);
const [projectAnalytics, setProjectAnalytics] = useState<ProjectAnalytics | null>(null);
const [goals, setGoals] = useState<WritingGoal[]>([]);
const [streakData, setStreakData] = useState<StreakData | null>(null);
const [productivity, setProductivity] = useState<ProductivityMetrics[]>([]);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
// ... 4 more states
```

### Target Store (analyticsStore.ts)

**File:** `src/lib/stores/analyticsStore.ts`

```typescript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { analyticsService } from '@/features/analytics/services/analyticsService';

// Types
interface WritingSession {
  id: string;
  projectId: string;
  startTime: number;
  endTime?: number;
  wordsWritten: number;
  chaptersEdited: string[];
}

interface WritingGoal {
  id: string;
  type: 'daily' | 'weekly' | 'monthly';
  target: number;
  current: number;
  deadline?: number;
}

interface ProductivityMetrics {
  date: string;
  wordsWritten: number;
  timeSpent: number;
  sessionsCount: number;
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
}

interface ProjectAnalytics {
  totalWords: number;
  totalChapters: number;
  completionPercentage: number;
  lastUpdated: number;
}

// Store State
interface AnalyticsState {
  // Data State
  currentSession: WritingSession | null;
  projectAnalytics: ProjectAnalytics | null;
  goals: WritingGoal[];
  streakData: StreakData | null;
  productivity: ProductivityMetrics[];

  // UI State
  isTracking: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  init: () => Promise<void>;
  startSession: (projectId: string) => Promise<void>;
  endSession: () => Promise<void>;
  trackProgress: (projectId: string, wordsWritten: number, chapterIds: string[]) => Promise<void>;
  loadProjectAnalytics: (projectId: string) => Promise<void>;
  loadGoals: (projectId: string) => Promise<void>;
  createGoal: (goal: Omit<WritingGoal, 'id' | 'current'>) => Promise<void>;
  updateGoal: (id: string, data: Partial<WritingGoal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  loadProductivity: (projectId: string, days: number) => Promise<void>;
  loadStreak: (projectId: string) => Promise<void>;
  reset: () => void;
}

// Store Implementation
export const useAnalyticsStore = create<AnalyticsState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        currentSession: null,
        projectAnalytics: null,
        goals: [],
        streakData: null,
        productivity: [],
        isTracking: false,
        isLoading: false,
        error: null,

        // Initialize
        init: async () => {
          try {
            set({ isLoading: true, error: null });
            await analyticsService.init();
            set({ isLoading: false });
          } catch (err) {
            set({
              error: err instanceof Error ? err.message : 'Failed to initialize analytics',
              isLoading: false
            });
          }
        },

        // Start Session
        startSession: async (projectId: string) => {
          try {
            set({ isLoading: true, error: null });
            const session = await analyticsService.startSession(projectId);
            set({
              currentSession: session,
              isTracking: true,
              isLoading: false
            });
          } catch (err) {
            set({
              error: err instanceof Error ? err.message : 'Failed to start session',
              isLoading: false
            });
          }
        },

        // End Session
        endSession: async () => {
          const { currentSession } = get();
          if (!currentSession) return;

          try {
            set({ isLoading: true, error: null });
            await analyticsService.endSession(currentSession.id);
            set({
              currentSession: null,
              isTracking: false,
              isLoading: false
            });
          } catch (err) {
            set({
              error: err instanceof Error ? err.message : 'Failed to end session',
              isLoading: false
            });
          }
        },

        // Track Progress
        trackProgress: async (projectId: string, wordsWritten: number, chapterIds: string[]) => {
          const { currentSession } = get();
          if (!currentSession) return;

          try {
            await analyticsService.trackProgress(currentSession.id, {
              wordsWritten,
              chaptersEdited: chapterIds
            });

            // Update current session
            set(state => ({
              currentSession: state.currentSession ? {
                ...state.currentSession,
                wordsWritten: state.currentSession.wordsWritten + wordsWritten
              } : null
            }));
          } catch (err) {
            set({
              error: err instanceof Error ? err.message : 'Failed to track progress'
            });
          }
        },

        // Load Project Analytics
        loadProjectAnalytics: async (projectId: string) => {
          try {
            set({ isLoading: true, error: null });
            const analytics = await analyticsService.getProjectAnalytics(projectId);
            set({
              projectAnalytics: analytics,
              isLoading: false
            });
          } catch (err) {
            set({
              error: err instanceof Error ? err.message : 'Failed to load analytics',
              isLoading: false
            });
          }
        },

        // Load Goals
        loadGoals: async (projectId: string) => {
          try {
            const goals = await analyticsService.getGoals(projectId);
            set({ goals });
          } catch (err) {
            set({
              error: err instanceof Error ? err.message : 'Failed to load goals'
            });
          }
        },

        // Create Goal
        createGoal: async (goalData) => {
          try {
            const goal = await analyticsService.createGoal(goalData);
            set(state => ({
              goals: [...state.goals, goal]
            }));
          } catch (err) {
            set({
              error: err instanceof Error ? err.message : 'Failed to create goal'
            });
          }
        },

        // Update Goal
        updateGoal: async (id, data) => {
          try {
            const updated = await analyticsService.updateGoal(id, data);
            set(state => ({
              goals: state.goals.map(g => g.id === id ? updated : g)
            }));
          } catch (err) {
            set({
              error: err instanceof Error ? err.message : 'Failed to update goal'
            });
          }
        },

        // Delete Goal
        deleteGoal: async (id) => {
          try {
            await analyticsService.deleteGoal(id);
            set(state => ({
              goals: state.goals.filter(g => g.id !== id)
            }));
          } catch (err) {
            set({
              error: err instanceof Error ? err.message : 'Failed to delete goal'
            });
          }
        },

        // Load Productivity
        loadProductivity: async (projectId, days = 30) => {
          try {
            const productivity = await analyticsService.getProductivityMetrics(projectId, days);
            set({ productivity });
          } catch (err) {
            set({
              error: err instanceof Error ? err.message : 'Failed to load productivity'
            });
          }
        },

        // Load Streak
        loadStreak: async (projectId) => {
          try {
            const streakData = await analyticsService.getStreak(projectId);
            set({ streakData });
          } catch (err) {
            set({
              error: err instanceof Error ? err.message : 'Failed to load streak'
            });
          }
        },

        // Reset Store
        reset: () => {
          set({
            currentSession: null,
            projectAnalytics: null,
            goals: [],
            streakData: null,
            productivity: [],
            isTracking: false,
            isLoading: false,
            error: null
          });
        }
      }),
      {
        name: 'analytics-storage',
        partialize: (state) => ({
          // Only persist non-sensitive data
          goals: state.goals,
          streakData: state.streakData
        })
      }
    ),
    { name: 'AnalyticsStore' }
  )
);

// Selectors (for performance optimization)
export const selectCurrentSession = (state: AnalyticsState) => state.currentSession;
export const selectIsTracking = (state: AnalyticsState) => state.isTracking;
export const selectProjectAnalytics = (state: AnalyticsState) => state.projectAnalytics;
export const selectGoals = (state: AnalyticsState) => state.goals;
export const selectProductivity = (state: AnalyticsState) => state.productivity;
export const selectStreakData = (state: AnalyticsState) => state.streakData;
```

### Migration in Components

**Before (AnalyticsDashboard.tsx):**
```typescript
const {
  projectAnalytics,
  goals,
  productivity,
  streakData,
  isLoading,
  loadProjectAnalytics,
  loadGoals,
  createGoal
} = useAnalytics(projectId);
```

**After (AnalyticsDashboard.tsx):**
```typescript
import { useAnalyticsStore, selectProjectAnalytics, selectGoals } from '@/lib/stores';

const AnalyticsDashboard = ({ projectId }) => {
  // Subscribe to specific slices (prevents unnecessary re-renders)
  const projectAnalytics = useAnalyticsStore(selectProjectAnalytics);
  const goals = useAnalyticsStore(selectGoals);
  const isLoading = useAnalyticsStore(state => state.isLoading);

  // Actions
  const loadAnalytics = useAnalyticsStore(state => state.loadProjectAnalytics);
  const loadGoals = useAnalyticsStore(state => state.loadGoals);
  const createGoal = useAnalyticsStore(state => state.createGoal);

  useEffect(() => {
    loadAnalytics(projectId);
    loadGoals(projectId);
  }, [projectId]);

  // ... rest of component
};
```

**Estimated Time:** 6 hours

---

## Phase 3: Publishing Store Migration (PRIORITY 2)

### Current State (usePublishingAnalytics.ts - 15 useState calls)

Similar massive state fragmentation.

### Target Store (publishingStore.ts)

**File:** `src/lib/stores/publishingStore.ts`

```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { publishingAnalyticsService } from '@/features/publishing/services/publishingAnalyticsService';

interface PublishingState {
  // Data State
  platforms: PublishingPlatform[];
  selectedPlatforms: string[];
  analytics: PublishingAnalytics | null;
  salesData: SalesData[];
  readerFeedback: Feedback[];

  // UI State
  isLoading: boolean;
  isPublishing: boolean;
  error: string | null;

  // Actions
  loadPlatforms: () => Promise<void>;
  selectPlatform: (id: string) => void;
  deselectPlatform: (id: string) => void;
  configurePlatform: (id: string, config: PlatformConfig) => Promise<void>;
  publish: (bookId: string, platforms: string[]) => Promise<void>;
  loadAnalytics: (bookId: string) => Promise<void>;
  loadSalesData: (bookId: string, dateRange: DateRange) => Promise<void>;
  loadFeedback: (bookId: string) => Promise<void>;
  reset: () => void;
}

export const usePublishingStore = create<PublishingState>()(
  devtools(
    (set, get) => ({
      // Initial State
      platforms: [],
      selectedPlatforms: [],
      analytics: null,
      salesData: [],
      readerFeedback: [],
      isLoading: false,
      isPublishing: false,
      error: null,

      // Implementation...
      loadPlatforms: async () => {
        try {
          set({ isLoading: true });
          const platforms = await publishingAnalyticsService.getPlatforms();
          set({ platforms, isLoading: false });
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'Failed to load platforms',
            isLoading: false
          });
        }
      },

      selectPlatform: (id) => {
        set(state => ({
          selectedPlatforms: [...state.selectedPlatforms, id]
        }));
      },

      deselectPlatform: (id) => {
        set(state => ({
          selectedPlatforms: state.selectedPlatforms.filter(p => p !== id)
        }));
      },

      publish: async (bookId, platforms) => {
        try {
          set({ isPublishing: true, error: null });
          await publishingAnalyticsService.publish(bookId, platforms);
          set({ isPublishing: false });
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'Failed to publish',
            isPublishing: false
          });
        }
      },

      // ... other actions

      reset: () => {
        set({
          platforms: [],
          selectedPlatforms: [],
          analytics: null,
          salesData: [],
          readerFeedback: [],
          isLoading: false,
          isPublishing: false,
          error: null
        });
      }
    }),
    { name: 'PublishingStore' }
  )
);
```

**Estimated Time:** 6 hours

---

## Phase 4: Editor Store Migration (PRIORITY 3)

### Current State (BookViewer.tsx - 12 useState calls)

Complex UI state management for modals, sidebars, and editor modes.

### Target Solution: useReducer Pattern

For UI-heavy state without persistence needs, `useReducer` is more appropriate than Zustand.

**File:** `src/features/editor/hooks/useEditorState.ts`

```typescript
import { useReducer } from 'react';

// State Type
interface EditorState {
  // Content State
  summary: string;
  content: string;
  hasUnsavedChanges: boolean;
  isGeneratingImage: boolean;

  // UI State
  isSidebarOpen: boolean;
  isFocusMode: boolean;
  showVersionHistory: boolean;
  showVersionComparison: boolean;
  showAnalytics: boolean;
  comparisonVersions: [any, any] | null;

  // Refine Settings
  refineSettings: RefineOptions;
}

// Action Types
type EditorAction =
  | { type: 'SET_CONTENT'; payload: string }
  | { type: 'SET_SUMMARY'; payload: string }
  | { type: 'SET_UNSAVED_CHANGES'; payload: boolean }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'TOGGLE_FOCUS_MODE' }
  | { type: 'OPEN_VERSION_HISTORY' }
  | { type: 'CLOSE_VERSION_HISTORY' }
  | { type: 'OPEN_VERSION_COMPARISON'; payload: [any, any] }
  | { type: 'CLOSE_VERSION_COMPARISON' }
  | { type: 'TOGGLE_ANALYTICS' }
  | { type: 'SET_REFINE_SETTINGS'; payload: RefineOptions }
  | { type: 'START_IMAGE_GENERATION' }
  | { type: 'END_IMAGE_GENERATION' }
  | { type: 'RESET' };

// Reducer
function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'SET_CONTENT':
      return { ...state, content: action.payload, hasUnsavedChanges: true };

    case 'SET_SUMMARY':
      return { ...state, summary: action.payload, hasUnsavedChanges: true };

    case 'SET_UNSAVED_CHANGES':
      return { ...state, hasUnsavedChanges: action.payload };

    case 'TOGGLE_SIDEBAR':
      return { ...state, isSidebarOpen: !state.isSidebarOpen };

    case 'TOGGLE_FOCUS_MODE':
      return {
        ...state,
        isFocusMode: !state.isFocusMode,
        isSidebarOpen: state.isFocusMode ? state.isSidebarOpen : false
      };

    case 'OPEN_VERSION_HISTORY':
      return { ...state, showVersionHistory: true };

    case 'CLOSE_VERSION_HISTORY':
      return { ...state, showVersionHistory: false };

    case 'OPEN_VERSION_COMPARISON':
      return {
        ...state,
        showVersionComparison: true,
        comparisonVersions: action.payload
      };

    case 'CLOSE_VERSION_COMPARISON':
      return {
        ...state,
        showVersionComparison: false,
        comparisonVersions: null
      };

    case 'TOGGLE_ANALYTICS':
      return { ...state, showAnalytics: !state.showAnalytics };

    case 'SET_REFINE_SETTINGS':
      return { ...state, refineSettings: action.payload };

    case 'START_IMAGE_GENERATION':
      return { ...state, isGeneratingImage: true };

    case 'END_IMAGE_GENERATION':
      return { ...state, isGeneratingImage: false };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

// Initial State
const initialState: EditorState = {
  summary: '',
  content: '',
  hasUnsavedChanges: false,
  isGeneratingImage: false,
  isSidebarOpen: false,
  isFocusMode: false,
  showVersionHistory: false,
  showVersionComparison: false,
  showAnalytics: false,
  comparisonVersions: null,
  refineSettings: {
    tone: 'balanced',
    length: 'maintain',
    focusArea: 'overall'
  }
};

// Custom Hook
export function useEditorState() {
  const [state, dispatch] = useReducer(editorReducer, initialState);

  return {
    state,
    actions: {
      setContent: (content: string) => dispatch({ type: 'SET_CONTENT', payload: content }),
      setSummary: (summary: string) => dispatch({ type: 'SET_SUMMARY', payload: summary }),
      setUnsavedChanges: (hasChanges: boolean) =>
        dispatch({ type: 'SET_UNSAVED_CHANGES', payload: hasChanges }),
      toggleSidebar: () => dispatch({ type: 'TOGGLE_SIDEBAR' }),
      toggleFocusMode: () => dispatch({ type: 'TOGGLE_FOCUS_MODE' }),
      openVersionHistory: () => dispatch({ type: 'OPEN_VERSION_HISTORY' }),
      closeVersionHistory: () => dispatch({ type: 'CLOSE_VERSION_HISTORY' }),
      openVersionComparison: (versions: [any, any]) =>
        dispatch({ type: 'OPEN_VERSION_COMPARISON', payload: versions }),
      closeVersionComparison: () => dispatch({ type: 'CLOSE_VERSION_COMPARISON' }),
      toggleAnalytics: () => dispatch({ type: 'TOGGLE_ANALYTICS' }),
      setRefineSettings: (settings: RefineOptions) =>
        dispatch({ type: 'SET_REFINE_SETTINGS', payload: settings }),
      startImageGeneration: () => dispatch({ type: 'START_IMAGE_GENERATION' }),
      endImageGeneration: () => dispatch({ type: 'END_IMAGE_GENERATION' }),
      reset: () => dispatch({ type: 'RESET' })
    }
  };
}
```

**Usage in BookViewer.tsx:**
```typescript
const BookViewer = ({ projectId, chapterId }) => {
  const { state, actions } = useEditorState();

  const handleContentChange = (newContent: string) => {
    actions.setContent(newContent);
  };

  const handleSave = async () => {
    // Save logic
    actions.setUnsavedChanges(false);
  };

  return (
    <div>
      {/* Use state.isSidebarOpen, state.content, etc. */}
      {/* Use actions.toggleSidebar(), actions.setContent(), etc. */}
    </div>
  );
};
```

**Estimated Time:** 4 hours

---

## Phase 5: Versioning Store Migration (OPTIONAL)

**Current State:** 6 useState calls (borderline)

**Decision:** Keep as-is or migrate to Zustand if future features add complexity.

**Estimated Time:** 0 hours (deferred)

---

## Summary

### Implementation Timeline

| Phase | Component | Time (hours) | Priority |
|-------|-----------|--------------|----------|
| 1 | Install Zustand + infrastructure | 0.5 | P0 |
| 2 | Analytics Store | 6 | P0 |
| 3 | Publishing Store | 6 | P0 |
| 4 | Editor useReducer | 4 | P1 |
| 5 | Testing & validation | 3 | P1 |
| **TOTAL** | | **19.5** | |

### Expected Benefits

1. **Performance:** Selective subscriptions prevent unnecessary re-renders
2. **Maintainability:** Centralized state logic easier to debug
3. **Type Safety:** Full TypeScript support with inferred types
4. **DevTools:** Zustand devtools for state debugging
5. **Persistence:** Optional state persistence across sessions
6. **Testing:** Easier to test isolated store logic

---

## Success Criteria

- ✓ Zero components with >3 useState calls
- ✓ All complex state in Zustand stores or useReducer
- ✓ Devtools integration functional
- ✓ No performance regressions
- ✓ All existing tests passing
- ✓ Type safety maintained

---

**Status:** Ready for implementation
**Dependencies:** None (can run parallel to component refactoring)
**Risk:** Medium (state migrations can introduce bugs - thorough testing required)
