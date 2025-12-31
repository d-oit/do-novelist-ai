import { Check, ChevronDown, ChevronUp, Edit2, Trash2 } from 'lucide-react';
import React, { useState } from 'react';

import type { WritingGoal, GoalProgress } from '@/features/writing-assistant/types';
import { cn } from '@/lib/utils';

import { GoalEditForm } from './GoalEditForm';
import { GoalProgressBar } from './GoalProgressBar';
import { GoalTargetsDisplay } from './GoalTargetsDisplay';

interface GoalItemProps {
  goal: WritingGoal;
  progress?: GoalProgress;
  isEditing: boolean;
  onToggleActive: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: (updates: Partial<WritingGoal>) => void;
  onDelete: () => void;
}

export const GoalItem: React.FC<GoalItemProps> = ({
  goal,
  progress,
  isEditing,
  onToggleActive,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasTargets =
    goal.targetReadability || goal.targetLength || goal.targetTone || goal.targetVocabulary;

  return (
    <div className={cn('p-4', !goal.isActive && 'opacity-60')}>
      <div className='flex items-start gap-3'>
        {/* Active toggle */}
        <button
          onClick={onToggleActive}
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded border-2',
            'transition-colors',
            goal.isActive
              ? 'border-indigo-500 bg-indigo-500 text-white'
              : 'border-gray-300 dark:border-gray-600',
          )}
          aria-label={goal.isActive ? 'Deactivate goal' : 'Activate goal'}
        >
          {goal.isActive && <Check className='h-3 w-3' />}
        </button>

        {/* Goal info */}
        <div className='min-w-0 flex-1'>
          {isEditing ? (
            <GoalEditForm goal={goal} onCancel={onCancelEdit} onSave={onSave} />
          ) : (
            <>
              <div className='flex items-center gap-2'>
                <h4 className='truncate font-medium text-gray-900 dark:text-white'>{goal.name}</h4>
                {progress?.isAchieved && (
                  <span className='rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-300'>
                    Achieved
                  </span>
                )}
              </div>
              {goal.description && (
                <p className='mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400'>
                  {goal.description}
                </p>
              )}

              {progress && <GoalProgressBar progress={progress} />}

              {hasTargets && (
                <>
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className='mt-2 flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  >
                    {isExpanded ? (
                      <ChevronUp className='h-3 w-3' />
                    ) : (
                      <ChevronDown className='h-3 w-3' />
                    )}
                    {isExpanded ? 'Hide targets' : 'Show targets'}
                  </button>

                  {isExpanded && <GoalTargetsDisplay goal={goal} />}
                </>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className='flex items-center gap-1'>
          <button
            onClick={isEditing ? onCancelEdit : onStartEdit}
            className='rounded p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700'
            title={isEditing ? 'Cancel' : 'Edit'}
            aria-label={isEditing ? 'Cancel edit goal' : 'Edit goal'}
          >
            <Edit2 className='h-4 w-4' />
          </button>
          <button
            onClick={onDelete}
            className='rounded p-1.5 text-red-600 transition-colors hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30'
            title='Delete'
            aria-label='Delete goal'
          >
            <Trash2 className='h-4 w-4' />
          </button>
        </div>
      </div>
    </div>
  );
};
