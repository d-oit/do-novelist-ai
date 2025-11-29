/**
 * AI Provider Configuration
 * Manages provider selection, API keys, and model configurations
 */

export type AIProvider = 'openai' | 'anthropic' | 'google';

export interface AIProviderConfig {
  provider: AIProvider;
  apiKey: string;
  models: {
    fast: string;      // Fast, cheap model for simple tasks
    standard: string;  // Balanced model for most tasks
    advanced: string;  // Premium model for complex tasks
  };
  enabled: boolean;
}

export interface AIServiceConfig {
  defaultProvider: AIProvider;
  enableFallback: boolean;
  providers: Record<AIProvider, AIProviderConfig>;
}

/**
 * Get AI service configuration from environment variables
 */
export function getAIConfig(): AIServiceConfig {
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
  const anthropicKey = import.meta.env.VITE_ANTHROPIC_API_KEY || '';
  const googleKey = import.meta.env.VITE_GOOGLE_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || '';

  return {
    defaultProvider: (import.meta.env.VITE_DEFAULT_AI_PROVIDER as AIProvider) || 'google',
    enableFallback: import.meta.env.VITE_ENABLE_AUTO_FALLBACK !== 'false',

    providers: {
      openai: {
        provider: 'openai',
        apiKey: openaiKey,
        models: {
          fast: 'gpt-4o-mini',
          standard: 'gpt-4o',
          advanced: 'gpt-4o'
        },
        enabled: !!openaiKey
      },

      anthropic: {
        provider: 'anthropic',
        apiKey: anthropicKey,
        models: {
          fast: 'claude-3-5-haiku-20241022',
          standard: 'claude-3-5-sonnet-20241022',
          advanced: 'claude-3-5-sonnet-20241022'
        },
        enabled: !!anthropicKey
      },

      google: {
        provider: 'google',
        apiKey: googleKey,
        models: {
          fast: 'gemini-2.0-flash-exp',
          standard: 'gemini-2.0-flash-exp',
          advanced: 'gemini-exp-1206'
        },
        enabled: !!googleKey
      }
    }
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
  (['openai', 'anthropic', 'google'] as AIProvider[]).forEach(provider => {
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
  config: AIServiceConfig
): string {
  return config.providers[provider].models[complexity];
}
