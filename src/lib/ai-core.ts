/**
 * AI Core Services
 * Base infrastructure for AI operations including configuration, logging, and provider management.
 */

import { OpenRouter } from '@openrouter/sdk';

import {
  getAIConfig,
  getEnabledProviders,
  getModelForTask,
  type AIProvider,
} from '@/lib/ai-config';
import { createAIError, createConfigurationError } from '@/lib/errors/error-types';
import { logger } from '@/lib/logging/logger';
import {
  loadUserPreferences,
  getActiveProviders,
  type ProviderPreferenceData,
} from '@/services/ai-config-service';
import type { Chapter } from '@/types/index';

// Get configuration
const config = getAIConfig();

// Create OpenRouter SDK client instance
const openrouterClient = new OpenRouter({
  apiKey: config.openrouterApiKey ?? '',
});

// Create logger for AI module
export const aiLogger = logger.child({ module: 'ai-service' });

/**
 * Check if running in test/CI environment
 */
export const isTestEnvironment = (): boolean => {
  if (typeof window !== 'undefined') {
    if (
      import.meta.env?.CI === 'true' ||
      import.meta.env?.NODE_ENV === 'test' ||
      import.meta.env?.PLAYWRIGHT_TEST === 'true' ||
      import.meta.env?.PLAYWRIGHT === 'true'
    ) {
      return true;
    }

    const isLocalhost =
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const hasApiKey = !!import.meta.env?.VITE_OPENROUTER_API_KEY;

    if (isLocalhost && !hasApiKey) {
      return true;
    }

    return false;
  }

  if (typeof process !== 'undefined' && process.env) {
    return (
      process.env.CI === 'true' ||
      process.env.NODE_ENV === 'test' ||
      process.env.PLAYWRIGHT === 'true'
    );
  }

  return false;
};

/**
 * Type guard for outline response
 */
export function isValidOutline(
  obj: unknown,
): obj is { title: string; chapters: Partial<Chapter>[] } {
  const record = obj as Record<string, unknown>;
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof record.title === 'string' &&
    Array.isArray(record.chapters)
  );
}

/**
 * Get model name for a specific provider and complexity level
 */
export function getModelName(
  provider: AIProvider,
  complexity: 'fast' | 'standard' | 'advanced' = 'standard',
): string {
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

  aiLogger.debug('Generated model name', {
    provider,
    modelName,
    complexity,
  });

  return `${provider}/${modelName}`;
}

/**
 * Resolve active providers based on user preferences or environment defaults
 */
export async function resolveProviders(): Promise<{
  providers: AIProvider[];
  enableFallback: boolean;
}> {
  try {
    let userId: string | null = null;
    if (typeof window !== 'undefined') {
      try {
        userId = localStorage.getItem('novelist_user_id');
      } catch {
        // Ignore localStorage errors
      }
    }

    if (userId !== null && userId !== '') {
      const prefs: ProviderPreferenceData = await loadUserPreferences(userId);
      const providers = getActiveProviders(prefs);
      return { providers, enableFallback: prefs.autoFallback };
    }
  } catch (e) {
    aiLogger.warn('Failed to resolve user preferences for providers, falling back to env order', {
      error: e instanceof Error ? e.message : String(e),
    });
  }

  return { providers: getEnabledProviders(config), enableFallback: config.enableFallback };
}

/**
 * Execute AI generation with automatic fallback and analytics
 */
export async function executeWithFallback<T>(
  operation: (provider: AIProvider) => Promise<T>,
  operationName: string,
): Promise<T> {
  const { providers, enableFallback } = await resolveProviders();

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
      },
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
    enableFallback,
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
        },
      );

      aiLogger.warn(`Provider ${provider} failed for ${operationName}`, {
        operationName,
        provider,
        error: errorMessage,
      });

      lastError = aiError;

      if (!enableFallback || provider === providers[providers.length - 1]) {
        break;
      }

      continue;
    }
  }

  aiLogger.error(`${operationName} failed with all providers`, {
    operationName,
    providers: providers.join(', '),
    lastError: lastError?.message,
  });

  throw lastError ?? new Error(`${operationName} failed with all providers`);
}

// Export OpenRouter client and config for use in other modules
export { openrouterClient, config };
