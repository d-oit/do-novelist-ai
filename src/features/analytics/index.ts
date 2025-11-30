/**
 * Analytics Feature - Public API
 * Provides comprehensive writing analytics and insights
 */

export * from './types';
export * from './hooks/useAnalytics';
export * from './services/analyticsService';

// Components
export { default as AnalyticsDashboard } from './components/AnalyticsDashboardRefactored';
export { default as AnalyticsSidebar } from './components/AnalyticsSidebar';
export { default as AnalyticsContent } from './components/AnalyticsContent';
export { default as GoalsManager } from './components/GoalsManager';
