import { Settings, DollarSign, Shield, Zap, Activity, Brain } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { CostDashboard } from '@/components/ai/CostDashboard';
import { FallbackProviderEditor } from '@/components/ai/FallbackProviderEditor';
import { ProviderSelector } from '@/components/ai/ProviderSelector';
import { useSettings } from '@/features/settings/hooks/useSettings';
import { logger } from '@/lib/logging/logger';
import { cn } from '@/lib/utils';
import {
  loadUserPreferences,
  saveUserPreferences,
  type ProviderPreferenceData,
} from '@/services/ai-config-service';
import { startHealthMonitoring } from '@/services/ai-health-service';

interface AISettingsPanelProps {
  userId: string;
}

export const AISettingsPanel: React.FC<AISettingsPanelProps> = ({ userId }) => {
  const [preferences, setPreferences] = useState<ProviderPreferenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'provider' | 'analytics' | 'health' | 'context'>(
    'provider',
  );
  const { settings, update } = useSettings();

  useEffect(() => {
    const fetchPreferences = async (): Promise<void> => {
      try {
        const prefs = await loadUserPreferences(userId);
        setPreferences(prefs);
        setLoading(false);
      } catch (error) {
        logger.error('Failed to load preferences', { component: 'AISettingsPanel', error, userId });
        setLoading(false);
      }
    };

    void fetchPreferences();
  }, [userId]);

  const handleSave = async (updates: Partial<ProviderPreferenceData>): Promise<void> => {
    if (!preferences) return;

    setSaving(true);
    try {
      await saveUserPreferences(userId, updates);
      const newPrefs = { ...preferences, ...updates };
      setPreferences(newPrefs);
    } catch (error) {
      logger.error('Failed to save preferences', { component: 'AISettingsPanel', error, userId });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !preferences) {
    return (
      <div data-testid='loading-skeleton' className='rounded-lg border bg-white p-6'>
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
            className={cn(
              'border-b-2 px-4 py-2 transition-colors',
              activeTab === 'provider'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900',
            )}
          >
            Provider Selection
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={cn(
              'border-b-2 px-4 py-2 transition-colors',
              activeTab === 'analytics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900',
            )}
          >
            Cost Analytics
          </button>
          <button
            onClick={() => setActiveTab('health')}
            className={cn(
              'border-b-2 px-4 py-2 transition-colors',
              activeTab === 'health'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900',
            )}
          >
            Provider Health
          </button>
          <button
            onClick={() => setActiveTab('context')}
            className={cn(
              'border-b-2 px-4 py-2 transition-colors',
              activeTab === 'context'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900',
            )}
          >
            <Brain className='mr-1 inline h-4 w-4' />
            Context Injection
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
                  void handleSave({
                    selectedProvider: provider,
                    selectedModel: model,
                  });
                }}
              />
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label
                  htmlFor='temperature-input'
                  className='mb-2 block text-sm font-medium text-foreground'
                >
                  Temperature
                </label>
                <input
                  id='temperature-input'
                  type='number'
                  min='0'
                  max='2'
                  step='0.1'
                  value={preferences.temperature}
                  onChange={e => void handleSave({ temperature: parseFloat(e.target.value) })}
                  className='w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                  aria-describedby='temperature-help'
                />
                <p id='temperature-help' className='mt-1 text-xs text-muted-foreground'>
                  0.0-2.0 (lower = more focused)
                </p>
              </div>

              <div>
                <label
                  htmlFor='max-tokens-input'
                  className='mb-2 block text-sm font-medium text-foreground'
                >
                  Max Tokens
                </label>
                <input
                  id='max-tokens-input'
                  type='number'
                  min='1'
                  max='128000'
                  value={preferences.maxTokens}
                  onChange={e => void handleSave({ maxTokens: parseInt(e.target.value) })}
                  className='w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                  aria-describedby='max-tokens-help'
                />
                <p id='max-tokens-help' className='mt-1 text-xs text-muted-foreground'>
                  Maximum response length
                </p>
              </div>
            </div>

            <div>
              <label htmlFor='auto-fallback-checkbox' className='flex cursor-pointer items-center'>
                <input
                  id='auto-fallback-checkbox'
                  type='checkbox'
                  checked={preferences.autoFallback}
                  onChange={e => void handleSave({ autoFallback: e.target.checked })}
                  className='mr-2 h-4 w-4 rounded border border-input bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2'
                />
                <span className='text-sm text-foreground'>
                  <Shield className='mr-1 inline h-4 w-4' />
                  Enable automatic fallback to other providers
                </span>
              </label>
            </div>

            <div>
              <label className='mb-2 block text-sm font-medium text-foreground'>
                Fallback Providers & Order
              </label>
              <FallbackProviderEditor
                userId={userId}
                value={preferences.fallbackProviders}
                onChange={providers => void handleSave({ fallbackProviders: providers })}
              />
            </div>

            <div>
              <label
                htmlFor='cost-optimization-checkbox'
                className='flex cursor-pointer items-center'
              >
                <input
                  id='cost-optimization-checkbox'
                  type='checkbox'
                  checked={preferences.costOptimization}
                  onChange={e => void handleSave({ costOptimization: e.target.checked })}
                  className='mr-2 h-4 w-4 rounded border border-input bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2'
                />
                <span className='text-sm text-foreground'>
                  <Zap className='mr-1 inline h-4 w-4' />
                  Enable cost optimization (route to cheapest provider)
                </span>
              </label>
            </div>

            <div>
              <label
                htmlFor='monthly-budget-input'
                className='mb-2 block text-sm font-medium text-foreground'
              >
                <DollarSign className='mr-1 inline h-4 w-4' />
                Monthly Budget ($)
              </label>
              <input
                id='monthly-budget-input'
                type='number'
                min='0'
                step='5'
                value={preferences.monthlyBudget}
                onChange={e => void handleSave({ monthlyBudget: parseFloat(e.target.value) })}
                className='w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                aria-describedby='monthly-budget-help'
              />
              <p id='monthly-budget-help' className='mt-1 text-xs text-muted-foreground'>
                Set a monthly spending limit
              </p>
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
              <div data-testid='provider-status-openai' className='rounded-lg border p-4'>
                <h4 className='mb-2 font-medium'>OpenAI</h4>
                <div className='flex items-center gap-2'>
                  <div className='h-2 w-2 rounded-full bg-green-500' />
                  <span className='text-sm text-gray-600'>Operational</span>
                </div>
              </div>
              <div data-testid='provider-status-anthropic' className='rounded-lg border p-4'>
                <h4 className='mb-2 font-medium'>Anthropic</h4>
                <div className='flex items-center gap-2'>
                  <div className='h-2 w-2 rounded-full bg-green-500' />
                  <span className='text-sm text-gray-600'>Operational</span>
                </div>
              </div>
              <div data-testid='provider-status-google' className='rounded-lg border p-4'>
                <h4 className='mb-2 font-medium'>Google</h4>
                <div className='flex items-center gap-2'>
                  <div className='h-2 w-2 rounded-full bg-green-500' />
                  <span className='text-sm text-gray-600'>Operational</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'context' && (
          <div className='space-y-6'>
            <div className='rounded-lg border border-blue-200 bg-blue-50 p-4'>
              <h3 className='mb-2 font-semibold'>
                <Brain className='mr-2 inline h-5 w-5' />
                AI Context-Aware Generation (RAG)
              </h3>
              <p className='text-sm text-gray-600'>
                Enable context injection to make AI aware of your project's characters,
                world-building, timeline, and chapters. This improves consistency and reduces
                factual errors in generated content.
              </p>
            </div>

            <div>
              <label htmlFor='enable-context-checkbox' className='flex cursor-pointer items-center'>
                <input
                  id='enable-context-checkbox'
                  type='checkbox'
                  checked={settings.enableContextInjection}
                  onChange={e => update({ enableContextInjection: e.target.checked })}
                  className='mr-2 h-4 w-4 rounded border border-input bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2'
                />
                <span className='text-sm text-foreground'>Enable Context Injection</span>
              </label>
            </div>

            {settings.enableContextInjection && (
              <>
                <div>
                  <label
                    htmlFor='context-token-limit'
                    className='mb-2 block text-sm font-medium text-foreground'
                  >
                    Context Token Limit
                  </label>
                  <input
                    id='context-token-limit'
                    type='number'
                    min='1000'
                    max='10000'
                    step='500'
                    value={settings.contextTokenLimit}
                    onChange={e => update({ contextTokenLimit: parseInt(e.target.value) })}
                    className='w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                    aria-describedby='context-token-limit-help'
                  />
                  <p id='context-token-limit-help' className='mt-1 text-xs text-muted-foreground'>
                    Maximum tokens for project context (1000-10000)
                  </p>
                </div>

                <div>
                  <label className='mb-2 block text-sm font-medium text-foreground'>
                    Include in Context
                  </label>
                  <div className='space-y-2'>
                    <label
                      htmlFor='context-characters'
                      className='flex cursor-pointer items-center'
                    >
                      <input
                        id='context-characters'
                        type='checkbox'
                        checked={settings.contextIncludeCharacters}
                        onChange={e => update({ contextIncludeCharacters: e.target.checked })}
                        className='mr-2 h-4 w-4 rounded border border-input bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2'
                      />
                      <span className='text-sm text-foreground'>Characters</span>
                    </label>

                    <label
                      htmlFor='context-worldbuilding'
                      className='flex cursor-pointer items-center'
                    >
                      <input
                        id='context-worldbuilding'
                        type='checkbox'
                        checked={settings.contextIncludeWorldBuilding}
                        onChange={e => update({ contextIncludeWorldBuilding: e.target.checked })}
                        className='mr-2 h-4 w-4 rounded border border-input bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2'
                      />
                      <span className='text-sm text-foreground'>World Building</span>
                    </label>

                    <label htmlFor='context-timeline' className='flex cursor-pointer items-center'>
                      <input
                        id='context-timeline'
                        type='checkbox'
                        checked={settings.contextIncludeTimeline}
                        onChange={e => update({ contextIncludeTimeline: e.target.checked })}
                        className='mr-2 h-4 w-4 rounded border border-input bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2'
                      />
                      <span className='text-sm text-foreground'>Timeline</span>
                    </label>

                    <label htmlFor='context-chapters' className='flex cursor-pointer items-center'>
                      <input
                        id='context-chapters'
                        type='checkbox'
                        checked={settings.contextIncludeChapters}
                        onChange={e => update({ contextIncludeChapters: e.target.checked })}
                        className='mr-2 h-4 w-4 rounded border border-input bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2'
                      />
                      <span className='text-sm text-foreground'>Chapter Summaries</span>
                    </label>
                  </div>
                </div>

                <div className='rounded-lg border border-yellow-200 bg-yellow-50 p-4'>
                  <h4 className='mb-2 font-medium text-yellow-800'>Performance Note</h4>
                  <p className='text-sm text-yellow-700'>
                    Increasing context token limit or including more context types may:
                  </p>
                  <ul className='mt-2 list-inside list-disc space-y-1 text-sm text-yellow-700'>
                    <li>Increase API response time</li>
                    <li>Increase token usage and costs</li>
                    <li>Require models with larger context windows</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
