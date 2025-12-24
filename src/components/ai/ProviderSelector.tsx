import { ChevronDown, Zap, CheckCircle, XCircle, Loader2, Search, RefreshCw } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';

import { getAIConfig, type AIProvider } from '@/lib/ai-config';
import { logger } from '@/lib/logging/logger';
import { cn } from '@/lib/utils';
import { loadUserPreferences, saveUserPreferences } from '@/services/ai-config-service';
import {
  openRouterModelsService,
  type OpenRouterModel,
} from '@/services/openrouter-models-service';

interface ProviderSelectorProps {
  userId: string;
  onProviderChange?: (provider: AIProvider, model: string) => void;
  showModelExplorer?: boolean;
}

export const ProviderSelector = ({
  userId,
  onProviderChange,
  showModelExplorer = false,
}: ProviderSelectorProps): React.JSX.Element => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('google');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.0-flash-exp');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [filteredModels, setFilteredModels] = useState<OpenRouterModel[]>([]);
  const [modelLoading, setModelLoading] = useState(false);

  const config = getAIConfig();

  const filterModels = useCallback(() => {
    let filtered = [...models];

    if (selectedProvider) {
      filtered = filtered.filter(model => model.id.startsWith(selectedProvider));
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        model =>
          model.name.toLowerCase().includes(query) ||
          model.description.toLowerCase().includes(query) ||
          model.id.toLowerCase().includes(query),
      );
    }

    filtered.sort((a, b) => a.name.localeCompare(b.name));
    setFilteredModels(filtered);
  }, [models, searchQuery, selectedProvider]);

  useEffect(() => {
    filterModels();
  }, [filterModels]);

  useEffect(() => {
    void loadUserPreferences(userId).then(prefs => {
      setSelectedProvider(prefs.selectedProvider);
      setSelectedModel(prefs.selectedModel);
      setLoading(false);
    });
  }, [userId]);

  const loadModels = useCallback(async (): Promise<void> => {
    setModelLoading(true);
    try {
      const availableModels = await openRouterModelsService.getAvailableModels();
      setModels(availableModels);
    } catch (error) {
      logger.error('Failed to load models', {
        component: 'ProviderSelector',
        error,
        userId,
      });
    } finally {
      setModelLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (isOpen && showModelExplorer) {
      void loadModels();
    }
  }, [isOpen, showModelExplorer, loadModels]);

  const handleProviderSelect = async (provider: AIProvider, model: string): Promise<void> => {
    try {
      await saveUserPreferences(userId, {
        selectedProvider: provider,
        selectedModel: model,
      });

      setSelectedProvider(provider);
      setSelectedModel(model);
      setIsOpen(false);
      setSearchQuery('');

      if (onProviderChange) {
        onProviderChange(provider, model);
      }
    } catch (error) {
      logger.error('Failed to save provider selection', {
        component: 'ProviderSelector',
        error,
        userId,
        provider,
        model,
      });
    }
  };

  const getStatusIcon = (provider: AIProvider): React.JSX.Element => {
    const isEnabled = config.providers[provider]?.enabled;

    if (!isEnabled) {
      return <XCircle className='h-4 w-4 text-gray-400' />;
    }

    return <CheckCircle className='h-4 w-4 text-green-500' />;
  };

  const formatContextLength = (length: number): string => {
    if (length >= 1000000) {
      return `${(length / 1000000).toFixed(1)}M`;
    } else if (length >= 1000) {
      return `${(length / 1000).toFixed(0)}K`;
    }
    return length.toString();
  };

  const formatPricing = (prompt: string, completion: string): string => {
    const p = parseFloat(prompt);
    const c = parseFloat(completion);
    if (p === 0 && c === 0) return 'Free';
    return `$${p}/${c}`;
  };

  const getProviderFromModel = (modelId: string): AIProvider => {
    return modelId.split('/')[0] as AIProvider;
  };

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

  if (loading) {
    return (
      <div className='flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2'>
        <Loader2 className='h-4 w-4 animate-spin' />
        <span className='text-sm text-gray-600'>Loading...</span>
      </div>
    );
  }

  return (
    <div className='relative'>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='flex items-center gap-2 rounded-lg border bg-white px-3 py-2 transition-colors hover:bg-gray-50'
      >
        <Zap className='h-4 w-4 text-blue-500' />
        <span className='text-sm font-medium'>
          {selectedProvider}:{selectedModel}
        </span>
        <ChevronDown className='h-4 w-4 text-gray-400' />
      </button>

      {isOpen && (
        <div className='absolute left-0 top-full z-50 mt-2 w-[600px] overflow-hidden rounded-lg border bg-white shadow-lg'>
          <div className='p-4'>
            <h3 className='mb-4 font-semibold'>Choose AI Provider & Model</h3>

            {showModelExplorer ? (
              <div className='space-y-4'>
                <div className='flex gap-2'>
                  <div className='relative flex-1'>
                    <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
                    <input
                      type='text'
                      placeholder='Search models...'
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className='w-full rounded border py-2 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none'
                    />
                  </div>
                  <button
                    onClick={() => void loadModels()}
                    disabled={modelLoading}
                    className='rounded border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50'
                  >
                    <RefreshCw className={cn('h-4 w-4', modelLoading && 'animate-spin')} />
                  </button>
                </div>

                <div className='flex flex-wrap gap-1'>
                  <button
                    onClick={() => setSelectedProvider('google')}
                    className={cn(
                      'rounded px-3 py-1 text-xs',
                      !selectedProvider
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                    )}
                  >
                    All Providers
                  </button>
                  {providers.slice(0, 8).map(provider => (
                    <button
                      key={provider}
                      onClick={() => setSelectedProvider(provider)}
                      className={cn(
                        'rounded px-3 py-1 text-xs capitalize',
                        selectedProvider === provider
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                      )}
                    >
                      {provider}
                    </button>
                  ))}
                </div>

                <div className='max-h-96 overflow-y-auto'>
                  {modelLoading ? (
                    <div className='flex items-center justify-center py-8'>
                      <Loader2 className='h-6 w-6 animate-spin' />
                      <span className='ml-2 text-sm text-gray-600'>Loading models...</span>
                    </div>
                  ) : filteredModels.length === 0 ? (
                    <div className='py-8 text-center text-sm text-gray-500'>
                      {searchQuery
                        ? 'No models found matching your search.'
                        : 'No models available.'}
                    </div>
                  ) : (
                    <div className='space-y-2'>
                      {filteredModels.map(model => {
                        const provider = getProviderFromModel(model.id);
                        const providerConfig = config.providers[provider];
                        const isSelected =
                          selectedProvider === provider && selectedModel === model.id;
                        const isEnabled = providerConfig?.enabled;

                        return (
                          <button
                            key={model.id}
                            onClick={() => {
                              if (isEnabled) {
                                void handleProviderSelect(provider, model.id);
                              }
                            }}
                            disabled={!isEnabled}
                            className={cn(
                              'w-full rounded border p-4 text-left transition-colors',
                              isSelected
                                ? 'border-blue-200 bg-blue-50'
                                : isEnabled
                                  ? 'border-gray-200 hover:bg-gray-50'
                                  : 'cursor-not-allowed border-gray-100 opacity-50',
                            )}
                          >
                            <div className='flex items-start justify-between'>
                              <div className='flex-1'>
                                <div className='flex items-center gap-2'>
                                  <h4 className='font-medium'>{model.name}</h4>
                                  <span className='rounded bg-gray-100 px-2 py-0.5 text-xs capitalize text-gray-600'>
                                    {provider}
                                  </span>
                                </div>
                                <p className='mt-1 line-clamp-2 text-sm text-gray-600'>
                                  {model.description}
                                </p>
                                <div className='mt-2 flex items-center gap-4 text-xs text-gray-500'>
                                  <span>Context: {formatContextLength(model.context_length)}</span>
                                  <span>
                                    Pricing:{' '}
                                    {formatPricing(model.pricing.prompt, model.pricing.completion)}
                                  </span>
                                </div>
                              </div>
                              <div className='ml-4 flex items-center gap-2'>
                                {getStatusIcon(provider)}
                                {isSelected && <CheckCircle className='h-4 w-4 text-blue-500' />}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className='space-y-4'>
                {providers.map(provider => {
                  const providerConfig = config.providers[provider];
                  const isSelected = selectedProvider === provider;

                  return (
                    <div key={provider} className='mb-4'>
                      <h4 className='mb-2 flex items-center gap-2 text-sm font-medium text-gray-900'>
                        {getStatusIcon(provider)}
                        <span className='capitalize'>{provider}</span>
                        <span
                          className={cn(
                            'ml-2 rounded px-2 py-1 text-xs',
                            providerConfig.enabled
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-500',
                          )}
                        >
                          {providerConfig.enabled ? 'Enabled' : 'Not Configured'}
                        </span>
                      </h4>

                      <div className='ml-6 space-y-2'>
                        {Object.entries(providerConfig.models).map(([type, model]) => (
                          <button
                            key={model}
                            onClick={() =>
                              providerConfig.enabled && void handleProviderSelect(provider, model)
                            }
                            disabled={!providerConfig.enabled}
                            className={cn(
                              'w-full rounded border p-3 text-left text-sm transition-colors',
                              isSelected && selectedModel === model
                                ? 'border-blue-200 bg-blue-50 text-blue-900'
                                : providerConfig.enabled
                                  ? 'border-gray-200 hover:bg-gray-50'
                                  : 'cursor-not-allowed border-gray-100 opacity-50',
                            )}
                          >
                            <div className='flex items-center justify-between'>
                              <span className='font-medium'>{model}</span>
                              <span className='text-xs capitalize text-gray-500'>{type}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
