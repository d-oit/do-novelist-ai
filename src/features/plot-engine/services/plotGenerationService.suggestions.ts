import type { PlotSuggestion } from '@/features/plot-engine';

interface ProjectContext {
  characters: string[];
  worldBuilding: string[];
  projectMetadata: string[];
  chapters: string[];
  themes: string[];
}

export function getDefaultSuggestions(
  request: { genre: string; characters?: string[] },
  context?: ProjectContext,
): PlotSuggestion[] {
  const suggestions: PlotSuggestion[] = [];

  const hasExistingCharacters = context && context.characters.length > 0;
  const characterNames = hasExistingCharacters
    ? context.characters.map(c => extractCharacterName(c))
    : request.characters || [];

  if (request.genre.toLowerCase().includes('romance')) {
    if (hasExistingCharacters && characterNames.length >= 2) {
      suggestions.push({
        id: 'sug-romance',
        type: 'subplot',
        title: `Develop relationship between ${characterNames[0]} and ${characterNames[1]}`,
        description: `Create a romantic subplot that develops relationship between ${characterNames[0]} and ${characterNames[1]}, adding emotional depth and stakes to story`,
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
        description: `Deepen relationship between ${characterNames[0]} and ${characterNames[1]} through shared challenges, revealing new layers of their personalities`,
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
      description: `Further explore themes through character choices and plot developments that connect with project's established foundation`,
      placement: 'anywhere',
      impact: 'medium',
      prerequisites: ['Establish character motivations'],
    });
  }

  return suggestions;
}

export function extractCharacterName(characterContext: string): string {
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

export { type ProjectContext };
