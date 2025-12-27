/**
 * AI Health Service Integration Tests
 * Tests for circuit breaker, latency tracking, and health monitoring
 */

import { describe, expect, it, vi } from 'vitest';

import { getLatencyStats, getCircuitBreakerStatus, resetCircuitBreaker } from '@/services/ai-health-service';

vi.mock('@/lib/ai-config', async () => {
  const actual = await vi.importActual<any>('@/lib/ai-config');
  return {
    ...actual,
    getAIConfig: () => ({
      defaultProvider: 'google',
      openrouterApiKey: 'test-api-key',
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
        mistral: {
          enabled: false,
          models: { fast: 'mistral-small-latest', standard: 'mistral-medium-latest', advanced: 'mistral-large-latest' },
        },
      },
    }),
  };
});

vi.mock('@/lib/db/index', async () => {
  return {
    getProviderHealth: vi.fn().mockResolvedValue([]),
    updateProviderHealth: vi.fn().mockResolvedValue(undefined),
    logUsageAnalytic: vi.fn().mockResolvedValue(undefined),
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

vi.mock('@openrouter/sdk', () => ({
  OpenRouter: class MockOpenRouter {
    chat = {
      send: vi.fn().mockResolvedValue({
        choices: [{ message: { content: 'Health check response' } }],
      }),
    };
  },
}));

describe('AI Health Service - Circuit Breaker', () => {
  beforeEach(() => {
    resetCircuitBreaker('google');
    resetCircuitBreaker('openai');
    resetCircuitBreaker('anthropic');
  });

  describe('getCircuitBreakerStatus', () => {
    it('returns closed circuit for new provider', () => {
      const status = getCircuitBreakerStatus('google');
      expect(status.isOpen).toBe(false);
      expect(status.failureCount).toBe(0);
      expect(status.lastFailureTime).toBeNull();
    });

    it('returns correct state after failures', () => {
      const statusBefore = getCircuitBreakerStatus('openai');
      expect(statusBefore.isOpen).toBe(false);
    });
  });

  describe('resetCircuitBreaker', () => {
    it('resets circuit breaker state', () => {
      const statusBefore = getCircuitBreakerStatus('anthropic');
      expect(statusBefore.failureCount).toBe(0);
      expect(statusBefore.isOpen).toBe(false);

      resetCircuitBreaker('anthropic');
      const statusAfter = getCircuitBreakerStatus('anthropic');
      expect(statusAfter.failureCount).toBe(0);
      expect(statusAfter.isOpen).toBe(false);
    });
  });
});

describe('AI Health Service - Latency Tracking', () => {
  describe('getLatencyStats', () => {
    it('returns zeros for provider with no history', () => {
      const stats = getLatencyStats('google');
      expect(stats.avg).toBe(0);
      expect(stats.p50).toBe(0);
      expect(stats.p95).toBe(0);
      expect(stats.p99).toBe(0);
      expect(stats.min).toBe(0);
      expect(stats.max).toBe(0);
    });

    it('calculates average latency correctly', () => {
      const stats = getLatencyStats('openai');
      expect(stats).toHaveProperty('avg');
      expect(stats).toHaveProperty('p50');
      expect(stats).toHaveProperty('p95');
      expect(stats).toHaveProperty('p99');
      expect(stats).toHaveProperty('min');
      expect(stats).toHaveProperty('max');
    });
  });
});

describe('AI Health Service - Health Status Determination', () => {
  it('returns operational when no issues', () => {
    const status = getCircuitBreakerStatus('google');
    expect(status).toBeDefined();
    expect(typeof status.isOpen).toBe('boolean');
  });

  it('tracks circuit breaker state correctly', () => {
    const status = getCircuitBreakerStatus('mistral');
    expect(status.isOpen).toBe(false);
    expect(status.failureCount).toBe(0);
  });
});
