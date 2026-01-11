/**
 * Plot Generation Service
 *
 * AI-powered plot generation and suggestion engine
 */

import type {
  PlotGenerationRequest,
  PlotGenerationResult,
  PlotStructure,
  PlotSuggestion,
  StoryStructure,
} from '@/features/plot-engine';
import { searchService } from '@/features/semantic-search';
import type { AIProvider } from '@/lib/ai-config';
import { generateText } from '@/lib/api-gateway';
import { logger } from '@/lib/logging/logger';

import {
  parsePlotResponse,
  parseSuggestionsResponse,
  identifyClimax,
  identifyResolution,
} from './plotGenerationService.parsers';
import {
  buildPlotPrompt,
  buildSuggestionsPrompt,
  buildSystemPrompt,
  SUGGESTIONS_SYSTEM_PROMPT,
} from './plotGenerationService.prompts';
import { getDefaultSuggestions } from './plotGenerationService.suggestions';
import { createTemplateActs } from './plotGenerationService.templates';
import { calculateComplexity, selectModel, withRetry } from './plotGenerationService.utils';

interface ProjectContext {
  characters: string[];
  worldBuilding: string[];
  projectMetadata: string[];
  chapters: string[];
  themes: string[];
}

export class PlotGenerationService {
  private readonly provider: AIProvider = 'anthropic';

  private async retrieveProjectContext(
    projectId: string,
    queryText?: string,
  ): Promise<ProjectContext> {
    try {
      const context: ProjectContext = {
        characters: [],
        worldBuilding: [],
        projectMetadata: [],
        chapters: [],
        themes: [],
      };

      const searchQueries = queryText
        ? [queryText]
        : ['main characters', 'story themes', 'plot structure', 'world building', 'story elements'];

      const searchPromises = searchQueries.map(query =>
        searchService.search(query, projectId, { limit: 5, minScore: 0.5 }),
      );

      const results = await Promise.all(searchPromises);

      for (const searchResults of results) {
        for (const result of searchResults) {
          switch (result.entityType) {
            case 'character':
              if (!context.characters.includes(result.context)) {
                context.characters.push(result.context);
              }
              break;
            case 'world_building':
              if (!context.worldBuilding.includes(result.context)) {
                context.worldBuilding.push(result.context);
              }
              break;
            case 'project':
              if (!context.projectMetadata.includes(result.context)) {
                context.projectMetadata.push(result.context);
              }
              break;
            case 'chapter':
              if (!context.chapters.includes(result.context)) {
                context.chapters.push(result.context);
              }
              break;
          }
        }
      }

      logger.info('Retrieved project context from RAG', {
        projectId,
        charactersCount: context.characters.length,
        worldBuildingCount: context.worldBuilding.length,
        projectMetadataCount: context.projectMetadata.length,
        chaptersCount: context.chapters.length,
      });

      return context;
    } catch (error) {
      logger.warn('Failed to retrieve project context from RAG', {
        projectId,
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        characters: [],
        worldBuilding: [],
        projectMetadata: [],
        chapters: [],
        themes: [],
      };
    }
  }

  public async generatePlot(request: PlotGenerationRequest): Promise<PlotGenerationResult> {
    try {
      logger.info('Generating plot structure', { projectId: request.projectId });

      const structure = request.structure || '3-act';
      const plotStructure = await this.createPlotStructure(request, structure);
      const suggestions = await this.generateSuggestions(request);
      const alternatives = await this.generateAlternatives(request, structure);

      return {
        plotStructure,
        suggestions,
        alternatives,
        confidence: 0.85,
        generatedAt: new Date(),
      };
    } catch (error) {
      logger.error('Plot generation failed', { projectId: request.projectId, error });
      throw error;
    }
  }

  private async createPlotStructure(
    request: PlotGenerationRequest,
    structure: StoryStructure,
  ): Promise<PlotStructure> {
    const context = await this.retrieveProjectContext(
      request.projectId,
      `${request.genre} ${request.premise.substring(0, 50)}`,
    );

    const prompt = buildPlotPrompt(request, structure, context);
    const systemPrompt = buildSystemPrompt(structure, context);
    const model = selectModel(
      this.provider,
      calculateComplexity(request, 'plot_structure'),
      'plot_structure',
      structure,
      request.targetLength,
    );

    logger.info('Calling AI Gateway for plot generation', {
      projectId: request.projectId,
      structure,
      promptLength: prompt.length,
      model,
    });

    try {
      const response = await withRetry(
        async () =>
          generateText({
            provider: this.provider,
            model,
            prompt,
            system: systemPrompt,
            temperature: 0.8,
          }),
        `createPlotStructure-${request.projectId}`,
      );

      if (!response.success || !response.data) {
        logger.error('AI Gateway failed after retries', {
          projectId: request.projectId,
          error: response.error,
          details: response.details,
        });
        return this.generateTemplatePlot(request, structure);
      }

      const plotData = parsePlotResponse(response.data.text, request);
      const acts = plotData.acts;

      return {
        id: `plot-${Date.now()}`,
        projectId: request.projectId,
        acts,
        climax: identifyClimax(acts),
        resolution: identifyResolution(acts),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      logger.error('All retries exhausted, falling back to template', {
        projectId: request.projectId,
        error: error instanceof Error ? error.message : String(error),
      });
      return this.generateTemplatePlot(request, structure);
    }
  }

  private async generateAlternatives(
    request: PlotGenerationRequest,
    mainStructure: StoryStructure,
  ): Promise<PlotStructure[]> {
    const alternatives: PlotStructure[] = [];

    if (mainStructure === '3-act') {
      const altRequest = { ...request, structure: '5-act' as StoryStructure };
      const altStructure = await this.createPlotStructure(altRequest, '5-act');
      alternatives.push(altStructure);
    } else if (mainStructure === '5-act') {
      const altRequest = { ...request, structure: 'hero-journey' as StoryStructure };
      const altStructure = await this.createPlotStructure(altRequest, 'hero-journey');
      alternatives.push(altStructure);
    }

    return alternatives;
  }

  private async generateSuggestions(request: PlotGenerationRequest): Promise<PlotSuggestion[]> {
    const context = await this.retrieveProjectContext(
      request.projectId,
      `${request.genre} ${request.premise.substring(0, 50)}`,
    );

    const prompt = buildSuggestionsPrompt(request, context);
    const systemPrompt = SUGGESTIONS_SYSTEM_PROMPT;
    const model = selectModel(
      this.provider,
      calculateComplexity(request, 'suggestions'),
      'suggestions',
    );

    try {
      const response = await withRetry(
        async () =>
          generateText({
            provider: this.provider,
            model,
            prompt,
            system: systemPrompt,
            temperature: 0.9,
          }),
        `generateSuggestions-${request.projectId}`,
      );

      if (!response.success || !response.data) {
        logger.warn('Failed to generate suggestions after retries', {
          projectId: request.projectId,
          error: response.error,
        });
        return getDefaultSuggestions(
          { genre: request.genre, characters: request.characters },
          context,
        );
      }

      return parseSuggestionsResponse(response.data.text);
    } catch (error) {
      logger.warn('Failed to parse suggestions or all retries exhausted, using defaults', {
        projectId: request.projectId,
        error: error instanceof Error ? error.message : String(error),
      });
      return getDefaultSuggestions(
        { genre: request.genre, characters: request.characters },
        context,
      );
    }
  }

  private generateTemplatePlot(
    request: PlotGenerationRequest,
    structure: StoryStructure,
  ): PlotStructure {
    logger.info('Generating template-based plot structure', {
      projectId: request.projectId,
      structure,
    });

    const targetLength = request.targetLength || 20;
    const acts = createTemplateActs(structure, targetLength);

    return {
      id: `plot-${Date.now()}`,
      projectId: request.projectId,
      acts,
      climax: identifyClimax(acts),
      resolution: identifyResolution(acts),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

export const plotGenerationService = new PlotGenerationService();
