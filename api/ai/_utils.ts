/**
 * Shared utilities for AI API endpoints
 * Provides OpenRouter client, error handling, and usage metrics
 */

import { OpenRouter } from '@openrouter/sdk';
import type { VercelResponse } from '@vercel/node';

/**
 * Usage metrics from OpenRouter API
 */
export interface UsageMetrics {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost?: number; // In USD
}

/**
 * Standard API error class
 */
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Cached OpenRouter client (reused across invocations for performance)
 */
let cachedClient: OpenRouter | null = null;

/**
 * Get or create OpenRouter client instance
 * Reuses client across invocations to avoid cold start overhead
 */
export function getOpenRouterClient(): OpenRouter {
  if (cachedClient) {
    return cachedClient;
  }

  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new APIError('OPENROUTER_API_KEY not configured on server', 500, 'MISSING_API_KEY');
  }

  cachedClient = new OpenRouter({
    apiKey,
  });

  return cachedClient;
}

/**
 * Extract usage metrics from OpenRouter API response
 */
export function extractUsageMetrics(response: unknown): UsageMetrics | undefined {
  if (!response || typeof response !== 'object' || !('usage' in response)) {
    return undefined;
  }

  const usage = (
    response as {
      usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
    }
  ).usage;

  if (!usage) {
    return undefined;
  }

  return {
    promptTokens: usage.prompt_tokens ?? 0,
    completionTokens: usage.completion_tokens ?? 0,
    totalTokens: usage.total_tokens ?? 0,
  };
}

/**
 * Approximate costs per 1M tokens (from OpenRouter pricing)
 * Update these values based on current OpenRouter pricing
 */
const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  // Free models
  'nvidia/nemotron-3-nano-30b-a3b:free': { input: 0, output: 0 },

  // Anthropic models
  'anthropic/claude-3-5-sonnet-20241022': { input: 3.0, output: 15.0 },
  'anthropic/claude-3-5-haiku-20241022': { input: 1.0, output: 5.0 },

  // OpenAI models
  'openai/gpt-4o': { input: 2.5, output: 10.0 },
  'openai/gpt-4o-mini': { input: 0.15, output: 0.6 },

  // Mistral models
  'mistral/mistral-small-latest': { input: 0.2, output: 0.6 },
  'mistral/mistral-medium-latest': { input: 0.7, output: 2.1 },
  'mistral/mistral-large-latest': { input: 2.0, output: 6.0 },

  // Google models
  'google/gemini-2.0-flash-exp': { input: 0.0, output: 0.0 },
  'google/gemini-exp-1206': { input: 0.0, output: 0.0 },
};

/**
 * Estimate cost in USD for a given model and usage
 */
export function estimateCost(model: string, usage: UsageMetrics): number {
  const costs = MODEL_COSTS[model] || { input: 1.0, output: 3.0 }; // Default fallback

  const inputCost = (usage.promptTokens / 1_000_000) * costs.input;
  const outputCost = (usage.completionTokens / 1_000_000) * costs.output;

  return inputCost + outputCost;
}

/**
 * Handle API errors and send appropriate response
 */
export function handleAPIError(error: unknown, res: VercelResponse): void {
  console.error('[API Error]', error);

  if (error instanceof APIError) {
    res.status(error.statusCode).json({
      error: error.message,
      code: error.code,
    });
    return;
  }

  if (error instanceof Error) {
    res.status(500).json({
      error: error.message,
    });
    return;
  }

  res.status(500).json({
    error: 'Internal server error',
  });
}

/**
 * Validate request method and body
 */
export function validateRequest(
  req: { method?: string; body?: Record<string, unknown> },
  requiredFields: string[],
): void {
  if (req.method !== 'POST') {
    throw new APIError('Method not allowed', 405, 'METHOD_NOT_ALLOWED');
  }

  if (!req.body) {
    throw new APIError('Missing request body', 400, 'INVALID_REQUEST');
  }

  for (const field of requiredFields) {
    if (!(field in req.body)) {
      throw new APIError(`Missing required field: ${field}`, 400, 'INVALID_REQUEST');
    }
  }
}

/**
 * Sanitize input text (prevent injection, limit length)
 */
export function sanitizeInput(input: string, maxLength: number = 50000): string {
  return input.trim().slice(0, maxLength);
}

/**
 * Set CORS headers
 */
export function setCORSHeaders(res: VercelResponse): void {
  const allowedOrigin = process.env.FRONTEND_URL || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

/**
 * Cost tracking service (logs to console, can be extended to analytics)
 */
interface CostEntry {
  timestamp: number;
  userId: string;
  endpoint: string;
  provider: string;
  model: string;
  tokensUsed: number;
  estimatedCost: number;
}

class CostTracker {
  track(entry: Omit<CostEntry, 'timestamp'>): void {
    const fullEntry: CostEntry = {
      ...entry,
      timestamp: Date.now(),
    };

    // Log to console (in production, send to PostHog/Mixpanel/DataDog)
    console.log('[COST]', JSON.stringify(fullEntry));

    // TODO: Send to analytics service
    // analytics.track('ai_api_call', fullEntry);
  }
}

export const costTracker = new CostTracker();
