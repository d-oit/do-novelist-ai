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
  PublishingCampaign,
  PublishingTrends,
  PublishingAlert,
  PublishingAnalyticsFilter,
  PublishingExport
} from '../features/publishing/types';

// Type aliases for backward compatibility
export type { EngagementMetrics as PublishingAnalytics } from '../features/publishing/types';
export type { ReaderInsights as PublishingInsights } from '../features/publishing/types';
export type { EngagementMetrics as ReaderEngagement } from '../features/publishing/types';

// Legacy enum exports for backward compatibility
export enum AgentMode {
  SINGLE = 'SINGLE',
  PARALLEL = 'PARALLEL',
  HYBRID = 'HYBRID',
  SWARM = 'SWARM'
}

export const ChapterStatus = {
  PENDING: 'pending',
  DRAFTING: 'drafting',
  REVIEW: 'review',
  COMPLETE: 'complete'
} as const;

export type ChapterStatusType = typeof ChapterStatus[keyof typeof ChapterStatus];

export enum PublishStatus {
  DRAFT = 'Draft',
  EDITING = 'Editing',
  REVIEW = 'Review',
  PUBLISHED = 'Published'
}
