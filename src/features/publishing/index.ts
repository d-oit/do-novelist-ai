/**
 * Publishing Analytics Feature - Public API
 * Provides reader engagement tracking and publishing platform analytics
 */

export * from './types';
export * from './hooks/usePublishingAnalytics';
export * from './services/publishingAnalyticsService';

// Components
export { default as PublishingDashboard } from './components/PublishingDashboard';
export { default as PublishingSetup } from './components/PublishingSetup';
