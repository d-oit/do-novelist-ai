/**
 * Plot Repository Core Implementation
 *
 * Core CRUD operations for plot structures, character graphs, analysis results
 * and story arcs. Includes private mapping methods.
 */

import { eq, gte, and, desc } from 'drizzle-orm';

import type { PlotStructure, CharacterGraph, StoryArc } from '@/features/plot-engine';
import { getDrizzleClient } from '@/lib/database/drizzle';
import {
  plotStructures,
  characterGraphs,
  analysisResults,
  storyArcs,
  type PlotStructureRow,
  type NewPlotStructureRow,
  type CharacterGraphRow,
  type NewCharacterGraphRow,
  type NewAnalysisResultRow,
  type StoryArcRow,
  type NewStoryArcRow,
} from '@/lib/database/schemas/plots';
import { toAppError } from '@/lib/errors/error-types';
import { logger } from '@/lib/logging/logger';
import type { AnalysisCacheConfig } from '@/lib/repositories/interfaces/IPlotRepository';
import { RepositoryError } from '@/lib/repositories/interfaces/IRepository';

/**
 * Plot Repository Core Implementation
 * Manages core plot data access with type-safe operations
 */
export class PlotRepositoryCore {
  protected db;

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
   * Creates or updates a plot structure record in the database
   *
   * @param structure - The plot structure to save
   * @throws RepositoryError if database connection is unavailable
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
   *
   * @param id - The plot structure ID
   * @returns The plot structure or null if not found
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
   *
   * @param projectId - The project ID
   * @returns Array of plot structures ordered by creation date (newest first)
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
   *
   * @param id - The plot structure ID
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

  // ==================== Character Graphs ====================

  /**
   * Save a character graph for a project
   * Creates or updates a character graph record
   *
   * @param graph - The character graph to save
   * @throws RepositoryError if database connection is unavailable
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
   *
   * @param projectId - The project ID
   * @returns The character graph or null if not found
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
   *
   * @param projectId - The project ID
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
   * Caches analysis results with automatic expiration
   *
   * @param projectId - The project ID
   * @param analysisType - Type of analysis (e.g., 'coherence', 'pacing')
   * @param resultData - The analysis result data
   * @param config - Optional cache configuration (TTL, custom key)
   * @throws RepositoryError if database connection is unavailable
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
   *
   * @param projectId - The project ID
   * @param analysisType - Type of analysis
   * @returns The cached result or null if not found/expired
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
   * Creates or updates a story arc analysis record
   *
   * @param projectId - The project ID
   * @param storyArc - The story arc analysis data
   * @param _config - Parameter for interface compatibility (unused)
   * @throws RepositoryError if database connection is unavailable
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
   *
   * @param projectId - The project ID
   * @returns The story arc analysis or null if not found
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
   * Removes all cached analysis results that have passed their expiration time
   *
   * @returns Number of records deleted
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
        .where(gte(analysisResults.expiresAt, now));

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

  // ==================== Public Helper Methods ====================

  /**
   * Map database row to PlotStructure domain object
   */
  public mapRowToPlotStructure(row: PlotStructureRow): PlotStructure {
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

  /**
   * Map database row to CharacterGraph domain object
   */
  public mapRowToCharacterGraph(row: CharacterGraphRow): CharacterGraph {
    return {
      projectId: row.projectId,
      nodes: row.nodes as CharacterGraph['nodes'],
      relationships: row.relationships as CharacterGraph['relationships'],
      analyzedAt: new Date(row.analyzedAt),
    };
  }

  /**
   * Map database row to StoryArc domain object
   */
  public mapRowToStoryArc(row: StoryArcRow): StoryArc {
    return {
      structure: row.structure,
      pacing: row.pacing as StoryArc['pacing'],
      tension: row.tension as StoryArc['tension'],
      coherence: row.coherence,
      recommendations: row.recommendations,
    };
  }
}
