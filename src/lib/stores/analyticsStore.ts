import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

import { analyticsService } from '@/features/analytics/services/analyticsService';
import {
  type AnalyticsFilter,
  type ChartDataPoint,
  type DailyStats,
  type ProjectAnalytics,
  type WeeklyStats,
  type WritingGoals,
  type WritingInsights,
  type WritingSession,
} from '@/features/analytics/types';
import { type Project } from '@/types';


// Store State
interface AnalyticsState {
  // Data State
  currentSession: WritingSession | null;
  projectAnalytics: ProjectAnalytics | null;
  goals: WritingGoals[];
  insights: WritingInsights | null;
  dailyStats: DailyStats[];
  weeklyStats: WeeklyStats | null;

  // Chart Data
  wordCountChart: ChartDataPoint[];
  productivityChart: ChartDataPoint[];
  streakChart: ChartDataPoint[];

  // UI State
  isTracking: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  init: () => Promise<void>;
  startSession: (projectId: string, chapterId?: string) => Promise<WritingSession>;
  endSession: (metrics?: {
    wordsAdded: number;
    wordsRemoved: number;
    charactersTyped: number;
    backspacesPressed: number;
    aiWordsGenerated: number;
  }) => Promise<void>;
  trackProgress: (projectId: string, wordsWritten: number, chapterIds: string[]) => Promise<void>;

  // Data Loaders
  loadProjectAnalytics: (project: Project) => Promise<void>;

  loadGoals: (projectId: string) => Promise<void>;
  loadInsights: (filter?: AnalyticsFilter) => Promise<void>;
  loadWeeklyStats: (weekStart?: Date) => Promise<void>;

  // Chart Loaders
  loadWordCountChart: (projectId: string, days?: number) => Promise<void>;
  loadProductivityChart: (days?: number) => void;

  // Goal Management
  createGoal: (goal: Omit<WritingGoals, 'id' | 'current'>) => Promise<WritingGoals>;
  updateGoal: (id: string, data: Partial<WritingGoals>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;

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
        insights: null,
        dailyStats: [],
        weeklyStats: null,
        wordCountChart: [],
        productivityChart: [],
        streakChart: [],
        isTracking: false,
        isLoading: false,
        error: null,

        // Initialize
        init: async (): Promise<void> => {
          try {
            set({ isLoading: true, error: null });
            await analyticsService.init();
            set({ isLoading: false });
          } catch (err) {
            set({
              error: err instanceof Error ? err.message : 'Failed to initialize analytics',
              isLoading: false,
            });
          }
        },

        // Start Session
        startSession: async (projectId: string, chapterId?: string): Promise<WritingSession> => {
          try {
            set({ isLoading: true, error: null });
            const session = await analyticsService.startWritingSession(projectId, chapterId);
            set({
              currentSession: session,
              isTracking: true,
              isLoading: false,
            });
            return session;
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to start session';
            set({
              error: msg,
              isLoading: false,
            });
            throw new Error(msg);
          }
        },

        // End Session
        endSession: async (metrics): Promise<void> => {
          const { currentSession } = get();
          if (!currentSession) return;

          try {
            set({ isLoading: true, error: null });

            // Provide default metrics if not provided
            const sessionMetrics = metrics ?? {
              wordsAdded: 0,
              wordsRemoved: 0,
              charactersTyped: 0,
              backspacesPressed: 0,
              aiWordsGenerated: 0,
            };

            await analyticsService.endWritingSession(currentSession.id, sessionMetrics);
            set({
              currentSession: null,
              isTracking: false,
              isLoading: false,
            });
          } catch (err) {
            set({
              error: err instanceof Error ? err.message : 'Failed to end session',
              isLoading: false,
            });
          }
        },

        // Track Progress
        trackProgress: async (
          _projectId: string,
          wordsWritten: number,
          chapterIds: string[],
        ): Promise<void> => {
          const { currentSession } = get();
          if (!currentSession) return;

          try {
            await analyticsService.trackProgress(currentSession.id, {
              wordsWritten,
              chapterIds,
              timeSpent:
                typeof currentSession.startTime === 'number'
                  ? Date.now() - currentSession.startTime
                  : currentSession.startTime instanceof Date
                    ? Date.now() - currentSession.startTime.getTime()
                    : 0,
            });

            // Update current session locally
            set(state => ({
              currentSession: state.currentSession
                ? {
                    ...state.currentSession,
                    wordsAdded: state.currentSession.wordsAdded + wordsWritten,
                    netWordCount: state.currentSession.netWordCount + wordsWritten,
                  }
                : null,
            }));
          } catch (err) {
            set({
              error: err instanceof Error ? err.message : 'Failed to track progress',
            });
          }
        },

        // Load Project Analytics
        loadProjectAnalytics: async (project): Promise<void> => {
          try {
            set({ isLoading: true, error: null });
            const analytics = await analyticsService.getProjectAnalytics(project);
            set({
              projectAnalytics: analytics,
              isLoading: false,
            });
          } catch (err) {
            set({
              error: err instanceof Error ? err.message : 'Failed to load analytics',
              isLoading: false,
            });
          }
        },

        // Load Goals
        loadGoals: async (projectId: string): Promise<void> => {
          try {
            const goals = await analyticsService.getGoals(projectId);
            set({ goals });
          } catch (err) {
            set({
              error: err instanceof Error ? err.message : 'Failed to load goals',
            });
          }
        },

        // Load Insights
        loadInsights: async (filter): Promise<void> => {
          try {
            set({ isLoading: true, error: null });
            const insights = await analyticsService.getWritingInsights(
              filter ?? {
                dateRange: {
                  start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                  end: new Date(),
                },
                granularity: 'day',
              },
            );
            set({ insights, isLoading: false });
          } catch (err) {
            set({
              error: err instanceof Error ? err.message : 'Failed to load insights',
              isLoading: false,
            });
          }
        },

        // Load Weekly Stats
        loadWeeklyStats: async (weekStart): Promise<void> => {
          try {
            set({ isLoading: true, error: null });
            const stats = await analyticsService.getWeeklyStats(weekStart ?? new Date());
            set({ weeklyStats: stats, isLoading: false });
          } catch (err) {
            set({
              error: err instanceof Error ? err.message : 'Failed to load weekly stats',
              isLoading: false,
            });
          }
        },

        // Load Charts
        loadWordCountChart: async (projectId, days = 30): Promise<void> => {
          try {
            const data = await analyticsService.getWordCountChartData(projectId, days);
            set({ wordCountChart: data });
          } catch (err) {
            set({ error: err instanceof Error ? err.message : 'Failed to load word count chart' });
          }
        },

        loadProductivityChart(days = 30): void {
          // Placeholder as per original hook
          const data: ChartDataPoint[] = [];
          const end = new Date();
          const start = new Date();
          start.setDate(end.getDate() - days);
          for (let i = 0; i < days; i++) {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            const dateStr = d.toISOString().split('T')[0] ?? '';
            data.push({
              date: dateStr,
              value: Math.floor(Math.random() * 50) + 10,
              label: d.toLocaleDateString('en-US', { weekday: 'short' }) ?? '',
            });
          }
          set({ productivityChart: data });
        },

        // Create Goal
        createGoal: async (goalData): Promise<WritingGoals> => {
          try {
            const goal = await analyticsService.createGoal(goalData);
            set(state => ({
              goals: [...state.goals, goal],
            }));
            return goal;
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to create goal';
            set({ error: msg });
            throw new Error(msg);
          }
        },

        // Update Goal
        updateGoal: async (id, data): Promise<void> => {
          try {
            await analyticsService.updateGoalProgress(id);
            // Ideally fetch updated goal
            set(state => ({
              goals: state.goals.map(g => (g.id === id ? { ...g, ...data } : g)),
            }));
          } catch (err) {
            set({
              error: err instanceof Error ? err.message : 'Failed to update goal',
            });
          }
        },

        // Delete Goal
        deleteGoal: async (id): Promise<void> => {
          try {
            await analyticsService.deleteGoal(id);
            set(state => ({
              goals: state.goals.filter(g => g.id !== id),
            }));
          } catch (err) {
            set({
              error: err instanceof Error ? err.message : 'Failed to delete goal',
            });
          }
        },

        // Reset Store
        reset: (): void => {
          set({
            currentSession: null,
            projectAnalytics: null,
            goals: [],
            insights: null,
            dailyStats: [],
            weeklyStats: null,
            wordCountChart: [],
            productivityChart: [],
            streakChart: [],
            isTracking: false,
            isLoading: false,
            error: null,
          });
        },
      }),
      {
        name: 'analytics-storage',
        partialize: state => ({
          goals: state.goals,
          insights: state.insights,
          weeklyStats: state.weeklyStats,
        }),
      },
    ),
    { name: 'AnalyticsStore' },
  ),
);

// Selectors
export const selectCurrentSession = (state: AnalyticsState): WritingSession | null =>
  state.currentSession;
export const selectIsTracking = (state: AnalyticsState): boolean => state.isTracking;
export const selectProjectAnalytics = (state: AnalyticsState): ProjectAnalytics | null =>
  state.projectAnalytics;
export const selectGoals = (state: AnalyticsState): WritingGoals[] => state.goals;
export const selectInsights = (state: AnalyticsState): WritingInsights | null => state.insights;
export const selectWeeklyStats = (state: AnalyticsState): WeeklyStats | null => state.weeklyStats;
export const selectCharts = (
  state: AnalyticsState,
): {
  wordCount: ChartDataPoint[];
  productivity: ChartDataPoint[];
  streak: ChartDataPoint[];
} => ({
  wordCount: state.wordCountChart,
  productivity: state.productivityChart,
  streak: state.streakChart,
});
