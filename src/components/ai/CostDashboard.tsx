import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Activity, CheckCircle } from 'lucide-react';
import {
  getUsageStats,
  getBudgetInfo,
  getOptimizationRecommendations,
  type EnhancedUsageStats,
} from '@/services/ai-analytics-service';
import type { BudgetInfo } from '@/services/ai-analytics-service';
import { type AIProvider } from '@/lib/ai-config';

interface CostDashboardProps {
  userId: string;
}

export const CostDashboard = ({ userId }: CostDashboardProps): JSX.Element => {
  const [usageStats, setUsageStats] = useState<EnhancedUsageStats | null>(null);
  const [budgetInfo, setBudgetInfo] = useState<BudgetInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadData();
  }, [userId]);

  const loadData = async (): Promise<void> => {
    try {
      const [stats, budget] = await Promise.all([getUsageStats(userId), getBudgetInfo(userId)]);

      setUsageStats(stats);
      setBudgetInfo(budget);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='rounded-lg border bg-white p-6'>
        <div className='animate-pulse space-y-4'>
          <div className='h-4 w-1/4 rounded bg-gray-200' />
          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            {[1, 2, 3].map(i => (
              <div key={i} className='h-24 rounded bg-gray-200' />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!usageStats || !budgetInfo) {
    return (
      <div className='rounded-lg border bg-white p-6'>
        <p className='text-gray-500'>No usage data available</p>
      </div>
    );
  }

  const recommendations = getOptimizationRecommendations(usageStats, budgetInfo);

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
        <div className='rounded-lg border bg-white p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-600'>Total Cost</p>
              <p className='text-2xl font-bold'>${usageStats.totalCost.toFixed(4)}</p>
            </div>
            <DollarSign className='h-8 w-8 text-green-500' />
          </div>
          <p className='mt-2 text-xs text-gray-500'>of ${budgetInfo.totalBudget} budget</p>
        </div>

        <div className='rounded-lg border bg-white p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-600'>Tokens Used</p>
              <p className='text-2xl font-bold'>{usageStats.totalTokens.toLocaleString()}</p>
            </div>
            <Activity className='h-8 w-8 text-blue-500' />
          </div>
          <p className='mt-2 text-xs text-gray-500'>{usageStats.totalRequests} requests</p>
        </div>

        <div className='rounded-lg border bg-white p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-600'>Avg Latency</p>
              <p className='text-2xl font-bold'>{usageStats.avgLatencyMs.toFixed(0)}ms</p>
            </div>
            <TrendingUp className='h-8 w-8 text-purple-500' />
          </div>
          <p className='mt-2 text-xs text-gray-500'>
            {usageStats.successRate.toFixed(1)}% success rate
          </p>
        </div>
      </div>

      <div className='rounded-lg border bg-white p-6'>
        <h3 className='mb-4 font-semibold'>Budget Status</h3>
        <div className='space-y-3'>
          <div>
            <div className='mb-1 flex justify-between text-sm'>
              <span>Usage</span>
              <span>{budgetInfo.usagePercentage.toFixed(1)}%</span>
            </div>
            <div className='h-2 w-full rounded-full bg-gray-200'>
              <div
                className={`h-2 rounded-full ${
                  budgetInfo.isOverLimit
                    ? 'bg-red-500'
                    : budgetInfo.isNearLimit
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(budgetInfo.usagePercentage, 100)}%` }}
              />
            </div>
          </div>
          <div className='flex justify-between text-sm text-gray-600'>
            <span>Used: ${budgetInfo.usedBudget.toFixed(4)}</span>
            <span>Remaining: ${budgetInfo.remainingBudget.toFixed(4)}</span>
          </div>
        </div>
      </div>

      <div className='rounded-lg border bg-white p-6'>
        <h3 className='mb-4 font-semibold'>Provider Breakdown</h3>
        <div className='space-y-3'>
          {usageStats.costByProvider.length > 0 ? (
            usageStats.costByProvider.map(
              (item: { provider: AIProvider; cost: number; percentage: number }) => (
                <div
                  key={item.provider}
                  className='flex items-center justify-between rounded bg-gray-50 p-3'
                >
                  <div className='flex items-center gap-3'>
                    <div className='h-3 w-3 rounded-full bg-blue-500' />
                    <span className='font-medium capitalize'>{item.provider}</span>
                  </div>
                  <div className='text-right'>
                    <div className='font-bold'>${item.cost.toFixed(4)}</div>
                    <div className='text-xs text-gray-500'>{item.percentage.toFixed(1)}%</div>
                  </div>
                </div>
              ),
            )
          ) : (
            <p className='text-sm text-gray-500'>No usage data</p>
          )}
        </div>
      </div>

      <div className='rounded-lg border bg-white p-6'>
        <h3 className='mb-4 font-semibold'>Optimization Suggestions</h3>
        <div className='space-y-3'>
          {recommendations.map((rec, idx) => (
            <div key={idx} className='rounded-lg border border-blue-200 bg-blue-50 p-4'>
              <div className='flex items-start gap-3'>
                {rec.type === 'cheaper_provider' || rec.type === 'cheaper_model' ? (
                  <TrendingDown className='mt-0.5 h-5 w-5 text-green-500' />
                ) : rec.type === 'reduce_tokens' ? (
                  <TrendingUp className='mt-0.5 h-5 w-5 text-orange-500' />
                ) : (
                  <CheckCircle className='mt-0.5 h-5 w-5 text-green-500' />
                )}
                <div className='flex-1'>
                  <p className='font-medium'>{rec.description}</p>
                  {rec.estimatedSavings > 0 && (
                    <p className='mt-1 text-sm text-gray-600'>
                      Estimated savings: ${rec.estimatedSavings.toFixed(4)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
