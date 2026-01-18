/**
 * Plot Repository Implementation
 *
 * Combines core, query, and bulk operations into a single repository
 * Implements IPlotRepository interface using Drizzle ORM
 */

import type {
  PlotStructure,
  PlotHole,
  CharacterGraph,
  PlotSuggestion,
  StoryArc,
} from '@/features/plot-engine';
import type {
  IPlotRepository,
  PlotHoleQueryOptions,
  PlotSuggestionQueryOptions,
  AnalysisCacheConfig,
} from '@/lib/repositories/interfaces/IPlotRepository';

import { PlotRepositoryBulk } from './PlotRepository.bulk';
import { PlotRepositoryCore } from './PlotRepository.core';
import { PlotRepositoryQueries } from './PlotRepository.queries';

/**
 * Plot Repository Implementation
 * Manages plot data access with type-safe operations
 * Delegates to specialized classes for core, query, and bulk operations
 */
export class PlotRepository implements IPlotRepository {
  private core: PlotRepositoryCore;
  private queries: PlotRepositoryQueries;
  private bulk: PlotRepositoryBulk;

  constructor() {
    this.core = new PlotRepositoryCore();
    this.queries = new PlotRepositoryQueries();
    this.bulk = new PlotRepositoryBulk();
  }

  // ==================== Plot Structures ====================
  async savePlotStructure(structure: PlotStructure): Promise<void> {
    return this.core.savePlotStructure(structure);
  }

  async getPlotStructure(id: string) {
    return this.core.getPlotStructure(id);
  }

  async getPlotStructuresByProject(projectId: string) {
    return this.core.getPlotStructuresByProject(projectId);
  }

  async deletePlotStructure(id: string): Promise<void> {
    return this.core.deletePlotStructure(id);
  }

  // ==================== Plot Holes ====================
  async savePlotHoles(projectId: string, holes: PlotHole[]): Promise<void> {
    return this.queries.savePlotHoles(projectId, holes);
  }

  async getPlotHolesByProject(projectId: string, options?: PlotHoleQueryOptions) {
    return this.queries.getPlotHolesByProject(projectId, options);
  }

  async getPlotHolesBySeverity(projectId: string, severity: PlotHole['severity']) {
    return this.queries.getPlotHolesBySeverity(projectId, severity);
  }

  async getPlotHolesByType(projectId: string, type: PlotHole['type']) {
    return this.queries.getPlotHolesByType(projectId, type);
  }

  async getPlotHolesByChapters(projectId: string, chapterIds: string[]) {
    return this.queries.getPlotHolesByChapters(projectId, chapterIds);
  }

  async getPlotHolesByCharacters(projectId: string, characterIds: string[]) {
    return this.queries.getPlotHolesByCharacters(projectId, characterIds);
  }

  // ==================== Character Graphs ====================
  async saveCharacterGraph(graph: CharacterGraph): Promise<void> {
    return this.core.saveCharacterGraph(graph);
  }

  async getCharacterGraphByProject(projectId: string) {
    return this.core.getCharacterGraphByProject(projectId);
  }

  async deleteCharacterGraph(projectId: string): Promise<void> {
    return this.core.deleteCharacterGraph(projectId);
  }

  // ==================== Analysis Results (Cached) ====================
  async saveAnalysisResult<T>(
    projectId: string,
    analysisType: string,
    resultData: T,
    config?: AnalysisCacheConfig,
  ): Promise<void> {
    return this.core.saveAnalysisResult(projectId, analysisType, resultData, config);
  }

  async getAnalysisResult<T>(projectId: string, analysisType: string) {
    return this.core.getAnalysisResult<T>(projectId, analysisType);
  }

  async saveStoryArc(
    projectId: string,
    storyArc: StoryArc,
    config?: AnalysisCacheConfig,
  ): Promise<void> {
    return this.core.saveStoryArc(projectId, storyArc, config);
  }

  async getStoryArc(projectId: string) {
    return this.core.getStoryArc(projectId);
  }

  async cleanupExpiredAnalysis(): Promise<number> {
    return this.core.cleanupExpiredAnalysis();
  }

  // ==================== Plot Suggestions ====================
  async savePlotSuggestions(projectId: string, suggestions: PlotSuggestion[]): Promise<void> {
    return this.queries.savePlotSuggestions(projectId, suggestions);
  }

  async getPlotSuggestionsByProject(projectId: string, options?: PlotSuggestionQueryOptions) {
    return this.queries.getPlotSuggestionsByProject(projectId, options);
  }

  async getPlotSuggestionsByType(projectId: string, type: PlotSuggestion['type']) {
    return this.queries.getPlotSuggestionsByType(projectId, type);
  }

  async getPlotSuggestionsByImpact(projectId: string, impact: PlotSuggestion['impact']) {
    return this.queries.getPlotSuggestionsByImpact(projectId, impact);
  }

  async getPlotSuggestionsByCharacters(projectId: string, characterIds: string[]) {
    return this.queries.getPlotSuggestionsByCharacters(projectId, characterIds);
  }

  // ==================== Bulk Operations ====================
  async deleteProjectData(projectId: string): Promise<void> {
    return this.bulk.deleteProjectData(projectId);
  }

  async exportProjectData(projectId: string) {
    return this.bulk.exportProjectData(projectId, this.core);
  }

  async importProjectData(
    projectId: string,
    data: {
      plotStructures: PlotStructure[];
      plotHoles: PlotHole[];
      characterGraph?: CharacterGraph;
      plotSuggestions: PlotSuggestion[];
    },
  ): Promise<void> {
    return this.bulk.importProjectData(projectId, data);
  }
}
