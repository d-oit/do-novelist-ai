/**
 * AI Service - Universal Multi-Provider Interface
 * Replaces gemini.ts with support for OpenAI, Anthropic, and Google
 * Uses Vercel AI SDK with Vercel AI Gateway for unified API across providers
 * Enhanced with comprehensive error handling (2024-2025 best practices)
 */

import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

import { Chapter, RefineOptions } from '../types/index';

import { getAIConfig, getEnabledProviders, getModelForTask, type AIProvider } from './ai-config';
import { withCache } from './cache';

// Import error handling system
import { logger } from './errors/logging';
import { createAIError, createConfigurationError } from './errors/error-types';

// Get configuration
const config = getAIConfig();
const enabledProviders = getEnabledProviders(config);

// Create logger for AI module
const aiLogger = logger.child({ module: 'ai-service' });

/**
 * Get the appropriate model instance based on provider
 * Uses Vercel AI Gateway for routing
 */
function getModel(
  provider: AIProvider,
  complexity: 'fast' | 'standard' | 'advanced' = 'standard'
): any {
  const modelName = getModelForTask(provider, complexity, config);
  const providerConfig = config.providers[provider];

  if (!providerConfig.enabled) {
    const error = createConfigurationError(`Provider ${provider} is not configured`, {
      configKey: `providers.${provider}.enabled`,
      configValue: providerConfig,
      context: {
        provider,
        modelName,
        gatewayPath: providerConfig.gatewayPath,
      },
    });

    aiLogger.error('Provider not configured', {
      provider,
      modelName,
      gatewayPath: providerConfig.gatewayPath,
    });

    throw error;
  }

  // Vercel AI Gateway base URL
  const gatewayUrl = `https://gateway.vercel.ai/v1/${providerConfig.gatewayPath}`;

  aiLogger.debug('Creating model instance', {
    provider,
    modelName,
    gatewayUrl,
    complexity,
  });

  switch (provider) {
    case 'openai': {
      const openaiClient = createOpenAI({
        apiKey: config.gatewayApiKey,
        baseURL: gatewayUrl,
      });
      return openaiClient(modelName);
    }

    case 'anthropic': {
      const anthropicClient = createAnthropic({
        apiKey: config.gatewayApiKey,
        baseURL: gatewayUrl,
      });
      return anthropicClient(modelName);
    }

    case 'google': {
      const googleClient = createGoogleGenerativeAI({
        apiKey: config.gatewayApiKey,
        baseURL: gatewayUrl,
      });
      return googleClient(modelName);
    }

    case 'mistral': {
      const error = createAIError(
        'Mistral SDK not installed. To enable Mistral, install @ai-sdk/mistral and uncomment the import.',
        {
          provider: 'mistral',
          model: modelName,
          operation: 'getModel',
          context: {
            complexity,
          },
        }
      );

      aiLogger.error('Mistral SDK not available', {
        provider,
        modelName,
        complexity,
      });

      throw error;
    }

    default: {
      const error = createAIError(`Unsupported provider: ${provider}`, {
        provider,
        model: modelName,
        operation: 'getModel',
        context: {
          complexity,
        },
      });

      aiLogger.error('Unsupported provider', {
        provider,
        modelName,
        complexity,
      });

      throw error;
    }
  }
}

/**
 * Execute AI generation with automatic fallback and analytics
 */
async function executeWithFallback<T>(
  operation: (provider: AIProvider) => Promise<T>,
  operationName: string
): Promise<T> {
  const providers = enabledProviders;

  if (providers.length === 0) {
    const error = createConfigurationError(
      'No AI providers configured. Please set at least one API key.',
      {
        configKey: 'providers',
        configValue: providers,
        context: {
          operationName,
          enabledProviders: providers.length,
        },
      }
    );

    aiLogger.error('No AI providers configured', {
      operationName,
      enabledProviders: providers.length,
    });

    throw error;
  }

  aiLogger.info('Starting operation with fallback', {
    operationName,
    providerCount: providers.length,
    providers: providers.join(', '),
    enableFallback: config.enableFallback,
  });

  let lastError: Error | null = null;

  for (const provider of providers) {
    try {
      aiLogger.debug(`Attempting ${operationName} with provider: ${provider}`);

      const result = await operation(provider);

      aiLogger.info(`Success with provider: ${provider}`, {
        operationName,
        provider,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Convert to AI error with context
      const aiError = createAIError(
        `Provider ${provider} failed for ${operationName}: ${errorMessage}`,
        {
          provider,
          operation: operationName,
          cause: error instanceof Error ? error : undefined,
          context: {
            errorMessage,
            attemptProvider: provider,
          },
        }
      );

      aiLogger.warn(`Provider ${provider} failed for ${operationName}`, {
        operationName,
        provider,
        error: errorMessage,
      });

      lastError = aiError;

      // If fallback is disabled or this is the last provider, throw immediately
      if (!config.enableFallback || provider === providers[providers.length - 1]) {
        break;
      }

      // Continue to next provider
      continue;
    }
  }

  aiLogger.error(`${operationName} failed with all providers`, {
    operationName,
    providers: providers.join(', '),
    lastError: lastError?.message,
  });

  throw lastError || new Error(`${operationName} failed with all providers`);
}

/**
 * Generate outline for a book idea
 */
const _generateOutline = async (
  idea: string,
  style: string
): Promise<{ title: string; chapters: Partial<Chapter>[] }> => {
  const operationLogger = aiLogger.child({ operation: 'generateOutline', ideaLength: idea.length });

  return executeWithFallback(async provider => {
    const model = getModel(provider, 'standard');

    const systemInstruction = `You are an expert Novel Architect.
Your goal is to take a vague book idea and structurize it into a compelling chapter outline.
The style of the book is: ${style}.
Adhere to the "Hero's Journey" or "Save the Cat" beat sheets if applicable to the genre.`;

    operationLogger.debug('Generating outline', {
      provider,
      style,
      ideaPreview: idea.substring(0, 100),
    });

    const response = await generateText({
      model,
      system: systemInstruction,
      prompt: `Create a title and a chapter outline for this idea: "${idea}"

Return a JSON object with this structure:
{
  "title": "Book Title",
  "chapters": [
    {
      "orderIndex": 1,
      "title": "Chapter Title",
      "summary": "Detailed paragraph summary of what happens in this chapter"
    }
  ]
}`,
      temperature: 0.7,
    });

    try {
      const parsed = JSON.parse(response.text);
      operationLogger.info('Outline generated successfully', {
        provider,
        title: parsed.title,
        chapterCount: parsed.chapters?.length || 0,
      });
      return parsed;
    } catch (parseError) {
      operationLogger.warn('JSON parsing failed, trying to extract from response', {
        provider,
        error: parseError instanceof Error ? parseError.message : String(parseError),
        responsePreview: response.text.substring(0, 200),
      });

      // If JSON parsing fails, try to extract JSON from the response
      const jsonMatch = /\{[\s\S]*\}/.exec(response.text);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          operationLogger.info('Successfully extracted JSON from response', {
            provider,
            title: parsed.title,
            chapterCount: parsed.chapters?.length || 0,
          });
          return parsed;
        } catch (secondParseError) {
          operationLogger.error('Failed to parse extracted JSON', {
            provider,
            error:
              secondParseError instanceof Error
                ? secondParseError.message
                : String(secondParseError),
          });
        }
      }

      const error = createAIError('Failed to parse outline response as JSON', {
        provider,
        operation: 'generateOutline',
        cause: parseError instanceof Error ? parseError : undefined,
        context: {
          responsePreview: response.text.substring(0, 500),
          idea: idea.substring(0, 100),
          style,
        },
      });

      throw error;
    }
  }, 'generateOutline');
};

export const generateOutline = withCache(_generateOutline, 'generateOutline');

/**
 * Write chapter content
 */
export const writeChapterContent = async (
  chapterTitle: string,
  chapterSummary: string,
  style: string,
  previousChapterSummary?: string
): Promise<string> => {
  return executeWithFallback(async provider => {
    const model = getModel(provider, 'standard');

    const prompt = `
Write the full content for the chapter: "${chapterTitle}".
Context / Summary: ${chapterSummary}
${previousChapterSummary ? `Previously: ${previousChapterSummary}` : ''}
Style: ${style}.
Write in Markdown. Focus on "Show, Don't Tell". Use sensory details.
Output only the chapter content.`;

    const response = await generateText({
      model,
      prompt,
      temperature: 0.7,
    });

    return response.text || '';
  }, 'writeChapterContent');
};

/**
 * Continue writing from current content
 */
export const continueWriting = async (
  currentContent: string,
  chapterSummary: string,
  style: string
): Promise<string> => {
  return executeWithFallback(async provider => {
    const model = getModel(provider, 'standard');
    const context = currentContent.slice(-3000);

    const prompt = `
You are a co-author. Continue the story.
Style: ${style}
Goal: ${chapterSummary}
Rules: Seamlessly continue narrative. Maintain tone. Write 300-500 words. Output ONLY new content.
Context: ...${context}`;

    const response = await generateText({
      model,
      prompt,
      temperature: 0.75,
    });

    return response.text || '';
  }, 'continueWriting');
};

/**
 * Refine chapter content
 */
export const refineChapterContent = async (
  content: string,
  chapterSummary: string,
  style: string,
  options: RefineOptions
): Promise<string> => {
  return executeWithFallback(async provider => {
    const complexity =
      options.model?.includes('pro') || options.model?.includes('advanced')
        ? 'advanced'
        : 'standard';
    const model = getModel(provider, complexity);

    const prompt = `
Refine the following chapter content.
Style: ${style}
Goal: ${chapterSummary}
Instructions: Improve flow, prose, and dialogue. Fix grammar. Maintain tone. Do NOT change plot.
Content: ${content}`;

    const response = await generateText({
      model,
      prompt,
      temperature: options.temperature,
    });

    return response.text || content;
  }, 'refineChapterContent');
};

/**
 * Analyze consistency across chapters
 */
export const analyzeConsistency = async (chapters: Chapter[], style: string): Promise<string> => {
  return executeWithFallback(async provider => {
    const model = getModel(provider, 'fast');
    const bookContext = chapters
      .map(c => `Ch ${c.orderIndex} (${c.title}): ${c.summary}`)
      .join('\n');

    const prompt = `
Analyze this outline for inconsistencies, plot holes, or tonal shifts.
Style: ${style}
Outline: ${bookContext}
INSTRUCTIONS: Identify up to 3 issues. For EACH, provide a "SUGGESTED FIX".`;

    const response = await generateText({
      model,
      prompt,
      temperature: 0.3,
    });

    return response.text || 'No issues found.';
  }, 'analyzeConsistency');
};

/**
 * Brainstorm ideas
 */
export const brainstormProject = async (
  context: string,
  field: 'title' | 'style' | 'idea'
): Promise<string> => {
  return executeWithFallback(async provider => {
    const model = getModel(provider, 'fast');
    const safeContext = context.substring(0, 50000);

    let prompt = '';
    if (field === 'title')
      prompt = `Generate a catchy book title for: "${safeContext}". Output ONLY title.`;
    else if (field === 'style')
      prompt = `Suggest a genre/style for: "${safeContext}". Output ONLY style.`;
    else if (field === 'idea')
      prompt = `Enhance this concept into a detailed paragraph: "${safeContext}"`;

    const response = await generateText({
      model,
      prompt,
      temperature: 0.8,
    });

    return response.text?.trim().replace(/^"|"$/g, '') || '';
  }, 'brainstormProject');
};

/**
 * Generate cover image (Google only - has Imagen support)
 */
export const generateCoverImage = async (
  _title: string,
  _style: string,
  _idea: string
): Promise<string | null> => {
  try {
    // This requires Google's Imagen API which is separate from the AI SDK
    // For now, return null and keep the original implementation
    console.warn(
      'Cover image generation requires Google Imagen API - keeping original implementation'
    );
    return null;
  } catch (error) {
    console.error('Cover image generation failed:', error);
    return null;
  }
};

/**
 * Generate chapter illustration (Google only - has Imagen support)
 */
export const generateChapterIllustration = async (
  _title: string,
  _summary: string,
  _style: string
): Promise<string | null> => {
  try {
    // This requires Google's Imagen API which is separate from the AI SDK
    // For now, return null and keep the original implementation
    console.warn(
      'Chapter illustration requires Google Imagen API - keeping original implementation'
    );
    return null;
  } catch (error) {
    console.error('Chapter illustration failed:', error);
    return null;
  }
};

/**
 * Translate content
 */
export const translateContent = async (
  content: string,
  targetLanguage: string
): Promise<string> => {
  return executeWithFallback(async provider => {
    const model = getModel(provider, 'fast');

    const prompt = `Translate markdown content to ${targetLanguage}. Maintain formatting and tone.\n\nContent:\n${content}`;

    const response = await generateText({
      model,
      prompt,
      temperature: 0.3,
    });

    return response.text || '';
  }, 'translateContent');
};

/**
 * Develop characters
 */
export const developCharacters = async (idea: string, style: string): Promise<string> => {
  return executeWithFallback(async provider => {
    const model = getModel(provider, 'standard');

    const prompt = `Create a character cast list for: ${idea}\nStyle: ${style}\nOutput Name, Role, Motivation, Conflict.`;

    const response = await generateText({
      model,
      prompt,
      temperature: 0.8,
    });

    return response.text || '';
  }, 'developCharacters');
};

/**
 * Build world
 */
export const buildWorld = async (idea: string, style: string): Promise<string> => {
  return executeWithFallback(async provider => {
    const model = getModel(provider, 'standard');

    const prompt = `Expand setting/lore for: ${idea}\nStyle: ${style}\nFocus on rules, atmosphere, locations.`;

    const response = await generateText({
      model,
      prompt,
      temperature: 0.85,
    });

    return response.text || '';
  }, 'buildWorld');
};

/**
 * Enhance plot
 */
export const enhancePlot = async (idea: string, style: string): Promise<string> => {
  return executeWithFallback(async provider => {
    const model = getModel(provider, 'advanced');

    const prompt = `Inject conflict and structure into: ${idea}\nStyle: ${style}\nProvide Inciting Incident, Twist, Climax setup.`;

    const response = await generateText({
      model,
      prompt,
      temperature: 0.7,
    });

    return response.text || '';
  }, 'enhancePlot');
};

/**
 * Polish dialogue
 */
export const polishDialogue = async (content: string, style: string): Promise<string> => {
  return executeWithFallback(async provider => {
    const model = getModel(provider, 'standard');

    const prompt = `Rewrite ONLY dialogue to be subtext-rich and distinct.\nStyle: ${style}\nText:\n${content}`;

    const response = await generateText({
      model,
      prompt,
      temperature: 0.6,
    });

    return response.text || '';
  }, 'polishDialogue');
};
