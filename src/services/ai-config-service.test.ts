/**
 * Tests for ai-config-service.ts
 * Target: Increase coverage from 15.62% to 70%+
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { getAIConfig } from '@/lib/ai-config';
import { getUserAIPreference, saveUserAIPreference } from '@/lib/db/index';
import { logger } from '@/lib/logging/logger';
import {
  loadUserPreferences,
  saveUserPreferences,
  getActiveProviders,
  validateProviderModel,
  getOptimalModel,
  type ProviderPreferenceData,
} from '@/services/ai-config-service';

// Mock dependencies
vi.mock('@/lib/db/index', () => ({
  getUserAIPreference: vi.fn(),
  saveUserAIPreference: vi.fn(),
}));

vi.mock('@/lib/ai-config', () => ({
  getAIConfig: vi.fn(),
}));

vi.mock('@/lib/logging/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

describe('ai-config-service', () => {
  const mockAIConfig = {
    defaultProvider: 'google' as const,
    providers: {
      google: {
        enabled: true,
        models: {
          fast: 'gemini-1.5-flash',
          standard: 'gemini-1.5-pro',
          advanced: 'gemini-2.0-flash-exp',
        },
      },
      openai: {
        enabled: true,
        models: {
          fast: 'gpt-3.5-turbo',
          standard: 'gpt-4',
          advanced: 'gpt-4-turbo',
        },
      },
      anthropic: {
        enabled: false,
        models: {
          fast: 'claude-instant',
          standard: 'claude-2',
          advanced: 'claude-3',
        },
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAIConfig).mockReturnValue(mockAIConfig as any);
  });

  describe('loadUserPreferences', () => {
    it('should load existing user preferences', async () => {
      const mockUserPrefs = {
        id: 'pref-1',
        userId: 'user-1',
        selectedProvider: 'google' as const,
        selectedModel: 'gemini-2.0-flash-exp',
        fallbackProviders: ['openai' as const],
        temperature: 0.8,
        maxTokensPerRequest: 8000,
        budgetLimit: 100,
        enableFallback: true,
        budgetPeriod: 'monthly' as const,
        topP: 1.0,
        frequencyPenalty: 0.0,
        presencePenalty: 0.0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(getUserAIPreference).mockResolvedValue(mockUserPrefs);

      const result = await loadUserPreferences('user-1');

      expect(result).toEqual({
        selectedProvider: 'google',
        selectedModel: 'gemini-2.0-flash-exp',
        fallbackProviders: ['openai'],
        temperature: 0.8,
        maxTokens: 8000,
        monthlyBudget: 100,
        autoFallback: true,
        costOptimization: false,
        autoRouting: false,
        modelVariant: '',
        enableStructuredOutputs: false,
        enableResponseValidation: false,
      });
    });

    it('should return default config when user has no preferences', async () => {
      vi.mocked(getUserAIPreference).mockResolvedValue(null);

      const result = await loadUserPreferences('user-1');

      expect(result.selectedProvider).toBe('google');
      expect(result.selectedModel).toBeDefined();
      expect(result.temperature).toBe(0.7);
      expect(result.maxTokens).toBe(4000);
      expect(result.monthlyBudget).toBe(50);
    });

    it('should return default config on error', async () => {
      vi.mocked(getUserAIPreference).mockRejectedValue(new Error('Database error'));

      const result = await loadUserPreferences('user-1');

      expect(result.selectedProvider).toBe('google');
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to load user preferences',
        { component: 'ai-config-service' },
        expect.any(Error),
      );
    });

    it('should handle null values in user preferences', async () => {
      const mockUserPrefs = {
        id: 'pref-1',
        userId: 'user-1',
        selectedProvider: 'google' as const,
        selectedModel: 'gemini-2.0-flash-exp',
        fallbackProviders: [],
        temperature: 0.7,
        maxTokensPerRequest: null,
        budgetLimit: null,
        enableFallback: false,
        budgetPeriod: 'monthly' as const,
        topP: 1.0,
        frequencyPenalty: 0.0,
        presencePenalty: 0.0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(getUserAIPreference).mockResolvedValue(mockUserPrefs as any);

      const result = await loadUserPreferences('user-1');

      expect(result.maxTokens).toBe(4000); // Default fallback
      expect(result.monthlyBudget).toBe(50); // Default fallback
    });
  });

  describe('saveUserPreferences', () => {
    it('should save valid user preferences', async () => {
      vi.mocked(getUserAIPreference).mockResolvedValue(null);
      vi.mocked(saveUserAIPreference).mockResolvedValue(undefined);

      const newPrefs: Partial<ProviderPreferenceData> = {
        temperature: 0.9,
        maxTokens: 8000,
      };

      await saveUserPreferences('user-1', newPrefs);

      expect(saveUserAIPreference).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('Saved AI preferences for user', { userId: 'user-1' });
    });

    it('should validate temperature range', async () => {
      vi.mocked(getUserAIPreference).mockResolvedValue(null);

      const invalidPrefs = {
        temperature: 3.0, // Invalid: > 2
      };

      await expect(saveUserPreferences('user-1', invalidPrefs)).rejects.toThrow();
    });

    it('should validate temperature lower bound', async () => {
      vi.mocked(getUserAIPreference).mockResolvedValue(null);

      const invalidPrefs = {
        temperature: -0.5, // Invalid: < 0
      };

      await expect(saveUserPreferences('user-1', invalidPrefs)).rejects.toThrow();
    });

    it('should validate maxTokens range', async () => {
      vi.mocked(getUserAIPreference).mockResolvedValue(null);

      const invalidPrefs = {
        maxTokens: 200000, // Invalid: > 128000
      };

      await expect(saveUserPreferences('user-1', invalidPrefs)).rejects.toThrow();
    });

    it('should validate maxTokens lower bound', async () => {
      vi.mocked(getUserAIPreference).mockResolvedValue(null);

      const invalidPrefs = {
        maxTokens: 0, // Invalid: < 1
      };

      await expect(saveUserPreferences('user-1', invalidPrefs)).rejects.toThrow();
    });

    it('should validate monthlyBudget', async () => {
      vi.mocked(getUserAIPreference).mockResolvedValue(null);

      const invalidPrefs = {
        monthlyBudget: -10, // Invalid: < 0
      };

      await expect(saveUserPreferences('user-1', invalidPrefs)).rejects.toThrow();
    });

    it('should validate fallbackProviders is array', async () => {
      vi.mocked(getUserAIPreference).mockResolvedValue(null);

      const invalidPrefs = {
        fallbackProviders: 'not-an-array' as any,
      };

      await expect(saveUserPreferences('user-1', invalidPrefs)).rejects.toThrow();
    });

    it('should convert autoFallback to boolean', async () => {
      vi.mocked(getUserAIPreference).mockResolvedValue(null);
      vi.mocked(saveUserAIPreference).mockResolvedValue(undefined);

      const prefs = {
        autoFallback: 1 as any, // Truthy value
      };

      await saveUserPreferences('user-1', prefs);

      expect(saveUserAIPreference).toHaveBeenCalled();
    });

    it('should convert costOptimization to boolean', async () => {
      vi.mocked(getUserAIPreference).mockResolvedValue(null);
      vi.mocked(saveUserAIPreference).mockResolvedValue(undefined);

      const prefs = {
        costOptimization: 'true' as any, // Truthy value
      };

      await saveUserPreferences('user-1', prefs);

      expect(saveUserAIPreference).toHaveBeenCalled();
    });

    it('should handle database save error', async () => {
      vi.mocked(getUserAIPreference).mockResolvedValue(null);
      vi.mocked(saveUserAIPreference).mockRejectedValue(new Error('DB save failed'));

      const prefs = {
        temperature: 0.8,
      };

      await expect(saveUserPreferences('user-1', prefs)).rejects.toThrow('Failed to save preferences');
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to save user preferences',
        { component: 'ai-config-service' },
        expect.any(Error),
      );
    });

    it('should merge with existing preferences', async () => {
      const existingPrefs = {
        id: 'pref-1',
        userId: 'user-1',
        selectedProvider: 'google' as const,
        selectedModel: 'gemini-2.0-flash-exp',
        fallbackProviders: ['openai' as const],
        temperature: 0.7,
        maxTokensPerRequest: 4000,
        budgetLimit: 50,
        enableFallback: true,
        budgetPeriod: 'monthly' as const,
        topP: 1.0,
        frequencyPenalty: 0.0,
        presencePenalty: 0.0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(getUserAIPreference).mockResolvedValue(existingPrefs);
      vi.mocked(saveUserAIPreference).mockResolvedValue(undefined);

      const newPrefs = {
        temperature: 0.9,
      };

      await saveUserPreferences('user-1', newPrefs);

      const savedCall = vi.mocked(saveUserAIPreference).mock.calls[0]?.[0];
      if (savedCall) {
        expect(savedCall.temperature).toBe(0.9);
        expect(savedCall.selectedModel).toBe('gemini-2.0-flash-exp'); // Preserved
      }
    });
  });

  describe('getActiveProviders', () => {
    it('should return primary provider when enabled', () => {
      const prefs: ProviderPreferenceData = {
        selectedProvider: 'google',
        selectedModel: 'gemini-2.0-flash-exp',
        fallbackProviders: [],
        temperature: 0.7,
        maxTokens: 4000,
        monthlyBudget: 50,
        autoFallback: true,
        costOptimization: false,
        autoRouting: false,
        modelVariant: '',
        enableStructuredOutputs: false,
        enableResponseValidation: false,
      };

      const result = getActiveProviders(prefs);

      expect(result).toEqual(['google']);
    });

    it('should include enabled fallback providers', () => {
      const prefs: ProviderPreferenceData = {
        selectedProvider: 'google',
        selectedModel: 'gemini-2.0-flash-exp',
        fallbackProviders: ['openai'],
        temperature: 0.7,
        maxTokens: 4000,
        monthlyBudget: 50,
        autoFallback: true,
        costOptimization: false,
        autoRouting: false,
        modelVariant: '',
        enableStructuredOutputs: false,
        enableResponseValidation: false,
      };

      const result = getActiveProviders(prefs);

      expect(result).toEqual(['google', 'openai']);
    });

    it('should skip disabled fallback providers', () => {
      const prefs: ProviderPreferenceData = {
        selectedProvider: 'google',
        selectedModel: 'gemini-2.0-flash-exp',
        fallbackProviders: ['anthropic'], // Disabled in mockAIConfig
        temperature: 0.7,
        maxTokens: 4000,
        monthlyBudget: 50,
        autoFallback: true,
        costOptimization: false,
        autoRouting: false,
        modelVariant: '',
        enableStructuredOutputs: false,
        enableResponseValidation: false,
      };

      const result = getActiveProviders(prefs);

      expect(result).toEqual(['google']);
    });

    it('should not include duplicate providers', () => {
      const prefs: ProviderPreferenceData = {
        selectedProvider: 'google',
        selectedModel: 'gemini-2.0-flash-exp',
        fallbackProviders: ['google', 'openai'], // Duplicate 'google'
        temperature: 0.7,
        maxTokens: 4000,
        monthlyBudget: 50,
        autoFallback: true,
        costOptimization: false,
        autoRouting: false,
        modelVariant: '',
        enableStructuredOutputs: false,
        enableResponseValidation: false,
      };

      const result = getActiveProviders(prefs);

      expect(result).toEqual(['google', 'openai']);
    });

    it('should handle multiple fallback providers', () => {
      const prefs: ProviderPreferenceData = {
        selectedProvider: 'google',
        selectedModel: 'gemini-2.0-flash-exp',
        fallbackProviders: ['openai', 'anthropic'], // One enabled, one disabled
        temperature: 0.7,
        maxTokens: 4000,
        monthlyBudget: 50,
        autoFallback: true,
        costOptimization: false,
        autoRouting: false,
        modelVariant: '',
        enableStructuredOutputs: false,
        enableResponseValidation: false,
      };

      const result = getActiveProviders(prefs);

      expect(result).toEqual(['google', 'openai']);
    });
  });

  describe('validateProviderModel', () => {
    it('should validate valid provider and model', () => {
      const result = validateProviderModel('google', 'gemini-2.0-flash-exp');

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject unknown provider', () => {
      const result = validateProviderModel('unknown' as any, 'some-model');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Unknown provider: unknown');
    });

    it('should reject disabled provider', () => {
      const result = validateProviderModel('anthropic', 'claude-3');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Provider anthropic is not configured');
    });

    it('should reject invalid model for provider', () => {
      const result = validateProviderModel('google', 'gpt-4');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Model gpt-4 not available for provider google');
    });

    it('should validate fast model', () => {
      const result = validateProviderModel('google', 'gemini-1.5-flash');

      expect(result.valid).toBe(true);
    });

    it('should validate standard model', () => {
      const result = validateProviderModel('openai', 'gpt-4');

      expect(result.valid).toBe(true);
    });

    it('should validate advanced model', () => {
      const result = validateProviderModel('openai', 'gpt-4-turbo');

      expect(result.valid).toBe(true);
    });
  });

  describe('getOptimalModel', () => {
    const mockPrefs: ProviderPreferenceData = {
      selectedProvider: 'google',
      selectedModel: 'gemini-2.0-flash-exp',
      fallbackProviders: [],
      temperature: 0.7,
      maxTokens: 4000,
      monthlyBudget: 50,
      autoFallback: true,
      costOptimization: false,
      autoRouting: false,
      modelVariant: '',
      enableStructuredOutputs: false,
      enableResponseValidation: false,
    };

    it('should return fast model', () => {
      const result = getOptimalModel('google', 'fast', mockPrefs);

      expect(result).toBe('gemini-1.5-flash');
    });

    it('should return standard model', () => {
      const result = getOptimalModel('google', 'standard', mockPrefs);

      expect(result).toBe('gemini-1.5-pro');
    });

    it('should return advanced model', () => {
      const result = getOptimalModel('google', 'advanced', mockPrefs);

      expect(result).toBe('gemini-2.0-flash-exp');
    });

    it('should work for different providers', () => {
      const result = getOptimalModel('openai', 'fast', mockPrefs);

      expect(result).toBe('gpt-3.5-turbo');
    });

    it('should return correct model for each task type', () => {
      expect(getOptimalModel('openai', 'fast', mockPrefs)).toBe('gpt-3.5-turbo');
      expect(getOptimalModel('openai', 'standard', mockPrefs)).toBe('gpt-4');
      expect(getOptimalModel('openai', 'advanced', mockPrefs)).toBe('gpt-4-turbo');
    });
  });
});
