/**
 * AI Health Monitoring Service
 * Provides periodic health checks, latency monitoring, error tracking, and circuit breaker pattern
 */

import {
  getProviderHealth,
  updateProviderHealth,
  logUsageAnalytic,
  type AIProviderHealth,
} from '@/lib/db/index';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { getAIConfig, type AIProvider } from '@/lib/ai-config';

/**
 * Health check configuration
 */
const HEALTH_CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const HEALTH_CHECK_TIMEOUT_MS = 10000; // 10 seconds
const CIRCUIT_BREAKER_THRESHOLD = 3; // Failures before circuit opens
const LATENCY_SPIKE_MULTIPLIER = 2; // 2x normal latency
const TEST_PROMPT = 'Hi'; // Lightweight test (< 10 tokens)

/**
 * Latency history tracking for percentile calculations
 */
interface LatencyHistory {
  provider: AIProvider;
  latencies: number[];
  maxHistorySize: number;
}

const latencyHistories = new Map<AIProvider, LatencyHistory>();

/**
 * Circuit breaker state
 */
interface CircuitBreakerState {
  provider: AIProvider;
  failureCount: number;
  lastFailureTime: number | null;
  isOpen: boolean;
}

const circuitBreakers = new Map<AIProvider, CircuitBreakerState>();

/**
 * Initialize circuit breaker for a provider
 */
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

/**
 * Initialize latency history for a provider
 */
function initLatencyHistory(provider: AIProvider): void {
  if (!latencyHistories.has(provider)) {
    latencyHistories.set(provider, {
      provider,
      latencies: [],
      maxHistorySize: 100, // Keep last 100 latency measurements
    });
  }
}

/**
 * Record latency measurement
 */
function recordLatency(provider: AIProvider, latencyMs: number): void {
  initLatencyHistory(provider);
  const history = latencyHistories.get(provider);
  if (!history) {
    return;
  }

  history.latencies.push(latencyMs);

  // Keep only recent measurements
  if (history.latencies.length > history.maxHistorySize) {
    history.latencies.shift();
  }
}

/**
 * Calculate percentile from sorted array
 */
function calculatePercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0;

  const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
  return sortedValues[Math.max(0, index)] ?? 0;
}

/**
 * Get latency statistics
 */
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

/**
 * Detect latency spike
 */
function isLatencySpike(provider: AIProvider, currentLatency: number): boolean {
  const stats = getLatencyStats(provider);

  if (stats.avg === 0) return false;

  return currentLatency > stats.avg * LATENCY_SPIKE_MULTIPLIER;
}

/**
 * Create AI provider instance
 */
function createProviderInstance(
  provider: AIProvider,
  apiKey: string,
): ReturnType<typeof createOpenAI | typeof createAnthropic | typeof createGoogleGenerativeAI> {
  switch (provider) {
    case 'openai':
      return createOpenAI({ apiKey });
    case 'anthropic':
      return createAnthropic({ apiKey });
    case 'google':
      return createGoogleGenerativeAI({ apiKey });
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Perform health check on a provider
 */
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
    const providerInstance = createProviderInstance(provider, apiKey);

    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Health check timeout')), HEALTH_CHECK_TIMEOUT_MS);
    });

    // Perform health check with timeout
    const checkPromise = generateText({
      model: providerInstance(modelName),
      prompt: TEST_PROMPT,
      maxOutputTokens: 5,
      // Disable AI SDK logging to prevent "m.log is not a function" error
      experimental_telemetry: { isEnabled: false },
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

    // Determine error type
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

/**
 * Update circuit breaker state
 */
function updateCircuitBreaker(provider: AIProvider, success: boolean): void {
  initCircuitBreaker(provider);
  const breaker = circuitBreakers.get(provider);
  if (!breaker) {
    return;
  }

  if (success) {
    // Reset on success
    breaker.failureCount = 0;
    breaker.lastFailureTime = null;
    if (breaker.isOpen) {
      console.log(`[HealthService] Circuit breaker closed for ${provider} - service recovered`);
      breaker.isOpen = false;
    }
  } else {
    // Increment failure count
    breaker.failureCount++;
    breaker.lastFailureTime = Date.now();

    // Open circuit if threshold exceeded
    if (breaker.failureCount >= CIRCUIT_BREAKER_THRESHOLD && !breaker.isOpen) {
      breaker.isOpen = true;
      console.warn(
        `[HealthService] Circuit breaker opened for ${provider} - ${breaker.failureCount} consecutive failures`,
      );
    }
  }
}

/**
 * Check if circuit breaker should attempt recovery
 */
function shouldAttemptRecovery(provider: AIProvider): boolean {
  const breaker = circuitBreakers.get(provider);

  if (breaker === undefined || breaker.isOpen === false || breaker.lastFailureTime === null) {
    return true; // Not open or no failure time, allow check
  }

  const timeSinceLastFailure = Date.now() - breaker.lastFailureTime;
  return timeSinceLastFailure >= HEALTH_CHECK_INTERVAL_MS;
}

/**
 * Calculate error rate from recent checks
 */
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

  // Keep last 20 checks
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

/**
 * Determine health status based on metrics
 */
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

/**
 * Calculate uptime percentage
 */
function calculateUptime(provider: AIProvider): number {
  const tracker = errorRateTrackers.get(provider);

  if (!tracker || tracker.recentChecks.length === 0) {
    return 100;
  }

  const successfulChecks = tracker.recentChecks.filter(c => c.success).length;
  return (successfulChecks / tracker.recentChecks.length) * 100;
}

/**
 * Check health of a single provider
 */
export async function checkProviderHealth(
  provider: AIProvider,
  userId: string = 'system',
): Promise<void> {
  // Check if circuit breaker allows the check
  if (!shouldAttemptRecovery(provider)) {
    console.log(
      `[HealthService] Skipping ${provider} - circuit breaker open, waiting for recovery window`,
    );
    return;
  }

  const config = getAIConfig();
  const providerConfig = config.providers[provider];

  if (!providerConfig.enabled) {
    console.log(`[HealthService] Skipping ${provider} - not enabled`);
    return;
  }

  console.log(`[HealthService] Checking health of ${provider}...`);

  // Ensure we have a valid API key for health checks
  if (!config.gatewayApiKey) {
    console.log(`[HealthService] Skipping ${provider} - no API key available`);
    return;
  }

  const modelName = providerConfig.models.fast; // Use fast model for health checks
  const result = await performHealthCheck(provider, modelName, config.gatewayApiKey);

  // Record latency if successful
  if (result.success) {
    recordLatency(provider, result.latencyMs);
  }

  // Update circuit breaker
  updateCircuitBreaker(provider, result.success);

  // Record result for error rate calculation
  recordHealthCheckResult(provider, result.success);

  // Get metrics
  const errorRate = getErrorRate(provider);
  const latencyStats = getLatencyStats(provider);
  const breaker = circuitBreakers.get(provider);
  const hasLatencySpike = result.success && isLatencySpike(provider, result.latencyMs);

  // Determine health status
  const status = determineHealthStatus(errorRate, hasLatencySpike, breaker?.isOpen ?? false);

  // Prepare health record
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

  // Update database
  await updateProviderHealth(health);

  // Log usage analytic
  await logUsageAnalytic({
    id: `analytic_${provider}_${Date.now()}`,
    userId,
    provider,
    modelName,
    promptTokens: result.success ? 2 : 0, // Estimated for "Hi"
    completionTokens: result.success ? 3 : 0, // Estimated short response
    totalTokens: result.success ? 5 : 0,
    estimatedCost: result.success ? 0.0001 : 0, // Minimal cost
    latencyMs: result.latencyMs,
    success: result.success,
    errorMessage: result.errorMessage,
    requestType: 'health_check',
    createdAt: now,
  });

  console.log(`[HealthService] ${provider} health check complete:`, {
    status,
    errorRate: `${errorRate.toFixed(1)}%`,
    uptime: `${health.uptime.toFixed(1)}%`,
    latency: `${result.latencyMs}ms`,
    circuitBreaker: breaker?.isOpen === true ? 'OPEN' : 'CLOSED',
  });
}

/**
 * Check health of all enabled providers
 */
export async function checkAllProvidersHealth(userId: string = 'system'): Promise<void> {
  const config = getAIConfig();
  const providers: AIProvider[] = ['openai', 'anthropic', 'google'];

  const enabledProviders = providers.filter(p => config.providers[p].enabled);

  console.log(`[HealthService] Starting health checks for ${enabledProviders.length} providers...`);

  // Run health checks in parallel
  await Promise.allSettled(enabledProviders.map(provider => checkProviderHealth(provider, userId)));

  console.log(`[HealthService] All health checks complete`);
}

/**
 * Start periodic health monitoring
 */
let healthCheckInterval: ReturnType<typeof setInterval> | null = null;

export function startHealthMonitoring(userId: string = 'system'): void {
  if (healthCheckInterval) {
    console.warn('[HealthService] Health monitoring already running');
    return;
  }

  console.log(
    `[HealthService] Starting periodic health monitoring (interval: ${HEALTH_CHECK_INTERVAL_MS / 1000}s)`,
  );

  // Run initial check
  checkAllProvidersHealth(userId).catch(error => {
    console.error('[HealthService] Initial health check failed:', error);
  });

  // Schedule periodic checks
  healthCheckInterval = setInterval(() => {
    checkAllProvidersHealth(userId).catch(error => {
      console.error('[HealthService] Periodic health check failed:', error);
    });
  }, HEALTH_CHECK_INTERVAL_MS);
}

/**
 * Stop periodic health monitoring
 */
export function stopHealthMonitoring(): void {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
    console.log('[HealthService] Health monitoring stopped');
  }
}

/**
 * Get circuit breaker status
 */
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

/**
 * Reset circuit breaker manually (for testing or manual recovery)
 */
export function resetCircuitBreaker(provider: AIProvider): void {
  const breaker = circuitBreakers.get(provider);

  if (breaker) {
    breaker.failureCount = 0;
    breaker.lastFailureTime = null;
    breaker.isOpen = false;
    console.log(`[HealthService] Circuit breaker manually reset for ${provider}`);
  }
}

/**
 * Get comprehensive health report
 */
export async function getHealthReport(): Promise<{
  providers: Array<{
    provider: AIProvider;
    health: AIProviderHealth | null;
    latencyStats: ReturnType<typeof getLatencyStats>;
    circuitBreaker: ReturnType<typeof getCircuitBreakerStatus>;
  }>;
  overallStatus: 'operational' | 'degraded' | 'outage';
}> {
  const providers: AIProvider[] = ['openai', 'anthropic', 'google'];
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

  // Determine overall status
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
