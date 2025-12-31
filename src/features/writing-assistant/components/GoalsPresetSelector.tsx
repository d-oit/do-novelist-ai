import React from 'react';

import type { GoalPreset } from '@/features/writing-assistant/types';
import { cn } from '@/lib/utils';

interface GoalsPresetSelectorProps {
  presets: GoalPreset[];
  onApplyPreset: (preset: GoalPreset) => void;
}

export const GoalsPresetSelector: React.FC<GoalsPresetSelectorProps> = ({
  presets,
  onApplyPreset,
}) => {
  return (
    <div className='border-b border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50'>
      <h4 className='mb-2 text-sm font-medium'>Apply Preset</h4>
      <div className='grid grid-cols-2 gap-2'>
        {presets.map(preset => (
          <button
            key={preset.id}
            onClick={() => onApplyPreset(preset)}
            className={cn(
              'rounded-lg border p-3 text-left',
              'hover:bg-indigo-50 dark:hover:bg-indigo-900/20',
              'border-gray-200 dark:border-gray-700',
              'transition-colors',
            )}
          >
            <div className='text-sm font-medium'>{preset.name}</div>
            <div className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
              {preset.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
