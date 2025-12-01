/**
 * Writing Assistant Settings Component
 * Configuration panel for the AI Writing Assistant
 */

import { motion } from 'framer-motion';
import { Settings, Save, RefreshCw, Brain, Filter, Zap, Users, Target } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { cn } from '../../../lib/utils';
import { type WritingAssistantConfig } from '../types';

interface WritingAssistantSettingsProps {
  config: WritingAssistantConfig;
  onConfigChange: (config: Partial<WritingAssistantConfig>) => void;
  onClose?: () => void;
  className?: string;
}

const SettingSection: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, description, icon, children }) => (
  <Card className='p-6'>
    <div className='mb-4 flex items-start gap-3'>
      <div className='text-blue-600'>{icon}</div>
      <div className='flex-1'>
        <h3 className='font-semibold text-gray-900 dark:text-gray-100'>{title}</h3>
        <p className='text-sm text-gray-600 dark:text-gray-400'>{description}</p>
      </div>
    </div>
    {children}
  </Card>
);

const Toggle: React.FC<{
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = ({ label, description, checked, onChange }) => (
  <div className='flex items-start justify-between py-2'>
    <div className='flex-1'>
      <label className='font-medium text-gray-900 dark:text-gray-100'>{label}</label>
      {(description?.length ?? 0) > 0 && (
        <p className='text-sm text-gray-600 dark:text-gray-400'>{description}</p>
      )}
    </div>
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
        checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700',
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1',
        )}
      />
    </button>
  </div>
);

const SliderInput: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
}> = ({ label, value, min, max, step = 1, onChange, formatValue }) => (
  <div className='py-2'>
    <div className='mb-2 flex items-center justify-between'>
      <label className='font-medium text-gray-900 dark:text-gray-100'>{label}</label>
      <span className='text-sm text-gray-600'>{formatValue ? formatValue(value) : value}</span>
    </div>
    <input
      type='range'
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      className='slider h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 dark:bg-gray-700'
    />
  </div>
);

const SelectInput: React.FC<{
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}> = ({ label, value, options, onChange }) => (
  <div className='py-2'>
    <label className='mb-2 block font-medium text-gray-900 dark:text-gray-100'>{label}</label>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className='w-full rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800'
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

const CategorySelector: React.FC<{
  selectedCategories: string[];
  onChange: (categories: string[]) => void;
}> = ({ selectedCategories, onChange }) => {
  const categories = [
    { id: 'readability', label: 'Readability', description: 'Check reading ease and clarity' },
    { id: 'engagement', label: 'Engagement', description: 'Analyze reader interest factors' },
    {
      id: 'consistency',
      label: 'Consistency',
      description: 'Detect inconsistencies in style and content',
    },
    { id: 'flow', label: 'Flow', description: 'Evaluate narrative and logical flow' },
    { id: 'dialogue', label: 'Dialogue', description: 'Improve dialogue quality and naturalness' },
    { id: 'description', label: 'Description', description: 'Enhance descriptive passages' },
    {
      id: 'character_voice',
      label: 'Character Voice',
      description: 'Maintain character voice consistency',
    },
    { id: 'plot_structure', label: 'Plot Structure', description: 'Analyze story structure' },
    { id: 'show_vs_tell', label: 'Show vs Tell', description: 'Balance showing and telling' },
  ];

  const toggleCategory = (categoryId: string): void => {
    if (selectedCategories.includes(categoryId)) {
      onChange(selectedCategories.filter(id => id !== categoryId));
    } else {
      onChange([...selectedCategories, categoryId]);
    }
  };

  return (
    <div className='space-y-2'>
      {categories.map(category => (
        <div
          key={category.id}
          className={cn(
            'flex cursor-pointer items-center rounded-lg border p-3 transition-colors',
            selectedCategories.includes(category.id)
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800',
          )}
          onClick={() => toggleCategory(category.id)}
        >
          <div className='flex-1'>
            <div className='font-medium text-gray-900 dark:text-gray-100'>{category.label}</div>
            <div className='text-sm text-gray-600 dark:text-gray-400'>{category.description}</div>
          </div>
          <div
            className={cn(
              'flex h-4 w-4 items-center justify-center rounded border-2',
              selectedCategories.includes(category.id)
                ? 'border-blue-500 bg-blue-500'
                : 'border-gray-300 dark:border-gray-600',
            )}
          >
            {selectedCategories.includes(category.id) && (
              <div className='h-2 w-2 rounded bg-white' />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export const WritingAssistantSettings: React.FC<WritingAssistantSettingsProps> = ({
  config,
  onConfigChange,
  onClose,
  className,
}) => {
  const [localConfig, setLocalConfig] = useState<WritingAssistantConfig>(config);
  const [hasChanges, setHasChanges] = useState(false);

  const updateLocalConfig = (updates: Partial<WritingAssistantConfig>): void => {
    setLocalConfig(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const handleSave = (): void => {
    onConfigChange(localConfig);
    setHasChanges(false);
  };

  const handleReset = (): void => {
    setLocalConfig(config);
    setHasChanges(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('writing-assistant-settings space-y-6', className)}
    >
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Settings className='h-5 w-5 text-blue-600' />
          <h2 className='text-xl font-semibold'>Writing Assistant Settings</h2>
        </div>
        {onClose && (
          <Button variant='ghost' onClick={onClose}>
            ×
          </Button>
        )}
      </div>

      {/* Real-time Analysis */}
      <SettingSection
        title='Real-time Analysis'
        description='Configure how the assistant analyzes your writing as you type'
        icon={<Zap className='h-5 w-5' />}
      >
        <div className='space-y-4'>
          <Toggle
            label='Enable Real-time Analysis'
            description='Automatically analyze content as you write'
            checked={localConfig.enableRealTimeAnalysis}
            onChange={checked => updateLocalConfig({ enableRealTimeAnalysis: checked })}
          />

          <SliderInput
            label='Analysis Delay'
            value={localConfig.analysisDelay}
            min={500}
            max={5000}
            step={100}
            onChange={value => updateLocalConfig({ analysisDelay: value })}
            formatValue={value => `${value}ms`}
          />
        </div>
      </SettingSection>

      {/* Content Analysis Features */}
      <SettingSection
        title='Analysis Features'
        description='Choose which types of analysis to enable'
        icon={<Brain className='h-5 w-5' />}
      >
        <div className='space-y-4'>
          <Toggle
            label='Plot Hole Detection'
            description='Analyze for plot inconsistencies and logical errors'
            checked={localConfig.enablePlotHoleDetection}
            onChange={checked => updateLocalConfig({ enablePlotHoleDetection: checked })}
          />

          <Toggle
            label='Character Tracking'
            description='Monitor character consistency and development'
            checked={localConfig.enableCharacterTracking}
            onChange={checked => updateLocalConfig({ enableCharacterTracking: checked })}
          />

          <Toggle
            label='Dialogue Analysis'
            description='Analyze dialogue quality and character voice'
            checked={localConfig.enableDialogueAnalysis}
            onChange={checked => updateLocalConfig({ enableDialogueAnalysis: checked })}
          />

          <Toggle
            label='Style Analysis'
            description='Evaluate writing style and tone consistency'
            checked={localConfig.enableStyleAnalysis}
            onChange={checked => updateLocalConfig({ enableStyleAnalysis: checked })}
          />
        </div>
      </SettingSection>

      {/* Suggestion Categories */}
      <SettingSection
        title='Suggestion Categories'
        description='Select which types of suggestions you want to receive'
        icon={<Filter className='h-5 w-5' />}
      >
        <CategorySelector
          selectedCategories={localConfig.enabledCategories}
          onChange={categories => updateLocalConfig({ enabledCategories: categories })}
        />
      </SettingSection>

      {/* AI Configuration */}
      <SettingSection
        title='AI Configuration'
        description='Configure the AI model and analysis depth'
        icon={<Target className='h-5 w-5' />}
      >
        <div className='space-y-4'>
          <SelectInput
            label='AI Model'
            value={localConfig.aiModel}
            options={[
              { value: 'gemini-pro', label: 'Gemini Pro (High Quality)' },
              { value: 'gemini-flash', label: 'Gemini Flash (Fast)' },
            ]}
            onChange={value =>
              updateLocalConfig({ aiModel: value as 'gemini-pro' | 'gemini-flash' })
            }
          />

          <SelectInput
            label='Analysis Depth'
            value={localConfig.analysisDepth}
            options={[
              { value: 'basic', label: 'Basic (Fast, fewer suggestions)' },
              { value: 'standard', label: 'Standard (Balanced)' },
              { value: 'comprehensive', label: 'Comprehensive (Detailed, slower)' },
            ]}
            onChange={value =>
              updateLocalConfig({ analysisDepth: value as 'basic' | 'standard' | 'comprehensive' })
            }
          />

          <SliderInput
            label='Minimum Confidence'
            value={localConfig.minimumConfidence}
            min={0.1}
            max={1.0}
            step={0.1}
            onChange={value => updateLocalConfig({ minimumConfidence: value })}
            formatValue={value => `${Math.round(value * 100)}%`}
          />

          <SliderInput
            label='Max Suggestions Per Type'
            value={localConfig.maxSuggestionsPerType}
            min={1}
            max={20}
            onChange={value => updateLocalConfig({ maxSuggestionsPerType: value })}
          />
        </div>
      </SettingSection>

      {/* Writing Preferences */}
      <SettingSection
        title='Writing Preferences'
        description='Help the AI understand your writing style and target audience'
        icon={<Users className='h-5 w-5' />}
      >
        <div className='space-y-4'>
          <SelectInput
            label='Preferred Style'
            value={localConfig.preferredStyle}
            options={[
              { value: 'concise', label: 'Concise (Brief and direct)' },
              { value: 'descriptive', label: 'Descriptive (Rich detail)' },
              { value: 'balanced', label: 'Balanced (Mix of both)' },
            ]}
            onChange={value =>
              updateLocalConfig({ preferredStyle: value as 'concise' | 'descriptive' | 'balanced' })
            }
          />

          <SelectInput
            label='Target Audience'
            value={localConfig.targetAudience}
            options={[
              { value: 'children', label: 'Children' },
              { value: 'young_adult', label: 'Young Adult' },
              { value: 'adult', label: 'Adult' },
              { value: 'literary', label: 'Literary' },
            ]}
            onChange={value =>
              updateLocalConfig({
                targetAudience: value as 'children' | 'young_adult' | 'adult' | 'literary',
              })
            }
          />

          <div className='py-2'>
            <label className='mb-2 block font-medium text-gray-900 dark:text-gray-100'>
              Genre (Optional)
            </label>
            <input
              type='text'
              value={localConfig.genre ?? ''}
              onChange={e => updateLocalConfig({ genre: e.target.value ?? undefined })}
              placeholder='e.g., Fantasy, Romance, Mystery'
              className='w-full rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800'
            />
          </div>
        </div>
      </SettingSection>

      {/* Save/Reset Actions */}
      <div className='flex items-center justify-between border-t pt-6'>
        <Button variant='outline' onClick={handleReset} disabled={!hasChanges}>
          <RefreshCw className='mr-2 h-4 w-4' />
          Reset
        </Button>

        <Button onClick={handleSave} disabled={!hasChanges}>
          <Save className='mr-2 h-4 w-4' />
          Save Settings
        </Button>
      </div>
    </motion.div>
  );
};

export default WritingAssistantSettings;
