/**
 * Prompt Builder
 *
 * Constructs system and user prompts for AI plot generation
 */

import type { PlotGenerationRequest, StoryStructure } from '@/features/plot-engine';

import { formatContextForPrompt, type ProjectContext } from './context-retrieval';

export function buildSystemPrompt(structure: StoryStructure, context?: ProjectContext): string {
  const structureInstructions: Record<StoryStructure, string> = {
    '3-act': 'Use a 3-act structure: Setup (Act 1), Confrontation (Act 2), Resolution (Act 3)',
    '5-act': 'Use a 5-act structure: Exposition, Rising Action, Climax, Falling Action, Denouement',
    'hero-journey':
      "Use the Hero's Journey structure: Departure, Initiation, Return with specific stages",
    kishotenketsu: 'Use the Kishōtenketsu structure: Introduction, Development, Twist, Conclusion',
    custom: 'Use a custom narrative structure that best fits the story',
  };

  let contextSection = '';
  if (context) {
    const formattedContext = formatContextForPrompt(context);
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

export function buildPlotPrompt(
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
    const formattedContext = formatContextForPrompt(context);
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
