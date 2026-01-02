/**
 * AI Integration with Context
 * Helper functions to inject context into AI operations
 */

import type { Character } from '@/features/characters/types';
import type { Location, Culture } from '@/features/world-building/types';
import { logger } from '@/lib/logging/logger';
import type { Project, Chapter } from '@/shared/types';

import { getOrExtractContext } from './cache';
import { extractProjectContext } from './extractor';
import { formatContextForPrompt } from './formatter';
import type { OperationContext, ContextExtractionOptions, ContextInjectionResult } from './types';

/**
 * Prepare context for AI generation
 * This is the main entry point for context injection
 */
export async function prepareContextForGeneration(
  project: Project,
  options: {
    characters?: Character[];
    locations?: Location[];
    cultures?: Culture[];
    currentChapterId?: string;
    maxContextTokens?: number;
  } = {},
): Promise<ContextInjectionResult> {
  const startTime = Date.now();

  logger.info('Preparing context for AI generation', {
    component: 'AIIntegration',
    projectId: project.id,
    currentChapterId: options.currentChapterId,
  });

  // Build operation context
  const operationContext: OperationContext = {
    project,
    characters: options.characters,
    locations: options.locations,
    cultures: options.cultures,
    currentChapter: options.currentChapterId
      ? project.chapters.find(c => c.id === options.currentChapterId)
      : undefined,
    relatedChapters: options.currentChapterId
      ? getRelatedChapters(project.chapters, options.currentChapterId)
      : undefined,
  };

  // Extract context (with caching)
  const extractionOptions: ContextExtractionOptions = {
    maxTokens: options.maxContextTokens || 50000,
    currentChapterId: options.currentChapterId,
  };

  const context = getOrExtractContext(operationContext, ctx =>
    extractProjectContext(ctx, extractionOptions),
  );

  // Format for AI prompt
  const result = formatContextForPrompt(context, options.maxContextTokens);

  const duration = Date.now() - startTime;

  logger.info('Context prepared for AI generation', {
    component: 'AIIntegration',
    projectId: project.id,
    contextTokens: result.contextTokens,
    chunksIncluded: result.chunksIncluded,
    truncated: result.truncated,
    duration,
  });

  return result;
}

/**
 * Get chapters related to the current one
 * Returns previous, current, and next chapters
 */
function getRelatedChapters(chapters: Chapter[], currentChapterId: string): Chapter[] {
  const currentIndex = chapters.findIndex(c => c.id === currentChapterId);
  if (currentIndex === -1) return [];

  const related: Chapter[] = [];

  // Previous chapter
  if (currentIndex > 0) {
    related.push(chapters[currentIndex - 1]!);
  }

  // Current chapter
  related.push(chapters[currentIndex]!);

  // Next chapter
  if (currentIndex < chapters.length - 1) {
    related.push(chapters[currentIndex + 1]!);
  }

  return related;
}

/**
 * Build enhanced system prompt with context
 */
export function buildEnhancedSystemPrompt(
  basePrompt: string,
  contextResult: ContextInjectionResult,
): string {
  // If no context or truncated heavily, just use base prompt
  if (contextResult.contextTokens === 0) {
    return basePrompt;
  }

  // Combine base prompt with context
  return `${contextResult.systemPrompt}

---

${basePrompt}`;
}

/**
 * Calculate remaining token budget for generation
 */
export function calculateGenerationBudget(
  modelMaxTokens: number,
  contextTokens: number,
  systemPromptTokens: number,
  userPromptTokens: number,
  reserveForOutput: number = 2000,
): number {
  const usedTokens = contextTokens + systemPromptTokens + userPromptTokens;
  const available = modelMaxTokens - usedTokens - reserveForOutput;

  return Math.max(0, available);
}

/**
 * Check if context injection should be used
 * Some operations may not benefit from full context
 */
export function shouldInjectContext(operation: string): boolean {
  const contextBeneficialOps = [
    'writeChapterContent',
    'continueWriting',
    'refineChapterContent',
    'analyzeConsistency',
    'developCharacters',
    'buildWorld',
    'enhancePlot',
  ];

  return contextBeneficialOps.includes(operation);
}

/**
 * Get context for quick operations (minimal context)
 */
export async function prepareMinimalContext(
  project: Project,
  currentChapterId?: string,
): Promise<ContextInjectionResult> {
  const operationContext: OperationContext = {
    project,
    currentChapter: currentChapterId
      ? project.chapters.find(c => c.id === currentChapterId)
      : undefined,
  };

  const context = extractProjectContext(operationContext, {
    maxTokens: 10000, // Strict limit
    currentChapterId,
  });

  return formatContextForPrompt(context, 10000);
}
