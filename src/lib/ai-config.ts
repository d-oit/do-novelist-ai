/**
 * AI Provider Configuration
 * Manages provider selection, API keys, and model configurations
 * Uses Vercel AI Gateway for multi-provider routing
 */

import { getValidatedEnv } from '@/lib/env-validation';

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'mistral';

export interface AIProviderConfig {
  provider: AIProvider;
  gatewayPath: string; // Path in Vercel AI Gateway
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
  gatewayApiKey?: string; // Vercel AI Gateway API key (optional)
  defaultModel: string; // Standard model for general tasks
  thinkingModel: string; // Advanced model for complex thinking/reading
  providers: Record<AIProvider, AIProviderConfig>;
}

/**
 * Get AI service configuration from environment variables
 * Uses validated environment variables for type safety
 */
export function getAIConfig(): AIServiceConfig {
  // Get validated environment variables (throws error if invalid)
  const env = getValidatedEnv();

  const gatewayApiKey = env.VITE_AI_GATEWAY_API_KEY;

  return {
    defaultProvider: env.VITE_DEFAULT_AI_PROVIDER,
    enableFallback: env.VITE_ENABLE_AUTO_FALLBACK !== 'false',
    gatewayApiKey,
    defaultModel: env.VITE_DEFAULT_AI_MODEL,
    thinkingModel: env.VITE_THINKING_AI_MODEL,

    providers: {
      mistral: {
        provider: 'mistral',
        gatewayPath: 'mistral',
        models: {
          fast: 'mistral-small-latest',
          standard: 'mistral-medium-latest',
          advanced: 'mistral-large-latest',
        },
        enabled: Boolean(gatewayApiKey),
      },

      openai: {
        provider: 'openai',
        gatewayPath: 'openai',
        models: {
          fast: 'gpt-4o-mini',
          standard: 'gpt-4o',
          advanced: 'gpt-4o',
        },
        enabled: Boolean(gatewayApiKey),
      },

      anthropic: {
        provider: 'anthropic',
        gatewayPath: 'anthropic',
        models: {
          fast: 'claude-3-5-haiku-20241022',
          standard: 'claude-3-5-sonnet-20241022',
          advanced: 'claude-3-5-sonnet-20241022',
        },
        enabled: Boolean(gatewayApiKey),
      },

      google: {
        provider: 'google',
        gatewayPath: 'google',
        models: {
          fast: 'gemini-2.0-flash-exp',
          standard: 'gemini-2.0-flash-exp',
          advanced: 'gemini-exp-1206',
        },
        enabled: Boolean(gatewayApiKey),
      },
    },
  };
}

/**
 * Get enabled providers in priority order
 */
export function getEnabledProviders(config: AIServiceConfig): AIProvider[] {
  const providers: AIProvider[] = [];

  // Add default provider first
  if (config.providers[config.defaultProvider].enabled) {
    providers.push(config.defaultProvider);
  }

  // Add other enabled providers as fallbacks
  (['mistral', 'openai', 'anthropic', 'google'] as AIProvider[]).forEach(provider => {
    if (provider !== config.defaultProvider && config.providers[provider].enabled) {
      providers.push(provider);
    }
  });

  return providers;
}

/**
 * Get model name for a specific task complexity
 */
export function getModelForTask(
  provider: AIProvider,
  complexity: 'fast' | 'standard' | 'advanced',
  config: AIServiceConfig,
): string {
  return config.providers[provider].models[complexity];
}
