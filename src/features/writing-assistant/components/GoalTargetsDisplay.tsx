import React from 'react';

import type { WritingGoal } from '@/features/writing-assistant/types';

interface GoalTargetsDisplayProps {
  goal: WritingGoal;
}

export const GoalTargetsDisplay: React.FC<GoalTargetsDisplayProps> = ({ goal }) => {
  return (
    <div className='mt-2 space-y-1 rounded bg-gray-50 p-2 text-xs dark:bg-gray-900/50'>
      {goal.targetReadability && (
        <div className='flex justify-between'>
          <span className='text-gray-500'>Readability:</span>
          <span>
            {goal.targetReadability.minScore ?? 0}-{goal.targetReadability.maxScore ?? 100} Flesch
          </span>
        </div>
      )}
      {goal.targetLength && (
        <div className='flex justify-between'>
          <span className='text-gray-500'>Length:</span>
          <span>
            {goal.targetLength.targetWords
              ? `${goal.targetLength.targetWords} words`
              : `${goal.targetLength.minWords ?? 0}-${goal.targetLength.maxWords ?? '∞'} words`}
          </span>
        </div>
      )}
      {goal.targetTone && (
        <div className='flex justify-between'>
          <span className='text-gray-500'>Tone:</span>
          <span>{goal.targetTone.primary}</span>
        </div>
      )}
      {goal.targetVocabulary?.minVocabularyDiversity !== undefined && (
        <div className='flex justify-between'>
          <span className='text-gray-500'>Vocab diversity:</span>
          <span>{Math.round(goal.targetVocabulary.minVocabularyDiversity * 100)}%</span>
        </div>
      )}
    </div>
  );
};
