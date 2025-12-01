import React, { useState, useEffect } from 'react';
import { ChevronDown, Zap, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { loadUserPreferences, saveUserPreferences } from '@/services/ai-config-service';
import { getAIConfig, type AIProvider } from '@/lib/ai-config';

interface ProviderSelectorProps {
  userId: string;
  onProviderChange?: (provider: AIProvider, model: string) => void;
}

export const ProviderSelector = ({
  userId,
  onProviderChange,
}: ProviderSelectorProps): React.JSX.Element => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('google');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.0-flash-exp');
  const [loading, setLoading] = useState(true);

  const config = getAIConfig();

  useEffect(() => {
    void loadUserPreferences(userId).then(prefs => {
      setSelectedProvider(prefs.selectedProvider);
      setSelectedModel(prefs.selectedModel);
      setLoading(false);
    });
  }, [userId]);

  const handleProviderSelect = async (provider: AIProvider, model: string): Promise<void> => {
    try {
      await saveUserPreferences(userId, {
        selectedProvider: provider,
        selectedModel: model,
      });

      setSelectedProvider(provider);
      setSelectedModel(model);
      setIsOpen(false);

      if (onProviderChange) {
        onProviderChange(provider, model);
      }
    } catch (error) {
      console.error('Failed to save provider selection:', error);
    }
  };

  const getStatusIcon = (provider: AIProvider): React.JSX.Element => {
    const isEnabled = config.providers[provider].enabled;

    if (!isEnabled) {
      return <XCircle className='h-4 w-4 text-gray-400' />;
    }

    return <CheckCircle className='h-4 w-4 text-green-500' />;
  };

  const providers: AIProvider[] = ['openai', 'anthropic', 'google'];

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
        <div className='absolute left-0 top-full z-50 mt-2 max-h-96 w-96 overflow-y-auto rounded-lg border bg-white shadow-lg'>
          <div className='p-4'>
            <h3 className='mb-4 font-semibold'>Choose AI Provider & Model</h3>

            {providers.map(provider => {
              const providerConfig = config.providers[provider];
              const isSelected = selectedProvider === provider;

              return (
                <div key={provider} className='mb-4'>
                  <h4 className='mb-2 flex items-center gap-2 text-sm font-medium text-gray-900'>
                    {getStatusIcon(provider)}
                    <span className='capitalize'>{provider}</span>
                    <span
                      className={`ml-2 rounded px-2 py-1 text-xs ${
                        providerConfig.enabled
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-500'
                      }`}
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
                        className={`w-full rounded border p-3 text-left text-sm transition-colors ${
                          isSelected && selectedModel === model
                            ? 'border-blue-200 bg-blue-50 text-blue-900'
                            : providerConfig.enabled
                              ? 'border-gray-200 hover:bg-gray-50'
                              : 'cursor-not-allowed border-gray-100 opacity-50'
                        }`}
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
        </div>
      )}
    </div>
  );
};
