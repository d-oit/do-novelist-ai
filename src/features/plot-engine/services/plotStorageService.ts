/**
 * Plot Storage Service
 *
 * Turso-based storage for Plot Engine data with embedded replica support.
 * Provides local-first performance with automatic cloud sync.
 */

import { createClient } from '@libsql/client/web';

import type {
  PlotStructure,
  PlotHole,
  CharacterGraph,
  PlotSuggestion,
} from '@/features/plot-engine';
import { logger } from '@/lib/logging/logger';

const STORAGE_KEY = 'novelist_plot_db_config';

interface PlotDbConfig {
  url: string;
  syncUrl: string;
  authToken: string;
  useEmbeddedReplica: boolean;
}

// Note: AnalysisResult interface defined inline for storage purposes
// Not exported as it's internal to storage layer

type Client = ReturnType<typeof createClient>;

/**
 * Get stored configuration or use environment defaults
 */
const getStoredConfig = (): PlotDbConfig => {
  // Check LocalStorage first
  const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
  if (stored != null) {
    return JSON.parse(stored) as PlotDbConfig;
  }

  // Use environment variables
  const syncUrl = (import.meta.env.VITE_TURSO_DATABASE_URL as string | undefined) ?? '';
  const authToken = (import.meta.env.VITE_TURSO_AUTH_TOKEN as string | undefined) ?? '';

  // Enable embedded replica if we have cloud credentials
  const useEmbeddedReplica = syncUrl.length > 0 && authToken.length > 0;

  return {
    url: useEmbeddedReplica ? ':memory:' : ':memory:', // Browser LibSQL client doesn't support 'file:' scheme
    syncUrl,
    authToken,
    useEmbeddedReplica,
  };
};

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
      if (this.config.useEmbeddedReplica) {
        this.client = createClient({
          url: this.config.url,
          syncUrl: this.config.syncUrl,
          authToken: this.config.authToken,
          syncInterval: 60000, // Auto-sync every 60 seconds
        });
      } else {
        // Fallback to in-memory database
        this.client = createClient({
          url: ':memory:',
        });
      }

      // Create tables
      await this.createTables();

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
   * Create all required tables with indexes
   */
  private async createTables(): Promise<void> {
    if (!this.client) throw new Error('Client not initialized');

    try {
      // 1. Plot Structures
      await this.client.execute(`
        CREATE TABLE IF NOT EXISTS plot_structures (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          acts TEXT NOT NULL,
          climax TEXT,
          resolution TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await this.client.execute(
        'CREATE INDEX IF NOT EXISTS idx_plot_structures_project ON plot_structures(project_id)',
      );

      // 2. Plot Holes
      await this.client.execute(`
        CREATE TABLE IF NOT EXISTS plot_holes (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          type TEXT NOT NULL,
          severity TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          affected_chapters TEXT NOT NULL,
          affected_characters TEXT NOT NULL,
          suggested_fix TEXT,
          confidence REAL NOT NULL,
          detected DATETIME NOT NULL
        )
      `);
      await this.client.execute(
        'CREATE INDEX IF NOT EXISTS idx_plot_holes_project ON plot_holes(project_id)',
      );

      // 3. Character Graphs
      await this.client.execute(`
        CREATE TABLE IF NOT EXISTS character_graphs (
          project_id TEXT PRIMARY KEY,
          nodes TEXT NOT NULL,
          relationships TEXT NOT NULL,
          analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await this.client.execute(
        'CREATE INDEX IF NOT EXISTS idx_character_graphs_project ON character_graphs(project_id)',
      );

      // 4. Analysis Results (with TTL)
      await this.client.execute(`
        CREATE TABLE IF NOT EXISTS analysis_results (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          analysis_type TEXT NOT NULL,
          result_data TEXT NOT NULL,
          expires_at DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await this.client.execute(
        'CREATE INDEX IF NOT EXISTS idx_analysis_results_project ON analysis_results(project_id)',
      );
      await this.client.execute(
        'CREATE INDEX IF NOT EXISTS idx_analysis_results_expires ON analysis_results(expires_at)',
      );

      // 5. Plot Suggestions
      await this.client.execute(`
        CREATE TABLE IF NOT EXISTS plot_suggestions (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          placement TEXT,
          impact TEXT,
          related_characters TEXT,
          prerequisites TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await this.client.execute(
        'CREATE INDEX IF NOT EXISTS idx_plot_suggestions_project ON plot_suggestions(project_id)',
      );

      logger.info('Plot Engine database tables created successfully');
    } catch (error) {
      logger.error('Failed to create tables', {
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

  // ==================== Plot Structures ====================

  /**
   * Save a plot structure
   */
  public async savePlotStructure(structure: PlotStructure): Promise<void> {
    if (!this.client) await this.init();
    if (!this.client) throw new Error('Client not initialized');

    try {
      await this.client.execute({
        sql: `INSERT INTO plot_structures (id, project_id, acts, climax, resolution, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET
              acts=excluded.acts, climax=excluded.climax, resolution=excluded.resolution, updated_at=CURRENT_TIMESTAMP`,
        args: [
          structure.id,
          structure.projectId,
          JSON.stringify(structure.acts),
          structure.climax ? JSON.stringify(structure.climax) : null,
          structure.resolution ? JSON.stringify(structure.resolution) : null,
          structure.createdAt.toISOString(),
          structure.updatedAt.toISOString(),
        ],
      });

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
   */
  public async getPlotStructure(id: string): Promise<PlotStructure | null> {
    if (!this.client) await this.init();
    if (!this.client) throw new Error('Client not initialized');

    try {
      const result = await this.client.execute({
        sql: 'SELECT * FROM plot_structures WHERE id = ?',
        args: [id],
      });

      if (result.rows.length === 0) return null;

      const row = result.rows[0] as Record<string, unknown>;
      return this.rowToPlotStructure(row);
    } catch (error) {
      logger.error('Failed to get plot structure', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get all plot structures for a project
   */
  public async getPlotStructuresByProject(projectId: string): Promise<PlotStructure[]> {
    if (!this.client) await this.init();
    if (!this.client) throw new Error('Client not initialized');

    try {
      const result = await this.client.execute({
        sql: 'SELECT * FROM plot_structures WHERE project_id = ? ORDER BY created_at DESC',
        args: [projectId],
      });

      return result.rows.map(row => this.rowToPlotStructure(row as Record<string, unknown>));
    } catch (error) {
      logger.error('Failed to get plot structures by project', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Delete a plot structure
   */
  public async deletePlotStructure(id: string): Promise<void> {
    if (!this.client) await this.init();
    if (!this.client) throw new Error('Client not initialized');

    try {
      await this.client.execute({
        sql: 'DELETE FROM plot_structures WHERE id = ?',
        args: [id],
      });

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
   */
  public async savePlotHoles(projectId: string, holes: PlotHole[]): Promise<void> {
    if (!this.client) await this.init();
    if (!this.client) throw new Error('Client not initialized');

    try {
      // Delete existing holes for this project
      await this.client.execute({
        sql: 'DELETE FROM plot_holes WHERE project_id = ?',
        args: [projectId],
      });

      // Insert new holes
      if (holes.length > 0) {
        const statements = holes.map(hole => ({
          sql: `INSERT INTO plot_holes (id, project_id, type, severity, title, description, affected_chapters, affected_characters, suggested_fix, confidence, detected)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            hole.id,
            projectId,
            hole.type,
            hole.severity,
            hole.title,
            hole.description,
            JSON.stringify(hole.affectedChapters),
            JSON.stringify(hole.affectedCharacters),
            hole.suggestedFix || null,
            hole.confidence,
            hole.detected.toISOString(),
          ],
        }));

        await this.client.batch(statements, 'write');
      }

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
   */
  public async getPlotHolesByProject(projectId: string): Promise<PlotHole[]> {
    if (!this.client) await this.init();
    if (!this.client) throw new Error('Client not initialized');

    try {
      const result = await this.client.execute({
        sql: 'SELECT * FROM plot_holes WHERE project_id = ? ORDER BY severity DESC, created_at DESC',
        args: [projectId],
      });

      return result.rows.map(row => this.rowToPlotHole(row as Record<string, unknown>));
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
   */
  public async saveCharacterGraph(graph: CharacterGraph): Promise<void> {
    if (!this.client) await this.init();
    if (!this.client) throw new Error('Client not initialized');

    try {
      await this.client.execute({
        sql: `INSERT INTO character_graphs (project_id, nodes, relationships, analyzed_at)
              VALUES (?, ?, ?, ?)
              ON CONFLICT(project_id) DO UPDATE SET
              nodes=excluded.nodes, relationships=excluded.relationships, analyzed_at=CURRENT_TIMESTAMP`,
        args: [
          graph.projectId,
          JSON.stringify(graph.nodes),
          JSON.stringify(graph.relationships),
          graph.analyzedAt.toISOString(),
        ],
      });

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
   */
  public async getCharacterGraphByProject(projectId: string): Promise<CharacterGraph | null> {
    if (!this.client) await this.init();
    if (!this.client) throw new Error('Client not initialized');

    try {
      const result = await this.client.execute({
        sql: 'SELECT * FROM character_graphs WHERE project_id = ?',
        args: [projectId],
      });

      if (result.rows.length === 0) return null;

      const row = result.rows[0] as Record<string, unknown>;
      return this.rowToCharacterGraph(row);
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
   */
  public async saveAnalysisResult(
    projectId: string,
    analysisType: string,
    resultData: unknown,
    ttlMinutes: number = 5,
  ): Promise<void> {
    if (!this.client) await this.init();
    if (!this.client) throw new Error('Client not initialized');

    try {
      const id = `analysis-${projectId}-${analysisType}-${Date.now()}`;
      const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

      await this.client.execute({
        sql: `INSERT INTO analysis_results (id, project_id, analysis_type, result_data, expires_at, created_at)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          id,
          projectId,
          analysisType,
          JSON.stringify(resultData),
          expiresAt.toISOString(),
          new Date().toISOString(),
        ],
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
   */
  public async getAnalysisResult(projectId: string, analysisType: string): Promise<unknown | null> {
    if (!this.client) await this.init();
    if (!this.client) throw new Error('Client not initialized');

    try {
      const result = await this.client.execute({
        sql: `SELECT * FROM analysis_results
              WHERE project_id = ? AND analysis_type = ? AND expires_at > datetime('now')
              ORDER BY created_at DESC LIMIT 1`,
        args: [projectId, analysisType],
      });

      if (result.rows.length === 0) return null;

      const row = result.rows[0] as Record<string, unknown>;
      return JSON.parse(row.result_data as string);
    } catch (error) {
      logger.error('Failed to get analysis result', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Cleanup expired analysis results
   */
  public async cleanupExpiredAnalysis(): Promise<number> {
    if (!this.client) await this.init();
    if (!this.client) throw new Error('Client not initialized');

    try {
      const result = await this.client.execute({
        sql: "DELETE FROM analysis_results WHERE expires_at < datetime('now')",
        args: [],
      });

      const deleted = result.rowsAffected;
      if (deleted > 0) {
        logger.info('Expired analysis results cleaned up', { count: deleted });
      }

      return deleted;
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
   */
  public async savePlotSuggestions(
    projectId: string,
    suggestions: PlotSuggestion[],
  ): Promise<void> {
    if (!this.client) await this.init();
    if (!this.client) throw new Error('Client not initialized');

    try {
      // Delete existing suggestions for this project
      await this.client.execute({
        sql: 'DELETE FROM plot_suggestions WHERE project_id = ?',
        args: [projectId],
      });

      // Insert new suggestions
      if (suggestions.length > 0) {
        const statements = suggestions.map(suggestion => ({
          sql: `INSERT INTO plot_suggestions (id, project_id, type, title, description, placement, impact, related_characters, prerequisites, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            suggestion.id,
            projectId,
            suggestion.type,
            suggestion.title,
            suggestion.description,
            suggestion.placement,
            suggestion.impact,
            suggestion.relatedCharacters ? JSON.stringify(suggestion.relatedCharacters) : null,
            suggestion.prerequisites ? JSON.stringify(suggestion.prerequisites) : null,
            new Date().toISOString(),
          ],
        }));

        await this.client.batch(statements, 'write');
      }

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
   */
  public async getPlotSuggestionsByProject(projectId: string): Promise<PlotSuggestion[]> {
    if (!this.client) await this.init();
    if (!this.client) throw new Error('Client not initialized');

    try {
      const result = await this.client.execute({
        sql: 'SELECT * FROM plot_suggestions WHERE project_id = ? ORDER BY created_at DESC',
        args: [projectId],
      });

      return result.rows.map(row => this.rowToPlotSuggestion(row as Record<string, unknown>));
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
   */
  public async deleteProjectData(projectId: string): Promise<void> {
    if (!this.client) await this.init();
    if (!this.client) throw new Error('Client not initialized');

    try {
      await this.client.batch(
        [
          { sql: 'DELETE FROM plot_structures WHERE project_id = ?', args: [projectId] },
          { sql: 'DELETE FROM plot_holes WHERE project_id = ?', args: [projectId] },
          { sql: 'DELETE FROM character_graphs WHERE project_id = ?', args: [projectId] },
          { sql: 'DELETE FROM analysis_results WHERE project_id = ?', args: [projectId] },
          { sql: 'DELETE FROM plot_suggestions WHERE project_id = ?', args: [projectId] },
        ],
        'write',
      );

      logger.info('Project data deleted', { projectId });
    } catch (error) {
      logger.error('Failed to delete project data', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // ==================== Helper Methods ====================

  private rowToPlotStructure(row: Record<string, unknown>): PlotStructure {
    return {
      id: row.id as string,
      projectId: row.project_id as string,
      acts: JSON.parse(row.acts as string),
      climax: row.climax ? JSON.parse(row.climax as string) : undefined,
      resolution: row.resolution ? JSON.parse(row.resolution as string) : undefined,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }

  private rowToPlotHole(row: Record<string, unknown>): PlotHole {
    return {
      id: row.id as string,
      type: row.type as PlotHole['type'],
      severity: row.severity as PlotHole['severity'],
      title: row.title as string,
      description: row.description as string,
      affectedChapters: JSON.parse(row.affected_chapters as string),
      affectedCharacters: JSON.parse(row.affected_characters as string),
      suggestedFix: row.suggested_fix as string | undefined,
      confidence: row.confidence as number,
      detected: new Date(row.detected as string),
    };
  }

  private rowToCharacterGraph(row: Record<string, unknown>): CharacterGraph {
    return {
      projectId: row.project_id as string,
      nodes: JSON.parse(row.nodes as string),
      relationships: JSON.parse(row.relationships as string),
      analyzedAt: new Date(row.analyzed_at as string),
    };
  }

  private rowToPlotSuggestion(row: Record<string, unknown>): PlotSuggestion {
    return {
      id: row.id as string,
      type: row.type as PlotSuggestion['type'],
      title: row.title as string,
      description: row.description as string,
      placement: row.placement as PlotSuggestion['placement'],
      impact: row.impact as PlotSuggestion['impact'],
      relatedCharacters: row.related_characters
        ? JSON.parse(row.related_characters as string)
        : undefined,
      prerequisites: row.prerequisites ? JSON.parse(row.prerequisites as string) : undefined,
    };
  }
}

// Export singleton instance
export const plotStorageService = new PlotStorageService();
