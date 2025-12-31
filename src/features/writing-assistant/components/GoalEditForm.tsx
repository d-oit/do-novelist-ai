import React, { useState, useEffect } from 'react';

import type { WritingGoal } from '@/features/writing-assistant/types';
import { cn } from '@/lib/utils';

interface GoalEditFormProps {
  goal: WritingGoal;
  onCancel: () => void;
  onSave: (updates: Partial<WritingGoal>) => void;
}

export const GoalEditForm: React.FC<GoalEditFormProps> = ({ goal, onCancel, onSave }) => {
  const [draftName, setDraftName] = useState(goal.name);
  const [draftDescription, setDraftDescription] = useState(goal.description);
  const [draftMinVocabDiversity, setDraftMinVocabDiversity] = useState<number | ''>(
    goal.targetVocabulary?.minVocabularyDiversity !== undefined
      ? Math.round(goal.targetVocabulary.minVocabularyDiversity * 100)
      : '',
  );

  useEffect(() => {
    setDraftName(goal.name);
    setDraftDescription(goal.description);
    setDraftMinVocabDiversity(
      goal.targetVocabulary?.minVocabularyDiversity !== undefined
        ? Math.round(goal.targetVocabulary.minVocabularyDiversity * 100)
        : '',
    );
  }, [goal]);

  const handleSave = (): void => {
    if (!draftName.trim()) return;

    const minVocabRatio =
      draftMinVocabDiversity === ''
        ? undefined
        : Math.min(1, Math.max(0, draftMinVocabDiversity / 100));

    onSave({
      name: draftName.trim(),
      description: draftDescription.trim(),
      targetVocabulary:
        minVocabRatio === undefined
          ? undefined
          : {
              ...goal.targetVocabulary,
              minVocabularyDiversity: minVocabRatio,
            },
    });
  };

  return (
    <div className='space-y-2'>
      <div className='space-y-2'>
        <input
          type='text'
          value={draftName}
          onChange={e => setDraftName(e.target.value)}
          className={cn(
            'w-full rounded border px-2 py-1 text-sm',
            'bg-white dark:bg-gray-800',
            'border-gray-200 dark:border-gray-700',
          )}
          aria-label='Goal name'
        />
        <input
          type='text'
          value={draftDescription}
          onChange={e => setDraftDescription(e.target.value)}
          className={cn(
            'w-full rounded border px-2 py-1 text-sm',
            'bg-white dark:bg-gray-800',
            'border-gray-200 dark:border-gray-700',
          )}
          aria-label='Goal description'
        />
      </div>

      <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
        <label className='text-xs text-gray-600 dark:text-gray-400'>
          Min vocabulary diversity (%)
          <input
            type='number'
            min={0}
            max={100}
            value={draftMinVocabDiversity}
            onChange={e => {
              const raw = e.target.value;
              setDraftMinVocabDiversity(raw === '' ? '' : Number(raw));
            }}
            className={cn(
              'mt-1 w-full rounded border px-2 py-1 text-sm',
              'bg-white dark:bg-gray-800',
              'border-gray-200 dark:border-gray-700',
            )}
            aria-label='Min vocabulary diversity'
          />
        </label>
      </div>

      <div className='flex justify-end gap-2'>
        <button
          onClick={onCancel}
          className='rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className={cn(
            'rounded bg-indigo-500 px-2 py-1 text-xs text-white',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
          disabled={!draftName.trim()}
        >
          Save
        </button>
      </div>
    </div>
  );
};
