/**
 * Metrics Monitor Component
 * Displays cache hit rates, AI costs, and rate limiting stats
 */

import { useEffect, useState } from 'react';

import { getCacheStats } from '@/lib/context/cache';
import { cn } from '@/lib/utils';
import { Card } from '@/shared/components/ui/Card';

interface CacheStats {
  size: number;
  maxSize: number;
  hitRate: number;
  hits: number;
  misses: number;
  entries: Array<{ projectId: string; age: number; tokens: number }>;
}

interface MetricsData {
  cache: CacheStats;
  lastUpdated: Date;
}

export const MetricsMonitor = (): React.ReactElement => {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const updateMetrics = (): void => {
      const cacheStats = getCacheStats();
      setMetrics({
        cache: cacheStats,
        lastUpdated: new Date(),
      });
    };

    // Initial update
    updateMetrics();

    // Update every 5 seconds
    const interval = setInterval(updateMetrics, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!metrics) {
    return (
      <Card className='p-4'>
        <p className='text-sm text-muted-foreground'>Loading metrics...</p>
      </Card>
    );
  }

  const { cache } = metrics;
  const hitRatePercent = (cache.hitRate * 100).toFixed(1);
  const utilizationPercent = ((cache.size / cache.maxSize) * 100).toFixed(0);

  // Determine hit rate color (Blue theme)
  const getHitRateColor = (rate: number): string => {
    if (rate >= 0.8) return 'text-blue-600 dark:text-blue-400';
    if (rate >= 0.5) return 'text-sky-600 dark:text-sky-400';
    return 'text-slate-600 dark:text-slate-400';
  };

  // Determine utilization color (Blue theme)
  const getUtilizationColor = (percent: number): string => {
    if (percent >= 90) return 'text-indigo-600 dark:text-indigo-400';
    if (percent >= 70) return 'text-blue-600 dark:text-blue-400';
    return 'text-sky-600 dark:text-sky-400';
  };

  return (
    <Card className='p-4'>
      <div className='space-y-4'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <h3 className='text-lg font-semibold'>System Metrics</h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className='rounded px-2 py-1 text-sm text-primary hover:bg-secondary'
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>

        {/* Cache Overview */}
        <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
          {/* Hit Rate */}
          <div className='rounded-lg border bg-card p-3'>
            <div className='text-sm text-muted-foreground'>Cache Hit Rate</div>
            <div className={cn('text-2xl font-bold', getHitRateColor(cache.hitRate))}>
              {hitRatePercent}%
            </div>
            <div className='text-xs text-muted-foreground'>
              {cache.hits} hits / {cache.misses} misses
            </div>
          </div>

          {/* Cache Size */}
          <div className='rounded-lg border bg-card p-3'>
            <div className='text-sm text-muted-foreground'>Cache Size</div>
            <div
              className={cn('text-2xl font-bold', getUtilizationColor(Number(utilizationPercent)))}
            >
              {cache.size}/{cache.maxSize}
            </div>
            <div className='text-xs text-muted-foreground'>{utilizationPercent}% full</div>
          </div>

          {/* Total Requests */}
          <div className='rounded-lg border bg-card p-3'>
            <div className='text-sm text-muted-foreground'>Total Requests</div>
            <div className='text-2xl font-bold'>{cache.hits + cache.misses}</div>
            <div className='text-xs text-muted-foreground'>Cache lookups</div>
          </div>

          {/* Cached Projects */}
          <div className='rounded-lg border bg-card p-3'>
            <div className='text-sm text-muted-foreground'>Cached Projects</div>
            <div className='text-2xl font-bold'>{cache.entries.length}</div>
            <div className='text-xs text-muted-foreground'>Active entries</div>
          </div>
        </div>

        {/* Performance Indicators */}
        <div className='rounded-lg border bg-card p-3'>
          <div className='mb-2 text-sm font-medium'>Performance Status</div>
          <div className='space-y-2'>
            {cache.hitRate >= 0.8 && (
              <div className='flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400'>
                <span className='text-lg'>✓</span>
                <span>Excellent cache performance</span>
              </div>
            )}
            {cache.hitRate >= 0.5 && cache.hitRate < 0.8 && (
              <div className='flex items-center gap-2 text-sm text-sky-600 dark:text-sky-400'>
                <span className='text-lg'>ℹ</span>
                <span>Good cache performance - consider increasing TTL for optimization</span>
              </div>
            )}
            {cache.hitRate < 0.5 && cache.hits + cache.misses > 10 && (
              <div className='flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400'>
                <span className='text-lg'>→</span>
                <span>Cache warming up - review strategy if this persists</span>
              </div>
            )}
            {cache.size >= cache.maxSize * 0.9 && (
              <div className='flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400'>
                <span className='text-lg'>◆</span>
                <span>Cache near capacity - LRU eviction active</span>
              </div>
            )}
            {cache.hits + cache.misses === 0 && (
              <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                <span className='text-lg'>○</span>
                <span>No cache activity yet</span>
              </div>
            )}
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && cache.entries.length > 0 && (
          <div className='rounded-lg border bg-card p-3'>
            <div className='mb-2 text-sm font-medium'>Cached Entries</div>
            <div className='max-h-48 space-y-2 overflow-y-auto'>
              {cache.entries.map(entry => (
                <div
                  key={entry.projectId}
                  className='flex items-center justify-between rounded bg-secondary/50 p-2 text-sm'
                >
                  <div className='flex-1 truncate'>
                    <div className='font-medium'>Project {entry.projectId.slice(0, 8)}...</div>
                    <div className='text-xs text-muted-foreground'>
                      {entry.tokens.toLocaleString()} tokens
                    </div>
                  </div>
                  <div className='text-xs text-muted-foreground'>
                    Age: {Math.floor(entry.age / 1000)}s
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Note */}
        <div className='rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/30'>
          <div className='flex items-start gap-2'>
            <span className='text-blue-600 dark:text-blue-400'>ℹ️</span>
            <div className='text-sm text-blue-800 dark:text-blue-200'>
              <div className='font-medium'>AI Cost Tracking Active</div>
              <div className='mt-1 text-xs opacity-90'>
                All AI API calls are now tracked to PostHog with cost estimates. View detailed
                analytics in your PostHog dashboard under event: <code>ai_api_call</code>
              </div>
            </div>
          </div>
        </div>

        {/* Last Updated */}
        <div className='text-center text-xs text-muted-foreground'>
          Last updated: {metrics.lastUpdated.toLocaleTimeString()}
        </div>
      </div>
    </Card>
  );
};
