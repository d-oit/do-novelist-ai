import { useCallback, useEffect, useRef } from 'react';

import type { Project } from '@/types';

import { useAnalyticsStore } from '../../../lib/stores/analyticsStore';
import type {
  WritingSession,
  WeeklyStats,
  ProjectAnalytics,
  WritingGoals,
  WritingInsights,
  AnalyticsFilter,
  ChartDataPoint,
} from '../types';

export interface UseAnalyticsReturn {
  // Session Management
  currentSession: WritingSession | null;
  isTracking: boolean;
  startSession: (projectId: string, chapterId?: string) => Promise<WritingSession>;
  endSession: () => Promise<void>;

  // Analytics Data
  projectAnalytics: ProjectAnalytics | null;
  weeklyStats: WeeklyStats | null;
  insights: WritingInsights | null;
  goals: WritingGoals[];

  // Chart Data
  wordCountChart: ChartDataPoint[];
  productivityChart: ChartDataPoint[];
  streakChart: ChartDataPoint[];

  // Actions
  loadProjectAnalytics: (project: Project) => Promise<void>;
  loadWeeklyStats: (weekStart?: Date) => Promise<void>;
  loadInsights: (filter?: AnalyticsFilter) => Promise<void>;
  createGoal: (goal: Omit<WritingGoals, 'id' | 'current'>) => Promise<WritingGoals>;
  updateGoal: (goalId: string, data: Partial<WritingGoals>) => Promise<void>;

  // Chart Data Loaders
  loadWordCountChart: (projectId: string, days?: number) => Promise<void>;
  loadProductivityChart: (days?: number) => void;

  // Export
  exportAnalytics: (format: 'json' | 'csv' | 'pdf') => Promise<string>;

  // State
  isLoading: boolean;
  error: string | null;

  // Tracking
  trackWordCountChange: (oldCount: number, newCount: number) => void;
  trackKeystroke: (isBackspace?: boolean) => void;
  trackAIGeneration: (wordsGenerated: number) => void;
}

export const useAnalytics = (): UseAnalyticsReturn => {
  const store = useAnalyticsStore();

  // Tracking metrics (kept local for performance)
  const sessionMetrics = useRef({
    initialWordCount: 0,
    currentWordCount: 0,
    charactersTyped: 0,
    backspacesPressed: 0,
    aiWordsGenerated: 0,
  });

  // Initialize with cleanup
  useEffect(() => {
    const controller = new AbortController();

    store.init().catch((err: unknown) => {
      if (err instanceof Error && err.name === 'AbortError') return;
      console.error('Failed to initialize analytics:', err);
    });

    return (): void => {
      controller.abort();
    };
  }, [store]);

  // Session Management Wrappers
  const startSession = useCallback(
    async (projectId: string, chapterId?: string) => {
      const session = await store.startSession(projectId, chapterId);

      // Reset local metrics
      sessionMetrics.current = {
        initialWordCount: 0,
        currentWordCount: 0,
        charactersTyped: 0,
        backspacesPressed: 0,
        aiWordsGenerated: 0,
      };

      return session;
    },
    [store],
  );

  const endSession = useCallback(async () => {
    const metrics = sessionMetrics.current;
    await store.endSession({
      wordsAdded: Math.max(0, metrics.currentWordCount - metrics.initialWordCount),
      wordsRemoved: Math.max(0, metrics.initialWordCount - metrics.currentWordCount),
      charactersTyped: metrics.charactersTyped,
      backspacesPressed: metrics.backspacesPressed,
      aiWordsGenerated: metrics.aiWordsGenerated,
    });
  }, [store]);

  // Tracking Functions
  const trackWordCountChange = useCallback(
    (oldCount: number, newCount: number) => {
      if (!store.isTracking) return;

      sessionMetrics.current.currentWordCount = newCount;
      if (sessionMetrics.current.initialWordCount === 0) {
        sessionMetrics.current.initialWordCount = oldCount;
      }
    },
    [store.isTracking],
  );

  const trackKeystroke = useCallback(
    (isBackspace = false) => {
      if (!store.isTracking) return;

      if (isBackspace) {
        sessionMetrics.current.backspacesPressed++;
      } else {
        sessionMetrics.current.charactersTyped++;
      }
    },
    [store.isTracking],
  );

  const trackAIGeneration = useCallback(
    (wordsGenerated: number) => {
      if (!store.isTracking) return;
      sessionMetrics.current.aiWordsGenerated += wordsGenerated;
    },
    [store.isTracking],
  );

  // Export Logic (kept here as it's a utility)
  const exportAnalytics = useCallback(
    (format: 'json' | 'csv' | 'pdf'): Promise<string> => {
      const exportData = {
        projectAnalytics: store.projectAnalytics,
        weeklyStats: store.weeklyStats,
        insights: store.insights,
        goals: store.goals,
        charts: {
          wordCount: store.wordCountChart,
          productivity: store.productivityChart,
          streak: store.streakChart,
        },
        exportedAt: new Date().toISOString(),
      };

      if (format === 'json') {
        return Promise.resolve(JSON.stringify(exportData, null, 2));
      } else if (format === 'csv') {
        // Simple CSV conversion
        return Promise.resolve(
          Object.entries(exportData)
            .map(([key, value]) => `${key},${JSON.stringify(value)}`)
            .join('\n'),
        );
      } else {
        return Promise.reject(new Error('PDF export not yet implemented'));
      }
    },
    [store],
  );

  // Auto-end session on page unload
  useEffect(() => {
    const handleBeforeUnload = (): void => {
      if (store.currentSession && store.isTracking) {
        void endSession();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return (): void => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [store.currentSession, store.isTracking, endSession]);

  return {
    // State from Store
    currentSession: store.currentSession,
    isTracking: store.isTracking,
    projectAnalytics: store.projectAnalytics,
    weeklyStats: store.weeklyStats,
    insights: store.insights,
    goals: store.goals,
    wordCountChart: store.wordCountChart,
    productivityChart: store.productivityChart,
    streakChart: store.streakChart,
    isLoading: store.isLoading,
    error: store.error,

    // Actions from Store
    startSession,
    endSession,
    loadProjectAnalytics: store.loadProjectAnalytics,
    loadWeeklyStats: store.loadWeeklyStats,
    loadInsights: store.loadInsights,
    createGoal: store.createGoal,
    updateGoal: store.updateGoal,
    loadWordCountChart: store.loadWordCountChart,
    loadProductivityChart: store.loadProductivityChart,

    // Local Actions
    exportAnalytics,
    trackWordCountChange,
    trackKeystroke,
    trackAIGeneration,
  };
};
