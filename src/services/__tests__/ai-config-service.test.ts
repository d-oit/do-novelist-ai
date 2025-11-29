/**
 * AI Config Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  AIConfigService,
  ConfigValidationError,
  getAIConfigService,
  loadUserPreferences,
  saveUserPreferences,
  getActiveProvider,
  validateModelForProvider,
  getAvailableModels
} from '../ai-config-service';
import type { UserAIPreference } from '@/lib/db';
import type { AIProvider } from '@/lib/ai-config';

// Mock the database module
vi.mock('@/lib/db', () => ({
  getUserAIPreference: vi.fn(),
  saveUserAIPreference: vi.fn()
}));

// Mock the ai-config module
vi.mock('@/lib/ai-config', () => ({
  getAIConfig: vi.fn(() => ({
    defaultProvider: 'google' as AIProvider,
    enableFallback: true,
    providers: {
      openai: {
        provider: 'openai' as AIProvider,
        apiKey: 'test-openai-key',
        models: {
          fast: 'gpt-4o-mini',
          standard: 'gpt-4o',
          advanced: 'gpt-4o'
        },
        enabled: true
      },
      anthropic: {
        provider: 'anthropic' as AIProvider,
        apiKey: 'test-anthropic-key',
        models: {
          fast: 'claude-3-5-haiku-20241022',
          standard: 'claude-3-5-sonnet-20241022',
          advanced: 'claude-3-5-sonnet-20241022'
        },
        enabled: true
      },
      google: {
        provider: 'google' as AIProvider,
        apiKey: 'test-google-key',
        models: {
          fast: 'gemini-2.0-flash-exp',
          standard: 'gemini-2.0-flash-exp',
          advanced: 'gemini-exp-1206'
        },
        enabled: true
      }
    }
  }))
}));

import * as db from '@/lib/db';

describe('AIConfigService', () => {
  let service: AIConfigService;

  beforeEach(() => {
    service = new AIConfigService();
    vi.clearAllMocks();
  });

  describe('loadUserPreferences', () => {
    it('should load preferences from database', async () => {
      const mockPreference: UserAIPreference = {
        id: 'pref_1',
        userId: 'user_1',
        selectedProvider: 'openai',
        selectedModel: 'gpt-4o',
        enableFallback: true,
        fallbackProviders: ['anthropic', 'google'],
        budgetLimit: 100,
        budgetPeriod: 'monthly',
        maxTokensPerRequest: 4000,
        temperature: 0.7,
        topP: 1.0,
        frequencyPenalty: 0.0,
        presencePenalty: 0.0,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      vi.mocked(db.getUserAIPreference).mockResolvedValue(mockPreference);

      const result = await service.loadUserPreferences('user_1');

      expect(result).toEqual(mockPreference);
      expect(db.getUserAIPreference).toHaveBeenCalledWith('user_1');
    });

    it('should return defaults when no preference exists', async () => {
      vi.mocked(db.getUserAIPreference).mockResolvedValue(null);

      const result = await service.loadUserPreferences('user_1');

      expect(result.userId).toBe('user_1');
      expect(result.selectedProvider).toBe('google');
      expect(result.enableFallback).toBe(true);
      expect(result.temperature).toBe(0.7);
    });

    it('should use cache on subsequent calls', async () => {
      const mockPreference: UserAIPreference = {
        id: 'pref_1',
        userId: 'user_1',
        selectedProvider: 'openai',
        selectedModel: 'gpt-4o',
        enableFallback: true,
        fallbackProviders: ['anthropic'],
        budgetLimit: null,
        budgetPeriod: null,
        maxTokensPerRequest: null,
        temperature: 0.7,
        topP: 1.0,
        frequencyPenalty: 0.0,
        presencePenalty: 0.0,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      vi.mocked(db.getUserAIPreference).mockResolvedValue(mockPreference);

      await service.loadUserPreferences('user_1');
      await service.loadUserPreferences('user_1');

      expect(db.getUserAIPreference).toHaveBeenCalledTimes(1);
    });

    it('should handle multi-user contexts', async () => {
      const user1Pref: UserAIPreference = {
        id: 'pref_1',
        userId: 'user_1',
        selectedProvider: 'openai',
        selectedModel: 'gpt-4o',
        enableFallback: true,
        fallbackProviders: [],
        budgetLimit: null,
        budgetPeriod: null,
        maxTokensPerRequest: null,
        temperature: 0.7,
        topP: 1.0,
        frequencyPenalty: 0.0,
        presencePenalty: 0.0,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      const user2Pref: UserAIPreference = {
        id: 'pref_2',
        userId: 'user_2',
        selectedProvider: 'anthropic',
        selectedModel: 'claude-3-5-sonnet-20241022',
        enableFallback: false,
        fallbackProviders: [],
        budgetLimit: null,
        budgetPeriod: null,
        maxTokensPerRequest: null,
        temperature: 0.5,
        topP: 0.9,
        frequencyPenalty: 0.0,
        presencePenalty: 0.0,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      vi.mocked(db.getUserAIPreference)
        .mockResolvedValueOnce(user1Pref)
        .mockResolvedValueOnce(user2Pref);

      const result1 = await service.loadUserPreferences('user_1');
      const result2 = await service.loadUserPreferences('user_2');

      expect(result1.selectedProvider).toBe('openai');
      expect(result2.selectedProvider).toBe('anthropic');
    });
  });

  describe('saveUserPreferences', () => {
    it('should save valid preferences', async () => {
      const preference: UserAIPreference = {
        id: 'pref_1',
        userId: 'user_1',
        selectedProvider: 'openai',
        selectedModel: 'gpt-4o',
        enableFallback: true,
        fallbackProviders: ['anthropic'],
        budgetLimit: null,
        budgetPeriod: null,
        maxTokensPerRequest: null,
        temperature: 0.7,
        topP: 1.0,
        frequencyPenalty: 0.0,
        presencePenalty: 0.0,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      await service.saveUserPreferences(preference);

      expect(db.saveUserAIPreference).toHaveBeenCalled();
      const savedPref = vi.mocked(db.saveUserAIPreference).mock.calls[0]![0];
      expect(savedPref.userId).toBe('user_1');
      expect(savedPref.selectedProvider).toBe('openai');
    });

    it('should update cache after save', async () => {
      const preference: UserAIPreference = {
        id: 'pref_1',
        userId: 'user_1',
        selectedProvider: 'openai',
        selectedModel: 'gpt-4o',
        enableFallback: true,
        fallbackProviders: [],
        budgetLimit: null,
        budgetPeriod: null,
        maxTokensPerRequest: null,
        temperature: 0.7,
        topP: 1.0,
        frequencyPenalty: 0.0,
        presencePenalty: 0.0,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      await service.saveUserPreferences(preference);

      // Should not call database on cache hit
      vi.mocked(db.getUserAIPreference).mockResolvedValue(preference);
      const result = await service.loadUserPreferences('user_1');

      expect(result.selectedProvider).toBe('openai');
      expect(db.getUserAIPreference).not.toHaveBeenCalled();
    });

    it('should trigger preference change callbacks', async () => {
      const callback = vi.fn();
      service.onPreferenceChange(callback);

      const preference: UserAIPreference = {
        id: 'pref_1',
        userId: 'user_1',
        selectedProvider: 'openai',
        selectedModel: 'gpt-4o',
        enableFallback: true,
        fallbackProviders: [],
        budgetLimit: null,
        budgetPeriod: null,
        maxTokensPerRequest: null,
        temperature: 0.7,
        topP: 1.0,
        frequencyPenalty: 0.0,
        presencePenalty: 0.0,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      await service.saveUserPreferences(preference);

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user_1', selectedProvider: 'openai' })
      );
    });

    it('should reject invalid provider', async () => {
      const preference: UserAIPreference = {
        id: 'pref_1',
        userId: 'user_1',
        selectedProvider: 'invalid' as AIProvider,
        selectedModel: 'model',
        enableFallback: true,
        fallbackProviders: [],
        budgetLimit: null,
        budgetPeriod: null,
        maxTokensPerRequest: null,
        temperature: 0.7,
        topP: 1.0,
        frequencyPenalty: 0.0,
        presencePenalty: 0.0,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      await expect(service.saveUserPreferences(preference)).rejects.toThrow(
        ConfigValidationError
      );
    });

    it('should reject invalid model for provider', async () => {
      const preference: UserAIPreference = {
        id: 'pref_1',
        userId: 'user_1',
        selectedProvider: 'openai',
        selectedModel: 'invalid-model',
        enableFallback: true,
        fallbackProviders: [],
        budgetLimit: null,
        budgetPeriod: null,
        maxTokensPerRequest: null,
        temperature: 0.7,
        topP: 1.0,
        frequencyPenalty: 0.0,
        presencePenalty: 0.0,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      await expect(service.saveUserPreferences(preference)).rejects.toThrow(
        ConfigValidationError
      );
    });

    it('should reject invalid temperature', async () => {
      const preference: UserAIPreference = {
        id: 'pref_1',
        userId: 'user_1',
        selectedProvider: 'openai',
        selectedModel: 'gpt-4o',
        enableFallback: true,
        fallbackProviders: [],
        budgetLimit: null,
        budgetPeriod: null,
        maxTokensPerRequest: null,
        temperature: 3.0,
        topP: 1.0,
        frequencyPenalty: 0.0,
        presencePenalty: 0.0,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      await expect(service.saveUserPreferences(preference)).rejects.toThrow(
        ConfigValidationError
      );
    });

    it('should reject invalid topP', async () => {
      const preference: UserAIPreference = {
        id: 'pref_1',
        userId: 'user_1',
        selectedProvider: 'openai',
        selectedModel: 'gpt-4o',
        enableFallback: true,
        fallbackProviders: [],
        budgetLimit: null,
        budgetPeriod: null,
        maxTokensPerRequest: null,
        temperature: 0.7,
        topP: 1.5,
        frequencyPenalty: 0.0,
        presencePenalty: 0.0,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      await expect(service.saveUserPreferences(preference)).rejects.toThrow(
        ConfigValidationError
      );
    });

    it('should reject budget limit without period', async () => {
      const preference: UserAIPreference = {
        id: 'pref_1',
        userId: 'user_1',
        selectedProvider: 'openai',
        selectedModel: 'gpt-4o',
        enableFallback: true,
        fallbackProviders: [],
        budgetLimit: 100,
        budgetPeriod: null,
        maxTokensPerRequest: null,
        temperature: 0.7,
        topP: 1.0,
        frequencyPenalty: 0.0,
        presencePenalty: 0.0,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      await expect(service.saveUserPreferences(preference)).rejects.toThrow(
        ConfigValidationError
      );
    });

    it('should reject negative budget limit', async () => {
      const preference: UserAIPreference = {
        id: 'pref_1',
        userId: 'user_1',
        selectedProvider: 'openai',
        selectedModel: 'gpt-4o',
        enableFallback: true,
        fallbackProviders: [],
        budgetLimit: -10,
        budgetPeriod: 'monthly',
        maxTokensPerRequest: null,
        temperature: 0.7,
        topP: 1.0,
        frequencyPenalty: 0.0,
        presencePenalty: 0.0,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      await expect(service.saveUserPreferences(preference)).rejects.toThrow(
        ConfigValidationError
      );
    });
  });

  describe('getActiveProvider', () => {
    it('should return selected provider when available', () => {
      const preference: UserAIPreference = {
        id: 'pref_1',
        userId: 'user_1',
        selectedProvider: 'openai',
        selectedModel: 'gpt-4o',
        enableFallback: true,
        fallbackProviders: ['anthropic'],
        budgetLimit: null,
        budgetPeriod: null,
        maxTokensPerRequest: null,
        temperature: 0.7,
        topP: 1.0,
        frequencyPenalty: 0.0,
        presencePenalty: 0.0,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      const provider = service.getActiveProvider(preference);

      expect(provider).toBe('openai');
    });

    it('should fallback when primary provider unavailable', () => {
      const { getAIConfig } = require('@/lib/ai-config');
      vi.mocked(getAIConfig).mockReturnValue({
        defaultProvider: 'google',
        enableFallback: true,
        providers: {
          openai: {
            provider: 'openai',
            apiKey: '',
            models: { fast: 'gpt-4o-mini', standard: 'gpt-4o', advanced: 'gpt-4o' },
            enabled: false
          },
          anthropic: {
            provider: 'anthropic',
            apiKey: 'test-key',
            models: {
              fast: 'claude-3-5-haiku-20241022',
              standard: 'claude-3-5-sonnet-20241022',
              advanced: 'claude-3-5-sonnet-20241022'
            },
            enabled: true
          },
          google: {
            provider: 'google',
            apiKey: 'test-key',
            models: {
              fast: 'gemini-2.0-flash-exp',
              standard: 'gemini-2.0-flash-exp',
              advanced: 'gemini-exp-1206'
            },
            enabled: true
          }
        }
      });

      const preference: UserAIPreference = {
        id: 'pref_1',
        userId: 'user_1',
        selectedProvider: 'openai',
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
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      const provider = service.getActiveProvider(preference);

      expect(provider).toBe('anthropic');
    });

    it('should throw when no provider available', () => {
      const { getAIConfig } = require('@/lib/ai-config');
      vi.mocked(getAIConfig).mockReturnValue({
        defaultProvider: 'google',
        enableFallback: true,
        providers: {
          openai: {
            provider: 'openai',
            apiKey: '',
            models: { fast: 'gpt-4o-mini', standard: 'gpt-4o', advanced: 'gpt-4o' },
            enabled: false
          },
          anthropic: {
            provider: 'anthropic',
            apiKey: '',
            models: {
              fast: 'claude-3-5-haiku-20241022',
              standard: 'claude-3-5-sonnet-20241022',
              advanced: 'claude-3-5-sonnet-20241022'
            },
            enabled: false
          },
          google: {
            provider: 'google',
            apiKey: '',
            models: {
              fast: 'gemini-2.0-flash-exp',
              standard: 'gemini-2.0-flash-exp',
              advanced: 'gemini-exp-1206'
            },
            enabled: false
          }
        }
      });

      const preference: UserAIPreference = {
        id: 'pref_1',
        userId: 'user_1',
        selectedProvider: 'openai',
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
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      expect(() => service.getActiveProvider(preference)).toThrow(ConfigValidationError);
    });
  });

  describe('validateModelForProvider', () => {
    it('should validate correct model for OpenAI', () => {
      expect(service.validateModelForProvider('openai', 'gpt-4o')).toBe(true);
      expect(service.validateModelForProvider('openai', 'gpt-4o-mini')).toBe(true);
    });

    it('should reject incorrect model for OpenAI', () => {
      expect(service.validateModelForProvider('openai', 'claude-3-5-sonnet-20241022')).toBe(false);
    });

    it('should validate correct model for Anthropic', () => {
      expect(service.validateModelForProvider('anthropic', 'claude-3-5-sonnet-20241022')).toBe(true);
    });

    it('should validate correct model for Google', () => {
      expect(service.validateModelForProvider('google', 'gemini-2.0-flash-exp')).toBe(true);
    });
  });

  describe('getAvailableModels', () => {
    it('should return models for OpenAI', () => {
      const models = service.getAvailableModels('openai');
      expect(models).toContain('gpt-4o');
      expect(models).toContain('gpt-4o-mini');
    });

    it('should return models for Anthropic', () => {
      const models = service.getAvailableModels('anthropic');
      expect(models).toContain('claude-3-5-sonnet-20241022');
      expect(models).toContain('claude-3-5-haiku-20241022');
    });

    it('should return models for Google', () => {
      const models = service.getAvailableModels('google');
      expect(models).toContain('gemini-2.0-flash-exp');
      expect(models).toContain('gemini-exp-1206');
    });
  });

  describe('clearCache', () => {
    it('should clear specific user cache', async () => {
      const mockPreference: UserAIPreference = {
        id: 'pref_1',
        userId: 'user_1',
        selectedProvider: 'openai',
        selectedModel: 'gpt-4o',
        enableFallback: true,
        fallbackProviders: [],
        budgetLimit: null,
        budgetPeriod: null,
        maxTokensPerRequest: null,
        temperature: 0.7,
        topP: 1.0,
        frequencyPenalty: 0.0,
        presencePenalty: 0.0,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      vi.mocked(db.getUserAIPreference).mockResolvedValue(mockPreference);

      await service.loadUserPreferences('user_1');
      service.clearCache('user_1');
      await service.loadUserPreferences('user_1');

      expect(db.getUserAIPreference).toHaveBeenCalledTimes(2);
    });

    it('should clear all cache', async () => {
      const mockPreference: UserAIPreference = {
        id: 'pref_1',
        userId: 'user_1',
        selectedProvider: 'openai',
        selectedModel: 'gpt-4o',
        enableFallback: true,
        fallbackProviders: [],
        budgetLimit: null,
        budgetPeriod: null,
        maxTokensPerRequest: null,
        temperature: 0.7,
        topP: 1.0,
        frequencyPenalty: 0.0,
        presencePenalty: 0.0,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      vi.mocked(db.getUserAIPreference).mockResolvedValue(mockPreference);

      await service.loadUserPreferences('user_1');
      service.clearCache();
      await service.loadUserPreferences('user_1');

      expect(db.getUserAIPreference).toHaveBeenCalledTimes(2);
    });
  });

  describe('Singleton functions', () => {
    it('should use singleton for loadUserPreferences', async () => {
      vi.mocked(db.getUserAIPreference).mockResolvedValue(null);

      const result = await loadUserPreferences('user_1');

      expect(result.userId).toBe('user_1');
    });

    it('should use singleton for saveUserPreferences', async () => {
      const preference: UserAIPreference = {
        id: 'pref_1',
        userId: 'user_1',
        selectedProvider: 'openai',
        selectedModel: 'gpt-4o',
        enableFallback: true,
        fallbackProviders: [],
        budgetLimit: null,
        budgetPeriod: null,
        maxTokensPerRequest: null,
        temperature: 0.7,
        topP: 1.0,
        frequencyPenalty: 0.0,
        presencePenalty: 0.0,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      await saveUserPreferences(preference);

      expect(db.saveUserAIPreference).toHaveBeenCalled();
    });

    it('should use singleton for getActiveProvider', () => {
      const preference: UserAIPreference = {
        id: 'pref_1',
        userId: 'user_1',
        selectedProvider: 'openai',
        selectedModel: 'gpt-4o',
        enableFallback: true,
        fallbackProviders: [],
        budgetLimit: null,
        budgetPeriod: null,
        maxTokensPerRequest: null,
        temperature: 0.7,
        topP: 1.0,
        frequencyPenalty: 0.0,
        presencePenalty: 0.0,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      const provider = getActiveProvider(preference);

      expect(provider).toBe('openai');
    });

    it('should use singleton for validateModelForProvider', () => {
      expect(validateModelForProvider('openai', 'gpt-4o')).toBe(true);
    });

    it('should use singleton for getAvailableModels', () => {
      const models = getAvailableModels('openai');
      expect(models).toContain('gpt-4o');
    });

    it('should return same singleton instance', () => {
      const instance1 = getAIConfigService();
      const instance2 = getAIConfigService();

      expect(instance1).toBe(instance2);
    });
  });
});
