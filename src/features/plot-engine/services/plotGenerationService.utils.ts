import type { AIProvider } from '@/lib/ai-config';
import { getAIConfig, getModelForTask } from '@/lib/ai-config';
import { logger } from '@/lib/logging/logger';

const config = getAIConfig();

const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 100;
const BACKOFF_MULTIPLIER = 2;

interface RetryableError extends Error {
  retryable?: boolean;
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const errorMsg = error.message.toLowerCase();
    if (
      errorMsg.includes('timeout') ||
      errorMsg.includes('network') ||
      errorMsg.includes('fetch')
    ) {
      return true;
    }
    if (
      errorMsg.includes('rate limit') ||
      errorMsg.includes('429') ||
      errorMsg.includes('too many')
    ) {
      return true;
    }
    if (errorMsg.includes('500') || errorMsg.includes('502') || errorMsg.includes('503')) {
      return true;
    }
  }
  const retryableError = error as RetryableError;
  return retryableError?.retryable === true;
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  context: string,
  maxRetries: number = MAX_RETRIES,
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries && isRetryableError(error)) {
        const delay = INITIAL_DELAY_MS * Math.pow(BACKOFF_MULTIPLIER, attempt - 1);
        logger.warn(`Retrying operation (attempt ${attempt}/${maxRetries})`, {
          context,
          delay,
          error: lastError.message,
        });
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        logger.error(`Operation failed after ${attempt} attempts`, {
          context,
          error: lastError,
          retryable: isRetryableError(error),
        });
        throw lastError;
      }
    }
  }

  throw lastError || new Error('Unknown error occurred');
}

export function selectModel(
  provider: AIProvider,
  complexity: 'fast' | 'standard' | 'advanced',
  taskType: string,
  structure?: string,
  targetLength?: number,
): string {
  const modelName = getModelForTask(provider, complexity, config);

  logger.debug('Model selection', {
    provider,
    complexity,
    taskType,
    model: modelName,
    structure,
    targetLength,
  });

  return modelName;
}

export function calculateComplexity(
  request: {
    structure?: string;
    targetLength?: number;
    characters?: string[];
    plotPoints?: string[];
    themes?: string[];
  },
  taskType: 'plot_structure' | 'suggestions' | 'alternatives',
): 'fast' | 'standard' | 'advanced' {
  let complexityScore = 0;

  if (taskType === 'suggestions') {
    complexityScore = 0;
  } else if (taskType === 'alternatives') {
    complexityScore = 1;
  } else {
    complexityScore = 1;
    if (request.structure === 'hero-journey') {
      complexityScore += 3;
    } else if (request.structure === '5-act' || request.structure === 'kishotenketsu') {
      complexityScore += 1;
    } else if (request.structure === 'custom') {
      complexityScore += 3;
    }

    if (request.targetLength && request.targetLength >= 40) {
      complexityScore += 2;
    } else if (request.targetLength && request.targetLength >= 30) {
      complexityScore += 1;
    }

    const characterCount = request.characters?.length || 0;
    if (characterCount >= 3) {
      complexityScore += 1;
    } else if (characterCount >= 5) {
      complexityScore += 2;
    }

    const plotPointCount = request.plotPoints?.length || 0;
    if (plotPointCount >= 5) {
      complexityScore += 1;
    }

    if (request.themes && request.themes.length >= 2) {
      complexityScore += 1;
    }
  }

  if (complexityScore >= 3) {
    return 'advanced';
  } else if (complexityScore >= 1) {
    return 'standard';
  } else {
    return 'fast';
  }
}
