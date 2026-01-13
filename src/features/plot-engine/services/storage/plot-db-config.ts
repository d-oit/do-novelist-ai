/**
 * Plot Storage Configuration
 * Database configuration and initialization utilities for Turso/LibSQL
 */

import { createClient } from '@libsql/client/web';

import { logger } from '@/lib/logging/logger';

export const STORAGE_KEY = 'novelist_plot_db_config';

export interface PlotDbConfig {
  url: string;
  syncUrl: string;
  authToken: string;
  useEmbeddedReplica: boolean;
}

export type Client = ReturnType<typeof createClient>;

/**
 * Get stored configuration or use environment defaults
 */
export const getStoredConfig = (): PlotDbConfig => {
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
    url: useEmbeddedReplica ? 'file:plot-engine.db' : ':memory:',
    syncUrl,
    authToken,
    useEmbeddedReplica,
  };
};

/**
 * Create database client with proper configuration
 */
export const createDbClient = (config: PlotDbConfig): Client => {
  if (config.useEmbeddedReplica) {
    return createClient({
      url: config.url,
      syncUrl: config.syncUrl,
      authToken: config.authToken,
      syncInterval: 60000, // Auto-sync every 60 seconds
    });
  }

  // Fallback to in-memory database
  return createClient({
    url: ':memory:',
  });
};

/**
 * Create all required database tables with indexes
 */
export const createTables = async (client: Client): Promise<void> => {
  try {
    // 1. Plot Structures
    await client.execute(`
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
    await client.execute(
      'CREATE INDEX IF NOT EXISTS idx_plot_structures_project ON plot_structures(project_id)',
    );

    // 2. Plot Holes
    await client.execute(`
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
    await client.execute(
      'CREATE INDEX IF NOT EXISTS idx_plot_holes_project ON plot_holes(project_id)',
    );

    // 3. Character Graphs
    await client.execute(`
      CREATE TABLE IF NOT EXISTS character_graphs (
        project_id TEXT PRIMARY KEY,
        nodes TEXT NOT NULL,
        relationships TEXT NOT NULL,
        analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.execute(
      'CREATE INDEX IF NOT EXISTS idx_character_graphs_project ON character_graphs(project_id)',
    );

    // 4. Analysis Results (with TTL)
    await client.execute(`
      CREATE TABLE IF NOT EXISTS analysis_results (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        analysis_type TEXT NOT NULL,
        result_data TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.execute(
      'CREATE INDEX IF NOT EXISTS idx_analysis_results_project ON analysis_results(project_id)',
    );
    await client.execute(
      'CREATE INDEX IF NOT EXISTS idx_analysis_results_expires ON analysis_results(expires_at)',
    );

    // 5. Plot Suggestions
    await client.execute(`
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
    await client.execute(
      'CREATE INDEX IF NOT EXISTS idx_plot_suggestions_project ON plot_suggestions(project_id)',
    );

    logger.info('Plot Engine database tables created successfully');
  } catch (error) {
    logger.error('Failed to create tables', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};
