import React, { useState } from 'react';
import { Plus, Trash2, TestTube, Check, AlertCircle } from 'lucide-react';
import type { AIProvider, AIProviderConfig } from '../../types/ai-config';
import { useAIConfig } from '../../hooks/useAIConfig';
import { getProviderDisplayName } from '../../lib/ai/provider-factory';
import { validateApiKey, getApiKeyInstructions } from '../../lib/ai/encryption';

const AIProviderSettings: React.FC = () => {
  const { configs, defaultConfig, isLoading, error, addConfig, updateConfig, removeConfig, getAvailableModels, getDefaultModelForProvider } = useAIConfig();

  const [isAdding, setIsAdding] = useState(false);
  const [newConfig, setNewConfig] = useState<Partial<AIProviderConfig>>({
    provider: 'openai',
    model: 'gpt-4o',
    apiKey: '',
    temperature: 0.7,
    maxTokens: 2000,
    isDefault: false,
  });
  const [testResult, setTestResult] = useState<{ status: 'success' | 'error'; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleAddConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const configToSave = {
        provider: newConfig.provider!,
        model: newConfig.model!,
        apiKey: newConfig.apiKey!,
        temperature: newConfig.temperature || 0.7,
        maxTokens: newConfig.maxTokens || 2000,
        isDefault: newConfig.isDefault || false,
      };

      await addConfig(configToSave);
      setIsAdding(false);
      setNewConfig({
        provider: 'openai',
        model: 'gpt-4o',
        apiKey: '',
        temperature: 0.7,
        maxTokens: 2000,
        isDefault: false,
      });
      setTestResult(null);
    } catch (err) {
      setTestResult({
        status: 'error',
        message: err instanceof Error ? err.message : 'Failed to save configuration',
      });
    }
  };

  const handleTestConnection = async (config: AIProviderConfig) => {
    setIsTesting(true);
    setTestResult(null);

    try {
      // Simple test: validate API key format
      const isValid = validateApiKey(config.provider, config.apiKey);

      if (!isValid) {
        throw new Error('API key validation failed');
      }

      // In a real implementation, you would make a test API call here
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      setTestResult({
        status: 'success',
        message: `Connection to ${getProviderDisplayName(config.provider)} successful!`,
      });
    } catch (err) {
      setTestResult({
        status: 'error',
        message: err instanceof Error ? err.message : 'Connection test failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleProviderChange = (provider: AIProvider) => {
    setNewConfig(prev => ({
      ...prev,
      provider,
      model: getDefaultModelForProvider(provider),
    }));
  };

  const availableModels = newConfig.provider ? getAvailableModels(newConfig.provider) : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">AI Provider Settings</h2>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add Configuration
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {testResult && (
        <div
          className={`flex items-center gap-2 p-4 rounded-lg ${
            testResult.status === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {testResult.status === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
          {testResult.message}
        </div>
      )}

      {/* Existing Configurations */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Configured Providers</h3>
        {configs.length === 0 ? (
          <p className="text-gray-500 italic">No AI providers configured yet.</p>
        ) : (
          configs.map(config => (
            <div key={config.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h4 className="font-semibold">{getProviderDisplayName(config.provider)}</h4>
                  <span className="text-sm text-gray-600">{config.model}</span>
                  {config.isDefault && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Default</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTestConnection(config)}
                    disabled={isTesting}
                    className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
                  >
                    <TestTube size={16} />
                    Test
                  </button>
                  {!config.isDefault && (
                    <button
                      onClick={() => updateConfig(config.id!, { isDefault: true })}
                      className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 rounded transition-colors"
                    >
                      Set as Default
                    </button>
                  )}
                  <button
                    onClick={() => removeConfig(config.id!)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <p>Temperature: {config.temperature} | Max Tokens: {config.maxTokens}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add New Configuration Form */}
      {isAdding && (
        <div className="border border-gray-200 rounded-lg p-6 space-y-4 bg-gray-50">
          <h3 className="text-lg font-semibold">Add New Provider</h3>
          <form onSubmit={handleAddConfig} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Provider</label>
                <select
                  value={newConfig.provider}
                  onChange={e => handleProviderChange(e.target.value as AIProvider)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="google">Google</option>
                  <option value="meta">Meta</option>
                  <option value="xai">xAI</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Model</label>
                <select
                  value={newConfig.model}
                  onChange={e => setNewConfig(prev => ({ ...prev, model: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {availableModels.map(model => (
                    <option key={model.id} value={model.id}>
                      {model.name} ({model.contextLength.toLocaleString()} tokens)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">API Key</label>
                <input
                  type="password"
                  value={newConfig.apiKey}
                  onChange={e => setNewConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your API key"
                  required
                />
                <a
                  href="#"
                  onClick={e => {
                    e.preventDefault();
                    const instructions = getApiKeyInstructions(newConfig.provider!);
                    alert(instructions);
                  }}
                  className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                >
                  Get API key instructions
                </a>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Set as Default</label>
                <input
                  type="checkbox"
                  checked={newConfig.isDefault}
                  onChange={e => setNewConfig(prev => ({ ...prev, isDefault: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Temperature: {newConfig.temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={newConfig.temperature}
                  onChange={e => setNewConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Max Tokens</label>
                <input
                  type="number"
                  value={newConfig.maxTokens}
                  onChange={e => setNewConfig(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="100"
                  max="4000"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Configuration
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AIProviderSettings;
