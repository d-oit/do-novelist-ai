import { useState, useEffect } from 'react';
import { Settings, DollarSign, Shield, Zap, Activity } from 'lucide-react';
import { ProviderSelector } from '@/components/ai/ProviderSelector';
import { CostDashboard } from '@/components/ai/CostDashboard';
import {
  loadUserPreferences,
  saveUserPreferences,
  type ProviderPreferenceData,
} from '@/services/ai-config-service';
import { startHealthMonitoring } from '@/services/ai-health-service';

interface AISettingsPanelProps {
  userId: string;
}

export const AISettingsPanel = ({ userId }: AISettingsPanelProps) => {
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
      <div className='rounded-lg border bg-white p-6'>
        <div className='animate-pulse space-y-4'>
          <div className='h-4 w-1/4 rounded bg-gray-200' />
          <div className='h-32 rounded bg-gray-200' />
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='rounded-lg border bg-white p-6'>
        <div className='mb-6 flex items-center justify-between'>
          <h2 className='flex items-center gap-2 text-xl font-semibold'>
            <Settings className='h-5 w-5' />
            AI Provider Settings
          </h2>
          <button
            onClick={() => startHealthMonitoring()}
            className='rounded bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600'
          >
            Refresh Health
          </button>
        </div>

        <div className='mb-6 flex gap-2 border-b'>
          <button
            onClick={() => setActiveTab('provider')}
            className={`border-b-2 px-4 py-2 transition-colors ${
              activeTab === 'provider'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Provider Selection
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`border-b-2 px-4 py-2 transition-colors ${
              activeTab === 'analytics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Cost Analytics
          </button>
          <button
            onClick={() => setActiveTab('health')}
            className={`border-b-2 px-4 py-2 transition-colors ${
              activeTab === 'health'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Provider Health
          </button>
        </div>

        {activeTab === 'provider' && (
          <div className='space-y-6'>
            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                <Zap className='mr-1 inline h-4 w-4' />
                Current Provider
              </label>
              <ProviderSelector
                userId={userId}
                onProviderChange={(provider, model) => {
                  handleSave({
                    selectedProvider: provider,
                    selectedModel: model,
                  });
                }}
              />
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='mb-2 block text-sm font-medium text-gray-700'>Temperature</label>
                <input
                  type='number'
                  min='0'
                  max='2'
                  step='0.1'
                  value={preferences.temperature}
                  onChange={e => handleSave({ temperature: parseFloat(e.target.value) })}
                  className='w-full rounded-md border px-3 py-2'
                />
                <p className='mt-1 text-xs text-gray-500'>0.0-2.0 (lower = more focused)</p>
              </div>

              <div>
                <label className='mb-2 block text-sm font-medium text-gray-700'>Max Tokens</label>
                <input
                  type='number'
                  min='1'
                  max='128000'
                  value={preferences.maxTokens}
                  onChange={e => handleSave({ maxTokens: parseInt(e.target.value) })}
                  className='w-full rounded-md border px-3 py-2'
                />
                <p className='mt-1 text-xs text-gray-500'>Maximum response length</p>
              </div>
            </div>

            <div>
              <label className='flex items-center'>
                <input
                  type='checkbox'
                  checked={preferences.autoFallback}
                  onChange={e => handleSave({ autoFallback: e.target.checked })}
                  className='mr-2'
                />
                <span className='text-sm text-gray-700'>
                  <Shield className='mr-1 inline h-4 w-4' />
                  Enable automatic fallback to other providers
                </span>
              </label>
            </div>

            <div>
              <label className='flex items-center'>
                <input
                  type='checkbox'
                  checked={preferences.costOptimization}
                  onChange={e => handleSave({ costOptimization: e.target.checked })}
                  className='mr-2'
                />
                <span className='text-sm text-gray-700'>
                  <Zap className='mr-1 inline h-4 w-4' />
                  Enable cost optimization (route to cheapest provider)
                </span>
              </label>
            </div>

            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                <DollarSign className='mr-1 inline h-4 w-4' />
                Monthly Budget ($)
              </label>
              <input
                type='number'
                min='0'
                step='5'
                value={preferences.monthlyBudget}
                onChange={e => handleSave({ monthlyBudget: parseFloat(e.target.value) })}
                className='w-full rounded-md border px-3 py-2'
              />
              <p className='mt-1 text-xs text-gray-500'>Set a monthly spending limit</p>
            </div>

            {saving && (
              <div className='flex items-center gap-2 text-sm text-blue-600'>
                <Activity className='h-4 w-4 animate-spin' />
                <span>Saving...</span>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && <CostDashboard userId={userId} />}

        {activeTab === 'health' && (
          <div className='space-y-4'>
            <div className='rounded-lg border border-blue-200 bg-blue-50 p-4'>
              <h3 className='mb-2 font-semibold'>Provider Health Monitoring</h3>
              <p className='text-sm text-gray-600'>
                All providers are automatically monitored for uptime and performance. Unhealthy
                providers will be automatically skipped during fallback.
              </p>
            </div>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
              <div className='rounded-lg border p-4'>
                <h4 className='mb-2 font-medium'>OpenAI</h4>
                <div className='flex items-center gap-2'>
                  <div className='h-2 w-2 rounded-full bg-green-500' />
                  <span className='text-sm text-gray-600'>Operational</span>
                </div>
              </div>
              <div className='rounded-lg border p-4'>
                <h4 className='mb-2 font-medium'>Anthropic</h4>
                <div className='flex items-center gap-2'>
                  <div className='h-2 w-2 rounded-full bg-green-500' />
                  <span className='text-sm text-gray-600'>Operational</span>
                </div>
              </div>
              <div className='rounded-lg border p-4'>
                <h4 className='mb-2 font-medium'>Google</h4>
                <div className='flex items-center gap-2'>
                  <div className='h-2 w-2 rounded-full bg-green-500' />
                  <span className='text-sm text-gray-600'>Operational</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
