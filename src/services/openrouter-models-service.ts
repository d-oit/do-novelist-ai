/**
 * OpenRouter Models Service
 * Dynamic model discovery, caching, and management
 */

import { getAIConfig } from '@/lib/ai-config';
import { logger } from '@/lib/logging/logger';

export interface OpenRouterModel {
  id: string;
  canonical_slug: string;
  name: string;
  created: number;
  description: string;
  context_length: number;
  architecture: {
    input_modalities: string[];
    output_modalities: string[];
    tokenizer: string;
    instruct_type: string | null;
  };
  pricing: {
    prompt: string;
    completion: string;
    request: string;
    image: string;
    web_search: string;
    internal_reasoning: string;
    input_cache_read: string;
    input_cache_write: string;
  };
  top_provider: {
    context_length: number;
    max_completion_tokens: number;
    is_moderated: boolean;
  };
  per_request_limits: string | null;
  supported_parameters: string[];
}

export interface ModelFilters {
  provider?: string;
  contextLength?: { min?: number; max?: number };
  modalities?: string[];
  pricing?: { maxPrompt?: number; maxCompletion?: number };
  search?: string;
  sortBy?: 'name' | 'context_length' | 'pricing' | 'created';
  sortOrder?: 'asc' | 'desc';
}

export interface ProviderStatus {
  id: string;
  name: string;
  enabled: boolean;
  modelsCount: number;
  avgLatency: number;
  successRate: number;
  lastHealthCheck: string;
  status: 'operational' | 'degraded' | 'outage';
}

export interface ModelRecommendation {
  model: OpenRouterModel;
  score: number;
  reasons: string[];
  taskTypes: string[];
}

const CACHE_KEY = 'openrouter_models_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const FALLBACK_MODELS = [
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    description: 'OpenAI latest multimodal model',
    context_length: 128000,
    architecture: {
      input_modalities: ['text', 'image'],
      output_modalities: ['text'],
      tokenizer: 'cl100k_base',
      instruct_type: 'chat',
    },
    pricing: {
      prompt: '2.5',
      completion: '10.0',
      request: '0',
      image: '0',
      web_search: '0',
      internal_reasoning: '0',
      input_cache_read: '0',
      input_cache_write: '0',
    },
    supported_parameters: ['tools', 'tool_choice', 'max_tokens', 'temperature', 'top_p'],
    top_provider: {
      context_length: 128000,
      max_completion_tokens: 16384,
      is_moderated: true,
    },
  },
  {
    id: 'anthropic/claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    description: 'Anthropic advanced reasoning model',
    context_length: 200000,
    architecture: {
      input_modalities: ['text', 'image'],
      output_modalities: ['text'],
      tokenizer: 'claude',
      instruct_type: 'messages',
    },
    pricing: {
      prompt: '3.0',
      completion: '15.0',
      request: '0',
      image: '0',
      web_search: '0',
      internal_reasoning: '0',
      input_cache_read: '0',
      input_cache_write: '0',
    },
    supported_parameters: ['tools', 'tool_choice', 'max_tokens', 'temperature', 'top_p'],
    top_provider: {
      context_length: 200000,
      max_completion_tokens: 8192,
      is_moderated: true,
    },
  },
  {
    id: 'google/gemini-2.0-flash-exp',
    name: 'Gemini 2.0 Flash',
    description: 'Google latest fast multimodal model',
    context_length: 1000000,
    architecture: {
      input_modalities: ['text', 'image', 'video'],
      output_modalities: ['text'],
      tokenizer: 'gemini',
      instruct_type: 'chat',
    },
    pricing: {
      prompt: '0.075',
      completion: '0.3',
      request: '0',
      image: '0',
      web_search: '0',
      internal_reasoning: '0',
      input_cache_read: '0',
      input_cache_write: '0',
    },
    supported_parameters: ['tools', 'tool_choice', 'max_tokens', 'temperature', 'top_p'],
    top_provider: {
      context_length: 1000000,
      max_completion_tokens: 8192,
      is_moderated: true,
    },
  },
] as OpenRouterModel[];

export class OpenRouterModelsService {
  private static instance: OpenRouterModelsService;
  private cache: { models: OpenRouterModel[]; timestamp: number } | null = null;
  private fetchPromise: Promise<OpenRouterModel[]> | null = null;

  private constructor() {
    this.loadFromCache();
  }

  public static getInstance(): OpenRouterModelsService {
    if (!OpenRouterModelsService.instance) {
      OpenRouterModelsService.instance = new OpenRouterModelsService();
    }
    return OpenRouterModelsService.instance;
  }

  /**
   * Get all available models from OpenRouter
   */
  public async getAvailableModels(): Promise<OpenRouterModel[]> {
    // Check cache first
    if (this.isCacheValid()) {
      return this.cache?.models ?? [];
    }

    // Check if already fetching
    if (this.fetchPromise) {
      return this.fetchPromise;
    }

    // Start fetching
    this.fetchPromise = this.fetchModelsFromAPI();

    try {
      const models = await this.fetchPromise;
      this.saveToCache(models);
      return models;
    } finally {
      this.fetchPromise = null;
    }
  }

  /**
   * Get models with search and filtering
   */
  public async getModelsWithFilters(filters: ModelFilters): Promise<OpenRouterModel[]> {
    const allModels = await this.getAvailableModels();

    let filteredModels = [...allModels];

    // Provider filter
    if (filters.provider) {
      filteredModels = filteredModels.filter(model => model.id.startsWith(filters.provider!));
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredModels = filteredModels.filter(
        model =>
          model.name.toLowerCase().includes(searchLower) ||
          model.description.toLowerCase().includes(searchLower) ||
          model.id.toLowerCase().includes(searchLower),
      );
    }

    // Context length filter
    if (filters.contextLength) {
      if (filters.contextLength.min !== undefined) {
        filteredModels = filteredModels.filter(
          model => model.context_length >= filters.contextLength!.min!,
        );
      }
      if (filters.contextLength.max !== undefined) {
        filteredModels = filteredModels.filter(
          model => model.context_length <= filters.contextLength!.max!,
        );
      }
    }

    // Modalities filter
    if (filters.modalities && filters.modalities.length > 0) {
      filteredModels = filteredModels.filter(model =>
        filters.modalities!.some(
          modality =>
            model.architecture.input_modalities.includes(modality) ||
            model.architecture.output_modalities.includes(modality),
        ),
      );
    }

    // Pricing filter
    if (filters.pricing) {
      if (filters.pricing.maxPrompt !== undefined) {
        filteredModels = filteredModels.filter(
          model => parseFloat(model.pricing.prompt) <= filters.pricing!.maxPrompt!,
        );
      }
      if (filters.pricing.maxCompletion !== undefined) {
        filteredModels = filteredModels.filter(
          model => parseFloat(model.pricing.completion) <= filters.pricing!.maxCompletion!,
        );
      }
    }

    // Sorting
    if (filters.sortBy) {
      filteredModels.sort((a, b) => {
        let aValue: number | string;
        let bValue: number | string;

        switch (filters.sortBy) {
          case 'name':
            aValue = a.name;
            bValue = b.name;
            break;
          case 'context_length':
            aValue = a.context_length;
            bValue = b.context_length;
            break;
          case 'pricing':
            aValue = parseFloat(a.pricing.prompt);
            bValue = parseFloat(b.pricing.prompt);
            break;
          case 'created':
            aValue = a.created;
            bValue = b.created;
            break;
          default:
            return 0;
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return filters.sortOrder === 'desc'
            ? bValue.localeCompare(aValue)
            : aValue.localeCompare(bValue);
        } else {
          return filters.sortOrder === 'desc'
            ? (bValue as number) - (aValue as number)
            : (aValue as number) - (bValue as number);
        }
      });
    }

    return filteredModels;
  }

  /**
   * Get model recommendations based on task type
   */
  public async getModelRecommendations(
    taskType: string,
    count: number = 5,
  ): Promise<ModelRecommendation[]> {
    const allModels = await this.getAvailableModels();
    const recommendations: ModelRecommendation[] = [];

    // Task type mapping to model characteristics
    const taskMappings: Record<
      string,
      {
        modalities?: string[];
        features?: string[];
        context?: number;
        pricing?: string;
        speed?: string;
      }
    > = {
      chat: { modalities: ['text'], context: 8000, pricing: 'low' },
      coding: { modalities: ['text'], features: ['tools'], context: 32000, pricing: 'medium' },
      reasoning: { context: 128000, features: ['tools'], pricing: 'high' },
      multimodal: { modalities: ['image', 'video'], context: 16000, pricing: 'high' },
      fast: { pricing: 'low', speed: 'high' },
      creative: { context: 32000, pricing: 'medium' },
      analysis: { context: 128000, pricing: 'high' },
      embedding: { modalities: ['text'], features: ['embeddings'] },
    };

    const taskConfig = taskMappings[taskType as keyof typeof taskMappings];
    if (!taskConfig) {
      return [];
    }

    for (const model of allModels) {
      let score = 0;
      const reasons: string[] = [];
      const taskTypes: string[] = [];

      // Score based on task match
      if (taskConfig.modalities) {
        const hasModalities = taskConfig.modalities.some((modality: string) =>
          model.architecture.input_modalities.includes(modality),
        );
        if (hasModalities) {
          score += 30;
          reasons.push(`Supports ${taskConfig.modalities.join(', ')}`);
          taskTypes.push('multimodal');
        }
      }

      if (taskConfig.features) {
        const hasFeatures = taskConfig.features.some(
          (feature: string) =>
            model.supported_parameters.includes(feature) || model.id.includes(feature),
        );
        if (hasFeatures) {
          score += 25;
          reasons.push(`Supports ${taskConfig.features.join(', ')}`);
          taskTypes.push('advanced');
        }
      }

      // Score based on context length
      if (taskConfig.context) {
        if (model.context_length >= taskConfig.context) {
          score += 20;
          reasons.push(`High context window (${model.context_length.toLocaleString()} tokens)`);
          taskTypes.push('long-context');
        }
      }

      // Score based on pricing
      if (taskConfig.pricing) {
        const promptPrice = parseFloat(model.pricing.prompt);
        const completionPrice = parseFloat(model.pricing.completion);
        const avgPrice = (promptPrice + completionPrice) / 2;

        switch (taskConfig.pricing) {
          case 'low':
            if (avgPrice <= 0.1) {
              score += 15;
              reasons.push('Cost-effective');
              taskTypes.push('economical');
            }
            break;
          case 'medium':
            if (avgPrice <= 1.0) {
              score += 10;
              reasons.push('Good value');
              taskTypes.push('balanced');
            }
            break;
          case 'high':
            if (avgPrice > 1.0) {
              score += 10;
              reasons.push('Premium quality');
              taskTypes.push('premium');
            }
            break;
        }
      }

      // Popularity boost (models from major providers)
      const majorProviders = ['openai', 'anthropic', 'google'];
      if (majorProviders.some(provider => model.id.startsWith(provider))) {
        score += 10;
        reasons.push('Established provider');
        taskTypes.push('reliable');
      }

      if (score > 0) {
        recommendations.push({
          model,
          score,
          reasons,
          taskTypes: [...new Set(taskTypes)],
        });
      }
    }

    // Sort by score and return top recommendations
    return recommendations.sort((a, b) => b.score - a.score).slice(0, count);
  }

  /**
   * Get provider statistics
   */
  public async getProviderStatuses(): Promise<ProviderStatus[]> {
    const allModels = await this.getAvailableModels();
    const providerMap = new Map<string, OpenRouterModel[]>();

    // Group models by provider
    for (const model of allModels) {
      const provider = model.id.split('/')[0] || '';
      if (!providerMap.has(provider)) {
        providerMap.set(provider, []);
      }
      providerMap.get(provider)!.push(model);
    }

    const config = getAIConfig();
    const statuses: ProviderStatus[] = [];

    for (const [provider, models] of providerMap) {
      const providerConfig = config.providers[provider as keyof typeof config.providers];

      statuses.push({
        id: provider,
        name: provider.charAt(0).toUpperCase() + provider.slice(1),
        enabled: providerConfig?.enabled ?? false,
        modelsCount: models.length,
        avgLatency: 0,
        successRate: 0,
        lastHealthCheck: new Date().toISOString(),
        status: providerConfig?.enabled ? 'operational' : 'outage',
      });
    }

    return statuses.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Validate model availability
   */
  public async validateModelAvailability(modelId: string): Promise<boolean> {
    try {
      const models = await this.getAvailableModels();
      return models.some(model => model.id === modelId);
    } catch (error) {
      logger.error('Failed to validate model availability', { modelId, error });
      return false;
    }
  }

  /**
   * Get model by ID
   */
  public async getModel(modelId: string): Promise<OpenRouterModel | null> {
    try {
      const models = await this.getAvailableModels();
      return models.find(model => model.id === modelId) ?? null;
    } catch (error) {
      logger.error('Failed to get model', { modelId, error });
      return null;
    }
  }

  /**
   * Refresh models cache
   */
  public async refreshCache(): Promise<void> {
    try {
      const models = await this.fetchModelsFromAPI();
      this.saveToCache(models);
      logger.info('Models cache refreshed', { modelCount: models.length });
    } catch (error) {
      logger.error('Failed to refresh models cache', { error });
      throw error;
    }
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(): boolean {
    if (!this.cache) return false;
    return Date.now() - this.cache.timestamp < CACHE_DURATION;
  }

  /**
   * Load models from cache
   */
  private loadFromCache(): void {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        this.cache = parsed;
      }
    } catch (error) {
      logger.warn('Failed to load models from cache', { error });
      this.cache = null;
    }
  }

  /**
   * Save models to cache
   */
  private saveToCache(models: OpenRouterModel[]): void {
    try {
      this.cache = {
        models,
        timestamp: Date.now(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(this.cache));
    } catch (error) {
      logger.warn('Failed to save models to cache', { error });
    }
  }

  /**
   * Fetch models from OpenRouter API via Edge Functions
   */
  private async fetchModelsFromAPI(): Promise<OpenRouterModel[]> {
    try {
      const response = await fetch('/api/ai/models', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch models: ${response.status} ${errorText}`);
      }

      const data = await response.json();

      if (!data.models || !Array.isArray(data.models)) {
        throw new Error('Invalid response format from API');
      }

      logger.info('Fetched models from Edge API', { modelCount: data.models.length });
      return data.models;
    } catch (error) {
      logger.error('Failed to fetch models from Edge API', { error });

      // Return fallback models for development/offline scenarios
      logger.warn('Using fallback models due to API error');
      return FALLBACK_MODELS;
    }
  }
}

// Export singleton instance
export const openRouterModelsService = OpenRouterModelsService.getInstance();
