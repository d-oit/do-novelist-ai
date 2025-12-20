import { describe, expect, it, vi, beforeEach } from 'vitest';

import { getActiveProviders } from '@/services/ai-config-service';
import type { ProviderPreferenceData } from '@/services/ai-config-service';

vi.mock('@/lib/ai-config', async () => {
  const actual = await vi.importActual<any>('@/lib/ai-config');
  return {
    ...actual,
    getAIConfig: () => ({
      defaultProvider: 'google',
      enableFallback: true,
      openrouterApiKey: 'test',
      defaultModel: 'gemini-2.0-flash-exp',
      thinkingModel: 'gemini-exp-1206',
      providers: {
        openai: {
          provider: 'openai',
          gatewayPath: 'openai',
          models: { fast: 'gpt-4o-mini', standard: 'gpt-4o', advanced: 'gpt-4o' },
          enabled: true,
        },
        anthropic: {
          provider: 'anthropic',
          gatewayPath: 'anthropic',
          models: {
            fast: 'claude-3-5-haiku-20241022',
            standard: 'claude-3-5-sonnet-20241022',
            advanced: 'claude-3-5-sonnet-20241022',
          },
          enabled: true,
        },
        google: {
          provider: 'google',
          gatewayPath: 'google',
          models: { fast: 'gemini-2.0-flash-exp', standard: 'gemini-2.0-flash-exp', advanced: 'gemini-exp-1206' },
          enabled: true,
        },
        mistral: {
          provider: 'mistral',
          gatewayPath: 'mistral',
          models: { fast: 'mistral-small-latest', standard: 'mistral-medium-latest', advanced: 'mistral-large-latest' },
          enabled: false,
        },
      },
    }),
  };
});

describe('getActiveProviders', () => {
  let prefs: ProviderPreferenceData;
  beforeEach(() => {
    prefs = {
      selectedProvider: 'google',
      selectedModel: 'gemini-2.0-flash-exp',
      fallbackProviders: ['openai', 'anthropic', 'mistral'],
      temperature: 0.7,
      maxTokens: 4000,
      monthlyBudget: 10,
      autoFallback: true,
      costOptimization: false,
    };
  });

  it('includes selected provider first when enabled', () => {
    const list = getActiveProviders(prefs);
    expect(list[0]).toBe('google');
  });

  it('preserves fallback order and filters out disabled providers', () => {
    const list = getActiveProviders(prefs);
    // mistral is disabled in mocked config
    expect(list).toEqual(['google', 'openai', 'anthropic']);
  });
});
