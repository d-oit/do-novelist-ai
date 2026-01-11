import type { StoryStructure } from '@/features/plot-engine';

interface ProjectContext {
  characters: string[];
  worldBuilding: string[];
  projectMetadata: string[];
  chapters: string[];
  themes: string[];
}

export function formatContextForPrompt(context: ProjectContext): string {
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

export function buildSystemPrompt(structure: StoryStructure, context?: ProjectContext): string {
  const structureInstructions: Record<StoryStructure, string> = {
    '3-act': 'Use a 3-act structure: Setup (Act 1), Confrontation (Act 2), Resolution (Act 3)',
    '5-act': 'Use a 5-act structure: Exposition, Rising Action, Climax, Falling Action, Denouement',
    'hero-journey':
      "Use Hero's Journey structure: Departure, Initiation, Return with specific stages",
    kishotenketsu: 'Use Kishōtenketsu structure: Introduction, Development, Twist, Conclusion',
    custom: 'Use a custom narrative structure that best fits story',
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
  request: {
    premise: string;
    genre: string;
    targetLength?: number;
    characters?: string[];
    themes?: string[];
    tone?: string;
    plotPoints?: string[];
  },
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

  return `Generate a ${structure} plot structure for following story:

Premise: ${request.premise}
Genre: ${request.genre}
Target Length: ${request.targetLength || 20} chapters

${charactersText}
${themesText}
${toneText}
${existingPointsText}${ragContextText}

Please create a detailed plot structure with acts and significant plot points that tell a compelling story with this premise. Focus on creating dramatic tension, character development, and satisfying narrative arcs.`;
}

export function buildSuggestionsPrompt(
  request: {
    premise: string;
    genre: string;
    targetLength?: number;
    characters?: string[];
  },
  context: ProjectContext,
): string {
  const existingCharactersText =
    context.characters.length > 0
      ? `\n\nExisting Characters:\n${context.characters.map(c => `- ${c}`).join('\n')}`
      : '\n\nNote: This is a new project with no existing characters yet.';

  const formattedContext = formatContextForPrompt(context);

  return `Based on this story premise and existing story elements, generate 3-5 plot suggestions that would enhance story:

Premise: ${request.premise}
Genre: ${request.genre}
Target Length: ${request.targetLength || 20} chapters${existingCharactersText}

EXISTING STORY ELEMENTS:\n\n${formattedContext}

Suggestion types to consider:
- Plot twists that surprise reader
- Character arcs that show growth for specific existing characters
- Subplots that enrich main story using existing characters
- Conflict escalation opportunities between established characters
- Theme development ideas based on existing story themes
- Resolution paths that provide satisfying conclusions

Guidelines for context-aware suggestions:
- If existing characters are available, suggest how they can be developed further
- Reference specific character traits, relationships, or motivations from context
- Build upon established plot points and themes
- Ensure suggestions maintain continuity with existing story
- For new projects, focus on foundational suggestions that establish key elements

For each suggestion, provide:
- Type: plot_twist, character_arc, subplot, conflict_escalation, resolution_path, or theme_development
- Title: Brief, catchy name
- Description: What suggestion involves
- Placement: early, middle, late, or anywhere in story
- Impact: low, medium, or high
- relatedCharacters (optional): Array of existing character names this suggestion involves
- prerequisites (optional): Any required setup before this suggestion can be implemented

Return as JSON array.`;
}

export const SUGGESTIONS_SYSTEM_PROMPT =
  'You are an expert story editor providing actionable plot suggestions. Be creative but practical. When existing story elements are available, create suggestions that build upon them and maintain story continuity.';

export { type ProjectContext };
