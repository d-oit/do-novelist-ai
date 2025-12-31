import { Target } from 'lucide-react';
import React from 'react';

import type { WritingGoal, GoalProgress } from '@/features/writing-assistant/types';

import { GoalItem } from './GoalItem';

interface GoalsListProps {
  goals: WritingGoal[];
  activeGoalsProgress: Map<string, GoalProgress>;
  editingId: string | null;
  onToggleActive: (goalId: string) => void;
  onStartEdit: (goalId: string) => void;
  onCancelEdit: () => void;
  onSave: (goalId: string, updates: Partial<WritingGoal>) => void;
  onDelete: (goalId: string) => void;
}

export const GoalsList: React.FC<GoalsListProps> = ({
  goals,
  activeGoalsProgress,
  editingId,
  onToggleActive,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
}) => {
  if (goals.length === 0) {
    return (
      <div className='p-8 text-center text-gray-500 dark:text-gray-400'>
        <Target className='mx-auto mb-3 h-12 w-12 opacity-50' />
        <p>No goals yet</p>
        <p className='mt-1 text-sm'>Create a goal or apply a preset to get started</p>
      </div>
    );
  }

  return (
    <div className='divide-y divide-gray-100 dark:divide-gray-700'>
      {goals.map(goal => (
        <GoalItem
          key={goal.id}
          goal={goal}
          progress={activeGoalsProgress.get(goal.id)}
          isEditing={editingId === goal.id}
          onToggleActive={() => onToggleActive(goal.id)}
          onStartEdit={() => onStartEdit(goal.id)}
          onCancelEdit={onCancelEdit}
          onSave={updates => onSave(goal.id, updates)}
          onDelete={() => onDelete(goal.id)}
        />
      ))}
    </div>
  );
};
