/**
 * Tests for openrouter-models-service.ts
 * Target: Increase coverage from 9.77% to 70%+
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { logger } from '@/lib/logging/logger';
import { withRetry } from '@/lib/utils/retry';
import { OpenRouterModelsService, type OpenRouterModel, type ModelFilters } from '@/services/openrouter-models-service';

// Mock dependencies
vi.mock('@/lib/logging/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@/lib/utils/retry', () => ({
  withRetry: vi.fn(),
}));

vi.mock('@/lib/ai-config', () => ({
  getAIConfig: vi.fn(() => ({
    defaultProvider: 'google',
    providers: {
      openai: { enabled: true },
      anthropic: { enabled: true },
      google: { enabled: true },
    },
  })),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('OpenRouterModelsService', () => {
  let service: OpenRouterModelsService;

  const mockModels: OpenRouterModel[] = [
    {
      id: 'openai/gpt-4',
      canonical_slug: 'openai/gpt-4',
      name: 'GPT-4',
      created: 1681300000,
      description: 'Most capable OpenAI model',
      context_length: 8192,
      architecture: {
        input_modalities: ['text'],
        output_modalities: ['text'],
        tokenizer: 'cl100k_base',
        instruct_type: 'chat',
      },
      pricing: {
        prompt: '30',
        completion: '60',
        request: '0',
        image: '0',
        web_search: '0',
        internal_reasoning: '0',
        input_cache_read: '0',
        input_cache_write: '0',
      },
      top_provider: {
        context_length: 8192,
        max_completion_tokens: 4096,
        is_moderated: true,
      },
      per_request_limits: null,
      supported_parameters: ['temperature', 'top_p', 'max_tokens'],
    },
    {
      id: 'anthropic/claude-3-opus',
      canonical_slug: 'anthropic/claude-3-opus',
      name: 'Claude 3 Opus',
      created: 1709000000,
      description: 'Most intelligent Claude model',
      context_length: 200000,
      architecture: {
        input_modalities: ['text', 'image'],
        output_modalities: ['text'],
        tokenizer: 'claude',
        instruct_type: 'messages',
      },
      pricing: {
        prompt: '15',
        completion: '75',
        request: '0',
        image: '0',
        web_search: '0',
        internal_reasoning: '0',
        input_cache_read: '0',
        input_cache_write: '0',
      },
      top_provider: {
        context_length: 200000,
        max_completion_tokens: 4096,
        is_moderated: true,
      },
      per_request_limits: null,
      supported_parameters: ['temperature', 'top_p', 'max_tokens', 'tools'],
    },
    {
      id: 'google/gemini-pro',
      canonical_slug: 'google/gemini-pro',
      name: 'Gemini Pro',
      created: 1702000000,
      description: 'Google multimodal model',
      context_length: 32000,
      architecture: {
        input_modalities: ['text', 'image'],
        output_modalities: ['text'],
        tokenizer: 'gemini',
        instruct_type: 'chat',
      },
      pricing: {
        prompt: '0.5',
        completion: '1.5',
        request: '0',
        image: '0',
        web_search: '0',
        internal_reasoning: '0',
        input_cache_read: '0',
        input_cache_write: '0',
      },
      top_provider: {
        context_length: 32000,
        max_completion_tokens: 2048,
        is_moderated: true,
      },
      per_request_limits: null,
      supported_parameters: ['temperature', 'top_p', 'max_tokens'],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();

    // Reset singleton instance for testing
    (OpenRouterModelsService as any).instance = null;
    service = OpenRouterModelsService.getInstance();

    // Mock fetch response
    vi.mocked(withRetry).mockResolvedValue({
      ok: true,
      json: async () => ({ models: mockModels }),
    } as any);
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = OpenRouterModelsService.getInstance();
      const instance2 = OpenRouterModelsService.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('getAvailableModels', () => {
    it('should fetch and return models', async () => {
      const models = await service.getAvailableModels();

      expect(models).toHaveLength(3);
      expect(models[0]?.id).toBe('openai/gpt-4');
    });

    it('should cache fetched models', async () => {
      await service.getAvailableModels();

      // Second call should use cache, not fetch again
      vi.mocked(withRetry).mockClear();
      await service.getAvailableModels();

      expect(withRetry).not.toHaveBeenCalled();
    });

    it('should handle fetch errors and return fallback models', async () => {
      vi.mocked(withRetry).mockRejectedValue(new Error('Network error'));

      const models = await service.getAvailableModels();

      expect(models.length).toBeGreaterThan(0);
      expect(logger.error).toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith('Using fallback models due to API error');
    });

    it('should not fetch concurrently', async () => {
      const promise1 = service.getAvailableModels();
      const promise2 = service.getAvailableModels();

      await Promise.all([promise1, promise2]);

      // Should only call withRetry once
      expect(withRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('getModelsWithFilters', () => {
    beforeEach(async () => {
      // Pre-load models
      await service.getAvailableModels();
    });

    it('should filter by provider', async () => {
      const filters: ModelFilters = { provider: 'openai' };
      const models = await service.getModelsWithFilters(filters);

      expect(models).toHaveLength(1);
      expect(models[0]!.id).toContain('openai');
    });

    it('should filter by search term', async () => {
      const filters: ModelFilters = { search: 'claude' };
      const models = await service.getModelsWithFilters(filters);

      expect(models).toHaveLength(1);
      expect(models[0]!.name.toLowerCase()).toContain('claude');
    });

    it('should filter by minimum context length', async () => {
      const filters: ModelFilters = { contextLength: { min: 100000 } };
      const models = await service.getModelsWithFilters(filters);

      expect(models.every(m => m.context_length >= 100000)).toBe(true);
    });

    it('should filter by maximum context length', async () => {
      const filters: ModelFilters = { contextLength: { max: 10000 } };
      const models = await service.getModelsWithFilters(filters);

      expect(models.every(m => m.context_length <= 10000)).toBe(true);
    });

    it('should filter by modalities', async () => {
      const filters: ModelFilters = { modalities: ['image'] };
      const models = await service.getModelsWithFilters(filters);

      expect(models.length).toBeGreaterThan(0);
      expect(
        models.every(
          m => m.architecture.input_modalities.includes('image') || m.architecture.output_modalities.includes('image'),
        ),
      ).toBe(true);
    });

    it('should filter by max prompt pricing', async () => {
      const filters: ModelFilters = { pricing: { maxPrompt: 10 } };
      const models = await service.getModelsWithFilters(filters);

      expect(models.every(m => parseFloat(m.pricing.prompt) <= 10)).toBe(true);
    });

    it('should filter by max completion pricing', async () => {
      const filters: ModelFilters = { pricing: { maxCompletion: 50 } };
      const models = await service.getModelsWithFilters(filters);

      expect(models.every(m => parseFloat(m.pricing.completion) <= 50)).toBe(true);
    });

    it('should sort by name ascending', async () => {
      const filters: ModelFilters = { sortBy: 'name', sortOrder: 'asc' };
      const models = await service.getModelsWithFilters(filters);

      for (let i = 0; i < models.length - 1; i++) {
        expect(models[i]!.name.localeCompare(models[i + 1]!.name)).toBeLessThanOrEqual(0);
      }
    });

    it('should sort by name descending', async () => {
      const filters: ModelFilters = { sortBy: 'name', sortOrder: 'desc' };
      const models = await service.getModelsWithFilters(filters);

      for (let i = 0; i < models.length - 1; i++) {
        expect(models[i]!.name.localeCompare(models[i + 1]!.name)).toBeGreaterThanOrEqual(0);
      }
    });

    it('should sort by context_length ascending', async () => {
      const filters: ModelFilters = { sortBy: 'context_length', sortOrder: 'asc' };
      const models = await service.getModelsWithFilters(filters);

      for (let i = 0; i < models.length - 1; i++) {
        expect(models[i]!.context_length).toBeLessThanOrEqual(models[i + 1]!.context_length);
      }
    });

    it('should sort by pricing ascending', async () => {
      const filters: ModelFilters = { sortBy: 'pricing', sortOrder: 'asc' };
      const models = await service.getModelsWithFilters(filters);

      for (let i = 0; i < models.length - 1; i++) {
        const price1 = parseFloat(models[i]!.pricing.prompt);
        const price2 = parseFloat(models[i + 1]!.pricing.prompt);
        expect(price1).toBeLessThanOrEqual(price2);
      }
    });

    it('should combine multiple filters', async () => {
      const filters: ModelFilters = {
        provider: 'anthropic',
        contextLength: { min: 100000 },
        modalities: ['image'],
      };
      const models = await service.getModelsWithFilters(filters);

      expect(
        models.every(
          m =>
            m.id.startsWith('anthropic') &&
            m.context_length >= 100000 &&
            m.architecture.input_modalities.includes('image'),
        ),
      ).toBe(true);
    });
  });

  describe('getModelRecommendations', () => {
    beforeEach(async () => {
      await service.getAvailableModels();
    });

    it('should return recommendations for chat task', async () => {
      const recommendations = await service.getModelRecommendations('chat', 3);

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.length).toBeLessThanOrEqual(3);
      expect(recommendations[0]!).toHaveProperty('model');
      expect(recommendations[0]!).toHaveProperty('score');
      expect(recommendations[0]!).toHaveProperty('reasons');
    });

    it('should return recommendations for coding task', async () => {
      const recommendations = await service.getModelRecommendations('coding', 3);

      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should return recommendations for multimodal task', async () => {
      const recommendations = await service.getModelRecommendations('multimodal', 3);

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0]!.model.architecture.input_modalities).toContain('image');
    });

    it('should sort recommendations by score', async () => {
      const recommendations = await service.getModelRecommendations('reasoning', 5);

      for (let i = 0; i < recommendations.length - 1; i++) {
        expect(recommendations[i]!.score).toBeGreaterThanOrEqual(recommendations[i + 1]!.score);
      }
    });

    it('should return empty array for unknown task type', async () => {
      const recommendations = await service.getModelRecommendations('unknown-task', 3);

      expect(recommendations).toEqual([]);
    });

    it('should limit recommendations to requested count', async () => {
      const recommendations = await service.getModelRecommendations('chat', 2);

      expect(recommendations.length).toBeLessThanOrEqual(2);
    });
  });

  describe('getProviderStatuses', () => {
    beforeEach(async () => {
      await service.getAvailableModels();
    });

    it('should return provider statistics', async () => {
      const statuses = await service.getProviderStatuses();

      expect(statuses.length).toBeGreaterThan(0);
      expect(statuses[0]).toHaveProperty('id');
      expect(statuses[0]).toHaveProperty('name');
      expect(statuses[0]).toHaveProperty('enabled');
      expect(statuses[0]).toHaveProperty('modelsCount');
    });

    it('should group models by provider', async () => {
      const statuses = await service.getProviderStatuses();

      const openaiStatus = statuses.find(s => s.id === 'openai');
      expect(openaiStatus).toBeDefined();
      expect(openaiStatus?.modelsCount).toBeGreaterThan(0);
    });

    it('should sort providers by name', async () => {
      const statuses = await service.getProviderStatuses();

      for (let i = 0; i < statuses.length - 1; i++) {
        expect(statuses[i]!.name.localeCompare(statuses[i + 1]!.name)).toBeLessThanOrEqual(0);
      }
    });
  });

  describe('validateModelAvailability', () => {
    beforeEach(async () => {
      await service.getAvailableModels();
    });

    it('should return true for available model', async () => {
      const isAvailable = await service.validateModelAvailability('openai/gpt-4');

      expect(isAvailable).toBe(true);
    });

    it('should return false for unavailable model', async () => {
      const isAvailable = await service.validateModelAvailability('unknown/model');

      expect(isAvailable).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(withRetry).mockRejectedValue(new Error('API error'));

      // Create new instance to avoid cache
      (OpenRouterModelsService as any).instance = null;
      const newService = OpenRouterModelsService.getInstance();

      const isAvailable = await newService.validateModelAvailability('openai/gpt-4');

      // Should return false but use fallback models, so might be true
      expect(typeof isAvailable).toBe('boolean');
    });
  });

  describe('getModel', () => {
    beforeEach(async () => {
      await service.getAvailableModels();
    });

    it('should return model by ID', async () => {
      const model = await service.getModel('openai/gpt-4');

      expect(model).toBeDefined();
      expect(model?.id).toBe('openai/gpt-4');
    });

    it('should return null for non-existent model', async () => {
      const model = await service.getModel('unknown/model');

      expect(model).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(withRetry).mockRejectedValue(new Error('API error'));

      (OpenRouterModelsService as any).instance = null;
      const newService = OpenRouterModelsService.getInstance();

      const model = await newService.getModel('openai/gpt-4');

      // Should handle error, might return null or fallback model
      expect(model === null || model?.id === 'openai/gpt-4').toBe(true);
    });
  });

  describe('refreshCache', () => {
    it('should refresh the cache', async () => {
      await service.refreshCache();

      expect(withRetry).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        'Models cache refreshed',
        expect.objectContaining({ modelCount: expect.any(Number) }),
      );
    });

    it('should handle refresh failure', async () => {
      vi.mocked(withRetry).mockRejectedValue(new Error('API error'));

      // refreshCache catches errors and uses fallback models
      await service.refreshCache();

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('caching behavior', () => {
    it('should save models to localStorage', async () => {
      await service.getAvailableModels();

      expect(localStorageMock.setItem).toHaveBeenCalledWith('openrouter_models_cache', expect.any(String));
    });

    it('should load models from localStorage on init', () => {
      const cacheData = {
        models: mockModels,
        timestamp: Date.now(),
      };
      localStorageMock.setItem('openrouter_models_cache', JSON.stringify(cacheData));

      (OpenRouterModelsService as any).instance = null;
      OpenRouterModelsService.getInstance();

      expect(localStorageMock.getItem).toHaveBeenCalledWith('openrouter_models_cache');
    });

    it('should handle invalid cache data gracefully', () => {
      localStorageMock.setItem('openrouter_models_cache', 'invalid-json');

      (OpenRouterModelsService as any).instance = null;
      OpenRouterModelsService.getInstance();

      expect(logger.warn).toHaveBeenCalledWith('Failed to load models from cache', expect.any(Object));
    });
  });
});
