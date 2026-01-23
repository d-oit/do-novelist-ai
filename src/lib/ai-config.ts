/**
 * AI Provider Configuration
 * Manages provider selection, API keys, and model configurations
 * Uses OpenRouter for multi-provider routing
 */

import { getValidatedEnv } from '@/lib/env-validation';

export type AIProvider =
  // Core Providers
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'mistral'
  // Extended Providers
  | 'deepseek'
  | 'cohere'
  | 'ai21'
  | 'together'
  | 'fireworks'
  | 'perplexity'
  | 'xai'
  | '01-ai'
  | 'nvidia'
  | 'amazon'
  | 'meta';

export interface AIProviderConfig {
  provider: AIProvider;
  gatewayPath: string; // Provider path for OpenRouter (e.g., 'openai', 'anthropic')
  models: {
    fast: string; // Fast, cheap model for simple tasks
    standard: string; // Balanced model for most tasks
    advanced: string; // Premium model for complex tasks
  };
  enabled: boolean;
}

export interface AIServiceConfig {
  defaultProvider: AIProvider;
  enableFallback: boolean;
  openrouterApiKey?: string; // OpenRouter API key (optional)
  defaultModel: string; // Standard model for general tasks
  thinkingModel: string; // Advanced model for complex thinking/reading
  enableAutoRouting: boolean; // Enable OpenRouter Auto Router
  enableModelVariants: boolean; // Enable model variants (:free, :thinking, etc.)
  providers: Record<AIProvider, AIProviderConfig>;
}

/**
 * Get AI service configuration from environment variables
 *
 * Retrieves the complete AI service configuration including all provider settings,
 * model configurations, and feature flags. The configuration is validated
 * using environment variables to ensure type safety and prevent runtime errors.
 *
 * Important notes:
 * - API keys are handled server-side for security reasons
 * - All providers are enabled by default when API keys are available server-side
 * - Model variants (:free, :thinking, etc.) can be enabled via configuration
 *
 * @returns {AIServiceConfig} Complete AI service configuration object containing:
 *   - defaultProvider: The primary AI provider to use
 *   - enableFallback: Whether to automatically fallback to alternative providers
 *   - defaultModel: Standard model for general tasks
 *   - thinkingModel: Advanced model for complex reasoning
 *   - enableAutoRouting: Whether to use OpenRouter's auto-routing
 *   - enableModelVariants: Whether to use model variant syntax
 *   - providers: Object containing all 15 AI provider configurations
 * @throws {Error} When environment validation fails or required variables are missing
 * @example
 * ```typescript
 * import { getAIConfig } from '@/lib/ai-config';
 *
 * try {
 *   const config = getAIConfig();
 *   console.log(`Default provider: ${config.defaultProvider}`);
 *   console.log(`Default model: ${config.defaultModel}`);
 *
 *   // Get model for specific task
 *   const model = getModelForTask(
 *     config.defaultProvider,
 *     'standard',
 *     config
 *   );
 *   console.log(`Model for standard task: ${model}`);
 * } catch (error) {
 *   console.error('Failed to get AI config:', error);
 * }
 * ```
 */
export function getAIConfig(): AIServiceConfig {
  // Get validated environment variables (throws error if invalid)
  const env = getValidatedEnv();

  return {
    defaultProvider: env.VITE_DEFAULT_AI_PROVIDER,
    enableFallback: env.VITE_ENABLE_AUTO_FALLBACK !== 'false',
    openrouterApiKey: undefined, // API keys handled server-side
    defaultModel: env.VITE_DEFAULT_AI_MODEL,
    thinkingModel: env.VITE_THINKING_AI_MODEL,
    enableAutoRouting: env.VITE_ENABLE_AUTO_ROUTING === 'true',
    enableModelVariants: env.VITE_ENABLE_MODEL_VARIANTS === 'true',

    providers: {
      // Core Providers (Original)
      mistral: {
        provider: 'mistral',
        gatewayPath: 'mistral',
        models: {
          fast: 'mistral-small-latest',
          standard: 'mistral-medium-latest',
          advanced: 'mistral-large-latest',
        },
        enabled: true, // Always enabled - API key handled server-side
      },

      openai: {
        provider: 'openai',
        gatewayPath: 'openai',
        models: {
          fast: 'gpt-4o-mini',
          standard: 'gpt-4o',
          advanced: 'gpt-4o',
        },
        enabled: true, // Always enabled - API key handled server-side
      },

      anthropic: {
        provider: 'anthropic',
        gatewayPath: 'anthropic',
        models: {
          fast: 'claude-3-5-haiku-20241022',
          standard: 'claude-3-5-sonnet-20241022',
          advanced: 'claude-3-5-sonnet-20241022',
        },
        enabled: true, // Always enabled - API key handled server-side
      },

      google: {
        provider: 'google',
        gatewayPath: 'google',
        models: {
          fast: 'gemini-2.0-flash-exp',
          standard: 'gemini-2.0-flash-exp',
          advanced: 'gemini-exp-1206',
        },
        enabled: true, // Always enabled - API key handled server-side
      },

      // Extended Providers (New)
      deepseek: {
        provider: 'deepseek',
        gatewayPath: 'deepseek',
        models: {
          fast: 'deepseek-chat',
          standard: 'deepseek-reasoner',
          advanced: 'deepseek-reasoner',
        },
        enabled: true, // Always enabled - API key handled server-side
      },

      cohere: {
        provider: 'cohere',
        gatewayPath: 'cohere',
        models: {
          fast: 'command-r',
          standard: 'command-r-plus',
          advanced: 'command-r-plus',
        },
        enabled: true, // Always enabled - API key handled server-side
      },

      ai21: {
        provider: 'ai21',
        gatewayPath: 'ai21',
        models: {
          fast: 'jamba-1.5-mini',
          standard: 'jamba-1.5-large',
          advanced: 'jamba-1.5-large',
        },
        enabled: true, // Always enabled - API key handled server-side
      },

      together: {
        provider: 'together',
        gatewayPath: 'together',
        models: {
          fast: 'meta-llama/llama-3.2-3b-instruct',
          standard: 'meta-llama/llama-3.1-8b-instruct',
          advanced: 'meta-llama/llama-3.1-70b-instruct',
        },
        enabled: true, // Always enabled - API key handled server-side
      },

      fireworks: {
        provider: 'fireworks',
        gatewayPath: 'fireworks',
        models: {
          fast: 'accounts/fireworks/models/llama-v3p1-8b-instruct',
          standard: 'accounts/fireworks/models/llama-v3p1-70b-instruct',
          advanced: 'accounts/fireworks/models/llama-v3p1-70b-instruct',
        },
        enabled: true, // Always enabled - API key handled server-side
      },

      perplexity: {
        provider: 'perplexity',
        gatewayPath: 'perplexity',
        models: {
          fast: 'pplx-7b-online',
          standard: 'pplx-70b-online',
          advanced: 'pplx-70b-online',
        },
        enabled: true, // Always enabled - API key handled server-side
      },

      xai: {
        provider: 'xai',
        gatewayPath: 'xai',
        models: {
          fast: 'grok-beta',
          standard: 'grok-beta',
          advanced: 'grok-beta',
        },
        enabled: true, // Always enabled - API key handled server-side
      },

      '01-ai': {
        provider: '01-ai',
        gatewayPath: '01-ai',
        models: {
          fast: '01-ai/yi-6b',
          standard: '01-ai/yi-34b',
          advanced: '01-ai/yi-34b',
        },
        enabled: true, // Always enabled - API key handled server-side
      },

      nvidia: {
        provider: 'nvidia',
        gatewayPath: 'nvidia',
        models: {
          fast: 'nvidia/nemotron-3-nano-30b-a3b:free',
          standard: 'nvidia/nemotron-3-nano-30b-a3b:free',
          advanced: 'nvidia/llama-3.1-nemotron-70b-instruct',
        },
        enabled: true, // Always enabled - API key handled server-side
      },

      amazon: {
        provider: 'amazon',
        gatewayPath: 'amazon',
        models: {
          fast: 'amazon/nova-micro-v1',
          standard: 'amazon/nova-lite-v1',
          advanced: 'amazon/nova-pro-v1',
        },
        enabled: true, // Always enabled - API key handled server-side
      },

      meta: {
        provider: 'meta',
        gatewayPath: 'meta',
        models: {
          fast: 'meta-llama/llama-3.2-1b-instruct',
          standard: 'meta-llama/llama-3.1-8b-instruct',
          advanced: 'meta-llama/llama-3.1-70b-instruct',
        },
        enabled: true, // Always enabled - API key handled server-side
      },
    },
  };
}

/**
 * Get enabled providers in priority order
 *
 * Returns an array of enabled AI providers sorted by priority. The default
 * provider is always first in the array, followed by other enabled providers
 * in a predetermined order (mistral, openai, anthropic, google, etc.).
 *
 * This ordering ensures that providers with higher reliability and better
 * performance are tried first when fallback is enabled.
 *
 * @param {AIServiceConfig} config - The AI service configuration object
 * @returns {AIProvider[]} Array of enabled provider names in priority order:
 *   - First element is the default provider (always)
 *   - Subsequent elements are other enabled providers in fixed priority order
 * @throws {Error} Never throws, returns empty array if no providers are enabled
 * @example
 * ```typescript
 * import { getAIConfig, getEnabledProviders } from '@/lib/ai-config';
 *
 * const config = getAIConfig();
 * const providers = getEnabledProviders(config);
 *
 * console.log('Available providers:');
 * providers.forEach((provider, index) => {
 *   console.log(`${index + 1}. ${provider}`);
 * });
 *
 * // Use first available provider
 * if (providers.length > 0) {
 *   const primaryProvider = providers[0];
 *   console.log(`Using: ${primaryProvider}`);
 * }
 * ```
 */
export function getEnabledProviders(config: AIServiceConfig): AIProvider[] {
  const providers: AIProvider[] = [];

  // Add default provider first
  if (config.providers[config.defaultProvider].enabled) {
    providers.push(config.defaultProvider);
  }

  // Add other enabled providers as fallbacks
  (
    [
      'mistral',
      'openai',
      'anthropic',
      'google',
      'deepseek',
      'cohere',
      'ai21',
      'together',
      'fireworks',
      'perplexity',
      'xai',
      '01-ai',
      'nvidia',
      'amazon',
      'meta',
    ] as AIProvider[]
  ).forEach(provider => {
    if (provider !== config.defaultProvider && config.providers[provider].enabled) {
      providers.push(provider);
    }
  });

  return providers;
}

/**
 * Get model name for a specific task complexity
 *
 * Retrieves the appropriate model name from the provider configuration
 * based on the task complexity level. This allows the application to
 * automatically select the optimal model for different types of tasks.
 *
 * Complexity levels:
 * - 'fast': Lightweight models for simple, quick tasks (e.g., basic queries)
 * - 'standard': Balanced models for most everyday tasks
 * - 'advanced': Premium models for complex reasoning, analysis, or generation
 *
 * @param {AIProvider} provider - The AI provider identifier (e.g., 'openai', 'anthropic')
 * @param {'fast' | 'standard' | 'advanced'} complexity - The task complexity level
 * @param {AIServiceConfig} config - The AI service configuration object
 * @returns {string} The model identifier for the specified provider and complexity level
 * @throws {Error} When provider is not found in configuration or model is not available
 * @example
 * ```typescript
 * import { getAIConfig, getModelForTask } from '@/lib/ai-config';
 *
 * const config = getAIConfig();
 *
 * // Get fast model for simple query
 * const fastModel = getModelForTask('openai', 'fast', config);
 * console.log(`Fast model: ${fastModel}`); // Output: "gpt-4o-mini"
 *
 * // Get standard model for typical task
 * const standardModel = getModelForTask('anthropic', 'standard', config);
 * console.log(`Standard model: ${standardModel}`); // Output: "claude-3-5-sonnet-20241022"
 *
 * // Get advanced model for complex reasoning
 * const advancedModel = getModelForTask('google', 'advanced', config);
 * console.log(`Advanced model: ${advancedModel}`); // Output: "gemini-exp-1206"
 * ```
 */
export function getModelForTask(
  provider: AIProvider,
  complexity: 'fast' | 'standard' | 'advanced',
  config: AIServiceConfig,
): string {
  return config.providers[provider].models[complexity];
}
