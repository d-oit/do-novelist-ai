/**
 * Context Extractor Service
 * Extracts and formats project context for AI prompt injection
 * Part of RAG Phase 1 implementation
 */

import { logger } from '@/lib/logging/logger';
import { ChapterStatus, type Project } from '@/types';

import { contextCache } from './contextCache';

export interface ProjectContext {
  project: {
    title: string;
    idea: string;
    style: string;
    summary: string;
  };
  characters: Array<{
    name: string;
    description: string;
    role: string;
  }>;
  worldBuilding: Array<{
    name: string;
    description: string;
    type: 'location' | 'rule' | 'culture' | 'technology';
  }>;
  timeline: Array<{
    event: string;
    chapter: number;
    importance: 'high' | 'medium' | 'low';
  }>;
  chapters: Array<{
    orderIndex: number;
    title: string;
    summary: string;
    status: string;
    wordCount: number;
  }>;
  metadata: {
    totalChapters: number;
    completedChapters: number;
    totalWords: number;
    extractedAt: string;
  };
}

export interface ContextExtractionOptions {
  includeCharacters?: boolean;
  includeWorldBuilding?: boolean;
  includeTimeline?: boolean;
  includeChapters?: boolean;
  maxTokens?: number;
  prioritizeRecent?: boolean;
}

const DEFAULT_OPTIONS: Required<ContextExtractionOptions> = {
  includeCharacters: true,
  includeWorldBuilding: true,
  includeTimeline: true,
  includeChapters: true,
  maxTokens: 8000, // Conservative limit for context injection
  prioritizeRecent: true,
};

/**
 * Extract comprehensive project context for AI prompt injection
 */
export async function extractProjectContext(
  project: Project,
  options: ContextExtractionOptions = {},
): Promise<ProjectContext> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  logger.info('Extracting project context', {
    component: 'ContextExtractor',
    projectId: project.id,
    options: opts,
  });

  // Check cache first
  const cachedContext = contextCache.get(project.id, project);
  if (cachedContext) {
    logger.info('Using cached project context', {
      component: 'ContextExtractor',
      projectId: project.id,
    });
    return cachedContext;
  }

  try {
    const context: ProjectContext = {
      project: {
        title: project.title || 'Untitled Project',
        idea: project.idea || '',
        style: project.style || 'General Fiction',
        summary: generateProjectSummary(project),
      },
      characters: opts.includeCharacters ? extractCharacters(project) : [],
      worldBuilding: opts.includeWorldBuilding ? extractWorldBuilding(project) : [],
      timeline: opts.includeTimeline ? extractTimeline(project) : [],
      chapters: opts.includeChapters ? extractChapters(project, opts.prioritizeRecent) : [],
      metadata: {
        totalChapters: project.chapters.length,
        completedChapters: project.chapters.filter(c => c.status === ChapterStatus.COMPLETE).length,
        totalWords: project.chapters.reduce((sum, c) => sum + (c.wordCount || 0), 0),
        extractedAt: new Date().toISOString(),
      },
    };

    // Validate token count and trim if necessary
    const estimatedTokens = estimateContextTokens(context);
    if (estimatedTokens > opts.maxTokens) {
      logger.warn('Context exceeds token limit, trimming', {
        component: 'ContextExtractor',
        estimatedTokens,
        maxTokens: opts.maxTokens,
      });
      const trimmedContext = trimContextToTokenLimit(context, opts.maxTokens);

      // Cache the trimmed context
      contextCache.set(project.id, project, trimmedContext);
      return trimmedContext;
    }

    logger.info('Context extraction complete', {
      component: 'ContextExtractor',
      estimatedTokens,
      charactersCount: context.characters.length,
      worldBuildingCount: context.worldBuilding.length,
      chaptersCount: context.chapters.length,
    });

    // Cache the context
    contextCache.set(project.id, project, context);
    return context;
  } catch (error) {
    logger.error('Context extraction failed', {
      component: 'ContextExtractor',
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Generate a concise project summary
 */
function generateProjectSummary(project: Project): string {
  const completedChapters = project.chapters.filter(
    c => c.status === ChapterStatus.COMPLETE,
  ).length;
  const totalWords = project.chapters.reduce((sum, c) => sum + (c.wordCount || 0), 0);

  return `${project.style} story with ${project.chapters.length} planned chapters (${completedChapters} completed). Current word count: ${totalWords.toLocaleString()}.`;
}

/**
 * Extract character information from project
 */
function extractCharacters(project: Project): ProjectContext['characters'] {
  // For now, extract from project idea/notes
  // In future, this would pull from dedicated character database
  const characters: ProjectContext['characters'] = [];

  // Parse characters from project idea using simple pattern matching
  const characterMatches = project.idea.match(
    /(?:CHARACTER|CHARACTERS?)[\s\S]*?(?=\n\n|\n---|\n#|$)/gi,
  );

  if (characterMatches) {
    characterMatches.forEach(match => {
      const lines = match.split('\n').filter(line => line.trim());
      lines.forEach(line => {
        // Look for character patterns like "Name: Description" or "**Name**: Description"
        const charMatch = line.match(/(?:\*\*)?([A-Z][a-zA-Z\s]+?)(?:\*\*)?:\s*(.+)/);
        if (charMatch && charMatch[1] && charMatch[2]) {
          characters.push({
            name: charMatch[1].trim(),
            description: charMatch[2].trim(),
            role: 'character', // Default role
          });
        }
      });
    });
  }

  return characters.slice(0, 10); // Limit to top 10 characters
}

/**
 * Extract world-building information from project
 */
function extractWorldBuilding(project: Project): ProjectContext['worldBuilding'] {
  const worldBuilding: ProjectContext['worldBuilding'] = [];

  // Parse world-building from project idea
  const worldMatches = project.idea.match(
    /(?:WORLD|SETTING|LOCATION)[\s\S]*?(?=\n\n|\n---|\n#|$)/gi,
  );

  if (worldMatches) {
    worldMatches.forEach(match => {
      const lines = match.split('\n').filter(line => line.trim());
      lines.forEach(line => {
        const worldMatch = line.match(/(?:\*\*)?([A-Z][a-zA-Z\s]+?)(?:\*\*)?:\s*(.+)/);
        if (worldMatch && worldMatch[1] && worldMatch[2]) {
          worldBuilding.push({
            name: worldMatch[1].trim(),
            description: worldMatch[2].trim(),
            type: 'location', // Default type
          });
        }
      });
    });
  }

  return worldBuilding.slice(0, 8); // Limit to top 8 world elements
}

/**
 * Extract timeline events from chapters
 */
function extractTimeline(project: Project): ProjectContext['timeline'] {
  return project.chapters
    .filter(c => c.summary && c.summary.length > 10)
    .map(c => ({
      event: c.summary,
      chapter: c.orderIndex,
      importance: c.status === ChapterStatus.COMPLETE ? ('high' as const) : ('medium' as const),
    }))
    .slice(0, 15); // Limit to 15 timeline events
}

/**
 * Extract chapter information
 */
function extractChapters(project: Project, prioritizeRecent: boolean): ProjectContext['chapters'] {
  const chapters = project.chapters.map(c => ({
    orderIndex: c.orderIndex,
    title: c.title,
    summary: c.summary || '',
    status: c.status,
    wordCount: c.wordCount || 0,
  }));

  if (prioritizeRecent) {
    // Sort by completion status and recent updates
    chapters.sort((a, b) => {
      if (a.status === ChapterStatus.COMPLETE && b.status !== ChapterStatus.COMPLETE) return -1;
      if (b.status === ChapterStatus.COMPLETE && a.status !== ChapterStatus.COMPLETE) return 1;
      return b.orderIndex - a.orderIndex; // Recent chapters first
    });
  }

  return chapters.slice(0, 20); // Limit to 20 chapters
}

/**
 * Estimate token count for context (rough approximation)
 */
function estimateContextTokens(context: ProjectContext): number {
  const text = JSON.stringify(context);
  // Rough approximation: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

/**
 * Trim context to fit within token limit
 */
function trimContextToTokenLimit(context: ProjectContext, maxTokens: number): ProjectContext {
  const trimmed = { ...context };

  // Priority order for trimming: timeline -> worldBuilding -> characters -> chapters
  while (estimateContextTokens(trimmed) > maxTokens) {
    if (trimmed.timeline.length > 5) {
      trimmed.timeline = trimmed.timeline.slice(0, -1);
    } else if (trimmed.worldBuilding.length > 3) {
      trimmed.worldBuilding = trimmed.worldBuilding.slice(0, -1);
    } else if (trimmed.characters.length > 3) {
      trimmed.characters = trimmed.characters.slice(0, -1);
    } else if (trimmed.chapters.length > 5) {
      trimmed.chapters = trimmed.chapters.slice(0, -1);
    } else {
      // If still too large, truncate project idea
      if (trimmed.project.idea.length > 500) {
        trimmed.project.idea = trimmed.project.idea.substring(0, 500) + '...';
      }
      break;
    }
  }

  return trimmed;
}

/**
 * Format context for AI prompt injection
 */
export function formatContextForPrompt(context: ProjectContext): string {
  const sections: string[] = [];

  // Project overview
  sections.push(`# Project: ${context.project.title}`);
  sections.push(`Genre: ${context.project.style}`);
  sections.push(`Summary: ${context.project.summary}`);

  if (context.project.idea) {
    sections.push(`\n## Story Concept\n${context.project.idea.substring(0, 1000)}`);
  }

  // Characters
  if (context.characters.length > 0) {
    sections.push('\n## Characters');
    context.characters.forEach(char => {
      sections.push(`- **${char.name}**: ${char.description}`);
    });
  }

  // World building
  if (context.worldBuilding.length > 0) {
    sections.push('\n## World & Setting');
    context.worldBuilding.forEach(world => {
      sections.push(`- **${world.name}**: ${world.description}`);
    });
  }

  // Timeline/Chapters
  if (context.chapters.length > 0) {
    sections.push('\n## Story Progress');
    context.chapters.slice(0, 10).forEach(chapter => {
      const status = chapter.status === 'complete' ? '✓' : '○';
      sections.push(`${status} Ch.${chapter.orderIndex}: ${chapter.title} - ${chapter.summary}`);
    });
  }

  // Metadata
  sections.push(
    `\n## Progress: ${context.metadata.completedChapters}/${context.metadata.totalChapters} chapters, ${context.metadata.totalWords.toLocaleString()} words`,
  );

  return sections.join('\n');
}
