/**
 * Plot Storage Service
 *
 * Provides storage for Plot Engine data using PlotRepository
 */

import type {
  PlotStructure,
  PlotHole,
  CharacterGraph,
  PlotSuggestion,
} from '@/features/plot-engine';
import { logger } from '@/lib/logging/logger';
import { PlotRepository } from '@/lib/repositories/implementations/PlotRepository';
import type { IPlotRepository } from '@/lib/repositories/interfaces/IPlotRepository';

/**
 * Plot Storage Service
 * Manages all plot-related data persistence using PlotRepository
 */
class PlotStorageService {
  private repository: IPlotRepository;

  constructor(repository?: IPlotRepository) {
    this.repository = repository ?? new PlotRepository();
  }

  /**
   * Initialize the Plot Storage Service
   *
   * Initializes the service and its underlying repository.
   *
   * @returns Promise that resolves when initialization is complete
   * @example
   * await plotStorageService.init();
   */
  public async init(): Promise<void> {
    logger.debug('Plot Storage Service initialized', {
      component: 'PlotStorageService',
    });
  }

  // ==================== Plot Structures ====================

  /**
   * Save a plot structure
   *
   * Saves or updates a plot structure to the database.
   *
   * Side effects:
   * - Writes to database
   *
   * @param structure - The plot structure to save
   * @returns Promise that resolves when save is complete
   * @throws {RepositoryError} When database write fails
   * @example
   * await plotStorageService.savePlotStructure({
   *   id: 'struct-uuid',
   *   projectId: 'project-uuid',
   *   type: 'three-act',
   *   acts: [...]
   * });
   */
  public async savePlotStructure(structure: PlotStructure): Promise<void> {
    try {
      await this.repository.savePlotStructure(structure);
      logger.info('Plot structure saved', { id: structure.id, projectId: structure.projectId });
    } catch (error) {
      logger.error('Failed to save plot structure', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get plot structure by ID
   *
   * Retrieves a specific plot structure by its unique identifier.
   *
   * @param id - The unique plot structure identifier
   * @returns The plot structure if found, or null if not found
   * @throws {RepositoryError} When database query fails
   * @example
   * const structure = await plotStorageService.getPlotStructure('struct-uuid');
   * if (structure) {
   *   console.log(`Structure type: ${structure.type}`);
   * }
   */
  public async getPlotStructure(id: string): Promise<PlotStructure | null> {
    try {
      return await this.repository.getPlotStructure(id);
    } catch (error) {
      logger.error('Failed to get plot structure', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get all plot structures for a project
   *
   * Retrieves all plot structures belonging to a specific project.
   *
   * @param projectId - The unique project identifier
   * @returns Array of plot structures for the project
   * @throws {RepositoryError} When database query fails
   * @example
   * const structures = await plotStorageService.getPlotStructuresByProject('project-uuid');
   * console.log(`Found ${structures.length} plot structures`);
   */
  public async getPlotStructuresByProject(projectId: string): Promise<PlotStructure[]> {
    try {
      return await this.repository.getPlotStructuresByProject(projectId);
    } catch (error) {
      logger.error('Failed to get plot structures by project', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Delete a plot structure
   *
   * Permanently deletes a plot structure from the database.
   *
   * Side effects:
   * - Deletes plot structure from database
   *
   * @param id - The unique plot structure identifier to delete
   * @returns Promise that resolves when deletion is complete
   * @throws {RepositoryError} When database deletion fails
   * @example
   * await plotStorageService.deletePlotStructure('struct-uuid');
   */
  public async deletePlotStructure(id: string): Promise<void> {
    try {
      await this.repository.deletePlotStructure(id);
      logger.info('Plot structure deleted', { id });
    } catch (error) {
      logger.error('Failed to delete plot structure', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // ==================== Plot Holes ====================

  /**
   * Save plot holes
   *
   * Saves all plot holes for a project to the database.
   *
   * Side effects:
   * - Writes to database
   *
   * @param projectId - The unique project identifier
   * @param holes - Array of plot holes to save
   * @returns Promise that resolves when save is complete
   * @throws {RepositoryError} When database write fails
   * @example
   * await plotStorageService.savePlotHoles('project-uuid', [
   *   { id: 'hole-1', description: 'Inconsistent timeline', severity: 'high' }
   * ]);
   */
  public async savePlotHoles(projectId: string, holes: PlotHole[]): Promise<void> {
    try {
      await this.repository.savePlotHoles(projectId, holes);
      logger.info('Plot holes saved', { projectId, count: holes.length });
    } catch (error) {
      logger.error('Failed to save plot holes', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get all plot holes for a project
   *
   * Retrieves all identified plot holes for a specific project.
   *
   * @param projectId - The unique project identifier
   * @returns Array of plot holes for the project
   * @throws {RepositoryError} When database query fails
   * @example
   * const holes = await plotStorageService.getPlotHolesByProject('project-uuid');
   * console.log(`Found ${holes.length} plot holes`);
   */
  public async getPlotHolesByProject(projectId: string): Promise<PlotHole[]> {
    try {
      return await this.repository.getPlotHolesByProject(projectId);
    } catch (error) {
      logger.error('Failed to get plot holes by project', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // ==================== Character Graphs ====================

  /**
   * Save a character graph
   *
   * Saves the character relationship graph for a project.
   *
   * Side effects:
   * - Writes to database
   *
   * @param graph - The character graph to save
   * @returns Promise that resolves when save is complete
   * @throws {RepositoryError} When database write fails
   * @example
   * await plotStorageService.saveCharacterGraph({
   *   projectId: 'project-uuid',
   *   nodes: [...],
   *   edges: [...]
   * });
   */
  public async saveCharacterGraph(graph: CharacterGraph): Promise<void> {
    try {
      await this.repository.saveCharacterGraph(graph);
      logger.info('Character graph saved', { projectId: graph.projectId });
    } catch (error) {
      logger.error('Failed to save character graph', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get character graph for a project
   *
   * Retrieves the character relationship graph for a specific project.
   *
   * @param projectId - The unique project identifier
   * @returns The character graph if found, or null if not found
   * @throws {RepositoryError} When database query fails
   * @example
   * const graph = await plotStorageService.getCharacterGraphByProject('project-uuid');
   * if (graph) {
   *   console.log(`Graph has ${graph.nodes.length} characters`);
   * }
   */
  public async getCharacterGraphByProject(projectId: string): Promise<CharacterGraph | null> {
    try {
      return await this.repository.getCharacterGraphByProject(projectId);
    } catch (error) {
      logger.error('Failed to get character graph by project', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // ==================== Analysis Results (with TTL) ====================

  /**
   * Save analysis result with TTL
   *
   * Caches an analysis result with a time-to-live (TTL) to avoid
   * re-running expensive analysis operations.
   *
   * Side effects:
   * - Writes to database
   *
   * @param projectId - The unique project identifier
   * @param analysisType - The type of analysis (e.g., 'pacing', 'coherence')
   * @param resultData - The analysis result data to cache
   * @param ttlMinutes - Time-to-live in minutes (default: 5)
   * @returns Promise that resolves when save is complete
   * @throws {RepositoryError} When database write fails
   * @example
   * await plotStorageService.saveAnalysisResult('project-uuid', 'pacing', { score: 0.85 }, 10);
   */
  public async saveAnalysisResult(
    projectId: string,
    analysisType: string,
    resultData: unknown,
    ttlMinutes: number = 5,
  ): Promise<void> {
    try {
      await this.repository.saveAnalysisResult(projectId, analysisType, resultData, {
        ttlMinutes,
        key: `${projectId}-${analysisType}-${Date.now()}`,
      });
      logger.info('Analysis result saved', { projectId, analysisType, ttlMinutes });
    } catch (error) {
      logger.error('Failed to save analysis result', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get cached analysis result (if not expired)
   *
   * Retrieves a cached analysis result if it hasn't expired yet.
   *
   * @param projectId - The unique project identifier
   * @param analysisType - The type of analysis to retrieve
   * @returns The cached result if found and not expired, or null otherwise
   * @throws {RepositoryError} When database query fails
   * @example
   * const result = await plotStorageService.getAnalysisResult('project-uuid', 'pacing');
   * if (result) {
   *   console.log('Using cached analysis result');
   * }
   */
  public async getAnalysisResult(projectId: string, analysisType: string): Promise<unknown | null> {
    try {
      return await this.repository.getAnalysisResult(projectId, analysisType);
    } catch (error) {
      logger.error('Failed to get analysis result', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Cleanup expired analysis results
   *
   * Removes all expired analysis results from the cache. This should be
   * called periodically to maintain cache efficiency.
   *
   * Side effects:
   * - Deletes expired entries from database
   *
   * @returns Number of expired entries removed
   * @throws {RepositoryError} When database cleanup fails
   * @example
   * const removedCount = await plotStorageService.cleanupExpiredAnalysis();
   * console.log(`Cleaned up ${removedCount} expired results`);
   */
  public async cleanupExpiredAnalysis(): Promise<number> {
    try {
      const count = await this.repository.cleanupExpiredAnalysis();
      if (count > 0) {
        logger.info('Expired analysis results cleaned up', { count });
      }
      return count;
    } catch (error) {
      logger.error('Failed to cleanup expired analysis', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // ==================== Plot Suggestions ====================

  /**
   * Save plot suggestions
   *
   * Saves AI-generated plot suggestions for a project.
   *
   * Side effects:
   * - Writes to database
   *
   * @param projectId - The unique project identifier
   * @param suggestions - Array of plot suggestions to save
   * @returns Promise that resolves when save is complete
   * @throws {RepositoryError} When database write fails
   * @example
   * await plotStorageService.savePlotSuggestions('project-uuid', [
   *   { id: 'sugg-1', text: 'Add a plot twist', confidence: 0.8 }
   * ]);
   */
  public async savePlotSuggestions(
    projectId: string,
    suggestions: PlotSuggestion[],
  ): Promise<void> {
    try {
      await this.repository.savePlotSuggestions(projectId, suggestions);
      logger.info('Plot suggestions saved', { projectId, count: suggestions.length });
    } catch (error) {
      logger.error('Failed to save plot suggestions', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get plot suggestions for a project
   *
   * Retrieves all saved plot suggestions for a specific project.
   *
   * @param projectId - The unique project identifier
   * @returns Array of plot suggestions for the project
   * @throws {RepositoryError} When database query fails
   * @example
   * const suggestions = await plotStorageService.getPlotSuggestionsByProject('project-uuid');
   * console.log(`Found ${suggestions.length} suggestions`);
   */
  public async getPlotSuggestionsByProject(projectId: string): Promise<PlotSuggestion[]> {
    try {
      return await this.repository.getPlotSuggestionsByProject(projectId);
    } catch (error) {
      logger.error('Failed to get plot suggestions by project', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // ==================== Cleanup ====================

  /**
   * Delete all data for a project
   *
   * Permanently deletes all plot-related data for a specific project,
   * including structures, holes, character graphs, and suggestions.
   *
   * Side effects:
   * - Deletes all plot data from database
   *
   * @param projectId - The unique project identifier
   * @returns Promise that resolves when deletion is complete
   * @throws {RepositoryError} When database deletion fails
   * @example
   * await plotStorageService.deleteProjectData('project-uuid');
   * console.log('All plot data deleted');
   */
  public async deleteProjectData(projectId: string): Promise<void> {
    try {
      await this.repository.deleteProjectData(projectId);
      logger.info('Project data deleted', { projectId });
    } catch (error) {
      logger.error('Failed to delete project data', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Sync (no-op for PlotRepository-based service)
   *
   * Kept for backward compatibility. The repository handles data
   * persistence directly, so no separate sync is needed.
   *
   * @returns Promise that resolves immediately
   * @example
   * await plotStorageService.sync(); // No-op
   */
  public async sync(): Promise<void> {
    // PlotRepository handles data persistence directly
    // No separate sync needed
    logger.debug('Sync called (no-op for repository-based service)', {
      component: 'PlotStorageService',
    });
  }
}

// Export class and singleton instance
export { PlotStorageService };
export const plotStorageService = new PlotStorageService();
