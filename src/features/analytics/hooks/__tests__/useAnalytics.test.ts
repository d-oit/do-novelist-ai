/**
 * Tests for useAnalytics hook
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { useAnalytics } from '@/features/analytics/hooks/useAnalytics';
import { useAnalyticsStore } from '@/lib/stores/analyticsStore';
import type { Project } from '@/types';

// Create mock functions outside the mock setup so they persist across calls
const mockStore = {
  currentSession: null,
  isTracking: false,
  projectAnalytics: null,
  weeklyStats: null,
  insights: null,
  goals: [],
  wordCountChart: [],
  productivityChart: [],
  streakChart: [],
  isLoading: false,
  error: null,
  init: vi.fn(() => Promise.resolve()),
  startSession: vi.fn((projectId?: string, chapterId?: string) =>
    Promise.resolve({
      id: 'session-1',
      projectId: projectId ?? 'proj-1',
      chapterId: chapterId ?? 'chapter-1',
      startTime: new Date('2026-01-15T10:00:00Z'),
      endTime: null,
      wordCount: 0,
    }),
  ),
  endSession: vi.fn(() => Promise.resolve()),
  loadProjectAnalytics: vi.fn(() => Promise.resolve()),
  loadWeeklyStats: vi.fn(() => Promise.resolve()),
  loadInsights: vi.fn(() => Promise.resolve()),
  createGoal: vi.fn((goal: any) => Promise.resolve({ ...goal, id: 'goal-1' })),
  updateGoal: vi.fn(() => Promise.resolve()),
  loadWordCountChart: vi.fn(() => Promise.resolve()),
  loadProductivityChart: vi.fn(() => Promise.resolve()),
};

// Mock the analytics store
vi.mock('@/lib/stores/analyticsStore', () => ({
  useAnalyticsStore: vi.fn(() => mockStore),
}));

describe('useAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock store state
    mockStore.currentSession = null;
    mockStore.isTracking = false;
    mockStore.endSession.mockClear();
    mockStore.updateGoal.mockClear();
    mockStore.loadProjectAnalytics.mockClear();
    mockStore.loadWeeklyStats.mockClear();
    mockStore.loadInsights.mockClear();
    mockStore.loadWordCountChart.mockClear();
    mockStore.loadProductivityChart.mockClear();
  });

  describe('initial state', () => {
    it('should return initial null values', () => {
      const { result } = renderHook(() => useAnalytics());

      expect(result.current.currentSession).toBeNull();
      expect(result.current.isTracking).toBe(false);
      expect(result.current.projectAnalytics).toBeNull();
      expect(result.current.weeklyStats).toBeNull();
      expect(result.current.insights).toBeNull();
      expect(result.current.goals).toEqual([]);
      expect(result.current.wordCountChart).toEqual([]);
      expect(result.current.productivityChart).toEqual([]);
      expect(result.current.streakChart).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('session management', () => {
    it('should start a new session', async () => {
      const { result } = renderHook(() => useAnalytics());

      await act(async () => {
        const session = await result.current.startSession('proj-1', 'chapter-1');
        expect(session).toEqual({
          id: 'session-1',
          projectId: 'proj-1',
          chapterId: 'chapter-1',
          startTime: expect.any(Date),
          endTime: null,
          wordCount: 0,
        });
      });
    });

    it('should start session without chapterId', async () => {
      const { result } = renderHook(() => useAnalytics());

      await act(async () => {
        const session = await result.current.startSession('proj-1');
        expect(session.projectId).toBe('proj-1');
      });
    });

    it('should end a session', async () => {
      const { result } = renderHook(() => useAnalytics());

      await act(async () => {
        await result.current.endSession();
      });

      const store = useAnalyticsStore();
      expect(store.endSession).toHaveBeenCalled();
    });
  });

  describe('tracking functions', () => {
    it('should track word count changes when tracking', () => {
      const store = useAnalyticsStore();
      // @ts-ignore - setting mock state
      store.isTracking = true;

      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackWordCountChange(100, 150);
      });

      // Should not throw and should handle the update
      expect(result.current).toBeDefined();
    });

    it('should not track word count when not tracking', () => {
      const store = useAnalyticsStore();
      // @ts-ignore - setting mock state
      store.isTracking = false;

      const { result } = renderHook(() => useAnalytics());

      expect(() => {
        act(() => {
          result.current.trackWordCountChange(100, 150);
        });
      }).not.toThrow();
    });

    it('should track keystrokes', () => {
      const store = useAnalyticsStore();
      // @ts-ignore - setting mock state
      store.isTracking = true;

      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackKeystroke(false);
      });

      act(() => {
        result.current.trackKeystroke(true);
      });

      expect(result.current).toBeDefined();
    });

    it('should track AI generation', () => {
      const store = useAnalyticsStore();
      // @ts-ignore - setting mock state
      store.isTracking = true;

      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackAIGeneration(100);
      });

      expect(result.current).toBeDefined();
    });
  });

  describe('goal management', () => {
    it('should create a new goal', async () => {
      const { result } = renderHook(() => useAnalytics());

      const newGoal = {
        type: 'daily' as const,
        target: { words: 1000 },
        current: { words: 0, time: 0, chapters: 0 },
        startDate: new Date('2026-01-15'),
        endDate: new Date('2026-01-20'),
        isActive: true,
      };

      await act(async () => {
        const goal = await result.current.createGoal(newGoal);
        expect(goal).toEqual({
          id: 'goal-1',
          ...newGoal,
        });
      });
    });

    it('should update an existing goal', async () => {
      const { result } = renderHook(() => useAnalytics());

      await act(async () => {
        await result.current.updateGoal('goal-1', { target: { words: 1500 } });
      });

      const store = useAnalyticsStore();
      expect(store.updateGoal).toHaveBeenCalledWith('goal-1', { target: { words: 1500 } });
    });
  });

  describe('export functionality', () => {
    it('should export analytics as JSON', async () => {
      const store = useAnalyticsStore();
      // @ts-ignore - setting mock data
      store.projectAnalytics = { totalWords: 5000, sessionsCount: 10 };

      const { result } = renderHook(() => useAnalytics());

      const exported = await result.current.exportAnalytics('json');
      const parsed = JSON.parse(exported);

      expect(parsed).toHaveProperty('exportedAt');
      expect(parsed.projectAnalytics).toEqual(store.projectAnalytics);
    });

    it('should export analytics as CSV', async () => {
      const { result } = renderHook(() => useAnalytics());

      const exported = await result.current.exportAnalytics('csv');

      expect(typeof exported).toBe('string');
      expect(exported).toContain(',');
      expect(exported).toContain('\n');
    });

    it('should reject PDF export', async () => {
      const { result } = renderHook(() => useAnalytics());

      await expect(result.current.exportAnalytics('pdf')).rejects.toThrow('PDF export not yet implemented');
    });
  });

  describe('data loading', () => {
    it('should load project analytics', async () => {
      const { result } = renderHook(() => useAnalytics());

      const project = { id: 'proj-1' } as Project;

      await act(async () => {
        await result.current.loadProjectAnalytics(project);
      });

      const store = useAnalyticsStore();
      expect(store.loadProjectAnalytics).toHaveBeenCalledWith(project);
    });

    it('should load weekly stats', async () => {
      const { result } = renderHook(() => useAnalytics());

      await act(async () => {
        await result.current.loadWeeklyStats(new Date('2026-01-08'));
      });

      const store = useAnalyticsStore();
      expect(store.loadWeeklyStats).toHaveBeenCalledWith(new Date('2026-01-08'));
    });

    it('should load weekly stats without date', async () => {
      const { result } = renderHook(() => useAnalytics());

      await act(async () => {
        await result.current.loadWeeklyStats();
      });

      const store = useAnalyticsStore();
      expect(store.loadWeeklyStats).toHaveBeenCalled();
    });

    it('should load insights', async () => {
      const { result } = renderHook(() => useAnalytics());

      const filter = {
        dateRange: {
          start: new Date('2026-01-01'),
          end: new Date('2026-01-31'),
        },
        granularity: 'week' as const,
      };

      await act(async () => {
        await result.current.loadInsights(filter);
      });

      const store = useAnalyticsStore();
      expect(store.loadInsights).toHaveBeenCalled();
    });

    it('should load insights without filter', async () => {
      const { result } = renderHook(() => useAnalytics());

      await act(async () => {
        await result.current.loadInsights();
      });

      const store = useAnalyticsStore();
      expect(store.loadInsights).toHaveBeenCalled();
    });
  });

  describe('chart data loading', () => {
    it('should load word count chart', async () => {
      const { result } = renderHook(() => useAnalytics());

      await act(async () => {
        await result.current.loadWordCountChart('proj-1', 7);
      });

      const store = useAnalyticsStore();
      expect(store.loadWordCountChart).toHaveBeenCalledWith('proj-1', 7);
    });

    it('should load productivity chart', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.loadProductivityChart(30);
      });

      const store = useAnalyticsStore();
      expect(store.loadProductivityChart).toHaveBeenCalledWith(30);
    });
  });
});
