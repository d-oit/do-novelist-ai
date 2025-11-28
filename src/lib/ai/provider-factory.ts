import type { AIProvider, AIModel } from '../../types/ai-config';

export const AVAILABLE_MODELS: Record<AIProvider, AIModel[]> = {
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', contextLength: 128000, pricing: { input: 0.005, output: 0.015 } },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai', contextLength: 128000, pricing: { input: 0.01, output: 0.03 } },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai', contextLength: 16385, pricing: { input: 0.001, output: 0.002 } },
  ],
  anthropic: [
    { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'anthropic', contextLength: 200000, pricing: { input: 0.003, output: 0.015 } },
    { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'anthropic', contextLength: 200000, pricing: { input: 0.015, output: 0.075 } },
    { id: 'claude-3-haiku', name: 'Claude 3 Haiku', provider: 'anthropic', contextLength: 200000, pricing: { input: 0.00025, output: 0.00125 } },
  ],
  google: [
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'google', contextLength: 1000000, pricing: { input: 0.00035, output: 0.00105 } },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'google', contextLength: 2097152, pricing: { input: 0.0035, output: 0.0105 } },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'google', contextLength: 1000000, pricing: { input: 0.00035, output: 0.00105 } },
  ],
  meta: [
    { id: 'llama-3.1-405b', name: 'Llama 3.1 405B', provider: 'meta', contextLength: 128000, pricing: { input: 0.0, output: 0.0 } },
    { id: 'llama-3.1-70b', name: 'Llama 3.1 70B', provider: 'meta', contextLength: 128000, pricing: { input: 0.0, output: 0.0 } },
  ],
  xai: [
    { id: 'grok-2', name: 'Grok-2', provider: 'xai', contextLength: 128000, pricing: { input: 0.002, output: 0.008 } },
    { id: 'grok-2-vision-1212', name: 'Grok-2 Vision', provider: 'xai', contextLength: 128000, pricing: { input: 0.002, output: 0.008 } },
  ],
};

export function getModelsForProvider(provider: AIProvider): AIModel[] {
  return AVAILABLE_MODELS[provider] || [];
}

export function getDefaultModel(provider: AIProvider): string {
  const models = getModelsForProvider(provider);
  return models[0]?.id || 'default';
}

export function getProviderDisplayName(provider: AIProvider): string {
  const names = {
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    google: 'Google',
    meta: 'Meta',
    xai: 'xAI',
  };
  return names[provider] || provider;
}

export function estimateCost(
  provider: AIProvider,
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const modelInfo = getModelsForProvider(provider).find(m => m.id === model);
  if (!modelInfo) return 0;

  return (promptTokens / 1000) * modelInfo.pricing.input + (completionTokens / 1000) * modelInfo.pricing.output;
}
