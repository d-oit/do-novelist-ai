import React from 'react';

import type { GoalProgress } from '@/features/writing-assistant/types';
import { cn } from '@/lib/utils';

interface GoalProgressBarProps {
  progress: GoalProgress;
}

export const GoalProgressBar: React.FC<GoalProgressBarProps> = ({ progress }) => {
  return (
    <div className='mt-2'>
      <div className='mb-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400'>
        <span>Progress</span>
        <span>{progress.progress}%</span>
      </div>
      <div className='h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700'>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300',
            progress.isAchieved ? 'bg-green-500' : 'bg-indigo-500',
          )}
          style={{ width: `${progress.progress}%` }}
        />
      </div>
    </div>
  );
};
