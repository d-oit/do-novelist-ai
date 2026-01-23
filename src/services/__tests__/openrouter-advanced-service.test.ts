/**
 * OpenRouterAdvancedService Tests
 * Tests advanced OpenRouter features like auto-routing and model variants
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { openRouterModelsService } from '../openrouter-models-service';
import { OpenRouterAdvancedService } from '../openrouter-advanced-service';

// Mock dependencies
vi.mock('../openrouter-models-service', () => ({
  openRouterModelsService: {
    getModel: vi.fn(),
    getAvailableModels: vi.fn(),
  },
}));

vi.mock('@/lib/ai-config', () => ({
  getAIConfig: vi.fn(() => ({
    enableAutoRouting: true,
  })),
}));

vi.mock('@/lib/logging/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe('OpenRouterAdvancedService', () => {
  let service: OpenRouterAdvancedService;

  const mockModel = {
    id: 'openai/gpt-4',
    name: 'GPT-4',
    context_length: 8192,
    pricing: { prompt: '30.0', completion: '60.0' },
    supported_parameters: ['temperature', 'top_p', 'tools'],
    architecture: { input_modalities: ['text'], output_modalities: ['text'] },
    created: Date.now(),
  };

  beforeEach(() => {
    service = OpenRouterAdvancedService.getInstance();
    vi.clearAllMocks();
  });

  describe('Model Variants', () => {
    it('should apply model variant to model ID', () => {
      const result = service.applyModelVariant('openai/gpt-4', ':free');
      
      expect(result).toBe('openai/gpt-4:free');
    });

    it('should replace existing variant', () => {
      const result = service.applyModelVariant('openai/gpt-4:extended', ':free');
      
      expect(result).toBe('openai/gpt-4:free');
    });

    it('should return original model ID for empty variant', () => {
      const result = service.applyModelVariant('openai/gpt-4', '');
      
      expect(result).toBe('openai/gpt-4');
    });

    it('should get variant information', () => {
      const info = service.getModelVariantInfo(':free');
      
      expect(info).toBeDefined();
      expect(info.name).toBe('Free Tier');
      expect(info.costImpact).toBe('free');
    });
  });

  describe('Available Variants', () => {
    it('should get available variants for a model', async () => {
      vi.mocked(openRouterModelsService.getModel).mockResolvedValue(mockModel as never);

      const variants = await service.getAvailableVariantsForModel('openai/gpt-4');
      
      expect(variants).toBeDefined();
      expect(variants).toContain('');
      expect(variants).toContain(':free');
      expect(variants).toContain(':safe');
    });

    it('should return only standard variant when model not found', async () => {
      vi.mocked(openRouterModelsService.getModel).mockResolvedValue(null);

      const variants = await service.getAvailableVariantsForModel('unknown/model');
      
      expect(variants).toEqual(['']);
    });

    it('should check if variant is available for model', async () => {
      vi.mocked(openRouterModelsService.getModel).mockResolvedValue(mockModel as never);

      const isAvailable = await service.isVariantAvailable('openai/gpt-4', ':free');
      
      expect(isAvailable).toBe(true);
    });
  });

  describe('Auto Router', () => {
    it('should select best model for task', async () => {
      vi.mocked(openRouterModelsService.getAvailableModels).mockResolvedValue([mockModel] as never);

      const result = await service.selectBestModel({
        taskType: 'chat',
      });
      
      expect(result).toBeDefined();
      expect(result.recommendedModel).toBe('openai/gpt-4');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.alternatives).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

    it('should filter models by cost requirements', async () => {
      const cheapModel = { ...mockModel, id: 'cheap/model', pricing: { prompt: '0.5', completion: '1.0' } };
      vi.mocked(openRouterModelsService.getAvailableModels).mockResolvedValue([mockModel, cheapModel] as never);

      const result = await service.selectBestModel({
        taskType: 'chat',
        requirements: { maxCost: 1.0 },
      });
      
      expect(result.recommendedModel).toBe('cheap/model');
    });

    it('should filter models by context length', async () => {
      const longContextModel = { ...mockModel, id: 'long/model', context_length: 200000 };
      vi.mocked(openRouterModelsService.getAvailableModels).mockResolvedValue([mockModel, longContextModel] as never);

      const result = await service.selectBestModel({
        taskType: 'analysis',
        requirements: { minContext: 100000 },
      });
      
      expect(result.recommendedModel).toBe('long/model');
    });

    it('should throw error when no suitable models found', async () => {
      vi.mocked(openRouterModelsService.getAvailableModels).mockResolvedValue([]);

      await expect(
        service.selectBestModel({ taskType: 'chat' })
      ).rejects.toThrow('No suitable models found');
    });
  });

  describe('Model Scoring', () => {
    it('should provide selection metadata', async () => {
      vi.mocked(openRouterModelsService.getAvailableModels).mockResolvedValue([mockModel] as never);

      const result = await service.selectBestModel({
        taskType: 'coding',
        requirements: { maxCost: 50, minContext: 8000 },
      });
      
      expect(result.metadata.selectionCriteria).toContain('Task type: coding');
      expect(result.metadata.selectionCriteria).toContain('Max cost: $50');
      expect(result.metadata.selectionCriteria).toContain('Min context: 8000 tokens');
      expect(result.metadata.estimatedCost).toBeGreaterThan(0);
    });

    it('should include alternative models', async () => {
      const models = [
        mockModel,
        { ...mockModel, id: 'anthropic/claude-3' },
        { ...mockModel, id: 'google/gemini-pro' },
      ];
      vi.mocked(openRouterModelsService.getAvailableModels).mockResolvedValue(models as never);

      const result = await service.selectBestModel({ taskType: 'chat' });
      
      expect(result.alternatives).toHaveLength(2);
      expect(result.alternatives[0]).toHaveProperty('model');
      expect(result.alternatives[0]).toHaveProperty('score');
      expect(result.alternatives[0]).toHaveProperty('reason');
    });
  });
});
