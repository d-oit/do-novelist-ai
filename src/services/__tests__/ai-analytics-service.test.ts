/**
 * AI Analytics Service Integration Tests
 * Tests for usage tracking, cost calculation, and budget management
 */

import { describe, expect, it, vi } from 'vitest';

import {
  calculateCost,
  getOptimizationRecommendations,
  compareProviderCosts,
  type EnhancedUsageStats,
  type BudgetInfo,
} from '@/services/ai-analytics-service';

vi.mock('@/lib/ai-config', async () => {
  const actual = await vi.importActual<any>('@/lib/ai-config');
  return {
    ...actual,
    getAIConfig: () => ({
      defaultProvider: 'google',
      openrouterApiKey: 'test',
      providers: {
        google: {
          enabled: true,
          models: { fast: 'gemini-2.0-flash-exp', standard: 'gemini-2.0-flash-exp', advanced: 'gemini-exp-1206' },
        },
        openai: { enabled: true, models: { fast: 'gpt-4o-mini', standard: 'gpt-4o', advanced: 'gpt-4o' } },
        anthropic: {
          enabled: true,
          models: {
            fast: 'claude-3-5-haiku-20241022',
            standard: 'claude-3-5-sonnet-20241022',
            advanced: 'claude-3-5-sonnet-20241022',
          },
        },
      },
    }),
  };
});

vi.mock('@/lib/db/index', async () => {
  const actual = await vi.importActual<any>('@/lib/db/index');
  return {
    ...actual,
    logUsageAnalytic: vi.fn().mockResolvedValue(undefined),
    getUserUsageStats: vi.fn().mockResolvedValue({
      totalRequests: 100,
      totalTokens: 50000,
      totalCost: 5.0,
      avgLatencyMs: 150,
      successRate: 95,
    }),
  };
});

vi.mock('@/lib/logging/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@/services/ai-config-service', async () => {
  const actual = await vi.importActual<any>('@/services/ai-config-service');
  return {
    ...actual,
    loadUserPreferences: vi.fn().mockResolvedValue({
      selectedProvider: 'google',
      selectedModel: 'gemini-2.0-flash-exp',
      monthlyBudget: 50,
      maxTokens: 4000,
    }),
  };
});

describe('AI Analytics Service - Cost Calculation', () => {
  describe('calculateCost', () => {
    it('calculates cost for known provider/model', () => {
      const cost = calculateCost('openai', 'gpt-4o', 1000000, 1000000);

      expect(cost.inputTokens).toBe(1000000);
      expect(cost.outputTokens).toBe(1000000);
      expect(cost.totalTokens).toBe(2000000);
      expect(cost.inputCost).toBe(2.5);
      expect(cost.outputCost).toBe(10.0);
      expect(cost.totalCost).toBe(12.5);
    });

    it('calculates cost for gpt-4o-mini (cheaper model)', () => {
      const cost = calculateCost('openai', 'gpt-4o-mini', 1000000, 1000000);

      expect(cost.totalCost).toBe(0.75); // 0.15 + 0.6 per 1M tokens
    });

    it('uses default pricing for unknown provider/model', () => {
      const cost = calculateCost('unknown', 'unknown-model', 1000000, 1000000);

      // Default pricing is 0.1 input / 0.4 output per 1M
      expect(cost.totalCost).toBe(0.5);
    });

    it('handles zero tokens', () => {
      const cost = calculateCost('openai', 'gpt-4o', 0, 0);

      expect(cost.totalTokens).toBe(0);
      expect(cost.totalCost).toBe(0);
    });

    it('handles fractional tokens', () => {
      const cost = calculateCost('openai', 'gpt-4o', 500000, 250000);

      expect(cost.totalTokens).toBe(750000);
      expect(cost.inputCost).toBe(1.25); // 0.5 * 2.5
      expect(cost.outputCost).toBe(2.5); // 0.25 * 10
    });

    it('calculates Google Gemini pricing correctly', () => {
      const cost = calculateCost('google', 'gemini-2.0-flash-exp', 1000000, 1000000);

      // gemini-2.0-flash-exp: 0.075 input / 0.3 output per 1M
      expect(cost.totalCost).toBe(0.375);
    });
  });
});

describe('AI Analytics Service - Optimization Recommendations', () => {
  const baseStats: EnhancedUsageStats = {
    totalRequests: 100,
    totalTokens: 50000,
    totalCost: 5.0,
    avgLatencyMs: 150,
    successRate: 95,
    providerBreakdown: [{ provider: 'openai' as const, tokens: 30000, cost: 4.0, requests: 60, successRate: 95 }],
    requestTypeBreakdown: [],
    costByProvider: [{ provider: 'openai' as const, cost: 4.0, percentage: 80 }],
    costByRequestType: [],
    timeSeriesData: [],
    totalBudget: 50,
    usedBudget: 5,
    budgetRemaining: 45,
  };

  const baseBudget: BudgetInfo = {
    totalBudget: 50,
    usedBudget: 5,
    remainingBudget: 45,
    usagePercentage: 10,
    projectedCost: 15,
    daysRemaining: 20,
    isNearLimit: false,
    isOverLimit: false,
  };

  describe('getOptimizationRecommendations', () => {
    it('returns none recommendation when well optimized', () => {
      const recommendations = getOptimizationRecommendations(baseStats, baseBudget);

      expect(recommendations.length).toBeGreaterThanOrEqual(1);
      const noneRec = recommendations.find(r => r.type === 'none');
      expect(noneRec).toBeDefined();
    });

    it('suggests cheaper provider when over budget', () => {
      const overBudget: BudgetInfo = {
        ...baseBudget,
        isOverLimit: true,
        usagePercentage: 110,
        usedBudget: 55,
        remainingBudget: -5,
      };

      const recommendations = getOptimizationRecommendations(baseStats, overBudget);

      const cheaperProviderRec = recommendations.find(r => r.type === 'cheaper_provider');
      expect(cheaperProviderRec).toBeDefined();
      expect(cheaperProviderRec?.action.provider).toBe('google');
    });

    it('suggests cheaper model when usage is high', () => {
      const highUsageStats: EnhancedUsageStats = {
        ...baseStats,
        costByProvider: [{ provider: 'openai' as const, cost: 30.0, percentage: 80 }],
      };

      const highUsageBudget: BudgetInfo = {
        ...baseBudget,
        usagePercentage: 70,
      };

      const recommendations = getOptimizationRecommendations(highUsageStats, highUsageBudget);

      const cheaperModelRec = recommendations.find(r => r.type === 'cheaper_model');
      expect(cheaperModelRec).toBeDefined();
      expect(cheaperModelRec?.action.model).toBe('gpt-4o-mini');
    });

    it('suggests reducing tokens for high usage', () => {
      const highTokenStats: EnhancedUsageStats = {
        ...baseStats,
        totalTokens: 150000,
        totalCost: 15.0,
      };

      const recommendations = getOptimizationRecommendations(highTokenStats, baseBudget);

      const reduceTokensRec = recommendations.find(r => r.type === 'reduce_tokens');
      expect(reduceTokensRec).toBeDefined();
      expect(reduceTokensRec?.action.maxTokens).toBe(2000);
    });
  });
});

describe('AI Analytics Service - Provider Cost Comparison', () => {
  it('sorts providers by cost descending', () => {
    const stats: EnhancedUsageStats = {
      totalRequests: 100,
      totalTokens: 100000,
      totalCost: 10.0,
      avgLatencyMs: 150,
      successRate: 95,
      providerBreakdown: [
        { provider: 'openai' as const, tokens: 60000, cost: 7.0, requests: 60, successRate: 95 },
        { provider: 'google' as const, tokens: 40000, cost: 3.0, requests: 40, successRate: 98 },
      ],
      requestTypeBreakdown: [],
      costByProvider: [
        { provider: 'openai' as const, cost: 7.0, percentage: 70 },
        { provider: 'google' as const, cost: 3.0, percentage: 30 },
      ],
      costByRequestType: [],
      timeSeriesData: [],
      totalBudget: 50,
      usedBudget: 10,
      budgetRemaining: 40,
    };

    const comparison = compareProviderCosts(stats);

    expect(comparison.length).toBe(2);
    expect(comparison[0]?.provider).toBe('openai');
    expect(comparison[0]?.cost).toBe(7.0);
    expect(comparison[1]?.provider).toBe('google');
    expect(comparison[1]?.cost).toBe(3.0);
  });

  it('calculates efficiency metric', () => {
    const stats: EnhancedUsageStats = {
      totalRequests: 100,
      totalTokens: 100000,
      totalCost: 10.0,
      avgLatencyMs: 150,
      successRate: 95,
      providerBreakdown: [{ provider: 'openai' as const, tokens: 100000, cost: 10.0, requests: 100, successRate: 95 }],
      requestTypeBreakdown: [],
      costByProvider: [{ provider: 'openai' as const, cost: 10.0, percentage: 100 }],
      costByRequestType: [],
      timeSeriesData: [],
      totalBudget: 50,
      usedBudget: 10,
      budgetRemaining: 40,
    };

    const comparison = compareProviderCosts(stats);

    expect(comparison.length).toBe(1);
    expect(comparison[0]?.efficiency).toBe(0.0001); // 10.0 / 100000
  });

  it('handles empty cost data', () => {
    const emptyStats: EnhancedUsageStats = {
      totalRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      avgLatencyMs: 0,
      successRate: 0,
      providerBreakdown: [],
      requestTypeBreakdown: [],
      costByProvider: [],
      costByRequestType: [],
      timeSeriesData: [],
      totalBudget: 50,
      usedBudget: 0,
      budgetRemaining: 50,
    };

    const comparison = compareProviderCosts(emptyStats);

    expect(comparison).toEqual([]);
  });
});

describe('AI Analytics Service - Cost Breakdown', () => {
  it('correctly separates input and output costs', () => {
    const cost = calculateCost('anthropic', 'claude-3.5-sonnet-20241022', 2000000, 4000000);

    // Anthropic pricing: $3 input / $15 output per 1M
    expect(cost.inputCost).toBe(6.0); // 2M * 3.0
    expect(cost.outputCost).toBe(60.0); // 4M * 15.0
    expect(cost.totalCost).toBe(66.0);
  });

  it('handles Haiku pricing (cheaper Anthropic model)', () => {
    const cost = calculateCost('anthropic', 'claude-3-5-haiku-20241022', 1000000, 1000000);

    // Haiku pricing: $0.25 input / $1.25 output per 1M
    expect(cost.totalCost).toBe(1.5);
  });
});
