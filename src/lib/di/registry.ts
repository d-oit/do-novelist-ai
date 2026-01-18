/**
 * Service Registry
 *
 * Registers all repositories and services with the DI container.
 * All services are registered as singletons.
 *
 * @module lib/di
 */

import { CharacterService } from '@/features/characters/services/characterService';
import { PlotStorageService } from '@/features/plot-engine/services/plotStorageService';
import { ProjectService } from '@/features/projects/services/projectService';
import { container } from '@/lib/di/Container';
import {
  ProjectRepository,
  CharacterRepository,
  ChapterRepository,
  PlotRepository,
} from '@/lib/repositories/implementations';
import type {
  IProjectRepository,
  ICharacterRepository,
  IChapterRepository,
  IPlotRepository,
} from '@/lib/repositories/interfaces';



// ==================== Repository Tokens ====================

/**
 * Repository dependency tokens
 *
 * Used to identify and resolve repositories from the container.
 */
export const REPOSITORY_TOKENS = {
  /** Project repository token */
  PROJECT: 'project-repository' as const,
  /** Character repository token */
  CHARACTER: 'character-repository' as const,
  /** Chapter repository token */
  CHAPTER: 'chapter-repository' as const,
  /** Plot repository token */
  PLOT: 'plot-repository' as const,
} as const;

// ==================== Service Tokens ====================

/**
 * Service dependency tokens
 *
 * Used to identify and resolve services from the container.
 */
export const SERVICE_TOKENS = {
  /** Project service token */
  PROJECT: 'project-service' as const,
  /** Character service token */
  CHARACTER: 'character-service' as const,
  /** Plot storage service token */
  PLOT_STORAGE: 'plot-storage-service' as const,
} as const;

// ==================== Repository Registration ====================

/**
 * Register all repositories with the container
 *
 * All repositories are registered as singletons. This ensures that
 * the same repository instance is used throughout the application.
 *
 * @example
 * ```ts
 * registerRepositories();
 * const projectRepo = container.resolve<IProjectRepository>(
 *   REPOSITORY_TOKENS.PROJECT
 * );
 * ```
 */
function registerRepositories(): void {
  // Register Project Repository
  container.register<IProjectRepository>(REPOSITORY_TOKENS.PROJECT, () => new ProjectRepository());

  // Register Character Repository
  container.register<ICharacterRepository>(
    REPOSITORY_TOKENS.CHARACTER,
    () => new CharacterRepository(),
  );

  // Register Chapter Repository
  container.register<IChapterRepository>(REPOSITORY_TOKENS.CHAPTER, () => new ChapterRepository());

  // Register Plot Repository
  container.register<IPlotRepository>(REPOSITORY_TOKENS.PLOT, () => new PlotRepository());
}

// ==================== Service Registration ====================

/**
 * Register all services with the container
 *
 * Services are registered with their repository dependencies.
 * This creates the dependency injection chain automatically.
 *
 * @example
 * ```ts
 * registerServices();
 * const projectService = container.resolve<ProjectService>(
 *   SERVICE_TOKENS.PROJECT
 * );
 * ```
 */
function registerServices(): void {
  // Register Project Service
  container.register<ProjectService>(SERVICE_TOKENS.PROJECT, () => {
    const projectRepo = container.resolve<IProjectRepository>(REPOSITORY_TOKENS.PROJECT);
    return new ProjectService(projectRepo);
  });

  // Register Character Service
  container.register<CharacterService>(SERVICE_TOKENS.CHARACTER, () => {
    const characterRepo = container.resolve<ICharacterRepository>(REPOSITORY_TOKENS.CHARACTER);
    return new CharacterService(characterRepo);
  });

  // Register Plot Storage Service
  container.register<PlotStorageService>(SERVICE_TOKENS.PLOT_STORAGE, () => {
    const plotRepo = container.resolve<IPlotRepository>(REPOSITORY_TOKENS.PLOT);
    return new PlotStorageService(plotRepo);
  });
}

// ==================== Initialization ====================

/**
 * Initialize the DI container with all services
 *
 * This function should be called during application startup to register
 * all repositories and services with the container.
 *
 * @example
 * ```ts
 * // In app initialization
 * import { initializeContainer } from '@/lib/di';
 *
 * initializeContainer();
 * ```
 */
export function initializeContainer(): void {
  registerRepositories();
  registerServices();
}

// ==================== Convenience Functions ====================

/**
 * Get Project Service from container
 *
 * Convenience function to resolve Project Service without needing
 * to remember the token string.
 *
 * @returns Project Service instance
 *
 * @example
 * ```ts
 * import { getProjectService } from '@/lib/di';
 *
 * const projectService = getProjectService();
 * const projects = await projectService.getAll();
 * ```
 */
export function getProjectService(): ProjectService {
  return container.resolve(SERVICE_TOKENS.PROJECT);
}

/**
 * Get Character Service from container
 *
 * Convenience function to resolve Character Service without needing
 * to remember the token string.
 *
 * @returns Character Service instance
 *
 * @example
 * ```ts
 * import { getCharacterService } from '@/lib/di';
 *
 * const characterService = getCharacterService();
 * const characters = await characterService.getAll(projectId);
 * ```
 */
export function getCharacterService(): CharacterService {
  return container.resolve(SERVICE_TOKENS.CHARACTER);
}

/**
 * Get Plot Storage Service from container
 *
 * Convenience function to resolve Plot Storage Service without needing
 * to remember the token string.
 *
 * @returns Plot Storage Service instance
 *
 * @example
 * ```ts
 * import { getPlotStorageService } from '@/lib/di';
 *
 * const plotService = getPlotStorageService();
 * const plots = await plotService.getPlotStructuresByProject(projectId);
 * ```
 */
export function getPlotStorageService(): PlotStorageService {
  return container.resolve(SERVICE_TOKENS.PLOT_STORAGE);
}
