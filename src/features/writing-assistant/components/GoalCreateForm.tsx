import React, { useState } from 'react';

import type { WritingGoal } from '@/features/writing-assistant/types';
import { cn } from '@/lib/utils';

interface GoalCreateFormProps {
  onCancel: () => void;
  onCreate: (goal: Omit<WritingGoal, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export const GoalCreateForm: React.FC<GoalCreateFormProps> = ({ onCancel, onCreate }) => {
  const [newGoal, setNewGoal] = useState<Partial<WritingGoal>>({
    name: '',
    description: '',
    isActive: true,
  });

  const handleCreate = (): void => {
    if (!newGoal.name) return;

    onCreate({
      name: newGoal.name,
      description: newGoal.description || `Goal: ${newGoal.name}`,
      isActive: newGoal.isActive ?? true,
      targetReadability: newGoal.targetReadability,
      targetLength: newGoal.targetLength,
      targetTone: newGoal.targetTone,
      targetStyle: newGoal.targetStyle,
    } as Omit<WritingGoal, 'id' | 'createdAt' | 'updatedAt'>);
  };

  return (
    <div className='border-b border-gray-200 p-4 dark:border-gray-700'>
      <div className='space-y-3'>
        <input
          type='text'
          value={newGoal.name || ''}
          onChange={e => setNewGoal(prev => ({ ...prev, name: e.target.value }))}
          placeholder='Goal name...'
          className={cn(
            'w-full rounded border px-3 py-2',
            'bg-white dark:bg-gray-800',
            'border-gray-200 dark:border-gray-700',
          )}
        />
        <input
          type='text'
          value={newGoal.description || ''}
          onChange={e => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
          placeholder='Description (optional)...'
          className={cn(
            'w-full rounded border px-3 py-2',
            'bg-white dark:bg-gray-800',
            'border-gray-200 dark:border-gray-700',
          )}
        />
        <div className='flex items-center gap-2'>
          <label className='flex items-center gap-2 text-sm'>
            <input
              type='checkbox'
              checked={newGoal.isActive ?? true}
              onChange={e => setNewGoal(prev => ({ ...prev, isActive: e.target.checked }))}
              className='rounded'
            />
            Active
          </label>
        </div>
        <div className='flex justify-end gap-2'>
          <button
            onClick={onCancel}
            className='rounded px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!newGoal.name}
            className={cn(
              'rounded px-3 py-1.5 text-sm',
              'bg-indigo-500 text-white',
              'disabled:opacity-50',
            )}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};
