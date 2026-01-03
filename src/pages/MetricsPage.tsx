/**
 * Metrics Page
 * Dashboard for system metrics and performance monitoring
 */

import { MetricsMonitor } from '@/components/MetricsMonitor';
import { Card } from '@/shared/components/ui/Card';

export const MetricsPage = (): React.ReactElement => {
  return (
    <div className='container mx-auto space-y-6 p-6'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold'>System Metrics</h1>
        <p className='mt-2 text-muted-foreground'>
          Monitor cache performance, AI costs, and system health
        </p>
      </div>

      {/* Metrics Monitor */}
      <MetricsMonitor />

      {/* Quick Guide */}
      <Card className='p-6'>
        <h2 className='mb-4 text-xl font-semibold'>Metrics Guide</h2>
        <div className='space-y-4'>
          <div>
            <h3 className='font-medium text-blue-600 dark:text-blue-400'>Cache Hit Rate (New!)</h3>
            <p className='mt-1 text-sm text-muted-foreground'>
              Percentage of cache lookups that found valid cached data. Higher is better.
            </p>
            <ul className='mt-2 space-y-1 text-sm text-muted-foreground'>
              <li className='flex items-center gap-2'>
                <span className='text-blue-600 dark:text-blue-400'>✓ 80%+</span>
                <span>Excellent - Most requests served from cache</span>
              </li>
              <li className='flex items-center gap-2'>
                <span className='text-sky-600 dark:text-sky-400'>ℹ 50-79%</span>
                <span>Good - Some optimization possible</span>
              </li>
              <li className='flex items-center gap-2'>
                <span className='text-slate-600 dark:text-slate-400'>→ &lt;50%</span>
                <span>Warming up - Review strategy if persistent</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className='font-medium text-indigo-600 dark:text-indigo-400'>
              AI Cost Tracking (New!)
            </h3>
            <p className='mt-1 text-sm text-muted-foreground'>
              All AI API calls are automatically tracked to PostHog with detailed cost estimates.
            </p>
            <div className='mt-2 space-y-1 text-sm text-muted-foreground'>
              <p>
                <strong>Event name:</strong>{' '}
                <code className='rounded bg-secondary px-1'>ai_api_call</code>
              </p>
              <p>
                <strong>Tracked data:</strong> Provider, model, tokens, estimated cost, endpoint
              </p>
              <p>
                <strong>View in:</strong> PostHog Dashboard → Events → Filter by "ai_api_call"
              </p>
            </div>
          </div>

          <div>
            <h3 className='font-medium text-cyan-600 dark:text-cyan-400'>
              Rate Limiting (Enhanced!)
            </h3>
            <p className='mt-1 text-sm text-muted-foreground'>
              Rate limiting now supports both in-memory (Hobby plan) and Vercel KV (Pro/Enterprise).
            </p>
            <div className='mt-2 space-y-1 text-sm text-muted-foreground'>
              <p>
                <strong>Current mode:</strong>{' '}
                {typeof window !== 'undefined' ? 'In-memory' : 'Server-side'}
              </p>
              <p>
                <strong>Limits:</strong> 60 requests per hour, refills at 1/minute
              </p>
              <p>
                <strong>Upgrade:</strong> Pro plan enables distributed rate limiting via Vercel KV
              </p>
            </div>
          </div>

          <div>
            <h3 className='font-medium'>Cache Configuration</h3>
            <ul className='mt-2 space-y-1 text-sm text-muted-foreground'>
              <li>
                <strong>TTL:</strong> 5 minutes (300 seconds)
              </li>
              <li>
                <strong>Max Size:</strong> 50 projects
              </li>
              <li>
                <strong>Eviction:</strong> LRU (Least Recently Used)
              </li>
              <li>
                <strong>Invalidation:</strong> Automatic on project updates
              </li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Optimization Tips */}
      <Card className='border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-950/30'>
        <h2 className='mb-4 text-xl font-semibold text-amber-900 dark:text-amber-100'>
          💡 Optimization Tips
        </h2>
        <div className='space-y-3 text-sm text-amber-800 dark:text-amber-200'>
          <div>
            <strong>Low hit rate?</strong> Projects may be changing frequently. Consider:
            <ul className='ml-4 mt-1 list-disc space-y-1'>
              <li>Increasing cache TTL (currently 5 minutes)</li>
              <li>Reducing auto-save frequency</li>
              <li>Batching updates to reduce cache invalidations</li>
            </ul>
          </div>
          <div>
            <strong>High costs?</strong> Check PostHog analytics:
            <ul className='ml-4 mt-1 list-disc space-y-1'>
              <li>Identify expensive models being used</li>
              <li>Look for repeated similar requests (can be cached)</li>
              <li>Consider using faster/cheaper models for simple tasks</li>
            </ul>
          </div>
          <div>
            <strong>Cache near full?</strong> Either:
            <ul className='ml-4 mt-1 list-disc space-y-1'>
              <li>You have many active projects (normal)</li>
              <li>Consider increasing MAX_CACHE_SIZE in cache.ts</li>
              <li>Oldest entries will be automatically evicted</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};
