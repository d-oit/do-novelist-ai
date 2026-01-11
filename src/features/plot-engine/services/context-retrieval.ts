/**
 * Context Retrieval Service
 *
 * Retrieves and formats project context from RAG semantic search
 */

import { searchService } from '@/features/semantic-search';
import { logger } from '@/lib/logging/logger';

export interface ProjectContext {
  characters: string[];
  worldBuilding: string[];
  projectMetadata: string[];
  chapters: string[];
  themes: string[];
}

export async function retrieveProjectContext(
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
