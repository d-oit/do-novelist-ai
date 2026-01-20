/**
 * AI Preferences Database Service Tests
 * Comprehensive test suite for CRUD operations, analytics, and health monitoring
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
  getUserAIPreference,
  saveUserAIPreference,
  getProviderCapabilities,
  saveProviderCapability,
  logUsageAnalytic,
  getUserUsageStats,
  getProviderHealth,
  updateProviderHealth,
  initAIPreferencesDB,
} from '@/lib/db/ai-preferences';
import {
  type UserAIPreference,
  type AIProviderCapability,
  type AIUsageAnalytic,
  type AIProviderHealth,
} from '@/lib/db/schemas/ai-preferences-schema';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string): string | null => {
      return store[key] || null;
    },
    setItem: (key: string, value: string): void => {
      store[key] = value;
    },
    removeItem: (key: string): void => {
      delete store[key];
    },
    clear: (): void => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('AI Preferences Database Service', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('Database Initialization', () => {
    it('should initialize AI preferences database without errors', async () => {
      await expect(initAIPreferencesDB()).resolves.not.toThrow();
    });
  });

  describe('User AI Preferences CRUD', () => {
    const mockPreference: UserAIPreference = {
      id: 'pref-123',
      userId: 'user-456',
      selectedProvider: 'openai',
      selectedModel: 'gpt-4o',
      enableFallback: true,
      fallbackProviders: ['anthropic', 'google'],
      budgetLimit: 100.0,
      budgetPeriod: 'monthly',
      maxTokensPerRequest: 4000,
      temperature: 0.7,
      topP: 1.0,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it('should save user AI preference to localStorage', async () => {
      await saveUserAIPreference(mockPreference);

      // Storage adapter uses key format: novelist_{namespace}_{key}_{userId}
      const stored = localStorage.getItem(`novelist_ai_preference_${mockPreference.userId}_${mockPreference.userId}`);
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored as string);
      expect(parsed.id).toBe(mockPreference.id);
      expect(parsed.selectedProvider).toBe('openai');
      expect(parsed.enableFallback).toBe(true);
    });

    it('should retrieve user AI preference from localStorage', async () => {
      await saveUserAIPreference(mockPreference);

      const retrieved = await getUserAIPreference(mockPreference.userId);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(mockPreference.id);
      expect(retrieved?.selectedProvider).toBe('openai');
      expect(retrieved?.selectedModel).toBe('gpt-4o');
      expect(retrieved?.fallbackProviders).toEqual(['anthropic', 'google']);
    });

    it('should return null for non-existent user preference', async () => {
      const retrieved = await getUserAIPreference('non-existent-user');
      expect(retrieved).toBeNull();
    });

    it('should update existing user preference', async () => {
      await saveUserAIPreference(mockPreference);

      const updated: UserAIPreference = {
        ...mockPreference,
        selectedModel: 'gpt-4o-mini',
        temperature: 0.5,
      };

      await saveUserAIPreference(updated);

      const retrieved = await getUserAIPreference(mockPreference.userId);

      expect(retrieved?.selectedModel).toBe('gpt-4o-mini');
      expect(retrieved?.temperature).toBe(0.5);
    });

    it('should handle preferences with null budget', async () => {
      const prefWithNoBudget: UserAIPreference = {
        ...mockPreference,
        budgetLimit: null,
        budgetPeriod: null,
      };

      await saveUserAIPreference(prefWithNoBudget);

      const retrieved = await getUserAIPreference(prefWithNoBudget.userId);

      expect(retrieved?.budgetLimit).toBeNull();
      expect(retrieved?.budgetPeriod).toBeNull();
    });
  });

  describe('AI Provider Capabilities CRUD', () => {
    const mockCapability: AIProviderCapability = {
      id: 'cap-123',
      provider: 'openai',
      modelName: 'gpt-4o',
      modelTier: 'advanced',
      maxTokens: 4096,
      inputCostPer1kTokens: 0.005,
      outputCostPer1kTokens: 0.015,
      supportsStreaming: true,
      supportsVision: true,
      supportsFunctionCalling: true,
      contextWindow: 128000,
      capabilities: JSON.stringify(['text', 'vision', 'function-calling']),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it('should save provider capability to localStorage', async () => {
      await saveProviderCapability(mockCapability);

      // Storage adapter uses key format: novelist_{namespace}_{key}
      const stored = localStorage.getItem('novelist_ai_capabilities');
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored as string);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].modelName).toBe('gpt-4o');
    });

    it('should retrieve all provider capabilities', async () => {
      await saveProviderCapability(mockCapability);

      const mockCapability2: AIProviderCapability = {
        ...mockCapability,
        id: 'cap-456',
        provider: 'anthropic',
        modelName: 'claude-3-5-sonnet-20241022',
      };

      await saveProviderCapability(mockCapability2);

      const capabilities = await getProviderCapabilities();

      expect(capabilities).toHaveLength(2);
    });

    it('should retrieve capabilities for specific provider', async () => {
      await saveProviderCapability(mockCapability);

      const mockCapability2: AIProviderCapability = {
        ...mockCapability,
        id: 'cap-456',
        provider: 'anthropic',
        modelName: 'claude-3-5-sonnet-20241022',
      };

      await saveProviderCapability(mockCapability2);

      const capabilities = await getProviderCapabilities('openai');

      expect(capabilities).toHaveLength(1);
      expect(capabilities[0]?.provider).toBe('openai');
    });

    it('should update existing capability when provider and model match', async () => {
      await saveProviderCapability(mockCapability);

      const updated: AIProviderCapability = {
        ...mockCapability,
        inputCostPer1kTokens: 0.003,
      };

      await saveProviderCapability(updated);

      const capabilities = await getProviderCapabilities('openai');

      expect(capabilities).toHaveLength(1);
      expect(capabilities[0]?.inputCostPer1kTokens).toBe(0.003);
    });
  });

  describe('AI Usage Analytics', () => {
    const mockAnalytic: AIUsageAnalytic = {
      id: 'anal-123',
      userId: 'user-456',
      provider: 'openai',
      modelName: 'gpt-4o',
      promptTokens: 100,
      completionTokens: 200,
      totalTokens: 300,
      estimatedCost: 0.0045,
      latencyMs: 1500,
      success: true,
      errorMessage: null,
      requestType: 'chapter-generation',
      createdAt: new Date().toISOString(),
    };

    it('should log usage analytic to localStorage', async () => {
      await logUsageAnalytic(mockAnalytic);

      // Storage adapter uses key format: novelist_{namespace}_{key}
      const stored = localStorage.getItem('novelist_ai_analytics');
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored as string);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].totalTokens).toBe(300);
    });

    it('should calculate usage stats correctly for single user', async () => {
      await logUsageAnalytic(mockAnalytic);
      await logUsageAnalytic({
        ...mockAnalytic,
        id: 'anal-124',
        totalTokens: 400,
        estimatedCost: 0.006,
        latencyMs: 2000,
      });

      const stats = await getUserUsageStats('user-456');

      expect(stats.totalTokens).toBe(700);
      expect(stats.totalCost).toBeCloseTo(0.0105, 4);
      expect(stats.totalRequests).toBe(2);
      expect(stats.successRate).toBe(100);
      expect(stats.avgLatencyMs).toBe(1750);
    });

    it('should calculate success rate correctly with failures', async () => {
      await logUsageAnalytic(mockAnalytic);
      await logUsageAnalytic({
        ...mockAnalytic,
        id: 'anal-125',
        success: false,
        errorMessage: 'Rate limit exceeded',
      });

      const stats = await getUserUsageStats('user-456');

      expect(stats.successRate).toBe(50);
    });

    it('should filter analytics by date range', async () => {
      const oldDate = new Date('2024-01-01').toISOString();
      const newDate = new Date().toISOString();

      await logUsageAnalytic({ ...mockAnalytic, id: 'anal-old', createdAt: oldDate });
      await logUsageAnalytic({ ...mockAnalytic, id: 'anal-new', createdAt: newDate });

      const stats = await getUserUsageStats('user-456', new Date('2024-06-01').toISOString());

      expect(stats.totalRequests).toBe(1);
    });

    it('should return zero stats for user with no analytics', async () => {
      const stats = await getUserUsageStats('non-existent-user');

      expect(stats.totalTokens).toBe(0);
      expect(stats.totalCost).toBe(0);
      expect(stats.totalRequests).toBe(0);
      expect(stats.successRate).toBe(0);
      expect(stats.avgLatencyMs).toBe(0);
    });
  });

  describe('AI Provider Health', () => {
    const mockHealth: AIProviderHealth = {
      id: 'health-123',
      provider: 'openai',
      status: 'operational',
      uptime: 99.9,
      errorRate: 0.1,
      avgLatencyMs: 1200,
      lastCheckedAt: new Date().toISOString(),
      lastIncidentAt: null,
      incidentDescription: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it('should save provider health to localStorage', async () => {
      await updateProviderHealth(mockHealth);

      // Storage adapter uses key format: novelist_{namespace}_{key}
      const stored = localStorage.getItem('novelist_ai_health');
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored as string);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].status).toBe('operational');
    });

    it('should retrieve all provider health records', async () => {
      await updateProviderHealth(mockHealth);
      await updateProviderHealth({
        ...mockHealth,
        id: 'health-456',
        provider: 'anthropic',
        uptime: 99.5,
      });

      const health = await getProviderHealth();

      expect(health).toHaveLength(2);
    });

    it('should retrieve health for specific provider', async () => {
      await updateProviderHealth(mockHealth);
      await updateProviderHealth({
        ...mockHealth,
        id: 'health-456',
        provider: 'anthropic',
      });

      const health = await getProviderHealth('openai');

      expect(health).toHaveLength(1);
      expect(health[0]?.provider).toBe('openai');
    });

    it('should update existing health record', async () => {
      await updateProviderHealth(mockHealth);

      const updated: AIProviderHealth = {
        ...mockHealth,
        status: 'degraded',
        errorRate: 5.0,
        lastIncidentAt: new Date().toISOString(),
        incidentDescription: 'Increased latency detected',
      };

      await updateProviderHealth(updated);

      const health = await getProviderHealth('openai');

      expect(health).toHaveLength(1);
      expect(health[0]?.status).toBe('degraded');
      expect(health[0]?.errorRate).toBe(5.0);
      expect(health[0]?.incidentDescription).toBe('Increased latency detected');
    });

    it('should handle outage status', async () => {
      const outageHealth: AIProviderHealth = {
        ...mockHealth,
        status: 'outage',
        uptime: 0,
        errorRate: 100,
        lastIncidentAt: new Date().toISOString(),
        incidentDescription: 'Complete service outage',
      };

      await updateProviderHealth(outageHealth);

      const health = await getProviderHealth('openai');

      expect(health[0]?.status).toBe('outage');
      expect(health[0]?.uptime).toBe(0);
      expect(health[0]?.errorRate).toBe(100);
    });
  });

  describe('Error Handling', () => {
    it('should handle corrupted localStorage data gracefully', async () => {
      localStorage.setItem('novelist_ai_preferences_user-456', 'invalid-json');

      const preference = await getUserAIPreference('user-456');

      // Should return null rather than throwing
      expect(preference).toBeNull();
    });

    it('should handle empty analytics array', async () => {
      const stats = await getUserUsageStats('user-456');

      expect(stats.totalTokens).toBe(0);
      expect(stats.totalRequests).toBe(0);
    });
  });

  describe('Type Safety', () => {
    it('should enforce AIProvider type constraints', async () => {
      const preference: UserAIPreference = {
        id: 'pref-123',
        userId: 'user-456',
        selectedProvider: 'openai' as const,
        selectedModel: 'gpt-4o',
        enableFallback: true,
        fallbackProviders: ['anthropic', 'google'],
        budgetLimit: null,
        budgetPeriod: null,
        maxTokensPerRequest: null,
        temperature: 0.7,
        topP: 1.0,
        frequencyPenalty: 0.0,
        presencePenalty: 0.0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveUserAIPreference(preference);
      const retrieved = await getUserAIPreference('user-456');

      expect(retrieved?.selectedProvider).toBe('openai');
    });

    it('should enforce model tier type constraints', async () => {
      const capability: AIProviderCapability = {
        id: 'cap-123',
        provider: 'openai',
        modelName: 'gpt-4o-mini',
        modelTier: 'fast' as const,
        maxTokens: 4096,
        inputCostPer1kTokens: 0.001,
        outputCostPer1kTokens: 0.003,
        supportsStreaming: true,
        supportsVision: false,
        supportsFunctionCalling: true,
        contextWindow: 128000,
        capabilities: JSON.stringify(['text']),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveProviderCapability(capability);
      const retrieved = await getProviderCapabilities('openai');

      expect(retrieved[0]?.modelTier).toBe('fast');
    });
  });
});
