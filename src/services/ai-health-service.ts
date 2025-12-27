/**
 * AI Health Monitoring Service
 * Provides periodic health checks, latency monitoring, error tracking, and circuit breaker pattern
 */

import { OpenRouter } from '@openrouter/sdk';

import { getAIConfig, type AIProvider } from '@/lib/ai-config';
import {
  getProviderHealth,
  updateProviderHealth,
  logUsageAnalytic,
  type AIProviderHealth,
} from '@/lib/db/index';
import { logger } from '@/lib/logging/logger';

const HEALTH_CHECK_INTERVAL_MS = 5 * 60 * 1000;
const HEALTH_CHECK_TIMEOUT_MS = 10000;
const CIRCUIT_BREAKER_THRESHOLD = 3;
const LATENCY_SPIKE_MULTIPLIER = 2;
const TEST_PROMPT = 'Hi';

interface LatencyHistory {
  provider: AIProvider;
  latencies: number[];
  maxHistorySize: number;
}

const latencyHistories = new Map<AIProvider, LatencyHistory>();

interface CircuitBreakerState {
  provider: AIProvider;
  failureCount: number;
  lastFailureTime: number | null;
  isOpen: boolean;
}

const circuitBreakers = new Map<AIProvider, CircuitBreakerState>();

function initCircuitBreaker(provider: AIProvider): void {
  if (!circuitBreakers.has(provider)) {
    circuitBreakers.set(provider, {
      provider,
      failureCount: 0,
      lastFailureTime: null,
      isOpen: false,
    });
  }
}

function initLatencyHistory(provider: AIProvider): void {
  if (!latencyHistories.has(provider)) {
    latencyHistories.set(provider, {
      provider,
      latencies: [],
      maxHistorySize: 100,
    });
  }
}

function recordLatency(provider: AIProvider, latencyMs: number): void {
  initLatencyHistory(provider);
  const history = latencyHistories.get(provider);
  if (!history) {
    return;
  }

  history.latencies.push(latencyMs);

  if (history.latencies.length > history.maxHistorySize) {
    history.latencies.shift();
  }
}

function calculatePercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0;

  const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
  return sortedValues[Math.max(0, index)] ?? 0;
}

export function getLatencyStats(provider: AIProvider): {
  avg: number;
  p50: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
} {
  const history = latencyHistories.get(provider);

  if (!history || history.latencies.length === 0) {
    return { avg: 0, p50: 0, p95: 0, p99: 0, min: 0, max: 0 };
  }

  const sorted = [...history.latencies].sort((a, b) => a - b);
  const avg = sorted.reduce((sum, val) => sum + val, 0) / sorted.length;

  return {
    avg: Math.round(avg),
    p50: calculatePercentile(sorted, 50),
    p95: calculatePercentile(sorted, 95),
    p99: calculatePercentile(sorted, 99),
    min: sorted[0] ?? 0,
    max: sorted[sorted.length - 1] ?? 0,
  };
}

function isLatencySpike(provider: AIProvider, currentLatency: number): boolean {
  const stats = getLatencyStats(provider);

  if (stats.avg === 0) return false;

  return currentLatency > stats.avg * LATENCY_SPIKE_MULTIPLIER;
}

async function performHealthCheck(
  provider: AIProvider,
  modelName: string,
  apiKey: string,
): Promise<{
  success: boolean;
  latencyMs: number;
  errorMessage: string | null;
  errorType: 'timeout' | 'api_error' | 'rate_limit' | null;
}> {
  const startTime = Date.now();

  try {
    const client = new OpenRouter({ apiKey });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Health check timeout')), HEALTH_CHECK_TIMEOUT_MS);
    });

    const checkPromise = client.chat.send({
      model: `${provider}/${modelName}`,
      messages: [{ role: 'user', content: TEST_PROMPT }],
      maxTokens: 5,
      stream: false,
    });

    await Promise.race([checkPromise, timeoutPromise]);

    const latencyMs = Date.now() - startTime;

    return {
      success: true,
      latencyMs,
      errorMessage: null,
      errorType: null,
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    let errorType: 'timeout' | 'api_error' | 'rate_limit' | null = null;
    if (errorMessage.includes('timeout')) {
      errorType = 'timeout';
    } else if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
      errorType = 'rate_limit';
    } else {
      errorType = 'api_error';
    }

    return {
      success: false,
      latencyMs,
      errorMessage,
      errorType,
    };
  }
}

function updateCircuitBreaker(provider: AIProvider, success: boolean): void {
  initCircuitBreaker(provider);
  const breaker = circuitBreakers.get(provider);
  if (!breaker) {
    return;
  }

  if (success) {
    breaker.failureCount = 0;
    breaker.lastFailureTime = null;
    if (breaker.isOpen) {
      logger.info(`[HealthService] Circuit breaker closed for ${provider} - service recovered`);
      breaker.isOpen = false;
    }
  } else {
    breaker.failureCount++;
    breaker.lastFailureTime = Date.now();

    if (breaker.failureCount >= CIRCUIT_BREAKER_THRESHOLD && !breaker.isOpen) {
      breaker.isOpen = true;
      logger.warn(
        `Circuit breaker opened for ${provider} - ${breaker.failureCount} consecutive failures`,
        { component: 'ai-health-service', provider },
      );
    }
  }
}

function shouldAttemptRecovery(provider: AIProvider): boolean {
  const breaker = circuitBreakers.get(provider);

  if (breaker === undefined || breaker.isOpen === false || breaker.lastFailureTime === null) {
    return true;
  }

  const timeSinceLastFailure = Date.now() - breaker.lastFailureTime;
  return timeSinceLastFailure >= HEALTH_CHECK_INTERVAL_MS;
}

interface ErrorRateTracker {
  provider: AIProvider;
  recentChecks: { success: boolean; timestamp: number }[];
}

const errorRateTrackers = new Map<AIProvider, ErrorRateTracker>();

function recordHealthCheckResult(provider: AIProvider, success: boolean): void {
  if (!errorRateTrackers.has(provider)) {
    errorRateTrackers.set(provider, {
      provider,
      recentChecks: [],
    });
  }

  const tracker = errorRateTrackers.get(provider);
  if (!tracker) {
    return;
  }
  tracker.recentChecks.push({ success, timestamp: Date.now() });

  if (tracker.recentChecks.length > 20) {
    tracker.recentChecks.shift();
  }
}

function getErrorRate(provider: AIProvider): number {
  const tracker = errorRateTrackers.get(provider);

  if (!tracker || tracker.recentChecks.length === 0) {
    return 0;
  }

  const failedChecks = tracker.recentChecks.filter(c => !c.success).length;
  return (failedChecks / tracker.recentChecks.length) * 100;
}

function determineHealthStatus(
  errorRate: number,
  isLatencySpike: boolean,
  circuitBreakerOpen: boolean,
): 'operational' | 'degraded' | 'outage' {
  if (circuitBreakerOpen || errorRate >= 50) {
    return 'outage';
  }

  if (errorRate >= 20 || isLatencySpike) {
    return 'degraded';
  }

  return 'operational';
}

function calculateUptime(provider: AIProvider): number {
  const tracker = errorRateTrackers.get(provider);

  if (!tracker || tracker.recentChecks.length === 0) {
    return 100;
  }

  const successfulChecks = tracker.recentChecks.filter(c => c.success).length;
  return (successfulChecks / tracker.recentChecks.length) * 100;
}

export async function checkProviderHealth(
  provider: AIProvider,
  userId: string = 'system',
): Promise<void> {
  if (!shouldAttemptRecovery(provider)) {
    logger.info(
      `[HealthService] Skipping ${provider} - circuit breaker open, waiting for recovery window`,
    );
    return;
  }

  const config = getAIConfig();
  const providerConfig = config.providers[provider];

  if (!providerConfig.enabled) {
    logger.info(`[HealthService] Skipping ${provider} - not enabled`);
    return;
  }

  logger.info(`[HealthService] Checking health of ${provider}...`);

  if (!config.openrouterApiKey) {
    logger.info(`[HealthService] Skipping ${provider} - no API key available`);
    return;
  }

  const modelName = providerConfig.models.fast;
  const result = await performHealthCheck(provider, modelName, config.openrouterApiKey);

  if (result.success) {
    recordLatency(provider, result.latencyMs);
  }

  updateCircuitBreaker(provider, result.success);
  recordHealthCheckResult(provider, result.success);

  const errorRate = getErrorRate(provider);
  const latencyStats = getLatencyStats(provider);
  const breaker = circuitBreakers.get(provider);
  const hasLatencySpike = result.success && isLatencySpike(provider, result.latencyMs);

  const status = determineHealthStatus(errorRate, hasLatencySpike, breaker?.isOpen ?? false);

  const now = new Date().toISOString();
  const health: AIProviderHealth = {
    id: `health_${provider}_${Date.now()}`,
    provider,
    status,
    uptime: calculateUptime(provider),
    errorRate,
    avgLatencyMs: latencyStats.avg,
    lastCheckedAt: now,
    lastIncidentAt: result.success ? null : now,
    incidentDescription: result.success ? null : `${result.errorType}: ${result.errorMessage}`,
    createdAt: now,
    updatedAt: now,
  };

  await updateProviderHealth(health);

  await logUsageAnalytic({
    id: `analytic_${provider}_${Date.now()}`,
    userId,
    provider,
    modelName,
    promptTokens: result.success ? 2 : 0,
    completionTokens: result.success ? 3 : 0,
    totalTokens: result.success ? 5 : 0,
    estimatedCost: result.success ? 0.0001 : 0,
    latencyMs: result.latencyMs,
    success: result.success,
    errorMessage: result.errorMessage,
    requestType: 'health_check',
    createdAt: now,
  });

  logger.info(`[HealthService] ${provider} health check complete:`, {
    status,
    errorRate: `${errorRate.toFixed(1)}%`,
    uptime: `${health.uptime.toFixed(1)}%`,
    latency: `${result.latencyMs}ms`,
    circuitBreaker: breaker?.isOpen === true ? 'OPEN' : 'CLOSED',
  });
}

export async function checkAllProvidersHealth(userId: string = 'system'): Promise<void> {
  const config = getAIConfig();
  const providers: AIProvider[] = [
    'openai',
    'anthropic',
    'google',
    'mistral',
    'deepseek',
    'cohere',
    'ai21',
    'together',
    'fireworks',
    'perplexity',
    'xai',
    '01-ai',
    'nvidia',
    'amazon',
    'meta',
  ];

  const enabledProviders = providers.filter(p => config.providers[p].enabled);

  logger.info(`[HealthService] Starting health checks for ${enabledProviders.length} providers...`);

  await Promise.allSettled(enabledProviders.map(provider => checkProviderHealth(provider, userId)));

  logger.info(`[HealthService] All health checks complete`);
}

let healthCheckInterval: ReturnType<typeof setInterval> | null = null;

export function startHealthMonitoring(userId: string = 'system'): void {
  if (healthCheckInterval) {
    logger.warn('Health monitoring already running', { component: 'ai-health-service' });
    return;
  }

  logger.info(
    `[HealthService] Starting periodic health monitoring (interval: ${HEALTH_CHECK_INTERVAL_MS / 1000}s)`,
  );

  checkAllProvidersHealth(userId).catch(error => {
    logger.error(
      'Initial health check failed',
      { component: 'ai-health-service' },
      error instanceof Error ? error : undefined,
    );
  });

  healthCheckInterval = setInterval(() => {
    checkAllProvidersHealth(userId).catch(error => {
      logger.error(
        'Periodic health check failed',
        { component: 'ai-health-service' },
        error instanceof Error ? error : undefined,
      );
    });
  }, HEALTH_CHECK_INTERVAL_MS);
}

export function stopHealthMonitoring(): void {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
    logger.info('[HealthService] Health monitoring stopped');
  }
}

export function getCircuitBreakerStatus(provider: AIProvider): {
  isOpen: boolean;
  failureCount: number;
  lastFailureTime: number | null;
} {
  const breaker = circuitBreakers.get(provider);

  if (!breaker) {
    return {
      isOpen: false,
      failureCount: 0,
      lastFailureTime: null,
    };
  }

  return {
    isOpen: breaker.isOpen,
    failureCount: breaker.failureCount,
    lastFailureTime: breaker.lastFailureTime,
  };
}

export function resetCircuitBreaker(provider: AIProvider): void {
  const breaker = circuitBreakers.get(provider);

  if (breaker) {
    breaker.failureCount = 0;
    breaker.lastFailureTime = null;
    breaker.isOpen = false;
    logger.info(`[HealthService] Circuit breaker manually reset for ${provider}`);
  }
}

export async function getHealthReport(): Promise<{
  providers: Array<{
    provider: AIProvider;
    health: AIProviderHealth | null;
    latencyStats: ReturnType<typeof getLatencyStats>;
    circuitBreaker: ReturnType<typeof getCircuitBreakerStatus>;
  }>;
  overallStatus: 'operational' | 'degraded' | 'outage';
}> {
  const providers: AIProvider[] = [
    'openai',
    'anthropic',
    'google',
    'mistral',
    'deepseek',
    'cohere',
    'ai21',
    'together',
    'fireworks',
    'perplexity',
    'xai',
    '01-ai',
    'nvidia',
    'amazon',
    'meta',
  ];
  const healthRecords = await getProviderHealth();

  const providerReports = providers.map(provider => {
    const health = healthRecords.find((h: AIProviderHealth) => h.provider === provider) ?? null;

    return {
      provider,
      health,
      latencyStats: getLatencyStats(provider),
      circuitBreaker: getCircuitBreakerStatus(provider),
    };
  });

  const statuses = providerReports
    .filter((r): r is typeof r & { health: NonNullable<typeof r.health> } => r.health !== null)
    .map(r => r.health.status);

  let overallStatus: 'operational' | 'degraded' | 'outage' = 'operational';

  if (statuses.includes('outage')) {
    overallStatus = 'outage';
  } else if (statuses.includes('degraded')) {
    overallStatus = 'degraded';
  }

  return {
    providers: providerReports,
    overallStatus,
  };
}
