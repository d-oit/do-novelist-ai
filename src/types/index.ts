/**
 * Enhanced type system with Zod schema integration
 * Provides both runtime validation and compile-time type safety
 */

// Re-export all types from schemas for backward compatibility
export * from './schemas';
export * from './utils';

// Re-export character types from features (primary schema)
export * from '@/features/characters/types';

// Re-export AI config types (excluding AIModel to avoid conflict)
export type { AIProvider, AIProviderConfig, AIUsageLog } from './ai-config';

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
  PublishingExport,
  PublishingAnalytics,
} from '@/features/publishing/types';

// Character types are exported above as the primary schema

// Re-export settings types
export * from '@/features/settings/types';

// Re-export projects types
export * from '@/features/projects/types';

// Re-export editor types
export * from '@/features/editor/types';

// Re-export gamification types
export * from '@/features/gamification/types';

// Re-export versioning types
export * from '@/features/versioning/types';

// Re-export writing assistant types
export * from '@/features/writing-assistant/types';

// Re-export world-building types
export type {
  WorldElementType,
  LocationType,
  CultureType,
  Location,
  Culture,
  TimelineEvent as WorldTimelineEvent,
  Timeline as WorldTimeline,
  LoreEntry,
  ResearchSource,
  WorldMap,
  WorldElement,
  WorldBuildingProject,
  WorldBuildingFilters,
  ConsistencyIssue,
  WorldBuildingValidationResult,
} from '@/features/world-building/types';

// Re-export analytics types
export type {
  WritingSession,
  DailyStats,
  WeeklyStats,
  MonthlyStats,
  ProjectAnalytics,
  WritingGoals,
  WritingInsights,
  AnalyticsFilter,
  AnalyticsExport,
  ChartDataPoint,
  AnalyticsChartType,
  ChartConfig,
} from '@/features/analytics/types';

// Use enum types from shared types for consistency
export { AgentMode, ChapterStatus, PublishStatus } from '@shared/types';

// Re-export additional shared types
export type {
  StatPoint,
  ProcessedAction,
  ActionResult,
  RejectedAction,
  PreconditionFailure,
  ActionTraceStep,
  AgentDecision,
  GoapDebugInfo,
} from '@shared/types';
