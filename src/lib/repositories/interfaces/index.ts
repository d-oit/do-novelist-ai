/**
 * Repository Interfaces
 *
 * Exports all repository interfaces for easy importing
 */

// Generic repository interface
export type { IRepository, IQueryBuilder, RepositoryError, RepositoryResult } from './IRepository';

// Entity-specific repository interfaces
export type { IProjectRepository, ProjectQueryOptions, ProjectStats } from './IProjectRepository';

export type { IChapterRepository, ChapterQueryOptions } from './IChapterRepository';

export type {
  ICharacterRepository,
  CharacterQueryOptions,
  CharacterRelationshipQueryOptions,
} from './ICharacterRepository';

export type {
  IPlotRepository,
  PlotQueryOptions,
  PlotHoleQueryOptions,
  PlotSuggestionQueryOptions,
  AnalysisCacheConfig,
} from './IPlotRepository';
