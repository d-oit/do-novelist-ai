/**
 * Provider Status Dashboard
 * Real-time monitoring of AI provider health and performance
 */

import { Activity, CheckCircle, XCircle, Clock, Zap, TrendingUp } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { cn } from '@/lib/utils';
import { openRouterModelsService, type ProviderStatus } from '@/services/openrouter-models-service';

interface ProviderStatusDashboardProps {
  refreshInterval?: number; // ms
  showMetrics?: boolean;
}

export const ProviderStatusDashboard: React.FC<ProviderStatusDashboardProps> = ({
  refreshInterval = 30000, // 30 seconds
  showMetrics = true,
}) => {
  const [providerStatuses, setProviderStatuses] = useState<ProviderStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  const loadProviderStatuses = async (): Promise<void> => {
    try {
      const statuses = await openRouterModelsService.getProviderStatuses();
      setProviderStatuses(statuses);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load provider statuses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProviderStatuses();

    // Set up periodic refresh
    const interval = setInterval(() => {
      void loadProviderStatuses();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const getStatusIcon = (status: ProviderStatus['status']) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className='h-4 w-4 text-green-500' />;
      case 'degraded':
        return <Clock className='h-4 w-4 text-yellow-500' />;
      case 'outage':
        return <XCircle className='h-4 w-4 text-red-500' />;
      default:
        return <Activity className='h-4 w-4 text-gray-400' />;
    }
  };

  const getStatusColor = (status: ProviderStatus['status']) => {
    switch (status) {
      case 'operational':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'outage':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatLatency = (latency: number) => {
    if (latency === 0) return 'N/A';
    if (latency < 1000) return `${latency}ms`;
    return `${(latency / 1000).toFixed(1)}s`;
  };

  const formatSuccessRate = (rate: number) => {
    if (rate === 0) return 'N/A';
    return `${rate.toFixed(1)}%`;
  };

  if (loading && providerStatuses.length === 0) {
    return (
      <div className='rounded-lg border bg-white p-6'>
        <div className='flex items-center gap-2'>
          <Activity className='h-5 w-5 animate-pulse text-gray-400' />
          <span className='text-sm text-gray-600'>Loading provider statuses...</span>
        </div>
      </div>
    );
  }

  const enabledProviders = providerStatuses.filter(p => p.enabled);
  const operationalProviders = providerStatuses.filter(p => p.status === 'operational');

  return (
    <div className='rounded-lg border bg-white'>
      {/* Header */}
      <div className='border-b p-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Activity className='h-5 w-5 text-blue-500' />
            <h3 className='font-semibold'>Provider Status</h3>
          </div>
          <div className='flex items-center gap-4 text-sm text-gray-600'>
            <span>Last update: {lastUpdate.toLocaleTimeString()}</span>
            <button
              onClick={() => void loadProviderStatuses()}
              className='rounded px-2 py-1 hover:bg-gray-100'
              disabled={loading}
            >
              <TrendingUp className={cn('h-4 w-4', loading && 'animate-spin')} />
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className='mt-4 grid grid-cols-3 gap-4'>
          <div className='rounded bg-gray-50 p-3'>
            <div className='text-sm text-gray-600'>Enabled Providers</div>
            <div className='text-2xl font-bold text-gray-900'>
              {enabledProviders.length}
              <span className='ml-1 text-sm font-normal text-gray-500'>
                / {providerStatuses.length}
              </span>
            </div>
          </div>
          <div className='rounded bg-green-50 p-3'>
            <div className='text-sm text-green-600'>Operational</div>
            <div className='text-2xl font-bold text-green-900'>{operationalProviders.length}</div>
          </div>
          <div className='rounded bg-blue-50 p-3'>
            <div className='text-sm text-blue-600'>Total Models</div>
            <div className='text-2xl font-bold text-blue-900'>
              {providerStatuses.reduce((sum, p) => sum + p.modelsCount, 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className='border-b border-red-200 bg-red-50 p-4'>
          <div className='flex items-center gap-2 text-red-700'>
            <XCircle className='h-4 w-4' />
            <span className='text-sm'>{error}</span>
          </div>
        </div>
      )}

      {/* Provider List */}
      <div className='max-h-96 overflow-y-auto p-4'>
        <div className='space-y-3'>
          {providerStatuses.map(provider => (
            <div
              key={provider.id}
              className={cn(
                'flex items-center justify-between rounded border p-4',
                provider.enabled ? 'bg-white' : 'bg-gray-50 opacity-60',
              )}
            >
              <div className='flex items-center gap-3'>
                {getStatusIcon(provider.status)}
                <div>
                  <div className='flex items-center gap-2'>
                    <h4 className='font-medium capitalize'>{provider.name}</h4>
                    <span
                      className={cn(
                        'rounded px-2 py-1 text-xs font-medium',
                        getStatusColor(provider.status),
                      )}
                    >
                      {provider.status}
                    </span>
                    {!provider.enabled && (
                      <span className='rounded bg-gray-200 px-2 py-1 text-xs text-gray-600'>
                        Disabled
                      </span>
                    )}
                  </div>
                  <div className='mt-1 text-sm text-gray-600'>
                    {provider.modelsCount} models available
                  </div>
                </div>
              </div>

              {showMetrics && provider.enabled && (
                <div className='flex items-center gap-6 text-sm'>
                  {provider.avgLatency > 0 && (
                    <div className='text-center'>
                      <div className='flex items-center gap-1 text-gray-600'>
                        <Zap className='h-3 w-3' />
                        <span>Latency</span>
                      </div>
                      <div className='font-medium'>{formatLatency(provider.avgLatency)}</div>
                    </div>
                  )}

                  {provider.successRate > 0 && (
                    <div className='text-center'>
                      <div className='flex items-center gap-1 text-gray-600'>
                        <CheckCircle className='h-3 w-3' />
                        <span>Success</span>
                      </div>
                      <div className='font-medium'>{formatSuccessRate(provider.successRate)}</div>
                    </div>
                  )}

                  <div className='text-center'>
                    <div className='flex items-center gap-1 text-gray-600'>
                      <Activity className='h-3 w-3' />
                      <span>Health</span>
                    </div>
                    <div className='text-xs text-gray-500'>
                      {new Date(provider.lastHealthCheck).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className='border-t bg-gray-50 px-4 py-2 text-xs text-gray-600'>
        <div className='flex items-center justify-between'>
          <span>Auto-refresh every {refreshInterval / 1000}s</span>
          <span>
            {enabledProviders.length} providers enabled • {operationalProviders.length} operational
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProviderStatusDashboard;
