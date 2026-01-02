/**
 * API Gateway - Brainstorm
 * Serverless function for AI brainstorming operations
 * Implements rate limiting, cost tracking, and request validation
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { runtime: 'edge' };

interface BrainstormRequest {
  context: string;
  field: 'title' | 'style' | 'idea';
  provider?: string;
}

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1';

const DEFAULT_PROVIDER = 'mistral';

const MODEL_MAP: Record<string, string> = {
  mistral: 'mistral-small-latest',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-haiku-20241022',
  google: 'gemini-2.0-flash-exp',
};

const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  'anthropic/claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 },
  'anthropic/claude-3-5-haiku-20241022': { input: 0.001, output: 0.005 },
  'openai/gpt-4o': { input: 0.005, output: 0.015 },
  'openai/gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  'google/gemini-2.0-flash-exp': { input: 0.000075, output: 0.0003 },
  'google/gemini-exp-1206': { input: 0.001, output: 0.004 },
  'mistral/mistral-small-latest': { input: 0.0001, output: 0.0003 },
  'mistral/mistral-medium-latest': { input: 0.00025, output: 0.0008 },
  'mistral/mistral-large-latest': { input: 0.004, output: 0.012 },
  'nvidia/nemotron-3-nano-30b-a3b:free': { input: 0, output: 0 },
  'nvidia/llama-3.1-nemotron-70b-instruct': { input: 0.001, output: 0.001 },
  'meta-llama/llama-3.2-1b-instruct': { input: 0.0001, output: 0.0001 },
  'meta-llama/llama-3.1-8b-instruct': { input: 0.00015, output: 0.00015 },
  'meta-llama/llama-3.1-70b-instruct': { input: 0.0007, output: 0.0007 },
};

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface CostTrackingEntry {
  totalCost: number;
  requestCount: number;
  lastReset: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const costTrackingStore = new Map<string, CostTrackingEntry>();

const RATE_LIMIT = {
  requestsPerMinute: 60,
  windowSizeMs: 60 * 1000,
};

const COST_LIMITS = {
  maxCostPerUserPerMonth: 5.0,
  alertThreshold: 0.8,
};

function getClientId(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'] as string;
  return (forwarded?.split(',')[0] ?? req.socket?.remoteAddress ?? 'unknown') as string;
}

function checkRateLimit(clientId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(clientId);

  if (!entry || now >= entry.resetTime) {
    rateLimitStore.set(clientId, {
      count: 1,
      resetTime: now + RATE_LIMIT.windowSizeMs,
    });
    return { allowed: true, remaining: RATE_LIMIT.requestsPerMinute - 1 };
  }

  if (entry.count >= RATE_LIMIT.requestsPerMinute) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  return { allowed: true, remaining: RATE_LIMIT.requestsPerMinute - entry.count };
}

function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const costs = MODEL_COSTS[model] ?? MODEL_COSTS['mistral/mistral-medium-latest'];
  const inputCost = (inputTokens / 1000) * (costs?.input ?? 0);
  const outputCost = (outputTokens / 1000) * (costs?.output ?? 0);
  return inputCost + outputCost;
}

function trackCost(
  clientId: string,
  cost: number,
): {
  totalCost: number;
  budgetRemaining: number;
  shouldAlert: boolean;
} {
  const now = Date.now();
  const entry = costTrackingStore.get(clientId);

  if (!entry || new Date(now).getMonth() !== new Date(entry.lastReset).getMonth()) {
    costTrackingStore.set(clientId, {
      totalCost: cost,
      requestCount: 1,
      lastReset: now,
    });
    return {
      totalCost: cost,
      budgetRemaining: COST_LIMITS.maxCostPerUserPerMonth - cost,
      shouldAlert: false,
    };
  }

  entry.totalCost += cost;
  entry.requestCount += 1;

  const shouldAlert =
    entry.totalCost >= COST_LIMITS.maxCostPerUserPerMonth * COST_LIMITS.alertThreshold;

  return {
    totalCost: entry.totalCost,
    budgetRemaining: COST_LIMITS.maxCostPerUserPerMonth - entry.totalCost,
    shouldAlert,
  };
}

function log(
  level: 'info' | 'warn' | 'error' | 'debug',
  message: string,
  data?: Record<string, unknown>,
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...data,
  };

  switch (level) {
    case 'debug':
      console.debug(JSON.stringify(logEntry));
      break;
    case 'info':
      console.info(JSON.stringify(logEntry));
      break;
    case 'warn':
      console.warn(JSON.stringify(logEntry));
      break;
    case 'error':
      console.error(JSON.stringify(logEntry));
      break;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  log('info', 'Brainstorm API request', {
    method: req.method,
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
  });

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    log('error', 'OpenRouter API key not configured');
    res.status(500).json({ error: 'API configuration error' });
    return;
  }

  const { context, field, provider = DEFAULT_PROVIDER } = req.body as BrainstormRequest;

  if (!context || !field) {
    log('warn', 'Invalid request body', { error: 'Missing required fields: context, field' });
    res.status(400).json({ error: 'Missing required fields: context, field' });
    return;
  }

  const clientId = getClientId(req);
  const { allowed, remaining } = checkRateLimit(clientId);

  res.setHeader('X-RateLimit-Limit', '60');
  res.setHeader('X-RateLimit-Remaining', remaining.toString());

  if (!allowed) {
    res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: 60,
    });
    return;
  }

  log('debug', 'Brainstorming', {
    field,
    provider,
    contextLength: context.length,
  });

  let prompt = '';
  if (field === 'title') {
    prompt = `Generate a catchy book title for: "${context.substring(0, 500)}". Output ONLY title, nothing else.`;
  } else if (field === 'style') {
    prompt = `Suggest a genre/style for: "${context.substring(0, 500)}". Output ONLY style/genre, nothing else.`;
  } else if (field === 'idea') {
    prompt = `Enhance this book concept into a detailed paragraph: "${context.substring(0, 1000)}"`;
  }

  try {
    const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://novelist.ai',
        'X-Title': 'Novelist.ai',
      },
      body: JSON.stringify({
        model: `${provider}/${MODEL_MAP[provider] || MODEL_MAP.mistral}`,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      log('error', 'OpenRouter API error', {
        status: response.status,
        error: errorText,
      });
      res.status(response.status).json({
        error: 'OpenRouter request failed',
        details: errorText,
      });
      return;
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim().replace(/^"|"$/g, '') || '';

    const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0 };
    const modelName = `${provider}/${MODEL_MAP[provider] || MODEL_MAP.mistral}`;
    const modelCost = calculateCost(
      modelName,
      usage.prompt_tokens || 0,
      usage.completion_tokens || 0,
    );

    const costInfo = trackCost(clientId, modelCost);

    log('info', 'Brainstorm successful', {
      field,
      provider,
      cost: modelCost,
      totalCost: costInfo.totalCost,
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
    });

    res.setHeader('X-Request-Cost', modelCost.toString());
    res.setHeader('X-Total-Cost', costInfo.totalCost.toString());
    res.setHeader('X-Budget-Remaining', costInfo.budgetRemaining.toString());

    res.status(200).json({ text });
  } catch (error) {
    log('error', 'Brainstorm API error', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
