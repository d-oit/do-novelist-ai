/**
 * AI Analytics Service
 * Tracks usage, costs, and provides analytics
 */

import {
  logUsageAnalytic,
  getUserUsageStats,
  type AIUsageAnalytic,
  type UsageStats,
} from '@/lib/db/index';
import { type AIProvider } from '@/lib/ai-config';

/**
 * Enhanced usage stats with computed properties
 */
export interface EnhancedUsageStats extends UsageStats {
  providerBreakdown: Array<{
    provider: AIProvider;
    tokens: number;
    cost: number;
    requests: number;
    successRate: number;
  }>;
  requestTypeBreakdown: Array<{
    requestType: string;
    tokens: number;
    cost: number;
    requests: number;
  }>;
  costByProvider: Array<{
    provider: AIProvider;
    cost: number;
    percentage: number;
  }>;
  costByRequestType: Array<{
    requestType: string;
    cost: number;
    percentage: number;
  }>;
  timeSeriesData: Array<{
    date: string;
    tokens: number;
    cost: number;
    requests: number;
  }>;
  totalBudget: number;
  usedBudget: number;
  budgetRemaining: number;
}

export interface CostBreakdown {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
}

export interface BudgetInfo {
  totalBudget: number;
  usedBudget: number;
  remainingBudget: number;
  usagePercentage: number;
  projectedCost: number;
  daysRemaining: number;
  isNearLimit: boolean;
  isOverLimit: boolean;
}

export interface OptimizationRecommendation {
  type: 'cheaper_provider' | 'cheaper_model' | 'reduce_tokens' | 'none';
  description: string;
  estimatedSavings: number;
  action: {
    provider?: string;
    model?: string;
    maxTokens?: number;
  };
}

const PRICING_PER_1M_TOKENS: Record<string, { input: number; output: number }> = {
  'openai:gpt-4o': { input: 2.5, output: 10.0 },
  'openai:gpt-4o-mini': { input: 0.15, output: 0.6 },
  'anthropic:claude-3.5-sonnet-20241022': { input: 3.0, output: 15.0 },
  'anthropic:claude-3-5-haiku-20241022': { input: 0.25, output: 1.25 },
  'google:gemini-2.0-flash-exp': { input: 0.075, output: 0.3 },
  'google:gemini-exp-1206': { input: 1.25, output: 5.0 },
};

/**
 * Calculate cost for API usage
 */
export function calculateCost(
  provider: string,
  model: string,
  promptTokens: number,
  completionTokens: number,
): CostBreakdown {
  const pricingKey = `${provider}:${model}`;
  const pricing = PRICING_PER_1M_TOKENS[pricingKey] ?? { input: 0.1, output: 0.4 };

  const inputCost = (promptTokens / 1_000_000) * pricing.input;
  const outputCost = (completionTokens / 1_000_000) * pricing.output;

  return {
    inputTokens: promptTokens,
    outputTokens: completionTokens,
    totalTokens: promptTokens + completionTokens,
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
  };
}

/**
 * Log AI usage to analytics
 */
export async function logAIUsage(
  userId: string,
  provider: string,
  model: string,
  promptTokens: number,
  completionTokens: number,
  latencyMs: number,
  success: boolean,
  errorMessage: string | null,
  requestType: string,
): Promise<void> {
  try {
    const costBreakdown = calculateCost(provider, model, promptTokens, completionTokens);

    const analytic: AIUsageAnalytic = {
      id: crypto.randomUUID(),
      userId,
      provider: provider as AIProvider,
      modelName: model,
      promptTokens,
      completionTokens,
      totalTokens: costBreakdown.totalTokens,
      estimatedCost: costBreakdown.totalCost,
      latencyMs,
      success,
      errorMessage,
      requestType,
      createdAt: new Date().toISOString(),
    };

    await logUsageAnalytic(analytic);
  } catch (error) {
    console.error('Failed to log AI usage:', error);
  }
}

/**
 * Get user usage statistics
 */
export async function getUsageStats(
  userId: string,
  startDate?: Date,
  endDate?: Date,
): Promise<EnhancedUsageStats> {
  try {
    const startDateStr = startDate?.toISOString();
    const endDateStr = endDate?.toISOString();
    const stats = await getUserUsageStats(userId, startDateStr, endDateStr);

    // Return with computed properties
    return {
      ...stats,
      providerBreakdown: [],
      requestTypeBreakdown: [],
      costByProvider: [],
      costByRequestType: [],
      timeSeriesData: [],
      totalBudget: 0,
      usedBudget: 0,
      budgetRemaining: 0,
    };
  } catch (error) {
    console.error('Failed to get usage stats:', error);
    return {
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
      totalBudget: 0,
      usedBudget: 0,
      budgetRemaining: 0,
    };
  }
}

/**
 * Get budget information for a user
 */
export async function getBudgetInfo(userId: string): Promise<BudgetInfo> {
  try {
    const { loadUserPreferences } = await import('./ai-config-service');
    const prefs = await loadUserPreferences(userId);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const stats = await getUserUsageStats(
      userId,
      startDate.toISOString(),
      new Date().toISOString(),
    );

    const totalBudget = prefs.monthlyBudget;
    const usedBudget = stats.totalCost;
    const remainingBudget = Math.max(0, totalBudget - usedBudget);
    const usagePercentage = totalBudget > 0 ? (usedBudget / totalBudget) * 100 : 0;

    const daysInMonth = 30;
    const currentDay = new Date().getDate();
    const daysRemaining = daysInMonth - currentDay;
    const projectedCost = (stats.totalCost / currentDay) * daysInMonth;

    return {
      totalBudget,
      usedBudget,
      remainingBudget,
      usagePercentage,
      projectedCost,
      daysRemaining: Math.max(0, daysRemaining),
      isNearLimit: usagePercentage >= 80,
      isOverLimit: usagePercentage >= 100,
    };
  } catch (error) {
    console.error('Failed to get budget info:', error);
    return {
      totalBudget: 50,
      usedBudget: 0,
      remainingBudget: 50,
      usagePercentage: 0,
      projectedCost: 0,
      daysRemaining: 30,
      isNearLimit: false,
      isOverLimit: false,
    };
  }
}

/**
 * Get cost optimization recommendations
 */
export function getOptimizationRecommendations(
  userStats: EnhancedUsageStats,
  budgetInfo: BudgetInfo,
): OptimizationRecommendation[] {
  const recommendations: OptimizationRecommendation[] = [];

  if (budgetInfo.isOverLimit) {
    recommendations.push({
      type: 'cheaper_provider',
      description: 'Switch to a more cost-effective provider',
      estimatedSavings: 0,
      action: { provider: 'google' },
    });
  }

  if (userStats.costByProvider.length > 0) {
    const topCostProvider = userStats.costByProvider[0];
    const isExpensive = topCostProvider?.provider === 'openai';

    if (isExpensive && budgetInfo.usagePercentage > 60) {
      recommendations.push({
        type: 'cheaper_model',
        description: 'Consider switching from GPT-4o to GPT-4o Mini (up to 90% cost reduction)',
        estimatedSavings: (topCostProvider?.cost || 0) * 0.5,
        action: { model: 'gpt-4o-mini' },
      });
    }
  }

  if (userStats.totalTokens > 100000) {
    recommendations.push({
      type: 'reduce_tokens',
      description: 'Reduce max tokens per request to lower costs',
      estimatedSavings: userStats.totalCost * 0.2,
      action: { maxTokens: 2000 },
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      type: 'none',
      description: 'Your usage is well optimized',
      estimatedSavings: 0,
      action: {},
    });
  }

  return recommendations;
}

/**
 * Get provider cost comparison
 */
export function compareProviderCosts(userStats: EnhancedUsageStats): Array<{
  provider: string;
  cost: number;
  percentage: number;
  efficiency: number;
}> {
  const costByProvider = userStats.costByProvider;
  const totalCost = userStats.totalCost;

  return costByProvider
    .map((item: { provider: AIProvider; cost: number }) => {
      const tokens =
        userStats.providerBreakdown.find(
          (p: { provider: AIProvider; tokens: number }) => p.provider === item.provider,
        )?.tokens ?? 0;

      return {
        provider: item.provider,
        cost: item.cost,
        percentage: totalCost > 0 ? (item.cost / totalCost) * 100 : 0,
        efficiency: tokens > 0 ? item.cost / tokens : 0,
      };
    })
    .sort((a: { cost: number }, b: { cost: number }) => b.cost - a.cost);
}
