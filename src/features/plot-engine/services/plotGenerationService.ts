/**
 * Plot Generation Service
 *
 * AI-powered plot generation and suggestion engine
 */

import type {
  PlotGenerationRequest,
  PlotGenerationResult,
  PlotStructure,
  PlotAct,
  PlotPoint,
  PlotPointType,
  PlotSuggestion,
  PlotSuggestionType,
  StoryStructure,
} from '@/features/plot-engine';
import { searchService } from '@/features/semantic-search';
import type { AIProvider } from '@/lib/ai-config';
import { getAIConfig, getModelForTask } from '@/lib/ai-config';
import { generateText } from '@/lib/api-gateway';
import { logger } from '@/lib/logging/logger';

const config = getAIConfig();

const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 100;
const BACKOFF_MULTIPLIER = 2;

interface RetryableError extends Error {
  retryable?: boolean;
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const errorMsg = error.message.toLowerCase();
    if (
      errorMsg.includes('timeout') ||
      errorMsg.includes('network') ||
      errorMsg.includes('fetch')
    ) {
      return true;
    }
    if (
      errorMsg.includes('rate limit') ||
      errorMsg.includes('429') ||
      errorMsg.includes('too many')
    ) {
      return true;
    }
    if (errorMsg.includes('500') || errorMsg.includes('502') || errorMsg.includes('503')) {
      return true;
    }
  }
  const retryableError = error as RetryableError;
  return retryableError?.retryable === true;
}

async function withRetry<T>(
  operation: () => Promise<T>,
  context: string,
  maxRetries: number = MAX_RETRIES,
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries && isRetryableError(error)) {
        const delay = INITIAL_DELAY_MS * Math.pow(BACKOFF_MULTIPLIER, attempt - 1);
        logger.warn(`Retrying operation (attempt ${attempt}/${maxRetries})`, {
          context,
          delay,
          error: lastError.message,
        });
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        logger.error(`Operation failed after ${attempt} attempts`, {
          context,
          error: lastError,
          retryable: isRetryableError(error),
        });
        throw lastError;
      }
    }
  }

  throw lastError || new Error('Unknown error occurred');
}

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

  private formatContextForPrompt(context: ProjectContext): string {
    const sections: string[] = [];

    if (context.projectMetadata.length > 0) {
      sections.push('PROJECT CONTEXT:\n' + context.projectMetadata.join('\n\n'));
    }

    if (context.characters.length > 0) {
      sections.push('EXISTING CHARACTERS:\n' + context.characters.join('\n\n'));
    }

    if (context.worldBuilding.length > 0) {
      sections.push('WORLD BUILDING ELEMENTS:\n' + context.worldBuilding.join('\n\n'));
    }

    if (context.chapters.length > 0) {
      sections.push('EXISTING CHAPTER CONTENT:\n' + context.chapters.slice(0, 3).join('\n\n'));
    }

    return sections.join('\n\n---\n\n');
  }

  private selectModel(
    request: PlotGenerationRequest,
    taskType: 'plot_structure' | 'suggestions' | 'alternatives',
  ): string {
    const complexity = this.calculateComplexity(request, taskType);

    const modelName = getModelForTask(this.provider, complexity, config);

    logger.debug('Model selection', {
      provider: this.provider,
      complexity,
      taskType,
      model: modelName,
      structure: request.structure,
      targetLength: request.targetLength,
    });

    return modelName;
  }

  private calculateComplexity(
    request: PlotGenerationRequest,
    taskType: 'plot_structure' | 'suggestions' | 'alternatives',
  ): 'fast' | 'standard' | 'advanced' {
    let complexityScore = 0;

    if (taskType === 'suggestions') {
      complexityScore = 0;
    } else if (taskType === 'alternatives') {
      complexityScore = 1;
    } else {
      complexityScore = 1;
      if (request.structure === 'hero-journey') {
        complexityScore += 3;
      } else if (request.structure === '5-act' || request.structure === 'kishotenketsu') {
        complexityScore += 1;
      } else if (request.structure === 'custom') {
        complexityScore += 3;
      }

      if (request.targetLength && request.targetLength >= 40) {
        complexityScore += 2;
      } else if (request.targetLength && request.targetLength >= 30) {
        complexityScore += 1;
      }

      const characterCount = request.characters?.length || 0;
      if (characterCount >= 3) {
        complexityScore += 1;
      } else if (characterCount >= 5) {
        complexityScore += 2;
      }

      const plotPointCount = request.plotPoints?.length || 0;
      if (plotPointCount >= 5) {
        complexityScore += 1;
      }

      if (request.themes && request.themes.length >= 2) {
        complexityScore += 1;
      }
    }

    if (complexityScore >= 3) {
      return 'advanced';
    } else if (complexityScore >= 1) {
      return 'standard';
    } else {
      return 'fast';
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

    const prompt = this.buildPlotPrompt(request, structure, context);
    const systemPrompt = this.buildSystemPrompt(structure, context);
    const model = this.selectModel(request, 'plot_structure');

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

      const plotData = this.parsePlotResponse(response.data.text, request);
      const acts = plotData.acts;

      return {
        id: `plot-${Date.now()}`,
        projectId: request.projectId,
        acts,
        climax: this.identifyClimax(acts),
        resolution: this.identifyResolution(acts),
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

  private identifyClimax(acts: PlotAct[]): PlotPoint | undefined {
    for (const act of acts) {
      const climax = act.plotPoints.find(pp => pp.type === 'climax');
      if (climax) return climax;
    }
    return undefined;
  }

  private identifyResolution(acts: PlotAct[]): PlotPoint | undefined {
    for (const act of acts) {
      const resolution = act.plotPoints.find(pp => pp.type === 'resolution');
      if (resolution) return resolution;
    }
    return undefined;
  }

  private async generateAlternatives(
    request: PlotGenerationRequest,
    _mainStructure: StoryStructure,
  ): Promise<PlotStructure[]> {
    const alternatives: PlotStructure[] = [];

    if (_mainStructure === '3-act') {
      const altRequest = { ...request, structure: '5-act' as StoryStructure };
      const altStructure = await this.createPlotStructure(altRequest, '5-act');
      alternatives.push(altStructure);
    } else if (_mainStructure === '5-act') {
      const altRequest = { ...request, structure: 'hero-journey' as StoryStructure };
      const altStructure = await this.createPlotStructure(altRequest, 'hero-journey');
      alternatives.push(altStructure);
    }

    return alternatives;
  }

  private buildSystemPrompt(structure: StoryStructure, context?: ProjectContext): string {
    const structureInstructions: Record<StoryStructure, string> = {
      '3-act': 'Use a 3-act structure: Setup (Act 1), Confrontation (Act 2), Resolution (Act 3)',
      '5-act':
        'Use a 5-act structure: Exposition, Rising Action, Climax, Falling Action, Denouement',
      'hero-journey':
        "Use the Hero's Journey structure: Departure, Initiation, Return with specific stages",
      kishotenketsu:
        'Use the Kishōtenketsu structure: Introduction, Development, Twist, Conclusion',
      custom: 'Use a custom narrative structure that best fits the story',
    };

    let contextSection = '';
    if (context) {
      const formattedContext = this.formatContextForPrompt(context);
      if (formattedContext) {
        contextSection = `\n\n---\n\nIMPORTANT CONTEXT FROM THE PROJECT:\n\n${formattedContext}\n\nUse this context to ensure continuity with existing story elements, characters, and world-building.`;
      }
    }

    return `You are an expert narrative architect specializing in plot structure design. Your task is to create detailed, compelling plot structures for stories.${contextSection}

Key Guidelines:
- Create acts with 3-5 significant plot points each
- Each plot point should be specific, actionable, and story-driving
- Include major plot points: inciting incident, rising action, midpoint, climax, resolution
- Ensure pacing builds tension effectively
- Make plot points character-driven and thematically relevant
- Provide brief but evocative descriptions (1-2 sentences each)

${structureInstructions[structure]}

Response Format:
Return a JSON object with this structure:
{
  "acts": [
    {
      "actNumber": 1,
      "name": "Act Name",
      "description": "Brief act description",
      "plotPoints": [
        {
          "type": "plot_point_type",
          "title": "Plot Point Title",
          "description": "Description of what happens",
          "importance": "major or minor",
          "position": 0-100
        }
      ]
    }
  ]
}`;
  }

  private buildPlotPrompt(
    request: PlotGenerationRequest,
    structure: StoryStructure,
    context?: ProjectContext,
  ): string {
    const charactersText = request.characters?.length
      ? `Characters to include: ${request.characters.join(', ')}`
      : 'Create appropriate characters for this story';

    const themesText = request.themes?.length
      ? `Themes to explore: ${request.themes.join(', ')}`
      : '';

    const toneText = request.tone ? `Story tone: ${request.tone}` : '';

    const existingPointsText = request.plotPoints?.length
      ? `Existing plot points to incorporate: ${request.plotPoints.join('; ')}`
      : '';

    let ragContextText = '';
    if (context) {
      const formattedContext = this.formatContextForPrompt(context);
      if (formattedContext) {
        ragContextText = `\n\n${formattedContext}`;
      }
    }

    return `Generate a ${structure} plot structure for the following story:

Premise: ${request.premise}
Genre: ${request.genre}
Target Length: ${request.targetLength || 20} chapters

${charactersText}
${themesText}
${toneText}
${existingPointsText}${ragContextText}

Please create a detailed plot structure with acts and significant plot points that tell a compelling story with this premise. Focus on creating dramatic tension, character development, and satisfying narrative arcs.`;
  }

  private parsePlotResponse(response: string, request: PlotGenerationRequest): { acts: PlotAct[] } {
    try {
      let jsonText = response.trim();

      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }

      const parsed = JSON.parse(jsonText) as { acts?: unknown[] };

      if (!parsed.acts || !Array.isArray(parsed.acts)) {
        throw new Error('Invalid response format: missing acts array');
      }

      const targetLength = request.targetLength || 20;
      const actCount = parsed.acts?.length || 3;

      const acts: PlotAct[] = parsed.acts.map((act: unknown, index: number) => {
        const actData = act as Record<string, unknown>;
        const plotPointsData = actData.plotPoints as unknown[];
        const actNum = ((actData.actNumber as number) || index + 1) as 1 | 2 | 3 | 4 | 5;
        const baseDuration = Math.floor(targetLength / actCount);

        return {
          id: `act-${index + 1}`,
          actNumber: actNum,
          name: String(actData.name || `Act ${index + 1}`),
          description: actData.description as string | undefined,
          plotPoints: (Array.isArray(plotPointsData) ? plotPointsData : []).map(
            (pp: unknown, ppIndex: number) => {
              const point = pp as Record<string, unknown>;
              return {
                id: `pp-${index + 1}-${ppIndex + 1}`,
                type: (point.type as PlotPointType) || 'rising_action',
                title: String(point.title || 'Plot Point'),
                description: String(point.description || ''),
                characterIds: request.characters || [],
                importance: (point.importance as 'major' | 'minor') || 'major',
                position: (point.position as number) || (index + 1) * 25,
              };
            },
          ),
          chapters: [],
          duration: baseDuration,
        };
      });

      const totalBaseDuration = acts.reduce((sum, act) => sum + (act.duration || 0), 0);
      if (totalBaseDuration < targetLength && acts.length > 0) {
        acts[acts.length - 1]!.duration! += targetLength - totalBaseDuration;
      }

      if (acts.length === 0) {
        throw new Error('No acts generated');
      }

      logger.info('Successfully parsed plot response', {
        projectId: request.projectId,
        actCount: acts.length,
        totalPlotPoints: acts.reduce((sum, act) => sum + act.plotPoints.length, 0),
      });

      return { acts };
    } catch (error) {
      logger.error('Failed to parse AI response', {
        projectId: request.projectId,
        error: error instanceof Error ? error.message : String(error),
        responsePreview: response.substring(0, 500),
      });
      throw new Error(
        `Failed to parse plot structure: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async generateSuggestions(request: PlotGenerationRequest): Promise<PlotSuggestion[]> {
    const context = await this.retrieveProjectContext(
      request.projectId,
      `${request.genre} ${request.premise.substring(0, 50)}`,
    );

    let contextSection = '';
    if (context) {
      const formattedContext = this.formatContextForPrompt(context);
      if (formattedContext) {
        contextSection = `\n\n---\n\nEXISTING STORY ELEMENTS:\n\n${formattedContext}`;
      }
    }

    const existingCharactersText =
      context.characters.length > 0
        ? `\n\nExisting Characters:\n${context.characters.map(c => `- ${c}`).join('\n')}`
        : '\n\nNote: This is a new project with no existing characters yet.';

    const prompt = `Based on this story premise and existing story elements, generate 3-5 plot suggestions that would enhance the story:

Premise: ${request.premise}
Genre: ${request.genre}
Target Length: ${request.targetLength || 20} chapters${existingCharactersText}${contextSection}

Suggestion types to consider:
- Plot twists that surprise the reader
- Character arcs that show growth for specific existing characters
- Subplots that enrich the main story using existing characters
- Conflict escalation opportunities between established characters
- Theme development ideas based on existing story themes
- Resolution paths that provide satisfying conclusions

Guidelines for context-aware suggestions:
- If existing characters are available, suggest how they can be developed further
- Reference specific character traits, relationships, or motivations from the context
- Build upon established plot points and themes
- Ensure suggestions maintain continuity with the existing story
- For new projects, focus on foundational suggestions that establish key elements

For each suggestion, provide:
- Type: plot_twist, character_arc, subplot, conflict_escalation, resolution_path, or theme_development
- Title: Brief, catchy name
- Description: What the suggestion involves
- Placement: early, middle, late, or anywhere in the story
- Impact: low, medium, or high
- relatedCharacters (optional): Array of existing character names this suggestion involves
- prerequisites (optional): Any required setup before this suggestion can be implemented

Return as JSON array.`;

    const systemPrompt =
      'You are an expert story editor providing actionable plot suggestions. Be creative but practical. When existing story elements are available, create suggestions that build upon them and maintain story continuity.';
    const model = this.selectModel(request, 'suggestions');

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
        return this.getDefaultSuggestions(request, context);
      }

      let jsonText = response.data.text.trim();
      const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }

      const parsed = JSON.parse(jsonText) as unknown[];

      if (!Array.isArray(parsed)) {
        return this.getDefaultSuggestions(request, context);
      }

      return parsed.map((suggestion: unknown, index: number) => {
        const sug = suggestion as Record<string, unknown>;
        return {
          id: `sug-${index + 1}`,
          type: (sug.type as PlotSuggestionType) || 'plot_twist',
          title: String(sug.title || 'Suggestion'),
          description: String(sug.description || ''),
          placement: (sug.placement as 'early' | 'middle' | 'late' | 'anywhere') || 'anywhere',
          impact: (sug.impact as 'low' | 'medium' | 'high') || 'medium',
          relatedCharacters: sug.relatedCharacters as string[] | undefined,
          prerequisites: sug.prerequisites as string[] | undefined,
        };
      });
    } catch (error) {
      logger.warn('Failed to parse suggestions or all retries exhausted, using defaults', {
        projectId: request.projectId,
        error: error instanceof Error ? error.message : String(error),
      });
      return this.getDefaultSuggestions(request, context);
    }
  }

  private getDefaultSuggestions(
    request: PlotGenerationRequest,
    context?: ProjectContext,
  ): PlotSuggestion[] {
    const suggestions: PlotSuggestion[] = [];

    const hasExistingCharacters = context && context.characters.length > 0;
    const characterNames = hasExistingCharacters
      ? context.characters.map(c => this.extractCharacterName(c))
      : request.characters || [];

    if (request.genre.toLowerCase().includes('romance')) {
      if (hasExistingCharacters && characterNames.length >= 2) {
        suggestions.push({
          id: 'sug-romance',
          type: 'subplot',
          title: `Develop relationship between ${characterNames[0]} and ${characterNames[1]}`,
          description: `Create a romantic subplot that develops the relationship between ${characterNames[0]} and ${characterNames[1]}, adding emotional depth and stakes to the story`,
          placement: 'early',
          impact: 'medium',
          relatedCharacters: [characterNames[0]!, characterNames[1]!],
        });
      } else {
        suggestions.push({
          id: 'sug-romance',
          type: 'subplot',
          title: 'Introduce Romantic Element',
          description: 'Develop a romantic relationship between key characters',
          placement: 'early',
          impact: 'medium',
          relatedCharacters: request.characters?.slice(0, 2),
        });
      }
    }

    if (hasExistingCharacters) {
      suggestions.push({
        id: 'sug-character-conflict',
        type: 'conflict_escalation',
        title: `Escalate ${characterNames[0]}'s internal struggle`,
        description: `Intensify ${characterNames[0]}'s internal conflict by forcing them to make difficult choices that test their beliefs and motivations`,
        placement: 'middle',
        impact: 'high',
        relatedCharacters: [characterNames[0]!],
      });

      if (characterNames.length >= 2) {
        suggestions.push({
          id: 'sug-character-relationship',
          type: 'subplot',
          title: `Explore ${characterNames[0]}'s relationship with ${characterNames[1]}`,
          description: `Deepen the relationship between ${characterNames[0]} and ${characterNames[1]} through shared challenges, revealing new layers of their personalities`,
          placement: 'middle',
          impact: 'medium',
          relatedCharacters: [characterNames[0]!, characterNames[1]!],
        });
      }
    } else {
      suggestions.push({
        id: 'sug-twist',
        type: 'plot_twist',
        title: 'Major Revelation',
        description: 'Reveal hidden truth that changes everything',
        placement: 'middle',
        impact: 'high',
      });

      suggestions.push({
        id: 'sug-arc',
        type: 'character_arc',
        title: 'Character Growth',
        description: 'Show protagonist overcoming a personal flaw',
        placement: 'anywhere',
        impact: 'medium',
        relatedCharacters: request.characters?.slice(0, 1),
      });
    }

    if (context && context.projectMetadata.length > 0) {
      suggestions.push({
        id: 'sug-theme-development',
        type: 'theme_development',
        title: 'Deepen story themes',
        description: `Further explore themes through character choices and plot developments that connect with the project's established foundation`,
        placement: 'anywhere',
        impact: 'medium',
        prerequisites: ['Establish character motivations'],
      });
    }

    return suggestions;
  }

  private extractCharacterName(characterContext: string): string {
    const nameMatch = characterContext.match(/^([A-Z][a-zA-Z]+)/);
    if (nameMatch && nameMatch[1]) {
      return nameMatch[1];
    }
    const firstLine = characterContext.split('\n')[0];
    if (firstLine) {
      const words = firstLine.split(' ').slice(0, 2).join(' ');
      return words || 'Character';
    }
    return 'Character';
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
    const acts: PlotAct[] = this.createTemplateActs(structure, targetLength);

    return {
      id: `plot-${Date.now()}`,
      projectId: request.projectId,
      acts,
      climax: this.identifyClimax(acts),
      resolution: this.identifyResolution(acts),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private createTemplateActs(structure: StoryStructure, targetLength: number): PlotAct[] {
    switch (structure) {
      case '3-act':
        return [
          {
            id: 'act-1',
            actNumber: 1,
            name: 'Setup',
            description: 'Introduction of characters and conflict',
            plotPoints: [
              {
                id: 'pp-1-1',
                type: 'inciting_incident',
                title: 'Inciting Incident',
                description: 'Event that sets the story in motion',
                importance: 'major',
                position: 5,
                characterIds: [],
              },
              {
                id: 'pp-1-2',
                type: 'rising_action',
                title: 'First Plot Point',
                description: 'Story leaves the ordinary world',
                importance: 'major',
                position: 20,
                characterIds: [],
              },
            ],
            chapters: [],
            duration: Math.ceil(targetLength * 0.2),
          },
          {
            id: 'act-2',
            actNumber: 2,
            name: 'Confrontation',
            description: 'Rising action and complications',
            plotPoints: [
              {
                id: 'pp-2-1',
                type: 'midpoint',
                title: 'Midpoint',
                description: 'Turning point that raises stakes',
                importance: 'major',
                position: 50,
                characterIds: [],
              },
              {
                id: 'pp-2-2',
                type: 'rising_action',
                title: 'All Is Lost',
                description: 'Lowest point for the protagonist',
                importance: 'major',
                position: 75,
                characterIds: [],
              },
            ],
            chapters: [],
            duration: Math.ceil(targetLength * 0.6),
          },
          {
            id: 'act-3',
            actNumber: 3,
            name: 'Resolution',
            description: 'Climax and conclusion',
            plotPoints: [
              {
                id: 'pp-3-1',
                type: 'climax',
                title: 'Climax',
                description: 'Final confrontation and resolution',
                importance: 'major',
                position: 90,
                characterIds: [],
              },
              {
                id: 'pp-3-2',
                type: 'resolution',
                title: 'Resolution',
                description: 'New normal after the conflict',
                importance: 'major',
                position: 100,
                characterIds: [],
              },
            ],
            chapters: [],
            duration: Math.ceil(targetLength * 0.2),
          },
        ];

      case '5-act':
        return [
          {
            id: 'act-1',
            actNumber: 1,
            name: 'Exposition',
            description: 'Setup and inciting incident',
            plotPoints: [
              {
                id: 'pp-1-1',
                type: 'inciting_incident',
                title: 'Inciting Incident',
                description: 'Event that starts the story',
                importance: 'major',
                position: 10,
                characterIds: [],
              },
            ],
            chapters: [],
            duration: Math.ceil(targetLength * 0.1),
          },
          {
            id: 'act-2',
            actNumber: 2,
            name: 'Rising Action',
            description: 'Conflict development',
            plotPoints: [
              {
                id: 'pp-2-1',
                type: 'rising_action',
                title: 'Rising Action Begins',
                description: 'First major obstacle',
                importance: 'major',
                position: 25,
                characterIds: [],
              },
            ],
            chapters: [],
            duration: Math.ceil(targetLength * 0.2),
          },
          {
            id: 'act-3',
            actNumber: 3,
            name: 'Climax',
            description: 'Peak tension and confrontation',
            plotPoints: [
              {
                id: 'pp-3-1',
                type: 'climax',
                title: 'Climax',
                description: 'Main conflict resolution',
                importance: 'major',
                position: 50,
                characterIds: [],
              },
            ],
            chapters: [],
            duration: Math.ceil(targetLength * 0.2),
          },
          {
            id: 'act-4',
            actNumber: 4,
            name: 'Falling Action',
            description: 'Aftermath of climax',
            plotPoints: [
              {
                id: 'pp-4-1',
                type: 'falling_action',
                title: 'Falling Action',
                description: 'Dealing with consequences',
                importance: 'major',
                position: 75,
                characterIds: [],
              },
            ],
            chapters: [],
            duration: Math.ceil(targetLength * 0.2),
          },
          {
            id: 'act-5',
            actNumber: 5,
            name: 'Denouement',
            description: 'Final resolution',
            plotPoints: [
              {
                id: 'pp-5-1',
                type: 'resolution',
                title: 'Resolution',
                description: 'Story conclusion',
                importance: 'major',
                position: 100,
                characterIds: [],
              },
            ],
            chapters: [],
            duration: Math.ceil(targetLength * 0.3),
          },
        ];

      case 'hero-journey':
        return [
          {
            id: 'act-1',
            actNumber: 1,
            name: 'Departure',
            description: 'Call to adventure',
            plotPoints: [
              {
                id: 'pp-1-1',
                type: 'inciting_incident',
                title: 'Call to Adventure',
                description: 'Hero receives a challenge',
                importance: 'major',
                position: 10,
                characterIds: [],
              },
              {
                id: 'pp-1-2',
                type: 'turning_point',
                title: 'Crossing the Threshold',
                description: 'Hero leaves ordinary world',
                importance: 'major',
                position: 20,
                characterIds: [],
              },
            ],
            chapters: [],
            duration: Math.ceil(targetLength * 0.25),
          },
          {
            id: 'act-2',
            actNumber: 2,
            name: 'Initiation',
            description: 'Trials and transformation',
            plotPoints: [
              {
                id: 'pp-2-1',
                type: 'rising_action',
                title: 'Tests and Allies',
                description: 'Hero faces challenges',
                importance: 'major',
                position: 40,
                characterIds: [],
              },
              {
                id: 'pp-2-2',
                type: 'climax',
                title: 'Ordeal',
                description: 'Greatest challenge near death',
                importance: 'major',
                position: 60,
                characterIds: [],
              },
              {
                id: 'pp-2-3',
                type: 'rising_action',
                title: 'Reward',
                description: 'Hero achieves the goal',
                importance: 'major',
                position: 70,
                characterIds: [],
              },
            ],
            chapters: [],
            duration: Math.ceil(targetLength * 0.5),
          },
          {
            id: 'act-3',
            actNumber: 3,
            name: 'Return',
            description: 'Coming back changed',
            plotPoints: [
              {
                id: 'pp-3-1',
                type: 'rising_action',
                title: 'The Road Back',
                description: 'Returning to ordinary world',
                importance: 'major',
                position: 80,
                characterIds: [],
              },
              {
                id: 'pp-3-2',
                type: 'resolution',
                title: 'Return with Elixir',
                description: 'Hero brings back wisdom',
                importance: 'major',
                position: 100,
                characterIds: [],
              },
            ],
            chapters: [],
            duration: Math.ceil(targetLength * 0.25),
          },
        ];

      case 'kishotenketsu':
        return [
          {
            id: 'act-1',
            actNumber: 1,
            name: 'Introduction',
            description: 'Establishing context',
            plotPoints: [
              {
                id: 'pp-1-1',
                type: 'turning_point',
                title: 'Introduction',
                description: 'Scene setting and character introduction',
                importance: 'major',
                position: 10,
                characterIds: [],
              },
            ],
            chapters: [],
            duration: Math.ceil(targetLength * 0.25),
          },
          {
            id: 'act-2',
            actNumber: 2,
            name: 'Development',
            description: 'Building tension',
            plotPoints: [
              {
                id: 'pp-2-1',
                type: 'rising_action',
                title: 'Development',
                description: 'Expanding on the situation',
                importance: 'major',
                position: 35,
                characterIds: [],
              },
            ],
            chapters: [],
            duration: Math.ceil(targetLength * 0.25),
          },
          {
            id: 'act-3',
            actNumber: 3,
            name: 'Twist',
            description: 'Unexpected turn',
            plotPoints: [
              {
                id: 'pp-3-1',
                type: 'climax',
                title: 'Twist',
                description: 'Surprising revelation or turn',
                importance: 'major',
                position: 60,
                characterIds: [],
              },
            ],
            chapters: [],
            duration: Math.ceil(targetLength * 0.25),
          },
          {
            id: 'act-4',
            actNumber: 4,
            name: 'Conclusion',
            description: 'Resolution and harmony',
            plotPoints: [
              {
                id: 'pp-4-1',
                type: 'resolution',
                title: 'Conclusion',
                description: 'Bringing elements together',
                importance: 'major',
                position: 100,
                characterIds: [],
              },
            ],
            chapters: [],
            duration: Math.ceil(targetLength * 0.25),
          },
        ];

      default:
        return this.createTemplateActs('3-act', targetLength);
    }
  }
}

export const plotGenerationService = new PlotGenerationService();
