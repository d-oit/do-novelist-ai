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
 * Uses validated environment variables for type safety
 */
export function getAIConfig(): AIServiceConfig {
  // Get validated environment variables (throws error if invalid)
  const env = getValidatedEnv();

  const openrouterApiKey = env.VITE_OPENROUTER_API_KEY;

  return {
    defaultProvider: env.VITE_DEFAULT_AI_PROVIDER,
    enableFallback: env.VITE_ENABLE_AUTO_FALLBACK !== 'false',
    openrouterApiKey,
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
        enabled: Boolean(openrouterApiKey),
      },

      openai: {
        provider: 'openai',
        gatewayPath: 'openai',
        models: {
          fast: 'gpt-4o-mini',
          standard: 'gpt-4o',
          advanced: 'gpt-4o',
        },
        enabled: Boolean(openrouterApiKey),
      },

      anthropic: {
        provider: 'anthropic',
        gatewayPath: 'anthropic',
        models: {
          fast: 'claude-3-5-haiku-20241022',
          standard: 'claude-3-5-sonnet-20241022',
          advanced: 'claude-3-5-sonnet-20241022',
        },
        enabled: Boolean(openrouterApiKey),
      },

      google: {
        provider: 'google',
        gatewayPath: 'google',
        models: {
          fast: 'gemini-2.0-flash-exp',
          standard: 'gemini-2.0-flash-exp',
          advanced: 'gemini-exp-1206',
        },
        enabled: Boolean(openrouterApiKey),
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
        enabled: Boolean(openrouterApiKey),
      },

      cohere: {
        provider: 'cohere',
        gatewayPath: 'cohere',
        models: {
          fast: 'command-r',
          standard: 'command-r-plus',
          advanced: 'command-r-plus',
        },
        enabled: Boolean(openrouterApiKey),
      },

      ai21: {
        provider: 'ai21',
        gatewayPath: 'ai21',
        models: {
          fast: 'jamba-1.5-mini',
          standard: 'jamba-1.5-large',
          advanced: 'jamba-1.5-large',
        },
        enabled: Boolean(openrouterApiKey),
      },

      together: {
        provider: 'together',
        gatewayPath: 'together',
        models: {
          fast: 'meta-llama/llama-3.2-3b-instruct',
          standard: 'meta-llama/llama-3.1-8b-instruct',
          advanced: 'meta-llama/llama-3.1-70b-instruct',
        },
        enabled: Boolean(openrouterApiKey),
      },

      fireworks: {
        provider: 'fireworks',
        gatewayPath: 'fireworks',
        models: {
          fast: 'accounts/fireworks/models/llama-v3p1-8b-instruct',
          standard: 'accounts/fireworks/models/llama-v3p1-70b-instruct',
          advanced: 'accounts/fireworks/models/llama-v3p1-70b-instruct',
        },
        enabled: Boolean(openrouterApiKey),
      },

      perplexity: {
        provider: 'perplexity',
        gatewayPath: 'perplexity',
        models: {
          fast: 'pplx-7b-online',
          standard: 'pplx-70b-online',
          advanced: 'pplx-70b-online',
        },
        enabled: Boolean(openrouterApiKey),
      },

      xai: {
        provider: 'xai',
        gatewayPath: 'xai',
        models: {
          fast: 'grok-beta',
          standard: 'grok-beta',
          advanced: 'grok-beta',
        },
        enabled: Boolean(openrouterApiKey),
      },

      '01-ai': {
        provider: '01-ai',
        gatewayPath: '01-ai',
        models: {
          fast: '01-ai/yi-6b',
          standard: '01-ai/yi-34b',
          advanced: '01-ai/yi-34b',
        },
        enabled: Boolean(openrouterApiKey),
      },

      nvidia: {
        provider: 'nvidia',
        gatewayPath: 'nvidia',
        models: {
          fast: 'nvidia/llama-3.1-nemotron-70b-instruct',
          standard: 'nvidia/llama-3.1-nemotron-70b-instruct',
          advanced: 'nvidia/llama-3.1-nemotron-70b-instruct',
        },
        enabled: Boolean(openrouterApiKey),
      },

      amazon: {
        provider: 'amazon',
        gatewayPath: 'amazon',
        models: {
          fast: 'amazon/nova-micro-v1',
          standard: 'amazon/nova-lite-v1',
          advanced: 'amazon/nova-pro-v1',
        },
        enabled: Boolean(openrouterApiKey),
      },

      meta: {
        provider: 'meta',
        gatewayPath: 'meta',
        models: {
          fast: 'meta-llama/llama-3.2-1b-instruct',
          standard: 'meta-llama/llama-3.1-8b-instruct',
          advanced: 'meta-llama/llama-3.1-70b-instruct',
        },
        enabled: Boolean(openrouterApiKey),
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
 */
export function getModelForTask(
  provider: AIProvider,
  complexity: 'fast' | 'standard' | 'advanced',
  config: AIServiceConfig,
): string {
  return config.providers[provider].models[complexity];
}
