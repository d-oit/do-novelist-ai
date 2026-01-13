/**
 * Plot Storage Service
 *
 * Turso-based storage for Plot Engine data with embedded replica support.
 * Provides local-first performance with automatic cloud sync.
 *
 * Refactored for better organization and maintainability.
 * Database operations extracted to separate modules:
 * - storage/plot-db-config.ts: Configuration and initialization
 * - storage/plot-mappers.ts: Row-to-object converters
 * - storage/plot-crud-operations.ts: All CRUD operations
 */

import type {
  PlotStructure,
  PlotHole,
  CharacterGraph,
  PlotSuggestion,
} from '@/features/plot-engine';
import { logger } from '@/lib/logging/logger';

import * as crud from './storage/plot-crud-operations';
import { getStoredConfig, createDbClient, createTables } from './storage/plot-db-config';
import type { Client, PlotDbConfig } from './storage/plot-db-config';

/**
 * Plot Storage Service
 * Manages all plot-related data persistence using Turso with embedded replicas
 */
class PlotStorageService {
  private client: Client | null = null;
  private config: PlotDbConfig;
  private initialized = false;

  constructor() {
    this.config = getStoredConfig();
  }

  /**
   * Initialize the database and create tables if needed
   */
  public async init(): Promise<void> {
    if (this.initialized) return;

    try {
      // Create client with embedded replica if cloud sync is configured
      this.client = createDbClient(this.config);

      // Create tables
      await createTables(this.client);

      this.initialized = true;
      logger.info('Plot Storage Service initialized', {
        useEmbeddedReplica: this.config.useEmbeddedReplica,
      });
    } catch (error) {
      logger.error('Failed to initialize Plot Storage Service', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Manually trigger sync with cloud (if using embedded replica)
   */
  public async sync(): Promise<void> {
    if (!this.client || !this.config.useEmbeddedReplica) return;

    try {
      await this.client.sync();
      logger.info('Manual sync completed');
    } catch (error) {
      logger.warn('Manual sync failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Ensure client is initialized
   */
  private async ensureClient(): Promise<Client> {
    if (!this.client) await this.init();
    if (!this.client) throw new Error('Client not initialized');
    return this.client;
  }

  // ==================== Plot Structures ====================

  public async savePlotStructure(structure: PlotStructure): Promise<void> {
    const client = await this.ensureClient();
    return crud.savePlotStructure(client, structure);
  }

  public async getPlotStructure(id: string): Promise<PlotStructure | null> {
    const client = await this.ensureClient();
    return crud.getPlotStructure(client, id);
  }

  public async getPlotStructuresByProject(projectId: string): Promise<PlotStructure[]> {
    const client = await this.ensureClient();
    return crud.getPlotStructuresByProject(client, projectId);
  }

  public async deletePlotStructure(id: string): Promise<void> {
    const client = await this.ensureClient();
    return crud.deletePlotStructure(client, id);
  }

  // ==================== Plot Holes ====================

  public async savePlotHoles(projectId: string, holes: PlotHole[]): Promise<void> {
    const client = await this.ensureClient();
    return crud.savePlotHoles(client, projectId, holes);
  }

  public async getPlotHolesByProject(projectId: string): Promise<PlotHole[]> {
    const client = await this.ensureClient();
    return crud.getPlotHolesByProject(client, projectId);
  }

  // ==================== Character Graphs ====================

  public async saveCharacterGraph(graph: CharacterGraph): Promise<void> {
    const client = await this.ensureClient();
    return crud.saveCharacterGraph(client, graph);
  }

  public async getCharacterGraphByProject(projectId: string): Promise<CharacterGraph | null> {
    const client = await this.ensureClient();
    return crud.getCharacterGraphByProject(client, projectId);
  }

  // ==================== Analysis Results (with TTL) ====================

  public async saveAnalysisResult(
    projectId: string,
    analysisType: string,
    resultData: unknown,
    ttlMinutes: number = 5,
  ): Promise<void> {
    const client = await this.ensureClient();
    return crud.saveAnalysisResult(client, projectId, analysisType, resultData, ttlMinutes);
  }

  public async getAnalysisResult(projectId: string, analysisType: string): Promise<unknown | null> {
    const client = await this.ensureClient();
    return crud.getAnalysisResult(client, projectId, analysisType);
  }

  public async cleanupExpiredAnalysis(): Promise<number> {
    const client = await this.ensureClient();
    return crud.cleanupExpiredAnalysis(client);
  }

  // ==================== Plot Suggestions ====================

  public async savePlotSuggestions(
    projectId: string,
    suggestions: PlotSuggestion[],
  ): Promise<void> {
    const client = await this.ensureClient();
    return crud.savePlotSuggestions(client, projectId, suggestions);
  }

  public async getPlotSuggestionsByProject(projectId: string): Promise<PlotSuggestion[]> {
    const client = await this.ensureClient();
    return crud.getPlotSuggestionsByProject(client, projectId);
  }

  // ==================== Cleanup ====================

  public async deleteProjectData(projectId: string): Promise<void> {
    const client = await this.ensureClient();
    return crud.deleteProjectData(client, projectId);
  }
}

// Export singleton instance
export const plotStorageService = new PlotStorageService();
