/**
 * Plot Repository Implementation
 *
 * Implements IPlotRepository interface using Drizzle ORM
 * Manages plot structures, holes, character graphs, and suggestions
 */

import { eq, and, gte, lte, desc } from 'drizzle-orm';

import type {
  PlotStructure,
  PlotHole,
  CharacterGraph,
  PlotSuggestion,
  StoryArc,
  PlotHoleSeverity,
  PlotHoleType,
  PlotSuggestionType,
} from '@/features/plot-engine';
import { getDrizzleClient } from '@/lib/database/drizzle';
import {
  plotStructures,
  plotHoles,
  characterGraphs,
  analysisResults,
  plotSuggestions,
  storyArcs,
  type PlotStructureRow,
  type NewPlotStructureRow,
  type PlotHoleRow,
  type NewPlotHoleRow,
  type CharacterGraphRow,
  type NewCharacterGraphRow,
  type NewAnalysisResultRow,
  type PlotSuggestionRow,
  type NewPlotSuggestionRow,
  type StoryArcRow,
  type NewStoryArcRow,
} from '@/lib/database/schemas/plots';
import { toAppError } from '@/lib/errors/error-types';
import { logger } from '@/lib/logging/logger';
import type {
  IPlotRepository,
  PlotHoleQueryOptions,
  PlotSuggestionQueryOptions,
  AnalysisCacheConfig,
} from '@/lib/repositories/interfaces/IPlotRepository';
import { RepositoryError } from '@/lib/repositories/interfaces/IRepository';

/**
 * Plot Repository Implementation
 * Manages plot data access with type-safe operations
 */
export class PlotRepository implements IPlotRepository {
  private db;

  constructor() {
    this.db = getDrizzleClient();
    if (!this.db) {
      logger.warn('PlotRepository initialized without database connection', {
        component: 'PlotRepository',
      });
    }
  }

  // ==================== Plot Structures ====================

  /**
   * Save a plot structure
   */
  async savePlotStructure(structure: PlotStructure): Promise<void> {
    try {
      const client = this.db;
      if (!client) {
        throw new RepositoryError('Database connection not available', 'DB_CONNECTION_ERROR');
      }

      const updateData: NewPlotStructureRow = {
        id: structure.id,
        projectId: structure.projectId,
        acts: structure.acts as never,
        climax: structure.climax as never,
        resolution: structure.resolution as never,
        createdAt: structure.createdAt.toISOString(),
        updatedAt: structure.updatedAt.toISOString(),
      };

      // Check if exists and update or insert
      const existing = await client
        .select()
        .from(plotStructures)
        .where(eq(plotStructures.id, structure.id))
        .limit(1);

      if (existing.length > 0) {
        await client
          .update(plotStructures)
          .set(updateData)
          .where(eq(plotStructures.id, structure.id));
      } else {
        await client.insert(plotStructures).values(updateData);
      }

      logger.info('Plot structure saved', {
        component: 'PlotRepository',
        plotStructureId: structure.id,
        projectId: structure.projectId,
      });
    } catch (error) {
      const appError =
        error instanceof RepositoryError
          ? error
          : toAppError(error, 'Failed to save plot structure');
      logger.error(
        'Failed to save plot structure',
        { component: 'PlotRepository', plotStructureId: structure.id },
        appError,
      );
      throw appError;
    }
  }

  /**
   * Get a plot structure by ID
   */
  async getPlotStructure(id: string): Promise<PlotStructure | null> {
    try {
      const client = this.db;
      if (!client) {
        return null;
      }

      const result = await client
        .select()
        .from(plotStructures)
        .where(eq(plotStructures.id, id))
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      return this.mapRowToPlotStructure(result[0]!);
    } catch (error) {
      logger.error(
        'Failed to get plot structure',
        { component: 'PlotRepository', plotStructureId: id },
        error instanceof Error ? error : undefined,
      );
      return null;
    }
  }

  /**
   * Get all plot structures for a project
   */
  async getPlotStructuresByProject(projectId: string): Promise<PlotStructure[]> {
    try {
      const client = this.db;
      if (!client) {
        return [];
      }

      const result = await client
        .select()
        .from(plotStructures)
        .where(eq(plotStructures.projectId, projectId))
        .orderBy(desc(plotStructures.createdAt));

      return result.map(row => this.mapRowToPlotStructure(row));
    } catch (error) {
      logger.error(
        'Failed to get plot structures by project',
        { component: 'PlotRepository', projectId },
        error instanceof Error ? error : undefined,
      );
      return [];
    }
  }

  /**
   * Delete a plot structure
   */
  async deletePlotStructure(id: string): Promise<void> {
    try {
      const client = this.db;
      if (!client) {
        return;
      }

      await client.delete(plotStructures).where(eq(plotStructures.id, id));

      logger.info('Plot structure deleted', {
        component: 'PlotRepository',
        plotStructureId: id,
      });
    } catch (error) {
      logger.error(
        'Failed to delete plot structure',
        { component: 'PlotRepository', plotStructureId: id },
        error instanceof Error ? error : undefined,
      );
      throw error;
    }
  }

  // ==================== Plot Holes ====================

  /**
   * Save plot holes for a project (replaces existing)
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
   * Get all plot holes for a project
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
   * Get plot holes by severity
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

  // ==================== Character Graphs ====================

  /**
   * Save a character graph for a project
   */
  async saveCharacterGraph(graph: CharacterGraph): Promise<void> {
    try {
      const client = this.db;
      if (!client) {
        throw new RepositoryError('Database connection not available', 'DB_CONNECTION_ERROR');
      }

      const updateData: NewCharacterGraphRow = {
        projectId: graph.projectId,
        nodes: graph.nodes as never,
        relationships: graph.relationships as never,
        analyzedAt: graph.analyzedAt.toISOString(),
      };

      // Check if exists and update or insert
      const existing = await client
        .select()
        .from(characterGraphs)
        .where(eq(characterGraphs.projectId, graph.projectId))
        .limit(1);

      if (existing.length > 0) {
        await client
          .update(characterGraphs)
          .set(updateData)
          .where(eq(characterGraphs.projectId, graph.projectId));
      } else {
        await client.insert(characterGraphs).values(updateData);
      }

      logger.info('Character graph saved', {
        component: 'PlotRepository',
        projectId: graph.projectId,
      });
    } catch (error) {
      const appError =
        error instanceof RepositoryError
          ? error
          : toAppError(error, 'Failed to save character graph');
      logger.error(
        'Failed to save character graph',
        { component: 'PlotRepository', projectId: graph.projectId },
        appError,
      );
      throw appError;
    }
  }

  /**
   * Get the character graph for a project
   */
  async getCharacterGraphByProject(projectId: string): Promise<CharacterGraph | null> {
    try {
      const client = this.db;
      if (!client) {
        return null;
      }

      const result = await client
        .select()
        .from(characterGraphs)
        .where(eq(characterGraphs.projectId, projectId))
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      return this.mapRowToCharacterGraph(result[0]!);
    } catch (error) {
      logger.error(
        'Failed to get character graph by project',
        { component: 'PlotRepository', projectId },
        error instanceof Error ? error : undefined,
      );
      return null;
    }
  }

  /**
   * Delete a character graph
   */
  async deleteCharacterGraph(projectId: string): Promise<void> {
    try {
      const client = this.db;
      if (!client) {
        return;
      }

      await client.delete(characterGraphs).where(eq(characterGraphs.projectId, projectId));

      logger.info('Character graph deleted', {
        component: 'PlotRepository',
        projectId,
      });
    } catch (error) {
      logger.error(
        'Failed to delete character graph',
        { component: 'PlotRepository', projectId },
        error instanceof Error ? error : undefined,
      );
      throw error;
    }
  }

  // ==================== Analysis Results (Cached) ====================

  /**
   * Save analysis result with TTL
   */
  async saveAnalysisResult<T>(
    projectId: string,
    analysisType: string,
    resultData: T,
    config?: AnalysisCacheConfig,
  ): Promise<void> {
    try {
      const client = this.db;
      if (!client) {
        throw new RepositoryError('Database connection not available', 'DB_CONNECTION_ERROR');
      }

      const ttlMinutes = config?.ttlMinutes ?? 5;
      const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();
      const id = config?.key ?? `${projectId}-${analysisType}-${Date.now()}`;

      const analysisResult: NewAnalysisResultRow = {
        id,
        projectId,
        analysisType,
        resultData: resultData as never,
        expiresAt,
        createdAt: new Date().toISOString(),
      };

      await client.insert(analysisResults).values(analysisResult);

      logger.info('Analysis result saved', {
        component: 'PlotRepository',
        projectId,
        analysisType,
        ttlMinutes,
      });
    } catch (error) {
      const appError =
        error instanceof RepositoryError
          ? error
          : toAppError(error, 'Failed to save analysis result');
      logger.error(
        'Failed to save analysis result',
        { component: 'PlotRepository', projectId, analysisType },
        appError,
      );
      throw appError;
    }
  }

  /**
   * Get cached analysis result (if not expired)
   */
  async getAnalysisResult<T>(projectId: string, analysisType: string): Promise<T | null> {
    try {
      const client = this.db;
      if (!client) {
        return null;
      }

      const now = new Date().toISOString();

      const result = await client
        .select()
        .from(analysisResults)
        .where(
          and(
            eq(analysisResults.projectId, projectId),
            eq(analysisResults.analysisType, analysisType),
            gte(analysisResults.expiresAt, now),
          ),
        )
        .orderBy(desc(analysisResults.createdAt))
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      return result[0]!.resultData as T;
    } catch (error) {
      logger.error(
        'Failed to get analysis result',
        { component: 'PlotRepository', projectId, analysisType },
        error instanceof Error ? error : undefined,
      );
      return null;
    }
  }

  /**
   * Save story arc analysis
   */
  async saveStoryArc(
    projectId: string,
    storyArc: StoryArc,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _config?: AnalysisCacheConfig, // Parameter for interface compatibility, TTL handled at query level
  ): Promise<void> {
    try {
      const client = this.db;
      if (!client) {
        throw new RepositoryError('Database connection not available', 'DB_CONNECTION_ERROR');
      }

      const updateData: NewStoryArcRow = {
        projectId,
        structure: storyArc.structure,
        pacing: storyArc.pacing as never,
        tension: storyArc.tension as never,
        coherence: storyArc.coherence,
        recommendations: storyArc.recommendations,
        analyzedAt: new Date().toISOString(),
      };

      // Check if exists and update or insert
      const existing = await client
        .select()
        .from(storyArcs)
        .where(eq(storyArcs.projectId, projectId))
        .limit(1);

      if (existing.length > 0) {
        await client.update(storyArcs).set(updateData).where(eq(storyArcs.projectId, projectId));
      } else {
        await client.insert(storyArcs).values(updateData);
      }

      logger.info('Story arc saved', {
        component: 'PlotRepository',
        projectId,
      });
    } catch (error) {
      const appError =
        error instanceof RepositoryError ? error : toAppError(error, 'Failed to save story arc');
      logger.error(
        'Failed to save story arc',
        { component: 'PlotRepository', projectId },
        appError,
      );
      throw appError;
    }
  }

  /**
   * Get cached story arc analysis
   */
  async getStoryArc(projectId: string): Promise<StoryArc | null> {
    try {
      const client = this.db;
      if (!client) {
        return null;
      }

      const result = await client
        .select()
        .from(storyArcs)
        .where(eq(storyArcs.projectId, projectId))
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      return this.mapRowToStoryArc(result[0]!);
    } catch (error) {
      logger.error(
        'Failed to get story arc',
        { component: 'PlotRepository', projectId },
        error instanceof Error ? error : undefined,
      );
      return null;
    }
  }

  /**
   * Cleanup expired analysis results
   */
  async cleanupExpiredAnalysis(): Promise<number> {
    try {
      const client = this.db;
      if (!client) {
        return 0;
      }

      const now = new Date().toISOString();

      const result = await client
        .delete(analysisResults)
        .where(lte(analysisResults.expiresAt, now));

      logger.info('Expired analysis results cleaned up', {
        component: 'PlotRepository',
        count: result.rowsAffected,
      });

      return result.rowsAffected;
    } catch (error) {
      logger.error(
        'Failed to cleanup expired analysis',
        { component: 'PlotRepository' },
        error instanceof Error ? error : undefined,
      );
      return 0;
    }
  }

  // ==================== Plot Suggestions ====================

  /**
   * Save plot suggestions for a project (replaces existing)
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
   * Get plot suggestions for a project
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
   * Get plot suggestions by impact
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
   * Get plot suggestions related to characters
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

  // ==================== Bulk Operations ====================

  /**
   * Delete all plot data for a project
   */
  async deleteProjectData(projectId: string): Promise<void> {
    try {
      const client = this.db;
      if (!client) {
        return;
      }

      // Delete all plot-related data for the project
      await Promise.all([
        client.delete(plotStructures).where(eq(plotStructures.projectId, projectId)),
        client.delete(plotHoles).where(eq(plotHoles.projectId, projectId)),
        client.delete(characterGraphs).where(eq(characterGraphs.projectId, projectId)),
        client.delete(analysisResults).where(eq(analysisResults.projectId, projectId)),
        client.delete(plotSuggestions).where(eq(plotSuggestions.projectId, projectId)),
        client.delete(storyArcs).where(eq(storyArcs.projectId, projectId)),
      ]);

      logger.info('Project plot data deleted', {
        component: 'PlotRepository',
        projectId,
      });
    } catch (error) {
      logger.error(
        'Failed to delete project plot data',
        { component: 'PlotRepository', projectId },
        error instanceof Error ? error : undefined,
      );
      throw error;
    }
  }

  /**
   * Export all plot data for a project
   */
  async exportProjectData(projectId: string): Promise<{
    plotStructures: PlotStructure[];
    plotHoles: PlotHole[];
    characterGraph: CharacterGraph | null;
    plotSuggestions: PlotSuggestion[];
  }> {
    try {
      const client = this.db;
      if (!client) {
        return {
          plotStructures: [],
          plotHoles: [],
          characterGraph: null,
          plotSuggestions: [],
        };
      }

      const [structuresResult, holesResult, graphResult, suggestionsResult] = await Promise.all([
        client.select().from(plotStructures).where(eq(plotStructures.projectId, projectId)),
        client.select().from(plotHoles).where(eq(plotHoles.projectId, projectId)),
        client
          .select()
          .from(characterGraphs)
          .where(eq(characterGraphs.projectId, projectId))
          .limit(1),
        client.select().from(plotSuggestions).where(eq(plotSuggestions.projectId, projectId)),
      ]);

      return {
        plotStructures: structuresResult.map(row => this.mapRowToPlotStructure(row)),
        plotHoles: holesResult.map(row => this.mapRowToPlotHole(row)),
        characterGraph:
          graphResult.length > 0 ? this.mapRowToCharacterGraph(graphResult[0]!) : null,
        plotSuggestions: suggestionsResult.map(row => this.mapRowToPlotSuggestion(row)),
      };
    } catch (error) {
      logger.error(
        'Failed to export project plot data',
        { component: 'PlotRepository', projectId },
        error instanceof Error ? error : undefined,
      );
      throw error;
    }
  }

  /**
   * Import plot data for a project
   */
  async importProjectData(
    projectId: string,
    data: {
      plotStructures: PlotStructure[];
      plotHoles: PlotHole[];
      characterGraph?: CharacterGraph;
      plotSuggestions: PlotSuggestion[];
    },
  ): Promise<void> {
    try {
      const client = this.db;
      if (!client) {
        throw new RepositoryError('Database connection not available', 'DB_CONNECTION_ERROR');
      }

      // Delete existing data for the project
      await this.deleteProjectData(projectId);

      // Import plot structures
      if (data.plotStructures.length > 0) {
        const structuresToInsert: NewPlotStructureRow[] = data.plotStructures.map(structure => ({
          id: structure.id,
          projectId,
          acts: structure.acts as never,
          climax: structure.climax as never,
          resolution: structure.resolution as never,
          createdAt: structure.createdAt.toISOString(),
          updatedAt: structure.updatedAt.toISOString(),
        }));
        await client.insert(plotStructures).values(structuresToInsert);
      }

      // Import plot holes
      if (data.plotHoles.length > 0) {
        const holesToInsert: NewPlotHoleRow[] = data.plotHoles.map(hole => ({
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

      // Import character graph
      if (data.characterGraph) {
        const graphToInsert: NewCharacterGraphRow = {
          projectId,
          nodes: data.characterGraph.nodes as never,
          relationships: data.characterGraph.relationships as never,
          analyzedAt: data.characterGraph.analyzedAt.toISOString(),
        };
        await client.insert(characterGraphs).values(graphToInsert);
      }

      // Import plot suggestions
      if (data.plotSuggestions.length > 0) {
        const suggestionsToInsert: NewPlotSuggestionRow[] = data.plotSuggestions.map(
          suggestion => ({
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
          }),
        );
        await client.insert(plotSuggestions).values(suggestionsToInsert);
      }

      logger.info('Project plot data imported', {
        component: 'PlotRepository',
        projectId,
        structuresCount: data.plotStructures.length,
        holesCount: data.plotHoles.length,
        suggestionsCount: data.plotSuggestions.length,
      });
    } catch (error) {
      const appError =
        error instanceof RepositoryError
          ? error
          : toAppError(error, 'Failed to import project plot data');
      logger.error(
        'Failed to import project plot data',
        { component: 'PlotRepository', projectId },
        appError,
      );
      throw appError;
    }
  }

  // ==================== Private Helper Methods ====================

  private mapRowToPlotStructure(row: PlotStructureRow): PlotStructure {
    return {
      id: row.id,
      projectId: row.projectId,
      acts: row.acts as PlotStructure['acts'],
      climax: row.climax as PlotStructure['climax'],
      resolution: row.resolution as PlotStructure['resolution'],
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  private mapRowToPlotHole(row: PlotHoleRow): PlotHole {
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

  private mapRowToCharacterGraph(row: CharacterGraphRow): CharacterGraph {
    return {
      projectId: row.projectId,
      nodes: row.nodes as CharacterGraph['nodes'],
      relationships: row.relationships as CharacterGraph['relationships'],
      analyzedAt: new Date(row.analyzedAt),
    };
  }

  private mapRowToPlotSuggestion(row: PlotSuggestionRow): PlotSuggestion {
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

  private mapRowToStoryArc(row: StoryArcRow): StoryArc {
    return {
      structure: row.structure,
      pacing: row.pacing as StoryArc['pacing'],
      tension: row.tension as StoryArc['tension'],
      coherence: row.coherence,
      recommendations: row.recommendations,
    };
  }
}
