/**
 * Enhanced type system with Zod schema integration
 * Provides both runtime validation and compile-time type safety
 */

// Re-export all types from schemas for backward compatibility
export * from './schemas';
export * from './utils';

// Re-export publishing types
export type {
  PublishingPlatform,
  PublishingFormat,
  Publication,
  PublishedInstance,
  PlatformAnalytics,
  ReaderFeedback,
  EngagementMetrics,
  PublishingGoals,
  ReaderInsights,
  ReaderEngagement,
  PublishingInsights,
  PublishingCampaign,
  PublishingTrends,
  PublishingAlert,
  PublishingAnalyticsFilter,
  PublishingExport
} from '../features/publishing/types';

// Type aliases for backward compatibility
export type { EngagementMetrics as PublishingAnalytics } from '../features/publishing/types';

// Legacy enum exports - import from root types.ts
export {
  AgentMode,
  ChapterStatus,
  PublishStatus
} from '../../types';
