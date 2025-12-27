/**
 * API Gateway Middleware
 * Provides rate limiting, cost tracking, and request validation for AI API calls
 */

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
  requestsPerHour: 500,
  windowSizeMs: 60 * 1000,
};

const COST_LIMITS = {
  maxCostPerUserPerMonth: 5.0,
  alertThreshold: 0.8,
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

export function getClientIdFromRequest(req: {
  headers?: Record<string, unknown>;
  socket?: { remoteAddress?: string };
}): string {
  const forwarded = req.headers?.['x-forwarded-for'] as string;
  return (forwarded?.split(',')[0] ?? req.socket?.remoteAddress ?? 'unknown') as string;
}

export function checkRateLimitForClient(clientId: string): { allowed: boolean; remaining: number } {
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

export function calculateCostForModel(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const costs = MODEL_COSTS[model] ?? MODEL_COSTS['mistral/mistral-medium-latest'];
  const inputCost = (inputTokens / 1000) * (costs?.input ?? 0);
  const outputCost = (outputTokens / 1000) * (costs?.output ?? 0);
  return inputCost + outputCost;
}

export function trackCostForClient(
  clientId: string,
  cost: number,
): {
  totalCost: number;
  requestCount: number;
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
      requestCount: 1,
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
    requestCount: entry.requestCount,
    budgetRemaining: COST_LIMITS.maxCostPerUserPerMonth - entry.totalCost,
    shouldAlert,
  };
}

export function getCostInfoForClient(clientId: string): {
  totalCost: number;
  requestCount: number;
  budgetRemaining: number;
  shouldAlert: boolean;
} {
  const entry = costTrackingStore.get(clientId);
  if (!entry) {
    return {
      totalCost: 0,
      requestCount: 0,
      budgetRemaining: COST_LIMITS.maxCostPerUserPerMonth,
      shouldAlert: false,
    };
  }

  const shouldAlert =
    entry.totalCost >= COST_LIMITS.maxCostPerUserPerMonth * COST_LIMITS.alertThreshold;

  return {
    totalCost: entry.totalCost,
    requestCount: entry.requestCount,
    budgetRemaining: COST_LIMITS.maxCostPerUserPerMonth - entry.totalCost,
    shouldAlert,
  };
}

export function validateRequestBody<T>(
  body: unknown,
  requiredFields: string[],
): { valid: boolean; error?: string; data?: T } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a valid JSON object' };
  }

  const record = body as Record<string, unknown>;

  for (const field of requiredFields) {
    if (record[field] === undefined || record[field] === null) {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }

  return { valid: true, data: body as T };
}
