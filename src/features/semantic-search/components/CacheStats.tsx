/**
 * Cache Statistics Component
 *
 * Displays real-time cache performance metrics for semantic search.
 */

import { useState, useEffect } from 'react';

import { queryCache } from '@/features/semantic-search/services/query-cache';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';

interface CacheStatsProps {
  className?: string;
}

export const CacheStats: React.FC<CacheStatsProps> = ({ className }) => {
  const [stats, setStats] = useState(queryCache.getStats());
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Update stats every 2 seconds
    const interval = setInterval(() => {
      setStats(queryCache.getStats());
    }, 2000);

    return () => clearInterval(interval);
  }, [refreshKey]);

  const handleClearCache = (): void => {
    if (confirm('Are you sure you want to clear the search cache?')) {
      queryCache.clear();
      setStats(queryCache.getStats());
      setRefreshKey(prev => prev + 1);
    }
  };

  const formatTimestamp = (timestamp: number | null): string => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleTimeString();
  };

  const getHitRateColor = (hitRate: number): string => {
    if (hitRate >= 0.8) {
      return 'text-green-600 dark:text-green-400';
    }
    if (hitRate >= 0.5) {
      return 'text-yellow-600 dark:text-yellow-400';
    }
    return 'text-red-600 dark:text-red-400';
  };

  const hitRatePercentage = Math.round(stats.hitRate * 100);

  return (
    <Card className={className}>
      <div className='space-y-4 p-4'>
        <div className='flex items-center justify-between'>
          <h3 className='text-lg font-semibold'>Search Cache Statistics</h3>
          <Button variant='outline' size='sm' onClick={handleClearCache} aria-label='Clear cache'>
            Clear Cache
          </Button>
        </div>

        <div className='grid grid-cols-2 gap-4'>
          {/* Hit Rate */}
          <div className='space-y-1'>
            <div className='text-sm text-muted-foreground'>Hit Rate</div>
            <div className={'text-2xl font-bold ' + getHitRateColor(stats.hitRate)}>
              {hitRatePercentage}%
            </div>
            <div className='text-xs text-muted-foreground'>
              {stats.totalHits} hits / {stats.totalHits + stats.totalMisses} total
            </div>
          </div>

          {/* Cache Size */}
          <div className='space-y-1'>
            <div className='text-sm text-muted-foreground'>Cache Entries</div>
            <div className='text-2xl font-bold'>{stats.entryCount}</div>
            <div className='text-xs text-muted-foreground'>of 100 max</div>
          </div>

          {/* Total Hits */}
          <div className='space-y-1'>
            <div className='text-sm text-muted-foreground'>Total Hits</div>
            <div className='text-lg font-semibold'>{stats.totalHits}</div>
          </div>

          {/* Total Misses */}
          <div className='space-y-1'>
            <div className='text-sm text-muted-foreground'>Total Misses</div>
            <div className='text-lg font-semibold'>{stats.totalMisses}</div>
          </div>

          {/* Oldest Entry */}
          <div className='space-y-1'>
            <div className='text-sm text-muted-foreground'>Oldest Entry</div>
            <div className='text-sm'>{formatTimestamp(stats.oldestEntry)}</div>
          </div>

          {/* Newest Entry */}
          <div className='space-y-1'>
            <div className='text-sm text-muted-foreground'>Newest Entry</div>
            <div className='text-sm'>{formatTimestamp(stats.newestEntry)}</div>
          </div>
        </div>

        {/* Performance Indicator */}
        <div className='border-t pt-4'>
          <div className='flex items-center justify-between text-sm'>
            <span className='text-muted-foreground'>Performance</span>
            <span className='font-medium'>
              {stats.hitRate >= 0.8 && '🚀 Excellent'}
              {stats.hitRate >= 0.5 && stats.hitRate < 0.8 && '✅ Good'}
              {stats.hitRate < 0.5 && stats.hitRate > 0 && '⚠️ Fair'}
              {stats.hitRate === 0 && '❄️ Cold Cache'}
            </span>
          </div>
          {stats.hitRate < 0.5 && stats.totalHits + stats.totalMisses > 10 && (
            <div className='mt-2 text-xs text-muted-foreground'>
              Tip: Cache hit rate improves as users perform repeat searches. Current rate is normal
              for early usage.
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
