/**
 * Plot Repository Bulk Operations Implementation
 *
 * Bulk operations for project plot data: delete all, export, import
 */

import { eq } from 'drizzle-orm';

import type {
  PlotStructure,
  PlotHole,
  CharacterGraph,
  PlotSuggestion,
} from '@/features/plot-engine';
import { getDrizzleClient } from '@/lib/database/drizzle';
import {
  plotStructures,
  plotHoles,
  characterGraphs,
  analysisResults,
  plotSuggestions,
  storyArcs,
  type NewPlotStructureRow,
  type NewPlotHoleRow,
  type NewCharacterGraphRow,
  type NewPlotSuggestionRow,
} from '@/lib/database/schemas/plots';
import { toAppError } from '@/lib/errors/error-types';
import { logger } from '@/lib/logging/logger';
import { RepositoryError } from '@/lib/repositories/interfaces/IRepository';

import type { PlotRepositoryCore } from './PlotRepository.core';

/**
 * Plot Repository Bulk Operations Implementation
 * Manages bulk operations for plot data
 */
export class PlotRepositoryBulk {
  private db;

  constructor() {
    this.db = getDrizzleClient();
    if (!this.db) {
      logger.warn('PlotRepository initialized without database connection', {
        component: 'PlotRepository',
      });
    }
  }

  // ==================== Bulk Operations ====================

  /**
   * Delete all plot data for a project
   * Removes all plot-related records for the specified project
   *
   * @param projectId - The project ID
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
   * Retrieves all plot-related data for backup or transfer
   *
   * @param projectId - The project ID
   * @returns Object containing all plot data for the project
   */
  async exportProjectData(
    projectId: string,
    coreRepo: PlotRepositoryCore,
  ): Promise<{
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
        plotStructures: structuresResult.map(row => coreRepo.mapRowToPlotStructure(row)),
        plotHoles: holesResult.map(row => this.mapRowToPlotHole(row)),
        characterGraph:
          graphResult.length > 0 ? coreRepo.mapRowToCharacterGraph(graphResult[0]!) : null,
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
   * Replaces all existing plot data for the project with the provided data
   *
   * @param projectId - The project ID
   * @param data - Object containing all plot data to import
   * @throws RepositoryError if database connection is unavailable
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

  /**
   * Map database row to PlotHole domain object
   */
  private mapRowToPlotHole(row: {
    id: string;
    type: string;
    severity: string;
    title: string;
    description: string | null;
    affectedChapters: string[] | null;
    affectedCharacters: string[] | null;
    suggestedFix: string | null;
    confidence: number;
    detected: string;
  }): PlotHole {
    return {
      id: row.id,
      type: row.type as PlotHole['type'],
      severity: row.severity as PlotHole['severity'],
      title: row.title,
      description: row.description ?? '',
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
  private mapRowToPlotSuggestion(row: {
    id: string;
    type: string;
    title: string;
    description: string | null;
    placement: string | null;
    impact: string | null;
    relatedCharacters: string[] | null;
    prerequisites: string[] | null;
    createdAt: string;
  }): PlotSuggestion {
    return {
      id: row.id,
      type: row.type as PlotSuggestion['type'],
      title: row.title,
      description: row.description ?? '',
      placement: (row.placement ?? 'anywhere') as PlotSuggestion['placement'],
      impact: (row.impact ?? 'medium') as PlotSuggestion['impact'],
      relatedCharacters: row.relatedCharacters ?? undefined,
      prerequisites: row.prerequisites ?? undefined,
    };
  }
}
