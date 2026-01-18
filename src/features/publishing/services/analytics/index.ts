/**
 * Analytics Module Public API
 * Exports all analytics-related services and utilities
 */

// Metrics
export {
  generateInitialAnalytics,
  aggregatePlatformAnalytics,
  generateEngagementMetrics,
  generatePublishingTrends,
} from './analytics.metrics';

// Export
export { exportPublishingAnalytics, generateExportFilename } from './analytics.export';

// Reporting
export { generateReaderInsights, generatePublishingInsights } from './analytics.reporting';
