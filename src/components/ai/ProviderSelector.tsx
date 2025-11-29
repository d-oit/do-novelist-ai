import { useState, useEffect } from 'react';
import { ChevronDown, Zap, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { loadUserPreferences, saveUserPreferences } from '@/services/ai-config-service';
import { getAIConfig, type AIProvider } from '@/lib/ai-config';

interface ProviderSelectorProps {
  userId: string;
  onProviderChange?: (provider: AIProvider, model: string) => void;
}

export function ProviderSelector({ userId, onProviderChange }: ProviderSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('google');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.0-flash-exp');
  const [loading, setLoading] = useState(true);

  const config = getAIConfig();

  useEffect(() => {
    loadUserPreferences(userId).then(prefs => {
      setSelectedProvider(prefs.selectedProvider);
      setSelectedModel(prefs.selectedModel);
      setLoading(false);
    });
  }, [userId]);

  const handleProviderSelect = async (provider: AIProvider, model: string) => {
    try {
      await saveUserPreferences(userId, {
        selectedProvider: provider,
        selectedModel: model
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

  const getStatusIcon = (provider: AIProvider) => {
    const isEnabled = config.providers[provider].enabled;

    if (!isEnabled) {
      return <XCircle className="w-4 h-4 text-gray-400" />;
    }

    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const providers: AIProvider[] = ['openai', 'anthropic', 'google'];

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm text-gray-600">Loading...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Zap className="w-4 h-4 text-blue-500" />
        <span className="text-sm font-medium">
          {selectedProvider}:{selectedModel}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-96 bg-white border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-4">
            <h3 className="font-semibold mb-4">Choose AI Provider & Model</h3>

            {providers.map(provider => {
              const providerConfig = config.providers[provider];
              const isSelected = selectedProvider === provider;

              return (
                <div key={provider} className="mb-4">
                  <h4 className="font-medium text-sm text-gray-900 mb-2 flex items-center gap-2">
                    {getStatusIcon(provider)}
                    <span className="capitalize">{provider}</span>
                    <span className={`ml-2 px-2 py-1 text-xs rounded ${
                      providerConfig.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {providerConfig.enabled ? 'Enabled' : 'Not Configured'}
                    </span>
                  </h4>

                  <div className="space-y-2 ml-6">
                    {Object.entries(providerConfig.models).map(([type, model]) => (
                      <button
                        key={model}
                        onClick={() => providerConfig.enabled && handleProviderSelect(provider, model)}
                        disabled={!providerConfig.enabled}
                        className={`w-full text-left p-3 rounded border text-sm transition-colors ${
                          isSelected && selectedModel === model
                            ? 'bg-blue-50 border-blue-200 text-blue-900'
                            : providerConfig.enabled
                            ? 'hover:bg-gray-50 border-gray-200'
                            : 'opacity-50 cursor-not-allowed border-gray-100'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{model}</span>
                          <span className="text-xs text-gray-500 capitalize">{type}</span>
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
}
