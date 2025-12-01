import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

import { publishingAnalyticsService } from '../../features/publishing/services/publishingAnalyticsService';
import {
  type EngagementMetrics,
  type PlatformAnalytics,
  type Publication,
  type PublishingAlert,
  type PublishingGoals,
  type PublishingPlatform,
  type PublishingTrends,
  type ReaderFeedback,
  type ReaderInsights,
} from '../../features/publishing/types';
import { Project } from '../../types';

// Store State
interface PublishingState {
  // Data State
  publications: Publication[];
  currentPublication: Publication | null;
  analytics: PlatformAnalytics | null;
  engagement: EngagementMetrics | null;
  insights: ReaderInsights | null;
  trends: PublishingTrends | null;
  feedback: ReaderFeedback[];
  goals: PublishingGoals[];
  alerts: PublishingAlert[];
  platforms: PublishingPlatform[];
  connectedPlatforms: PublishingPlatform[];

  // UI State
  isLoading: boolean;
  isPublishing: boolean;
  error: string | null;

  // Actions
  init: () => Promise<void>;
  publishProject: (
    project: Project,
    platformIds: string[],
    metadata: Publication['metadata'],
  ) => Promise<Publication>;
  loadPublicationData: (publicationId: string) => Promise<void>;
  loadTrends: (publicationId: string, days?: number) => void;
  loadFeedback: (publicationId: string, limit?: number) => Promise<void>;
  createGoal: (goalData: Omit<PublishingGoals, 'id' | 'current'>) => Promise<PublishingGoals>;
  connectPlatform: (platformId: string, credentials: Record<string, unknown>) => boolean;

  // Alert Management
  addAlert: (alert: PublishingAlert) => void;
  markAlertAsRead: (alertId: string) => void;
  dismissAlert: (alertId: string) => void;

  reset: () => void;
}

// Store Implementation
export const usePublishingStore = create<PublishingState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        publications: [],
        currentPublication: null,
        analytics: null,
        engagement: null,
        insights: null,
        trends: null,
        feedback: [],
        goals: [],
        alerts: [],
        platforms: [],
        connectedPlatforms: [],
        isLoading: false,
        isPublishing: false,
        error: null,

        // Initialize
        init: async (): Promise<void> => {
          try {
            set({ isLoading: true, error: null });
            await publishingAnalyticsService.init();
            const alerts = await publishingAnalyticsService.getPublishingAlerts();
            const allPlatforms = publishingAnalyticsService.getAllPlatforms();
            const connected = publishingAnalyticsService.getConnectedPlatforms();
            set({
              platforms: allPlatforms,
              connectedPlatforms: connected,
              alerts,
              isLoading: false,
            });
          } catch (err) {
            set({
              error:
                err instanceof Error ? err.message : 'Failed to initialize publishing analytics',
              isLoading: false,
            });
          }
        },

        // Publish Project
        publishProject: async (project, platformIds, metadata): Promise<Publication> => {
          set({ isPublishing: true, error: null });
          try {
            const publication = await publishingAnalyticsService.publishProject(
              project,
              platformIds,
              metadata,
            );
            set(state => ({
              publications: [publication, ...state.publications],
              currentPublication: publication,
              isPublishing: false,
            }));

            // Add alert
            const alert: PublishingAlert = {
              id: `alert_${Date.now()}`,
              type: 'milestone',
              priority: 'medium',
              title: 'Publication Successful!',
              message: `"${project.title}" has been published successfully to ${platformIds.length} platform(s).`,
              actionRequired: false,
              timestamp: new Date(),
              isRead: false,
              publicationId: publication.id,
            };
            get().addAlert(alert);

            return publication;
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to publish project';
            set({ error: msg, isPublishing: false });
            throw new Error(msg);
          }
        },

        // Load Publication Data
        loadPublicationData: async (publicationId): Promise<void> => {
          set({ isLoading: true, error: null });
          try {
            const [analytics, insights, feedback, goals] = await Promise.all([
              publishingAnalyticsService.getPublicationAnalytics(publicationId),
              publishingAnalyticsService.getReaderInsights(publicationId),
              publishingAnalyticsService.getReaderFeedback(publicationId),
              publishingAnalyticsService.getPublishingGoals(publicationId),
            ]);
            const engagement = publishingAnalyticsService.getEngagementMetrics(publicationId, {
              start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              end: new Date(),
            });

            set({
              analytics,
              engagement,
              insights,
              feedback,
              goals,
              isLoading: false,
            });
          } catch (err) {
            set({
              error: err instanceof Error ? err.message : 'Failed to load publication data',
              isLoading: false,
            });
          }
        },

        // Load Trends
        loadTrends: (publicationId, days = 30): void => {
          try {
            const trends = publishingAnalyticsService.getPublishingTrends(publicationId, days);
            set({ trends });
          } catch (err) {
            set({ error: err instanceof Error ? err.message : 'Failed to load trends' });
          }
        },

        // Load Feedback
        loadFeedback: async (publicationId, limit = 50): Promise<void> => {
          try {
            const feedback = await publishingAnalyticsService.getReaderFeedback(
              publicationId,
              limit,
            );
            set({ feedback });
          } catch (err) {
            set({ error: err instanceof Error ? err.message : 'Failed to load feedback' });
          }
        },

        // Create Goal
        createGoal: async (goalData): Promise<PublishingGoals> => {
          try {
            const goal = await publishingAnalyticsService.createPublishingGoal(goalData);
            set(state => ({
              goals: [goal, ...state.goals],
            }));

            // Add alert
            const alert: PublishingAlert = {
              id: `alert_${Date.now()}`,
              type: 'milestone',
              priority: 'low',
              title: 'New Goal Created',
              message: `Publishing goal for ${goalData.type} has been set with target: ${goalData.target}`,
              actionRequired: false,
              timestamp: new Date(),
              isRead: false,
              publicationId: goalData.publicationId ?? undefined,
            };
            get().addAlert(alert);

            return goal;
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to create goal';
            set({ error: msg });
            throw new Error(msg);
          }
        },

        // Connect Platform
        connectPlatform: (platformId, credentials): boolean => {
          try {
            const success = publishingAnalyticsService.connectPlatform(platformId, credentials);
            if (success) {
              const connected = publishingAnalyticsService.getConnectedPlatforms();
              set({ connectedPlatforms: connected });

              const platform = get().platforms.find(p => p.id === platformId);
              const alert: PublishingAlert = {
                id: `alert_${Date.now()}`,
                type: 'opportunity',
                priority: 'medium',
                title: 'Platform Connected',
                message: `Successfully connected to ${platform?.name ?? platformId}.`,
                actionRequired: false,
                timestamp: new Date(),
                isRead: false,
              };
              get().addAlert(alert);
            }
            return success;
          } catch (err) {
            set({ error: err instanceof Error ? err.message : 'Failed to connect platform' });
            return false;
          }
        },

        // Alert Management
        addAlert: (alert: PublishingAlert): void => {
          set(state => ({ alerts: [alert, ...state.alerts] }));
        },

        markAlertAsRead: (alertId: string): void => {
          set(state => ({
            alerts: state.alerts.map(a => (a.id === alertId ? { ...a, isRead: true } : a)),
          }));
        },

        dismissAlert: (alertId: string): void => {
          set(state => ({
            alerts: state.alerts.filter(a => a.id !== alertId),
          }));
        },

        // Reset
        reset: (): void => {
          set({
            publications: [],
            currentPublication: null,
            analytics: null,
            engagement: null,
            insights: null,
            trends: null,
            feedback: [],
            goals: [],
            alerts: [],
            platforms: [],
            connectedPlatforms: [],
            isLoading: false,
            isPublishing: false,
            error: null,
          });
        },
      }),
      {
        name: 'publishing-store',
        partialize: state => ({
          publications: state.publications,
          goals: state.goals,
          alerts: state.alerts,
          connectedPlatforms: state.connectedPlatforms,
        }),
      },
    ),
    { name: 'PublishingStore' },
  ),
);

// Selectors
export const selectPublications = (state: PublishingState): Publication[] => state.publications;
export const selectCurrentPublication = (state: PublishingState): Publication | null =>
  state.currentPublication;
export const selectPublishingAnalytics = (state: PublishingState): PlatformAnalytics | null =>
  state.analytics;
export const selectEngagement = (state: PublishingState): EngagementMetrics | null =>
  state.engagement;
export const selectPublishingInsights = (state: PublishingState): ReaderInsights | null =>
  state.insights;
export const selectPublishingTrends = (state: PublishingState): PublishingTrends | null =>
  state.trends;
export const selectFeedback = (state: PublishingState): ReaderFeedback[] => state.feedback;
export const selectPublishingGoals = (state: PublishingState): PublishingGoals[] => state.goals;
export const selectAlerts = (state: PublishingState): PublishingAlert[] => state.alerts;
export const selectPlatforms = (state: PublishingState): PublishingPlatform[] => state.platforms;
export const selectConnectedPlatforms = (state: PublishingState): PublishingPlatform[] =>
  state.connectedPlatforms;
