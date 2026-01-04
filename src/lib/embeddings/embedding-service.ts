/**
 * Embedding Service
 * Generates vector embeddings using OpenAI API via OpenRouter
 */

import { logger } from '@/lib/logging/logger';
import {
  EMBEDDING_MODELS,
  type EmbeddingModel,
  type EmbeddingRequest,
  type EmbeddingResponse,
} from '@/types/embeddings';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1';

/**
 * OpenRouter API key from environment
 */
function getOpenRouterApiKey(): string {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_OPENROUTER_API_KEY not configured');
  }
  return apiKey;
}

/**
 * Validate embedding request
 */
function validateRequest(request: EmbeddingRequest): void {
  if (!request.texts || request.texts.length === 0) {
    throw new Error('Request must contain at least one text');
  }

  if (request.texts.length > 2048) {
    throw new Error('Maximum 2048 texts per request');
  }

  const modelConfig = EMBEDDING_MODELS[request.model];
  if (!modelConfig) {
    throw new Error(`Unknown model: ${request.model}`);
  }

  // Check token limits
  for (const text of request.texts) {
    const estimatedTokens = text.length / 4; // Rough estimate
    if (estimatedTokens > modelConfig.maxTokens) {
      throw new Error(
        `Text exceeds model max tokens (${modelConfig.maxTokens}). Consider chunking.`,
      );
    }
  }
}

/**
 * Calculate embedding generation cost
 */
function calculateCost(model: EmbeddingModel, inputTokens: number): number {
  const modelConfig = EMBEDDING_MODELS[model];
  return (inputTokens / 1000000) * modelConfig.costPer1MInputTokens;
}

/**
 * Call OpenRouter API to generate embeddings
 */
async function callOpenRouterAPI(request: EmbeddingRequest): Promise<EmbeddingResponse> {
  const apiKey = getOpenRouterApiKey();
  const modelConfig = EMBEDDING_MODELS[request.model];

  try {
    const response = await fetch(`${OPENROUTER_API_URL}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://novelist.ai',
        'X-Title': 'Novelist.ai',
      },
      body: JSON.stringify({
        model: request.model,
        input: request.texts,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('OpenRouter API error', {
        status: response.status,
        error: errorText,
      });
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    const rawEmbeddings: Array<{ embedding?: number[] }> = data.data;
    const embeddings: number[][] = rawEmbeddings
      .map(item => item.embedding ?? [])
      .filter((embedding: number[]) => embedding.length > 0) as number[][];

    const usage = data.usage
      ? {
          promptTokens: data.usage.prompt_tokens,
          totalTokens: data.usage.total_tokens,
        }
      : undefined;

    return {
      embeddings,
      model: request.model,
      dimensions: modelConfig.dimensions,
      usage,
    };
  } catch (error) {
    logger.error('Failed to generate embeddings', {
      model: request.model,
      textCount: request.texts.length,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Generate embeddings for a single text
 */
export async function generateEmbedding(
  text: string,
  model: EmbeddingModel = 'text-embedding-3-small',
): Promise<number[]> {
  const request: EmbeddingRequest = {
    texts: [text],
    model,
  };

  validateRequest(request);

  const response = await callOpenRouterAPI(request);

  if (response.embeddings.length === 0 || response.embeddings[0] === undefined) {
    throw new Error('No embeddings returned from API');
  }

  return response.embeddings[0] as number[];
}

/**
 * Generate embeddings for multiple texts (batch)
 */
export async function generateEmbeddings(
  texts: string[],
  model: EmbeddingModel = 'text-embedding-3-small',
): Promise<{ embeddings: number[][]; cost: number; tokenCount: number }> {
  const request: EmbeddingRequest = {
    texts,
    model,
  };

  validateRequest(request);

  const response = await callOpenRouterAPI(request);

  const cost = response.usage ? calculateCost(model, response.usage.promptTokens) : 0;
  const tokenCount = response.usage?.promptTokens ?? 0;

  logger.info('Generated batch embeddings', {
    model,
    count: texts.length,
    cost,
    tokens: tokenCount,
  });

  return {
    embeddings: response.embeddings,
    cost,
    tokenCount,
  };
}

/**
 * Check if embedding service is available
 */
export function isEmbeddingServiceAvailable(): boolean {
  try {
    getOpenRouterApiKey();
    return true;
  } catch {
    return false;
  }
}

/**
 * Get default embedding model
 */
export function getDefaultEmbeddingModel(): EmbeddingModel {
  return 'text-embedding-3-small';
}

/**
 * Get embedding model dimensions
 */
export function getEmbeddingDimensions(model: EmbeddingModel): number {
  return EMBEDDING_MODELS[model].dimensions;
}
