/**
 * OpenRouter Auto Router and Model Variants Service
 * Handles advanced OpenRouter features like Auto Router and model variants
 */

import { getAIConfig } from '@/lib/ai-config';
import { logger } from '@/lib/logging/logger';

import { openRouterModelsService, type OpenRouterModel } from './openrouter-models-service';

export type ModelVariant =
  | '' // No variant (default)
  | ':free' // Free tier models
  | ':extended' // Extended context window
  | ':exacto' // Exact provider selection
  | ':thinking' // Enhanced reasoning
  | ':online' // Web search enabled
  | ':nitro' // High-speed inference
  | ':distillable' // Compliant for distillation
  | ':safe' // Content safety enabled
  | ':fast' // Fast inference optimized
  | ':reasoning'; // Advanced reasoning models;

export interface ModelVariantConfig {
  variant: ModelVariant;
  name: string;
  description: string;
  features: string[];
  useCase: string;
  costImpact: 'free' | 'reduced' | 'same' | 'increased' | 'premium';
  availability: 'universal' | 'limited' | 'selective';
}

export const MODEL_VARIANTS: Record<ModelVariant, ModelVariantConfig> = {
  '': {
    variant: '',
    name: 'Standard',
    description: 'Default model without variants',
    features: [],
    useCase: 'General purpose usage',
    costImpact: 'same',
    availability: 'universal',
  },
  ':free': {
    variant: ':free',
    name: 'Free Tier',
    description: 'Free tier models with rate limits',
    features: ['rate_limited', 'no_guarantee'],
    useCase: 'Testing and light usage',
    costImpact: 'free',
    availability: 'limited',
  },
  ':extended': {
    variant: ':extended',
    name: 'Extended Context',
    description: 'Extended context window models',
    features: ['extended_context', 'long_documents'],
    useCase: 'Long documents and conversations',
    costImpact: 'increased',
    availability: 'limited',
  },
  ':exacto': {
    variant: ':exacto',
    name: 'Exact Provider',
    description: 'Target specific providers selected by OpenRouter',
    features: ['provider_control', 'reliable_routing'],
    useCase: 'When provider selection matters',
    costImpact: 'same',
    availability: 'limited',
  },
  ':thinking': {
    variant: ':thinking',
    name: 'Thinking Mode',
    description: 'Enhanced reasoning capabilities',
    features: ['advanced_reasoning', 'step_by_step'],
    useCase: 'Complex reasoning and analysis',
    costImpact: 'premium',
    availability: 'selective',
  },
  ':online': {
    variant: ':online',
    name: 'Online Search',
    description: 'Real-time web search enabled',
    features: ['web_search', 'current_info', 'citations'],
    useCase: 'Research and fact-checking',
    costImpact: 'increased',
    availability: 'selective',
  },
  ':nitro': {
    variant: ':nitro',
    name: 'High-Speed',
    description: 'Optimized for fastest inference',
    features: ['low_latency', 'high_throughput'],
    useCase: 'Real-time applications',
    costImpact: 'increased',
    availability: 'limited',
  },
  ':distillable': {
    variant: ':distillable',
    name: 'Distillable',
    description: 'Compliant for distillation and training',
    features: ['distillation_safe', 'training_ok'],
    useCase: 'Model training and fine-tuning',
    costImpact: 'same',
    availability: 'limited',
  },
  ':safe': {
    variant: ':safe',
    name: 'Content Safe',
    description: 'Enhanced content safety and moderation',
    features: ['content_moderation', 'safety_filters'],
    useCase: 'Sensitive content and safety-critical applications',
    costImpact: 'same',
    availability: 'universal',
  },
  ':fast': {
    variant: ':fast',
    name: 'Fast Inference',
    description: 'Optimized for speed over quality',
    features: ['speed_optimized', 'quick_responses'],
    useCase: 'Simple tasks requiring quick responses',
    costImpact: 'reduced',
    availability: 'limited',
  },
  ':reasoning': {
    variant: ':reasoning',
    name: 'Advanced Reasoning',
    description: 'Specialized reasoning models',
    features: ['logical_reasoning', 'mathematical', 'analytical'],
    useCase: 'Complex problem solving and analysis',
    costImpact: 'premium',
    availability: 'selective',
  },
};

export interface AutoRouterRequest {
  taskType?:
    | 'chat'
    | 'completion'
    | 'analysis'
    | 'reasoning'
    | 'coding'
    | 'creative'
    | 'multimodal';
  context?: string;
  requirements?: {
    maxCost?: number;
    maxLatency?: number;
    minContext?: number;
    multimodal?: boolean;
    reasoning?: boolean;
  };
  fallback?: boolean;
}

export interface AutoRouterResponse {
  recommendedModel: string;
  confidence: number;
  alternatives: Array<{
    model: string;
    score: number;
    reason: string;
  }>;
  metadata: {
    selectionCriteria: string[];
    estimatedCost: number;
    estimatedLatency: number;
    features: string[];
  };
}

export class OpenRouterAdvancedService {
  private static instance: OpenRouterAdvancedService;

  private constructor() {}

  public static getInstance(): OpenRouterAdvancedService {
    if (!OpenRouterAdvancedService.instance) {
      OpenRouterAdvancedService.instance = new OpenRouterAdvancedService();
    }
    return OpenRouterAdvancedService.instance;
  }

  /**
   * Apply model variant to model ID
   */
  public applyModelVariant(modelId: string, variant: ModelVariant): string {
    if (!variant) {
      return modelId;
    }

    // Check if model already has a variant
    const hasVariant = /:[a-z]+$/.test(modelId);
    if (hasVariant) {
      // Replace existing variant
      return modelId.replace(/:[a-z]+$/, variant);
    }

    return `${modelId}${variant}`;
  }

  /**
   * Get available variants for a specific model
   */
  public async getAvailableVariantsForModel(modelId: string): Promise<ModelVariant[]> {
    try {
      const model = await openRouterModelsService.getModel(modelId);
      if (!model) {
        return ['']; // Only standard variant available
      }

      const availableVariants: ModelVariant[] = ['']; // Always available

      // Check which variants are supported based on model characteristics
      const provider = modelId.split('/')[0];

      // Universal variants (available for most models)
      availableVariants.push(':free', ':safe');

      // Provider-specific variants
      if (['openai', 'anthropic', 'google'].includes(provider || '')) {
        availableVariants.push(':extended', ':nitro');
      }

      // Reasoning-capable models
      if (
        model.supported_parameters.includes('reasoning') ||
        model.id.includes('reasoning') ||
        model.id.includes('claude-3-5-sonnet')
      ) {
        availableVariants.push(':thinking', ':reasoning');
      }

      // Web search capable models
      if (model.supported_parameters.includes('web_search') || provider === 'perplexity') {
        availableVariants.push(':online');
      }

      // Long context models
      if (model.context_length > 50000) {
        availableVariants.push(':extended');
      }

      // Cost-optimized variants
      if (parseFloat(model.pricing.prompt) < 0.5) {
        availableVariants.push(':fast');
      }

      return [...new Set(availableVariants)];
    } catch (error) {
      logger.error('Failed to get available variants for model', { modelId, error });
      return [''];
    }
  }

  /**
   * Auto Router - select best model for task
   */
  public async selectBestModel(request: AutoRouterRequest): Promise<AutoRouterResponse> {
    try {
      const config = getAIConfig();
      if (!config.enableAutoRouting) {
        throw new Error('Auto routing is not enabled in configuration');
      }

      const allModels = await openRouterModelsService.getAvailableModels();

      // Filter models based on requirements
      let candidateModels = [...allModels];

      if (request.requirements) {
        const { maxCost, minContext, multimodal, reasoning } = request.requirements;

        if (maxCost !== undefined) {
          candidateModels = candidateModels.filter(
            model => parseFloat(model.pricing.prompt) <= maxCost,
          );
        }

        if (minContext !== undefined) {
          candidateModels = candidateModels.filter(model => model.context_length >= minContext);
        }

        if (multimodal) {
          candidateModels = candidateModels.filter(model =>
            model.architecture.input_modalities.includes('image'),
          );
        }

        if (reasoning) {
          candidateModels = candidateModels.filter(
            model =>
              model.supported_parameters.includes('reasoning') ||
              model.id.includes('reasoning') ||
              model.id.includes('claude-3-5-sonnet'),
          );
        }
      }

      // Score models based on task type and features
      const scoredModels = candidateModels.map(model => ({
        model,
        score: this.calculateModelScore(model, request),
        reason: this.getSelectionReason(model, request),
      }));

      // Sort by score and get top candidates
      scoredModels.sort((a, b) => b.score - a.score);

      const topModel = scoredModels[0];
      if (!topModel) {
        throw new Error('No suitable models found for the request');
      }

      // Generate alternatives (top 3 other models)
      const alternatives = scoredModels.slice(1, 4).map(scored => ({
        model: scored.model.id,
        score: scored.score,
        reason: scored.reason,
      }));

      return {
        recommendedModel: topModel.model.id,
        confidence: Math.min(topModel.score / 100, 1),
        alternatives,
        metadata: {
          selectionCriteria: this.getSelectionCriteria(request),
          estimatedCost: this.estimateCost(topModel.model),
          estimatedLatency: 1000, // Simple estimate for now
          features: topModel.model.supported_parameters.slice(0, 5),
        },
      };
    } catch (error) {
      logger.error('Auto routing failed', { request, error });
      throw error;
    }
  }

  /**
   * Calculate model score for a request
   */
  private calculateModelScore(model: OpenRouterModel, request: AutoRouterRequest): number {
    let score = 50; // Base score

    // Task type matching
    if (request.taskType) {
      const provider = model.id.split('/')[0];

      switch (request.taskType) {
        case 'chat':
          if (provider === 'openai' || provider === 'anthropic') score += 20;
          break;
        case 'coding':
          if (
            model.supported_parameters.includes('tools') ||
            model.id.includes('code') ||
            provider === 'anthropic'
          )
            score += 25;
          break;
        case 'reasoning':
          if (
            model.supported_parameters.includes('reasoning') ||
            model.id.includes('reasoning') ||
            provider === 'anthropic'
          )
            score += 30;
          break;
        case 'multimodal':
          if (model.architecture.input_modalities.includes('image')) score += 25;
          break;
        case 'creative':
          if (provider === 'openai' || provider === 'anthropic') score += 15;
          break;
        case 'analysis':
          if (model.context_length > 50000) score += 20;
          break;
      }
    }

    // Cost consideration
    const promptCost = parseFloat(model.pricing.prompt);
    if (promptCost <= 0.1) score += 15;
    else if (promptCost <= 1.0) score += 10;
    else if (promptCost <= 5.0) score += 5;

    // Context length bonus
    if (model.context_length > 100000) score += 10;
    else if (model.context_length > 50000) score += 5;

    // Provider reliability (popular providers get bonus)
    const majorProviders = ['openai', 'anthropic', 'google', 'mistral'];
    if (majorProviders.includes(model.id.split('/')[0] || '')) score += 10;

    // Model maturity (newer models get slight bonus)
    if (model.created > Date.now() - 365 * 24 * 60 * 60 * 1000) score += 5;

    return Math.min(score, 100);
  }

  /**
   * Get reason for model selection
   */
  private getSelectionReason(model: OpenRouterModel, request: AutoRouterRequest): string {
    const provider = model.id.split('/')[0] || '';
    const reasons: string[] = [];

    if (request.taskType) {
      switch (request.taskType) {
        case 'chat':
          if (['openai', 'anthropic'].includes(provider)) {
            reasons.push('Optimized for conversational AI');
          }
          break;
        case 'coding':
          if (model.supported_parameters.includes('tools')) {
            reasons.push('Supports function calling for code tasks');
          }
          break;
        case 'reasoning':
          if (model.supported_parameters.includes('reasoning')) {
            reasons.push('Advanced reasoning capabilities');
          }
          break;
        case 'multimodal':
          if (model.architecture.input_modalities.includes('image')) {
            reasons.push('Multimodal capabilities');
          }
          break;
      }
    }

    // Context length reason
    if (model.context_length > 100000) {
      reasons.push('Extended context window');
    }

    // Cost reason
    const promptCost = parseFloat(model.pricing.prompt);
    if (promptCost <= 0.1) {
      reasons.push('Cost-effective');
    }

    return reasons.join(', ') || 'Good general performance';
  }

  /**
   * Get selection criteria used
   */
  private getSelectionCriteria(request: AutoRouterRequest): string[] {
    const criteria: string[] = [];

    if (request.taskType) {
      criteria.push(`Task type: ${request.taskType}`);
    }

    if (request.requirements) {
      const { maxCost, maxLatency, minContext, multimodal, reasoning } = request.requirements;

      if (maxCost !== undefined) criteria.push(`Max cost: $${maxCost}`);
      if (maxLatency !== undefined) criteria.push(`Max latency: ${maxLatency}ms`);
      if (minContext !== undefined) criteria.push(`Min context: ${minContext} tokens`);
      if (multimodal) criteria.push('Multimodal required');
      if (reasoning) criteria.push('Reasoning required');
    }

    return criteria;
  }

  /**
   * Estimate cost for model usage
   */
  private estimateCost(model: OpenRouterModel): number {
    const promptCost = parseFloat(model.pricing.prompt);
    const completionCost = parseFloat(model.pricing.completion);

    // Rough estimation: 1000 input tokens, 500 output tokens
    const estimatedInputTokens = 1000;
    const estimatedOutputTokens = 500;

    return (
      (promptCost * estimatedInputTokens) / 1000000 +
      (completionCost * estimatedOutputTokens) / 1000000
    );
  }

  /**
   * Get model variant information
   */
  public getModelVariantInfo(variant: ModelVariant): ModelVariantConfig {
    return MODEL_VARIANTS[variant];
  }

  /**
   * Check if variant is available for provider/model
   */
  public async isVariantAvailable(modelId: string, variant: ModelVariant): Promise<boolean> {
    if (!variant) return true;

    const availableVariants = await this.getAvailableVariantsForModel(modelId);
    return availableVariants.includes(variant);
  }
}

// Export singleton instance
export const openRouterAdvancedService = OpenRouterAdvancedService.getInstance();
