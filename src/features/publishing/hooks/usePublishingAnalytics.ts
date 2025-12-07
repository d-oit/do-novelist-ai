import { useCallback, useEffect, useMemo } from 'react';

import { usePublishingStore } from '../../../lib/stores/publishingStore';
import type { Project } from '@/types';
import { publishingAnalyticsService } from '../services/publishingAnalyticsService';
import type {
  EngagementMetrics,
  PlatformAnalytics,
  Publication,
  PublishingAlert,
  PublishingGoals,
  PublishingPlatform,
  PublishingTrends,
  ReaderFeedback,
  ReaderInsights,
} from '../types';

export interface UsePublishingAnalyticsReturn {
  // Publications
  publications: Publication[];
  currentPublication: Publication | null;

  // Analytics Data
  analytics: PlatformAnalytics | null;
  engagement: EngagementMetrics | null;
  insights: ReaderInsights | null;
  trends: PublishingTrends | null;

  // Feedback & Reviews
  feedback: ReaderFeedback[];
  averageRating: number;
  totalReviews: number;
  sentimentBreakdown: { positive: number; neutral: number; negative: number };

  // Goals & Performance
  goals: PublishingGoals[];
  alerts: PublishingAlert[];

  // Platform Management
  platforms: PublishingPlatform[];
  connectedPlatforms: PublishingPlatform[];

  // Actions
  publishProject: (
    project: Project,
    platforms: string[],
    metadata: Publication['metadata'],
  ) => Promise<Publication>;
  loadPublicationData: (publicationId: string) => Promise<void>;
  createGoal: (goal: Omit<PublishingGoals, 'id' | 'current'>) => Promise<PublishingGoals>;
  connectPlatform: (platformId: string, credentials: Record<string, unknown>) => boolean;

  // Data Loading
  refreshAnalytics: (publicationId: string) => Promise<void>;
  loadTrends: (publicationId: string, days?: number) => void;
  loadFeedback: (publicationId: string, limit?: number) => Promise<void>;

  // Export & Sharing
  exportAnalytics: (publicationIds: string[], format: 'json' | 'csv' | 'xlsx') => Promise<string>;
  generateReport: (publicationId: string) => Promise<string>;

  // Filtering & Search
  filterFeedback: (type?: string, sentiment?: string) => ReaderFeedback[];
  searchFeedback: (query: string) => ReaderFeedback[];

  // State
  isLoading: boolean;
  error: string | null;
  isPublishing: boolean;

  // Alert Management
  markAlertAsRead: (alertId: string) => void;
  dismissAlert: (alertId: string) => void;
}

export const usePublishingAnalytics = (): UsePublishingAnalyticsReturn => {
  const store = usePublishingStore();

  // Initialize with cleanup
  useEffect(() => {
    const controller = new AbortController();

    store.init().catch((err: unknown) => {
      if (err instanceof Error && err.name === 'AbortError') return;
      console.error('Failed to initialize publishing analytics:', err);
    });

    const cleanup = (): void => {
      controller.abort();
    };
    return cleanup;
  }, [store]);

  // Computed values
  const averageRating = useMemo(() => {
    const rated = store.feedback.filter(f => f.rating != null);
    return rated.length > 0 ? rated.reduce((sum, f) => sum + (f.rating ?? 0), 0) / rated.length : 0;
  }, [store.feedback]);

  const totalReviews = useMemo(
    () => store.feedback.filter(f => f.type === 'review').length,
    [store.feedback],
  );

  const sentimentBreakdown = useMemo(
    () => ({
      positive: store.feedback.filter(f => f.sentiment === 'positive').length,
      neutral: store.feedback.filter(f => f.sentiment === 'neutral').length,
      negative: store.feedback.filter(f => f.sentiment === 'negative').length,
    }),
    [store.feedback],
  );

  // Helper Functions (Logic kept in hook)
  const refreshAnalytics = useCallback(
    async (publicationId: string) => {
      await store.loadPublicationData(publicationId);
    },
    [store],
  );

  const exportAnalytics = useCallback(
    async (publicationIds: string[], format: 'json' | 'csv' | 'xlsx'): Promise<string> => {
      try {
        return await publishingAnalyticsService.exportPublishingAnalytics(publicationIds, format);
      } catch (err) {
        // We might want to set error in store or throw
        throw new Error(err instanceof Error ? err.message : 'Failed to export analytics');
      }
    },
    [],
  );

  const generateReport = useCallback(async (publicationId: string): Promise<string> => {
    try {
      // We can use store data if available, or fetch fresh
      // Fetching fresh ensures report is up to date
      const [analyticsData, insightsData] = await Promise.all([
        publishingAnalyticsService.getPublicationAnalytics(publicationId),
        publishingAnalyticsService.getReaderInsights(publicationId),
      ]);
      const engagementData = publishingAnalyticsService.getEngagementMetrics(publicationId, {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date(),
      });

      const report = {
        publicationId,
        generatedAt: new Date().toISOString(),
        summary: {
          totalViews: analyticsData.views,
          averageRating: analyticsData.rating.average,
          completionRate: engagementData.completionRate,
          topCountries: insightsData.audienceProfile.topCountries,
        },
        performance: {
          viewTrend: 'increasing',
          engagementLevel: engagementData.averageReadingTime > 30 ? 'high' : 'moderate',
          readerSatisfaction: analyticsData.rating.average >= 4 ? 'excellent' : 'good',
        },
        recommendations: insightsData.marketInsights.recommendations,
      };

      return JSON.stringify(report, null, 2);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to generate report');
    }
  }, []);

  const filterFeedback = useCallback(
    (type?: string, sentiment?: string): ReaderFeedback[] => {
      return store.feedback.filter(item => {
        if ((type ?? '') && item.type !== type) return false;
        if ((sentiment ?? '') && item.sentiment !== sentiment) return false;
        return true;
      });
    },
    [store.feedback],
  );

  const searchFeedback = useCallback(
    (query: string): ReaderFeedback[] => {
      const lowercaseQuery = query.toLowerCase();
      return store.feedback.filter(
        item =>
          item.content?.toLowerCase().includes(lowercaseQuery) === true ||
          item.author.name.toLowerCase().includes(lowercaseQuery) ||
          item.topics.some(topic => topic.toLowerCase().includes(lowercaseQuery)),
      );
    },
    [store.feedback],
  );

  // Performance Monitoring (Effect to generate alerts based on data)
  useEffect(() => {
    if (store.analytics && store.engagement && store.currentPublication) {
      const newAlerts: PublishingAlert[] = [];

      // Low engagement alert
      if (store.engagement.completionRate < 0.3) {
        const alertId = `alert_low_completion_${store.currentPublication.id}`;
        // Check if alert already exists to avoid duplicates
        if (!store.alerts.some(a => a.id.startsWith('alert_low_completion_'))) {
          newAlerts.push({
            id: alertId,
            type: 'issue',
            priority: 'high',
            title: 'Low Completion Rate',
            message: `Your story has a ${Math.round(store.engagement.completionRate * 100)}% completion rate. Consider improving chapter endings.`,
            actionRequired: true,
            suggestedActions: ['Review chapter cliffhangers', 'Shorten chapters', 'Improve pacing'],
            timestamp: new Date(),
            isRead: false,
            publicationId: store.currentPublication.id,
          });
        }
      }

      // Rating milestone alert
      if (store.analytics.rating.average >= 4.5 && store.analytics.rating.count >= 10) {
        const alertId = `alert_high_rating_${store.currentPublication.id}`;
        if (!store.alerts.some(a => a.id.startsWith('alert_high_rating_'))) {
          newAlerts.push({
            id: alertId,
            type: 'milestone',
            priority: 'medium',
            title: 'Excellent Rating Achievement!',
            message: `Your story has achieved a ${store.analytics.rating.average.toFixed(1)} star average with ${store.analytics.rating.count} reviews!`,
            actionRequired: false,
            timestamp: new Date(),
            isRead: false,
            publicationId: store.currentPublication.id,
          });
        }
      }

      if (newAlerts.length > 0) {
        newAlerts.forEach(alert => store.addAlert(alert));
      }
    }
  }, [
    store.analytics,
    store.engagement,
    store.currentPublication,
    store.alerts,
    store.addAlert,
    store,
  ]);

  return {
    // State from Store
    publications: store.publications,
    currentPublication: store.currentPublication,
    analytics: store.analytics,
    engagement: store.engagement,
    insights: store.insights,
    trends: store.trends,
    feedback: store.feedback,
    goals: store.goals,
    alerts: store.alerts,
    platforms: store.platforms,
    connectedPlatforms: store.connectedPlatforms,
    isLoading: store.isLoading,
    error: store.error,
    isPublishing: store.isPublishing,

    // Computed
    averageRating,
    totalReviews,
    sentimentBreakdown,

    // Actions from Store
    publishProject: store.publishProject,
    loadPublicationData: store.loadPublicationData,
    createGoal: store.createGoal,
    connectPlatform: store.connectPlatform,
    loadTrends: store.loadTrends,
    loadFeedback: store.loadFeedback,
    markAlertAsRead: store.markAlertAsRead,
    dismissAlert: store.dismissAlert,

    // Local Actions
    refreshAnalytics,
    exportAnalytics,
    generateReport,
    filterFeedback,
    searchFeedback,
  };
};
