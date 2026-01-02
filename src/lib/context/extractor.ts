/**
 * Context Extractor
 * Extracts relevant context from project data for AI prompts
 */

import type { Character } from '@/features/characters/types';
import type { Location, Culture } from '@/features/world-building/types';
import { logger } from '@/lib/logging/logger';
import type { Project, Chapter } from '@/shared/types';

import { estimateTokens } from './token-utils';
import {
  ContextType,
  ContextPriority,
  type ContextChunk,
  type ProjectContext,
  type ContextExtractionOptions,
  type OperationContext,
} from './types';

const DEFAULT_MAX_TOKENS = 50000;
const CONTEXT_VERSION = '1.0.0';

/**
 * Extract project metadata context
 */
function extractProjectMetadata(project: Project): ContextChunk {
  const content = `# Project: ${project.title}

**Genre**: ${project.style}
**Target Audience**: ${project.targetAudience}
**Synopsis**: ${project.synopsis || 'Not provided'}
**Total Chapters**: ${project.chapters.length}
**Target Word Count**: ${project.targetWordCount}
${project.contentWarnings.length > 0 ? `\n**Content Warnings**: ${project.contentWarnings.join(', ')}` : ''}
${project.keywords.length > 0 ? `\n**Keywords**: ${project.keywords.join(', ')}` : ''}`;

  return {
    type: ContextType.PROJECT_METADATA,
    priority: ContextPriority.CRITICAL,
    content,
    tokens: estimateTokens(content),
    metadata: {
      id: project.id,
      name: project.title,
    },
  };
}

/**
 * Extract character context
 */
function extractCharacters(characters: Character[]): ContextChunk[] {
  if (characters.length === 0) return [];

  return characters.map(char => {
    const content = `## Character: ${char.name}

**Role**: ${char.role}
**Arc**: ${char.arc}
**Age**: ${char.age || 'Unknown'}
**Gender**: ${char.gender || 'Not specified'}
**Occupation**: ${char.occupation || 'Not specified'}
**Motivation**: ${char.motivation}
**Goal**: ${char.goal}
**Conflict**: ${char.conflict}
${char.backstory ? `**Backstory**: ${char.backstory}` : ''}
${char.traits.length > 0 ? `**Traits**: ${char.traits.map(t => t.name).join(', ')}` : ''}
${char.summary ? `**Summary**: ${char.summary}` : ''}`;

    // Determine priority based on role
    let priority = ContextPriority.MEDIUM;
    if (char.role === 'protagonist' || char.role === 'antagonist') {
      priority = ContextPriority.CRITICAL;
    } else if (char.role === 'supporting' || char.role === 'mentor') {
      priority = ContextPriority.HIGH;
    }

    return {
      type: ContextType.CHARACTERS,
      priority,
      content,
      tokens: estimateTokens(content),
      metadata: {
        id: char.id,
        name: char.name,
      },
    };
  });
}

/**
 * Extract world-building context
 */
function extractWorldBuilding(locations: Location[], cultures: Culture[]): ContextChunk[] {
  const chunks: ContextChunk[] = [];

  // Extract locations
  locations.forEach(location => {
    const content = `### Location: ${location.name}

**Type**: ${location.type}
**Description**: ${location.description}
${location.geography ? `**Geography**: ${location.geography}` : ''}
${location.climate ? `**Climate**: ${location.climate}` : ''}
${location.population ? `**Population**: ${location.population}` : ''}
${location.government ? `**Government**: ${location.government}` : ''}
${location.primaryIndustries && location.primaryIndustries.length > 0 ? `**Industries**: ${location.primaryIndustries.join(', ')}` : ''}`;

    chunks.push({
      type: ContextType.WORLD_BUILDING,
      priority: ContextPriority.MEDIUM,
      content,
      tokens: estimateTokens(content),
      metadata: {
        id: location.id,
        name: location.name,
      },
    });
  });

  // Extract cultures
  cultures.forEach(culture => {
    const content = `### Culture: ${culture.name}

**Type**: ${culture.type}
**Description**: ${culture.description}
${culture.values.length > 0 ? `**Values**: ${culture.values.join(', ')}` : ''}
${culture.traditions && culture.traditions.length > 0 ? `**Traditions**: ${culture.traditions.join(', ')}` : ''}
${culture.beliefs ? `**Beliefs**: ${culture.beliefs}` : ''}
${culture.socialStructure ? `**Social Structure**: ${culture.socialStructure}` : ''}
${culture.language ? `**Language**: ${culture.language}` : ''}`;

    chunks.push({
      type: ContextType.WORLD_BUILDING,
      priority: ContextPriority.MEDIUM,
      content,
      tokens: estimateTokens(content),
      metadata: {
        id: culture.id,
        name: culture.name,
      },
    });
  });

  return chunks;
}

/**
 * Extract chapter context
 */
function extractChapters(chapters: Chapter[], currentChapterId?: string): ContextChunk[] {
  if (chapters.length === 0) return [];

  return chapters.map(chapter => {
    const isCurrent = chapter.id === currentChapterId;
    const content = `${isCurrent ? '## CURRENT CHAPTER' : '## Chapter'} ${chapter.orderIndex}: ${chapter.title}

**Summary**: ${chapter.summary}
**Status**: ${chapter.status}
**Word Count**: ${chapter.wordCount}
${chapter.plotPoints?.length ? `**Plot Points**: ${chapter.plotPoints.join('; ')}` : ''}
${chapter.characters?.length ? `**Characters**: ${chapter.characters.join(', ')}` : ''}
${chapter.locations?.length ? `**Locations**: ${chapter.locations.join(', ')}` : ''}
${chapter.notes ? `**Notes**: ${chapter.notes}` : ''}`;

    // Determine priority
    let priority = ContextPriority.LOW;
    if (isCurrent) {
      priority = ContextPriority.CRITICAL;
    } else if (currentChapterId) {
      const currentIndex = chapters.findIndex(c => c.id === currentChapterId);
      const chapterIndex = chapters.findIndex(c => c.id === chapter.id);
      const distance = Math.abs(currentIndex - chapterIndex);

      if (distance === 1) {
        priority = ContextPriority.HIGH; // Adjacent chapters
      } else if (distance <= 3) {
        priority = ContextPriority.MEDIUM; // Near chapters
      }
    }

    return {
      type: ContextType.CHAPTERS,
      priority,
      content,
      tokens: estimateTokens(content),
      metadata: {
        id: chapter.id,
        name: chapter.title,
      },
    };
  });
}

/**
 * Extract timeline context
 */
function extractTimeline(project: Project): ContextChunk | null {
  if (!project.timeline || project.timeline.events.length === 0) {
    return null;
  }

  const majorEvents = project.timeline.events
    .filter(e => e.importance === 'major')
    .sort((a, b) => a.chronologicalIndex - b.chronologicalIndex)
    .slice(0, 10); // Limit to 10 major events

  if (majorEvents.length === 0) return null;

  const content = `# Timeline

${majorEvents.map(event => `- **${event.title}** (${event.date || 'Unknown date'}): ${event.description}`).join('\n')}`;

  return {
    type: ContextType.TIMELINE,
    priority: ContextPriority.MEDIUM,
    content,
    tokens: estimateTokens(content),
    metadata: {
      id: project.timeline.id,
      name: 'Project Timeline',
    },
  };
}

/**
 * Main context extraction function
 */
export function extractProjectContext(
  operationContext: OperationContext,
  options: ContextExtractionOptions = {},
): ProjectContext {
  const startTime = Date.now();
  const {
    maxTokens = DEFAULT_MAX_TOKENS,
    includeTypes,
    currentChapterId,
    priorityThreshold = ContextPriority.LOW,
  } = options;

  const { project, characters = [], locations = [], cultures = [] } = operationContext;

  logger.info('Extracting project context', {
    component: 'ContextExtractor',
    projectId: project.id,
    maxTokens,
    currentChapterId,
  });

  const allChunks: ContextChunk[] = [];

  // Extract each type of context
  const shouldInclude = (type: ContextType) => !includeTypes || includeTypes.includes(type);

  if (shouldInclude(ContextType.PROJECT_METADATA)) {
    allChunks.push(extractProjectMetadata(project));
  }

  if (shouldInclude(ContextType.CHARACTERS)) {
    allChunks.push(...extractCharacters(characters));
  }

  if (shouldInclude(ContextType.WORLD_BUILDING)) {
    allChunks.push(...extractWorldBuilding(locations, cultures));
  }

  if (shouldInclude(ContextType.CHAPTERS)) {
    allChunks.push(...extractChapters(project.chapters, currentChapterId));
  }

  if (shouldInclude(ContextType.TIMELINE)) {
    const timelineChunk = extractTimeline(project);
    if (timelineChunk) allChunks.push(timelineChunk);
  }

  // Sort by priority (critical first)
  const priorityOrder = [
    ContextPriority.CRITICAL,
    ContextPriority.HIGH,
    ContextPriority.MEDIUM,
    ContextPriority.LOW,
  ];

  allChunks.sort((a, b) => {
    return priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority);
  });

  // Filter by priority threshold and fit within token limit
  const selectedChunks: ContextChunk[] = [];
  let totalTokens = 0;

  for (const chunk of allChunks) {
    // Skip if below priority threshold
    if (priorityOrder.indexOf(chunk.priority) > priorityOrder.indexOf(priorityThreshold)) {
      continue;
    }

    // Check if adding this chunk would exceed limit
    if (totalTokens + chunk.tokens > maxTokens) {
      // If it's critical, we must include it (might exceed limit slightly)
      if (chunk.priority === ContextPriority.CRITICAL) {
        selectedChunks.push(chunk);
        totalTokens += chunk.tokens;
      }
      break;
    }

    selectedChunks.push(chunk);
    totalTokens += chunk.tokens;
  }

  const duration = Date.now() - startTime;

  logger.info('Context extraction complete', {
    component: 'ContextExtractor',
    projectId: project.id,
    totalChunks: allChunks.length,
    selectedChunks: selectedChunks.length,
    totalTokens,
    duration,
  });

  return {
    projectId: project.id,
    chunks: selectedChunks,
    totalTokens,
    extractedAt: new Date(),
    version: CONTEXT_VERSION,
  };
}
