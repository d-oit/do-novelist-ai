/**
 * Context Formatter
 * Formats extracted context into AI-ready prompts
 */

import { logger } from '@/lib/logging/logger';

import { estimateTokens } from './token-utils';
import type { ProjectContext, ContextInjectionResult } from './types';
import { ContextType, ContextPriority } from './types';

/**
 * Format context into a system prompt section
 */
export function formatContextForPrompt(
  context: ProjectContext,
  maxTokens: number = 50000,
): ContextInjectionResult {
  const startTime = Date.now();

  logger.debug('Formatting context for prompt', {
    component: 'ContextFormatter',
    projectId: context.projectId,
    totalChunks: context.chunks.length,
    maxTokens,
  });

  const sections: string[] = [];
  let tokenCount = 0;
  let chunksIncluded = 0;
  let truncated = false;

  // Group chunks by type for better organization
  const chunksByType = new Map<ContextType, typeof context.chunks>();

  for (const chunk of context.chunks) {
    if (!chunksByType.has(chunk.type)) {
      chunksByType.set(chunk.type, []);
    }
    chunksByType.get(chunk.type)!.push(chunk);
  }

  // Add header
  const header =
    '# PROJECT CONTEXT\n\nThe following information provides context about the project. Use this to maintain consistency and accuracy in your responses.\n';
  sections.push(header);
  tokenCount += estimateTokens(header);

  // Process chunks in priority order, grouped by type
  const typeOrder = [
    ContextType.PROJECT_METADATA,
    ContextType.CHARACTERS,
    ContextType.CHAPTERS,
    ContextType.WORLD_BUILDING,
    ContextType.TIMELINE,
    ContextType.THEMES,
  ];

  for (const type of typeOrder) {
    const chunks = chunksByType.get(type);
    if (!chunks || chunks.length === 0) continue;

    // Add type section header
    const typeHeader = `\n## ${formatTypeName(type)}\n`;
    const typeHeaderTokens = estimateTokens(typeHeader);

    if (tokenCount + typeHeaderTokens > maxTokens) {
      truncated = true;
      break;
    }

    sections.push(typeHeader);
    tokenCount += typeHeaderTokens;

    // Add chunks of this type
    for (const chunk of chunks) {
      if (tokenCount + chunk.tokens > maxTokens) {
        // Only truncate non-critical chunks
        if (chunk.priority !== ContextPriority.CRITICAL) {
          truncated = true;
          break;
        }
      }

      sections.push(chunk.content + '\n');
      tokenCount += chunk.tokens;
      chunksIncluded++;
    }
  }

  // Add footer with instructions
  const footer =
    '\n---\n\n**Instructions**: Reference the above context when generating content. Ensure character names, locations, plot points, and world rules remain consistent with the provided information.\n';
  const footerTokens = estimateTokens(footer);

  if (tokenCount + footerTokens <= maxTokens) {
    sections.push(footer);
    tokenCount += footerTokens;
  }

  const systemPrompt = sections.join('');
  const duration = Date.now() - startTime;

  logger.info('Context formatting complete', {
    component: 'ContextFormatter',
    projectId: context.projectId,
    chunksIncluded,
    totalChunks: context.chunks.length,
    contextTokens: tokenCount,
    truncated,
    duration,
  });

  return {
    systemPrompt,
    contextTokens: tokenCount,
    chunksIncluded,
    truncated,
  };
}

/**
 * Format context type name for display
 */
function formatTypeName(type: ContextType): string {
  switch (type) {
    case ContextType.PROJECT_METADATA:
      return 'Project Information';
    case ContextType.CHARACTERS:
      return 'Characters';
    case ContextType.WORLD_BUILDING:
      return 'World Building';
    case ContextType.TIMELINE:
      return 'Timeline';
    case ContextType.CHAPTERS:
      return 'Chapter Summaries';
    case ContextType.THEMES:
      return 'Themes & Motifs';
    default:
      return String(type);
  }
}

/**
 * Create a compact context summary
 * For displaying to users or logging
 */
export function createContextSummary(context: ProjectContext): string {
  const typeCount = new Map<ContextType, number>();

  for (const chunk of context.chunks) {
    typeCount.set(chunk.type, (typeCount.get(chunk.type) || 0) + 1);
  }

  const parts: string[] = [];

  for (const [type, count] of typeCount.entries()) {
    parts.push(`${formatTypeName(type)}: ${count}`);
  }

  return `Context includes ${context.chunks.length} chunks (${context.totalTokens} tokens): ${parts.join(', ')}`;
}

/**
 * Format a minimal context for fast operations
 * Only includes critical information
 */
export function formatMinimalContext(context: ProjectContext): ContextInjectionResult {
  const criticalChunks = context.chunks.filter(
    chunk => chunk.priority === ContextPriority.CRITICAL,
  );

  const minimalContext: ProjectContext = {
    ...context,
    chunks: criticalChunks,
    totalTokens: criticalChunks.reduce((sum, chunk) => sum + chunk.tokens, 0),
  };

  return formatContextForPrompt(minimalContext, 10000); // Stricter limit for minimal
}
