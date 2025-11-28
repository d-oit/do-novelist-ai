import { useState, useEffect } from 'react';
import type { AIProviderConfig, AIProvider } from '../types/ai-config';
import {
  saveAIConfig,
  getAIConfigs,
  getDefaultAIConfig,
  updateAIConfig,
  deleteAIConfig,
} from '../lib/services/aiConfigService';
import { validateApiKey } from '../lib/ai/encryption';
import { getModelsForProvider, getDefaultModel } from '../lib/ai/provider-factory';

export function useAIConfig() {
  const [configs, setConfigs] = useState<AIProviderConfig[]>([]);
  const [defaultConfig, setDefaultConfig] = useState<AIProviderConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConfigs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const allConfigs = await getAIConfigs();
      setConfigs(allConfigs);

      const defaultCfg = await getDefaultAIConfig();
      setDefaultConfig(defaultCfg);
    } catch (err) {
      console.error('Failed to load AI configs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load configurations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConfigs();
  }, []);

  const addConfig = async (config: Omit<AIProviderConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
      setError(null);

      // Validate API key
      if (!validateApiKey(config.provider, config.apiKey)) {
        throw new Error('Invalid API key for selected provider');
      }

      // If this is set as default, unset other defaults
      if (config.isDefault) {
        await Promise.all(
          configs
            .filter(c => c.isDefault)
            .map(c => updateAIConfig(c.id!, { isDefault: false }))
        );
      }

      const id = await saveAIConfig(config);
      await loadConfigs(); // Reload to get updated list
      return id;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save configuration';
      setError(message);
      throw new Error(message);
    }
  };

  const updateConfig = async (id: string, updates: Partial<AIProviderConfig>): Promise<void> => {
    try {
      setError(null);

      // Validate API key if being updated
      if (updates.apiKey && !validateApiKey(updates.provider || 'openai', updates.apiKey)) {
        throw new Error('Invalid API key for selected provider');
      }

      // If setting as default, unset other defaults
      if (updates.isDefault) {
        await Promise.all(
          configs
            .filter(c => c.isDefault && c.id !== id)
            .map(c => updateAIConfig(c.id!, { isDefault: false }))
        );
      }

      await updateAIConfig(id, updates);
      await loadConfigs(); // Reload to get updated list
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update configuration';
      setError(message);
      throw new Error(message);
    }
  };

  const removeConfig = async (id: string): Promise<void> => {
    try {
      setError(null);
      await deleteAIConfig(id);
      await loadConfigs(); // Reload to get updated list
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete configuration';
      setError(message);
      throw new Error(message);
    }
  };

  const getAvailableModels = (provider: AIProvider) => {
    return getModelsForProvider(provider);
  };

  const getDefaultModelForProvider = (provider: AIProvider) => {
    return getDefaultModel(provider);
  };

  return {
    configs,
    defaultConfig,
    isLoading,
    error,
    addConfig,
    updateConfig,
    removeConfig,
    loadConfigs,
    getAvailableModels,
    getDefaultModelForProvider,
  };
}
