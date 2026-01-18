/**
 * Plot Repository Interface
 *
 * Extends the generic repository with plot-specific query methods.
 * Manages plot structures, holes, character graphs, and suggestions.
 */
import type {
  PlotStructure,
  PlotHole,
  CharacterGraph,
  PlotSuggestion,
  StoryArc,
  PlotHoleType,
  PlotHoleSeverity,
  PlotSuggestionType,
} from '@/features/plot-engine';

/**
 * Plot query options
 */
export interface PlotQueryOptions {
  projectId?: string;
  minDate?: Date;
  maxDate?: Date;
  includeArchived?: boolean;
}

/**
 * Plot hole query options
 */
export interface PlotHoleQueryOptions {
  projectId?: string;
  type?: PlotHoleType;
  severity?: PlotHoleSeverity;
  minConfidence?: number;
  minDate?: Date;
  maxDate?: Date;
  includeResolved?: boolean;
}

/**
 * Plot suggestion query options
 */
export interface PlotSuggestionQueryOptions {
  projectId?: string;
  type?: PlotSuggestionType;
  impact?: PlotSuggestion['impact'];
  placement?: PlotSuggestion['placement'];
}

/**
 * Plot analysis cache configuration
 */
export interface AnalysisCacheConfig {
  ttlMinutes?: number;
  key: string;
}

/**
 * Plot repository interface with plot-specific methods
 */
export interface IPlotRepository {
  // ==================== Plot Structures ====================

  /**
   * Save a plot structure
   * @param structure - The plot structure to save
   */
  savePlotStructure(structure: PlotStructure): Promise<void>;

  /**
   * Get a plot structure by ID
   * @param id - The plot structure ID
   */
  getPlotStructure(id: string): Promise<PlotStructure | null>;

  /**
   * Get all plot structures for a project
   * @param projectId - The project ID
   */
  getPlotStructuresByProject(projectId: string): Promise<PlotStructure[]>;

  /**
   * Delete a plot structure
   * @param id - The plot structure ID
   */
  deletePlotStructure(id: string): Promise<void>;

  // ==================== Plot Holes ====================

  /**
   * Save plot holes for a project (replaces existing)
   * @param projectId - The project ID
   * @param holes - Array of plot holes
   */
  savePlotHoles(projectId: string, holes: PlotHole[]): Promise<void>;

  /**
   * Get all plot holes for a project
   * @param projectId - The project ID
   * @param options - Query options
   */
  getPlotHolesByProject(projectId: string, options?: PlotHoleQueryOptions): Promise<PlotHole[]>;

  /**
   * Get plot holes by severity
   * @param projectId - The project ID
   * @param severity - The severity level
   */
  getPlotHolesBySeverity(projectId: string, severity: PlotHoleSeverity): Promise<PlotHole[]>;

  /**
   * Get plot holes by type
   * @param projectId - The project ID
   * @param type - The plot hole type
   */
  getPlotHolesByType(projectId: string, type: PlotHoleType): Promise<PlotHole[]>;

  /**
   * Get plot holes affecting specific chapters
   * @param projectId - The project ID
   * @param chapterIds - Array of chapter IDs
   */
  getPlotHolesByChapters(projectId: string, chapterIds: string[]): Promise<PlotHole[]>;

  /**
   * Get plot holes affecting specific characters
   * @param projectId - The project ID
   * @param characterIds - Array of character IDs
   */
  getPlotHolesByCharacters(projectId: string, characterIds: string[]): Promise<PlotHole[]>;

  // ==================== Character Graphs ====================

  /**
   * Save a character graph for a project
   * @param graph - The character graph
   */
  saveCharacterGraph(graph: CharacterGraph): Promise<void>;

  /**
   * Get the character graph for a project
   * @param projectId - The project ID
   */
  getCharacterGraphByProject(projectId: string): Promise<CharacterGraph | null>;

  /**
   * Delete a character graph
   * @param projectId - The project ID
   */
  deleteCharacterGraph(projectId: string): Promise<void>;

  // ==================== Analysis Results (Cached) ====================

  /**
   * Save analysis result with TTL
   * @param projectId - The project ID
   * @param analysisType - Type of analysis
   * @param resultData - The analysis result data
   * @param config - Cache configuration
   */
  saveAnalysisResult<T>(
    projectId: string,
    analysisType: string,
    resultData: T,
    config?: AnalysisCacheConfig,
  ): Promise<void>;

  /**
   * Get cached analysis result (if not expired)
   * @param projectId - The project ID
   * @param analysisType - Type of analysis
   */
  getAnalysisResult<T>(projectId: string, analysisType: string): Promise<T | null>;

  /**
   * Save story arc analysis
   * @param projectId - The project ID
   * @param storyArc - The story arc
   * @param config - Cache configuration
   */
  saveStoryArc(projectId: string, storyArc: StoryArc, config?: AnalysisCacheConfig): Promise<void>;

  /**
   * Get cached story arc analysis
   * @param projectId - The project ID
   */
  getStoryArc(projectId: string): Promise<StoryArc | null>;

  /**
   * Cleanup expired analysis results
   * @returns Number of deleted results
   */
  cleanupExpiredAnalysis(): Promise<number>;

  // ==================== Plot Suggestions ====================

  /**
   * Save plot suggestions for a project (replaces existing)
   * @param projectId - The project ID
   * @param suggestions - Array of plot suggestions
   */
  savePlotSuggestions(projectId: string, suggestions: PlotSuggestion[]): Promise<void>;

  /**
   * Get plot suggestions for a project
   * @param projectId - The project ID
   * @param options - Query options
   */
  getPlotSuggestionsByProject(
    projectId: string,
    options?: PlotSuggestionQueryOptions,
  ): Promise<PlotSuggestion[]>;

  /**
   * Get plot suggestions by type
   * @param projectId - The project ID
   * @param type - The suggestion type
   */
  getPlotSuggestionsByType(projectId: string, type: PlotSuggestionType): Promise<PlotSuggestion[]>;

  /**
   * Get plot suggestions by impact
   * @param projectId - The project ID
   * @param impact - The impact level
   */
  getPlotSuggestionsByImpact(
    projectId: string,
    impact: PlotSuggestion['impact'],
  ): Promise<PlotSuggestion[]>;

  /**
   * Get plot suggestions related to characters
   * @param projectId - The project ID
   * @param characterIds - Array of character IDs
   */
  getPlotSuggestionsByCharacters(
    projectId: string,
    characterIds: string[],
  ): Promise<PlotSuggestion[]>;

  // ==================== Bulk Operations ====================

  /**
   * Delete all plot data for a project
   * @param projectId - The project ID
   */
  deleteProjectData(projectId: string): Promise<void>;

  /**
   * Export all plot data for a project
   * @param projectId - The project ID
   */
  exportProjectData(projectId: string): Promise<{
    plotStructures: PlotStructure[];
    plotHoles: PlotHole[];
    characterGraph: CharacterGraph | null;
    plotSuggestions: PlotSuggestion[];
  }>;

  /**
   * Import plot data for a project
   * @param projectId - The project ID
   * @param data - The plot data to import
   */
  importProjectData(
    projectId: string,
    data: {
      plotStructures: PlotStructure[];
      plotHoles: PlotHole[];
      characterGraph?: CharacterGraph;
      plotSuggestions: PlotSuggestion[];
    },
  ): Promise<void>;
}
