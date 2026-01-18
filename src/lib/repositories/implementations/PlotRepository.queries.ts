/**
 * Plot Repository Queries Implementation
 *
 * Complex query and filter operations for plot holes and plot suggestions
 */

import { eq, and, gte, lte, desc } from 'drizzle-orm';

import type {
  PlotHole,
  PlotSuggestion,
  PlotHoleSeverity,
  PlotHoleType,
  PlotSuggestionType,
} from '@/features/plot-engine';
import { getDrizzleClient } from '@/lib/database/drizzle';
import {
  plotHoles,
  plotSuggestions,
  type PlotHoleRow,
  type NewPlotHoleRow,
  type PlotSuggestionRow,
  type NewPlotSuggestionRow,
} from '@/lib/database/schemas/plots';
import { toAppError } from '@/lib/errors/error-types';
import { logger } from '@/lib/logging/logger';
import type {
  PlotHoleQueryOptions,
  PlotSuggestionQueryOptions,
} from '@/lib/repositories/interfaces/IPlotRepository';
import { RepositoryError } from '@/lib/repositories/interfaces/IRepository';

/**
 * Plot Repository Queries Implementation
 * Manages complex query operations for plot data
 */
export class PlotRepositoryQueries {
  protected db;

  constructor() {
    this.db = getDrizzleClient();
    if (!this.db) {
      logger.warn('PlotRepository initialized without database connection', {
        component: 'PlotRepository',
      });
    }
  }

  // ==================== Plot Holes ====================

  /**
   * Save plot holes for a project (replaces existing)
   * Deletes all existing holes for the project and inserts new ones
   *
   * @param projectId - The project ID
   * @param holes - Array of plot holes to save
   * @throws RepositoryError if database connection is unavailable
   */
  async savePlotHoles(projectId: string, holes: PlotHole[]): Promise<void> {
    try {
      const client = this.db;
      if (!client) {
        throw new RepositoryError('Database connection not available', 'DB_CONNECTION_ERROR');
      }

      // Delete existing holes for this project
      await client.delete(plotHoles).where(eq(plotHoles.projectId, projectId));

      // Insert new holes
      if (holes.length > 0) {
        const holesToInsert: NewPlotHoleRow[] = holes.map(hole => ({
          id: hole.id,
          projectId,
          type: hole.type,
          severity: hole.severity,
          title: hole.title,
          description: hole.description,
          affectedChapters: hole.affectedChapters,
          affectedCharacters: hole.affectedCharacters,
          suggestedFix: hole.suggestedFix ?? null,
          confidence: hole.confidence,
          detected: hole.detected.toISOString(),
        }));

        await client.insert(plotHoles).values(holesToInsert);
      }

      logger.info('Plot holes saved', {
        component: 'PlotRepository',
        projectId,
        count: holes.length,
      });
    } catch (error) {
      const appError =
        error instanceof RepositoryError ? error : toAppError(error, 'Failed to save plot holes');
      logger.error(
        'Failed to save plot holes',
        { component: 'PlotRepository', projectId },
        appError,
      );
      throw appError;
    }
  }

  /**
   * Get all plot holes for a project with optional filtering
   *
   * @param projectId - The project ID
   * @param options - Optional query filters (type, severity, confidence, date range)
   * @returns Array of plot holes ordered by severity and detection date
   */
  async getPlotHolesByProject(
    projectId: string,
    options?: PlotHoleQueryOptions,
  ): Promise<PlotHole[]> {
    try {
      const client = this.db;
      if (!client) {
        return [];
      }

      const conditions: unknown[] = [eq(plotHoles.projectId, projectId)];

      if (options?.type) {
        conditions.push(eq(plotHoles.type, options.type));
      }

      if (options?.severity) {
        conditions.push(eq(plotHoles.severity, options.severity));
      }

      if (options?.minConfidence) {
        conditions.push(gte(plotHoles.confidence, options.minConfidence));
      }

      if (options?.minDate) {
        conditions.push(gte(plotHoles.detected, options.minDate.toISOString()));
      }

      if (options?.maxDate) {
        conditions.push(lte(plotHoles.detected, options.maxDate.toISOString()));
      }

      const result = await client
        .select()
        .from(plotHoles)
        .where(
          conditions.length > 1 ? and(...(conditions as [])) : eq(plotHoles.projectId, projectId),
        )
        .orderBy(desc(plotHoles.severity), desc(plotHoles.detected));

      return result.map(row => this.mapRowToPlotHole(row));
    } catch (error) {
      logger.error(
        'Failed to get plot holes by project',
        { component: 'PlotRepository', projectId, options },
        error instanceof Error ? error : undefined,
      );
      return [];
    }
  }

  /**
   * Get plot holes by severity level
   *
   * @param projectId - The project ID
   * @param severity - The severity level to filter by
   * @returns Array of plot holes with the specified severity
   */
  async getPlotHolesBySeverity(projectId: string, severity: PlotHoleSeverity): Promise<PlotHole[]> {
    try {
      const client = this.db;
      if (!client) {
        return [];
      }

      const result = await client
        .select()
        .from(plotHoles)
        .where(and(eq(plotHoles.projectId, projectId), eq(plotHoles.severity, severity)))
        .orderBy(desc(plotHoles.detected));

      return result.map(row => this.mapRowToPlotHole(row));
    } catch (error) {
      logger.error(
        'Failed to get plot holes by severity',
        { component: 'PlotRepository', projectId, severity },
        error instanceof Error ? error : undefined,
      );
      return [];
    }
  }

  /**
   * Get plot holes by type
   *
   * @param projectId - The project ID
   * @param type - The plot hole type to filter by
   * @returns Array of plot holes with the specified type
   */
  async getPlotHolesByType(projectId: string, type: PlotHoleType): Promise<PlotHole[]> {
    try {
      const client = this.db;
      if (!client) {
        return [];
      }

      const result = await client
        .select()
        .from(plotHoles)
        .where(and(eq(plotHoles.projectId, projectId), eq(plotHoles.type, type)))
        .orderBy(desc(plotHoles.severity), desc(plotHoles.detected));

      return result.map(row => this.mapRowToPlotHole(row));
    } catch (error) {
      logger.error(
        'Failed to get plot holes by type',
        { component: 'PlotRepository', projectId, type },
        error instanceof Error ? error : undefined,
      );
      return [];
    }
  }

  /**
   * Get plot holes affecting specific chapters
   * Filters holes that have any of the specified chapter IDs in their affectedChapters array
   *
   * @param projectId - The project ID
   * @param chapterIds - Array of chapter IDs to filter by
   * @returns Array of plot holes affecting any of the specified chapters
   */
  async getPlotHolesByChapters(projectId: string, chapterIds: string[]): Promise<PlotHole[]> {
    try {
      const client = this.db;
      if (!client) {
        return [];
      }

      // Get all holes for project and filter in memory since we need to search JSON array
      const result = await client
        .select()
        .from(plotHoles)
        .where(eq(plotHoles.projectId, projectId));

      return result
        .map(row => this.mapRowToPlotHole(row))
        .filter(hole => hole.affectedChapters.some(chapterId => chapterIds.includes(chapterId)));
    } catch (error) {
      logger.error(
        'Failed to get plot holes by chapters',
        { component: 'PlotRepository', projectId, chapterIds },
        error instanceof Error ? error : undefined,
      );
      return [];
    }
  }

  /**
   * Get plot holes affecting specific characters
   * Filters holes that have any of the specified character IDs in their affectedCharacters array
   *
   * @param projectId - The project ID
   * @param characterIds - Array of character IDs to filter by
   * @returns Array of plot holes affecting any of the specified characters
   */
  async getPlotHolesByCharacters(projectId: string, characterIds: string[]): Promise<PlotHole[]> {
    try {
      const client = this.db;
      if (!client) {
        return [];
      }

      // Get all holes for project and filter in memory since we need to search JSON array
      const result = await client
        .select()
        .from(plotHoles)
        .where(eq(plotHoles.projectId, projectId));

      return result
        .map(row => this.mapRowToPlotHole(row))
        .filter(hole =>
          hole.affectedCharacters.some(characterId => characterIds.includes(characterId)),
        );
    } catch (error) {
      logger.error(
        'Failed to get plot holes by characters',
        { component: 'PlotRepository', projectId, characterIds },
        error instanceof Error ? error : undefined,
      );
      return [];
    }
  }

  // ==================== Plot Suggestions ====================

  /**
   * Save plot suggestions for a project (replaces existing)
   * Deletes all existing suggestions for the project and inserts new ones
   *
   * @param projectId - The project ID
   * @param suggestions - Array of plot suggestions to save
   * @throws RepositoryError if database connection is unavailable
   */
  async savePlotSuggestions(projectId: string, suggestions: PlotSuggestion[]): Promise<void> {
    try {
      const client = this.db;
      if (!client) {
        throw new RepositoryError('Database connection not available', 'DB_CONNECTION_ERROR');
      }

      // Delete existing suggestions for this project
      await client.delete(plotSuggestions).where(eq(plotSuggestions.projectId, projectId));

      // Insert new suggestions
      if (suggestions.length > 0) {
        const suggestionsToInsert: NewPlotSuggestionRow[] = suggestions.map(suggestion => ({
          id: suggestion.id,
          projectId,
          type: suggestion.type,
          title: suggestion.title,
          description: suggestion.description ?? null,
          placement: suggestion.placement ?? null,
          impact: suggestion.impact,
          relatedCharacters: suggestion.relatedCharacters ?? null,
          prerequisites: suggestion.prerequisites ?? null,
          createdAt: new Date().toISOString(),
        }));

        await client.insert(plotSuggestions).values(suggestionsToInsert);
      }

      logger.info('Plot suggestions saved', {
        component: 'PlotRepository',
        projectId,
        count: suggestions.length,
      });
    } catch (error) {
      const appError =
        error instanceof RepositoryError
          ? error
          : toAppError(error, 'Failed to save plot suggestions');
      logger.error(
        'Failed to save plot suggestions',
        { component: 'PlotRepository', projectId },
        appError,
      );
      throw appError;
    }
  }

  /**
   * Get plot suggestions for a project with optional filtering
   *
   * @param projectId - The project ID
   * @param options - Optional query filters (type, impact, placement)
   * @returns Array of plot suggestions ordered by creation date (newest first)
   */
  async getPlotSuggestionsByProject(
    projectId: string,
    options?: PlotSuggestionQueryOptions,
  ): Promise<PlotSuggestion[]> {
    try {
      const client = this.db;
      if (!client) {
        return [];
      }

      const conditions: unknown[] = [eq(plotSuggestions.projectId, projectId)];

      if (options?.type) {
        conditions.push(eq(plotSuggestions.type, options.type));
      }

      if (options?.impact) {
        conditions.push(eq(plotSuggestions.impact, options.impact));
      }

      if (options?.placement) {
        conditions.push(eq(plotSuggestions.placement, options.placement));
      }

      const result = await client
        .select()
        .from(plotSuggestions)
        .where(
          conditions.length > 1
            ? and(...(conditions as []))
            : eq(plotSuggestions.projectId, projectId),
        )
        .orderBy(desc(plotSuggestions.createdAt));

      return result.map(row => this.mapRowToPlotSuggestion(row));
    } catch (error) {
      logger.error(
        'Failed to get plot suggestions by project',
        { component: 'PlotRepository', projectId, options },
        error instanceof Error ? error : undefined,
      );
      return [];
    }
  }

  /**
   * Get plot suggestions by type
   *
   * @param projectId - The project ID
   * @param type - The suggestion type to filter by
   * @returns Array of plot suggestions with the specified type
   */
  async getPlotSuggestionsByType(
    projectId: string,
    type: PlotSuggestionType,
  ): Promise<PlotSuggestion[]> {
    try {
      const client = this.db;
      if (!client) {
        return [];
      }

      const result = await client
        .select()
        .from(plotSuggestions)
        .where(and(eq(plotSuggestions.projectId, projectId), eq(plotSuggestions.type, type)))
        .orderBy(desc(plotSuggestions.createdAt));

      return result.map(row => this.mapRowToPlotSuggestion(row));
    } catch (error) {
      logger.error(
        'Failed to get plot suggestions by type',
        { component: 'PlotRepository', projectId, type },
        error instanceof Error ? error : undefined,
      );
      return [];
    }
  }

  /**
   * Get plot suggestions by impact level
   *
   * @param projectId - The project ID
   * @param impact - The impact level to filter by
   * @returns Array of plot suggestions with the specified impact level
   */
  async getPlotSuggestionsByImpact(
    projectId: string,
    impact: PlotSuggestion['impact'],
  ): Promise<PlotSuggestion[]> {
    try {
      const client = this.db;
      if (!client) {
        return [];
      }

      const result = await client
        .select()
        .from(plotSuggestions)
        .where(and(eq(plotSuggestions.projectId, projectId), eq(plotSuggestions.impact, impact)))
        .orderBy(desc(plotSuggestions.createdAt));

      return result.map(row => this.mapRowToPlotSuggestion(row));
    } catch (error) {
      logger.error(
        'Failed to get plot suggestions by impact',
        { component: 'PlotRepository', projectId, impact },
        error instanceof Error ? error : undefined,
      );
      return [];
    }
  }

  /**
   * Get plot suggestions related to specific characters
   * Filters suggestions that have any of the specified character IDs in their relatedCharacters array
   *
   * @param projectId - The project ID
   * @param characterIds - Array of character IDs to filter by
   * @returns Array of plot suggestions related to any of the specified characters
   */
  async getPlotSuggestionsByCharacters(
    projectId: string,
    characterIds: string[],
  ): Promise<PlotSuggestion[]> {
    try {
      const client = this.db;
      if (!client) {
        return [];
      }

      // Get all suggestions for project and filter in memory since we need to search JSON array
      const result = await client
        .select()
        .from(plotSuggestions)
        .where(eq(plotSuggestions.projectId, projectId));

      return result
        .map(row => this.mapRowToPlotSuggestion(row))
        .filter(suggestion =>
          suggestion.relatedCharacters
            ? suggestion.relatedCharacters.some(characterId => characterIds.includes(characterId))
            : false,
        );
    } catch (error) {
      logger.error(
        'Failed to get plot suggestions by characters',
        { component: 'PlotRepository', projectId, characterIds },
        error instanceof Error ? error : undefined,
      );
      return [];
    }
  }

  // ==================== Private Helper Methods ====================

  /**
   * Map database row to PlotHole domain object
   */
  protected mapRowToPlotHole(row: PlotHoleRow): PlotHole {
    return {
      id: row.id,
      type: row.type,
      severity: row.severity,
      title: row.title,
      description: row.description,
      affectedChapters: row.affectedChapters ?? [],
      affectedCharacters: row.affectedCharacters ?? [],
      suggestedFix: row.suggestedFix ?? undefined,
      confidence: row.confidence,
      detected: new Date(row.detected),
    };
  }

  /**
   * Map database row to PlotSuggestion domain object
   */
  protected mapRowToPlotSuggestion(row: PlotSuggestionRow): PlotSuggestion {
    return {
      id: row.id,
      type: row.type,
      title: row.title,
      description: row.description ?? '',
      placement: row.placement ?? 'anywhere',
      impact: row.impact as PlotSuggestion['impact'],
      relatedCharacters: row.relatedCharacters ?? undefined,
      prerequisites: row.prerequisites ?? undefined,
    };
  }
}
