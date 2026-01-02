/**
 * Context Injector Service
 * Injects project context into AI prompts for context-aware generation
 * Part of RAG Phase 1 implementation
 */

import { logger } from '@/lib/logging/logger';
import type { Project } from '@/types';

import {
  extractProjectContext,
  formatContextForPrompt,
  type ProjectContext,
  type ContextExtractionOptions,
} from './contextExtractor';

export interface ContextInjectionOptions {
  includeContext?: boolean;
  contextOptions?: ContextExtractionOptions;
  maxContextTokens?: number;
  contextPlacement?: 'before' | 'after' | 'system';
}

export interface EnhancedPrompt {
  systemPrompt?: string;
  userPrompt: string;
  context?: ProjectContext;
  estimatedTokens: number;
}

const DEFAULT_INJECTION_OPTIONS: Required<ContextInjectionOptions> = {
  includeContext: true,
  contextOptions: {
    includeCharacters: true,
    includeWorldBuilding: true,
    includeTimeline: true,
    includeChapters: true,
    maxTokens: 6000,
    prioritizeRecent: true,
  },
  maxContextTokens: 6000,
  contextPlacement: 'system',
};

/**
 * Inject project context into AI prompts for context-aware generation
 */
export async function injectProjectContext(
  project: Project,
  originalPrompt: string,
  systemPrompt?: string,
  options: ContextInjectionOptions = {},
): Promise<EnhancedPrompt> {
  const opts = { ...DEFAULT_INJECTION_OPTIONS, ...options };

  logger.info('Injecting project context', {
    component: 'ContextInjector',
    projectId: project.id,
    includeContext: opts.includeContext,
    contextPlacement: opts.contextPlacement,
  });

  try {
    if (!opts.includeContext) {
      return {
        systemPrompt,
        userPrompt: originalPrompt,
        estimatedTokens: estimatePromptTokens(originalPrompt + (systemPrompt || '')),
      };
    }

    // Extract project context
    const context = await extractProjectContext(project, opts.contextOptions);
    const formattedContext = formatContextForPrompt(context);

    // Inject context based on placement preference
    let enhancedSystemPrompt = systemPrompt;
    let enhancedUserPrompt = originalPrompt;

    switch (opts.contextPlacement) {
      case 'system':
        enhancedSystemPrompt = buildSystemPromptWithContext(systemPrompt, formattedContext);
        break;
      case 'before':
        enhancedUserPrompt = `${formattedContext}\n\n---\n\n${originalPrompt}`;
        break;
      case 'after':
        enhancedUserPrompt = `${originalPrompt}\n\n---\n\n${formattedContext}`;
        break;
    }

    const estimatedTokens = estimatePromptTokens((enhancedSystemPrompt || '') + enhancedUserPrompt);

    // Validate token limits
    if (estimatedTokens > 15000) {
      // Conservative limit for most models
      logger.warn('Enhanced prompt exceeds recommended token limit', {
        component: 'ContextInjector',
        estimatedTokens,
        limit: 15000,
      });
    }

    logger.info('Context injection complete', {
      component: 'ContextInjector',
      estimatedTokens,
      contextTokens: estimatePromptTokens(formattedContext),
      originalTokens: estimatePromptTokens(originalPrompt),
    });

    return {
      systemPrompt: enhancedSystemPrompt,
      userPrompt: enhancedUserPrompt,
      context,
      estimatedTokens,
    };
  } catch (error) {
    logger.error('Context injection failed', {
      component: 'ContextInjector',
      error: error instanceof Error ? error.message : String(error),
    });

    // Fallback to original prompt on error
    return {
      systemPrompt,
      userPrompt: originalPrompt,
      estimatedTokens: estimatePromptTokens(originalPrompt + (systemPrompt || '')),
    };
  }
}

/**
 * Build system prompt with integrated context
 */
function buildSystemPromptWithContext(
  originalSystemPrompt: string | undefined,
  formattedContext: string,
): string {
  const contextSection = `# Project Context

You are working on a specific writing project. Use this context to ensure consistency and accuracy in your responses:

${formattedContext}

---

# Instructions

When generating content, please:
- Reference established characters, settings, and plot points from the context above
- Maintain consistency with the established tone and style
- Consider the current story progress and chapter structure
- Ensure new content fits naturally with existing material`;

  if (originalSystemPrompt) {
    return `${contextSection}\n\n# Additional Instructions\n\n${originalSystemPrompt}`;
  }

  return contextSection;
}

/**
 * Estimate token count for prompts (rough approximation)
 */
function estimatePromptTokens(text: string): number {
  // Rough approximation: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4);
}

/**
 * Create context-aware prompts for specific AI operations
 */
export class ContextAwarePrompts {
  constructor(private project: Project) {}

  /**
   * Generate context-aware outline prompt
   */
  async createOutlinePrompt(idea: string, style: string): Promise<EnhancedPrompt> {
    const systemPrompt = `You are an expert story architect specializing in ${style} fiction. Create a compelling chapter outline that follows genre conventions and narrative structure.`;

    const userPrompt = `Create a detailed chapter outline for this story concept:

${idea}

Please provide:
1. A compelling title
2. 8-12 chapters with titles and summaries
3. Clear story arc with proper pacing
4. Genre-appropriate elements for ${style}`;

    return injectProjectContext(this.project, userPrompt, systemPrompt, {
      contextOptions: {
        includeCharacters: true,
        includeWorldBuilding: true,
        includeTimeline: false, // Not relevant for initial outline
        includeChapters: false, // Not relevant for initial outline
        maxTokens: 3000,
      },
    });
  }

  /**
   * Generate context-aware chapter writing prompt
   */
  async createChapterPrompt(
    chapterTitle: string,
    chapterSummary: string,
    style: string,
    previousChapterSummary?: string,
  ): Promise<EnhancedPrompt> {
    const systemPrompt = `You are a skilled ${style} writer. Write engaging, well-paced chapter content that advances the story and develops characters naturally.`;

    let userPrompt = `Write the full content for this chapter:

Title: ${chapterTitle}
Summary: ${chapterSummary}
Style: ${style}`;

    if (previousChapterSummary) {
      userPrompt += `\n\nPrevious chapter context: ${previousChapterSummary}`;
    }

    userPrompt += `\n\nPlease write the complete chapter with:
- Engaging opening that connects to previous events
- Natural dialogue and character development
- Vivid descriptions and scene-setting
- Proper pacing and story progression
- Satisfying chapter conclusion`;

    return injectProjectContext(this.project, userPrompt, systemPrompt, {
      contextOptions: {
        includeCharacters: true,
        includeWorldBuilding: true,
        includeTimeline: true,
        includeChapters: true,
        maxTokens: 5000,
        prioritizeRecent: true,
      },
    });
  }

  /**
   * Generate context-aware character development prompt
   */
  async createCharacterPrompt(idea: string, style: string): Promise<EnhancedPrompt> {
    const systemPrompt = `You are an expert character developer specializing in ${style} fiction. Create compelling, three-dimensional characters that fit the story world.`;

    const userPrompt = `Develop a cast of characters for this story:

${idea}

Create 4-6 main characters with:
- Names and basic demographics
- Personality traits and motivations
- Character arcs and growth potential
- Relationships and conflicts
- Unique voices and mannerisms
- Roles in the story structure`;

    return injectProjectContext(this.project, userPrompt, systemPrompt, {
      contextOptions: {
        includeCharacters: false, // Don't include existing characters to avoid duplication
        includeWorldBuilding: true,
        includeTimeline: false,
        includeChapters: true,
        maxTokens: 4000,
      },
    });
  }

  /**
   * Generate context-aware consistency analysis prompt
   */
  async createConsistencyPrompt(
    chapters: Array<{
      orderIndex: number;
      title: string;
      summary: string;
    }>,
  ): Promise<EnhancedPrompt> {
    const systemPrompt = `You are an expert story editor specializing in narrative consistency and continuity. Analyze the story structure for potential issues.`;

    const chaptersText = chapters
      .map(c => `Chapter ${c.orderIndex}: ${c.title}\nSummary: ${c.summary}`)
      .join('\n\n');

    const userPrompt = `Analyze this story outline for consistency issues:

${chaptersText}

Please identify:
1. Plot holes or logical inconsistencies
2. Character development issues
3. Pacing problems
4. Timeline conflicts
5. Genre convention violations
6. Specific suggestions for improvement`;

    return injectProjectContext(this.project, userPrompt, systemPrompt, {
      contextOptions: {
        includeCharacters: true,
        includeWorldBuilding: true,
        includeTimeline: true,
        includeChapters: false, // Chapters are provided in the prompt
        maxTokens: 4000,
      },
    });
  }
}

/**
 * Utility function to create context-aware prompts for any operation
 */
export async function createContextAwarePrompt(
  project: Project,
  operation: string,
  originalPrompt: string,
  systemPrompt?: string,
  options?: ContextInjectionOptions,
): Promise<EnhancedPrompt> {
  logger.info('Creating context-aware prompt', {
    component: 'ContextInjector',
    operation,
    projectId: project.id,
  });

  return injectProjectContext(project, originalPrompt, systemPrompt, options);
}
