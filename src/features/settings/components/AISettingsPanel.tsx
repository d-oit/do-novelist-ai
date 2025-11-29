import React, { useState, useEffect } from 'react';
import { Settings, Save, DollarSign, Shield, Zap, Activity } from 'lucide-react';
import { ProviderSelector } from '@/components/ai/ProviderSelector';
import { CostDashboard } from '@/components/ai/CostDashboard';
import { loadUserPreferences, saveUserPreferences, type ProviderPreferenceData } from '@/services/ai-config-service';
import { startHealthMonitoring } from '@/services/ai-health-service';

interface AISettingsPanelProps {
  userId: string;
}

export function AISettingsPanel({ userId }: AISettingsPanelProps) {
  const [preferences, setPreferences] = useState<ProviderPreferenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'provider' | 'analytics' | 'health'>('provider');

  useEffect(() => {
    loadUserPreferences(userId).then(prefs => {
      setPreferences(prefs);
      setLoading(false);
    });
  }, [userId]);

  const handleSave = async (updates: Partial<ProviderPreferenceData>) => {
    if (!preferences) return;

    setSaving(true);
    try {
      await saveUserPreferences(userId, updates);
      const newPrefs = { ...preferences, ...updates };
      setPreferences(newPrefs);
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !preferences) {
    return (
      <div className="bg-white p-6 rounded-lg border">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Settings className="w-5 h-5" />
            AI Provider Settings
          </h2>
          <button
            onClick={() => startHealthMonitoring()}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          >
            Refresh Health
          </button>
        </div>

        <div className="flex gap-2 mb-6 border-b">
          <button
            onClick={() => setActiveTab('provider')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'provider'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Provider Selection
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'analytics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Cost Analytics
          </button>
          <button
            onClick={() => setActiveTab('health')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'health'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Provider Health
          </button>
        </div>

        {activeTab === 'provider' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Zap className="w-4 h-4 inline mr-1" />
                Current Provider
              </label>
              <ProviderSelector
                userId={userId}
                onProviderChange={(provider, model) => {
                  handleSave({
                    selectedProvider: provider,
                    selectedModel: model
                  });
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temperature
                </label>
                <input
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  value={preferences.temperature}
                  onChange={(e) => handleSave({ temperature: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">0.0-2.0 (lower = more focused)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Tokens
                </label>
                <input
                  type="number"
                  min="1"
                  max="128000"
                  value={preferences.maxTokens}
                  onChange={(e) => handleSave({ maxTokens: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum response length</p>
              </div>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.autoFallback}
                  onChange={(e) => handleSave({ autoFallback: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">
                  <Shield className="w-4 h-4 inline mr-1" />
                  Enable automatic fallback to other providers
                </span>
              </label>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.costOptimization}
                  onChange={(e) => handleSave({ costOptimization: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">
                  <Zap className="w-4 h-4 inline mr-1" />
                  Enable cost optimization (route to cheapest provider)
                </span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Monthly Budget ($)
              </label>
              <input
                type="number"
                min="0"
                step="5"
                value={preferences.monthlyBudget}
                onChange={(e) => handleSave({ monthlyBudget: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border rounded-md"
              />
              <p className="text-xs text-gray-500 mt-1">Set a monthly spending limit</p>
            </div>

            {saving && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Activity className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <CostDashboard userId={userId} />
        )}

        {activeTab === 'health' && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold mb-2">Provider Health Monitoring</h3>
              <p className="text-sm text-gray-600">
                All providers are automatically monitored for uptime and performance.
                Unhealthy providers will be automatically skipped during fallback.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">OpenAI</h4>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Operational</span>
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Anthropic</h4>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Operational</span>
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Google</h4>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Operational</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
