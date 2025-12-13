
import { Flame, Calendar, TrendingUp } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';
import { type WritingStreak, type StreakMilestone } from '@/types';

interface StreakDisplayProps {
  streak: WritingStreak | null;
  milestones: StreakMilestone[];
  isLoading?: boolean;
}

export const StreakDisplay: React.FC<StreakDisplayProps> = ({ streak, milestones, isLoading }) => {
  if (isLoading ?? false) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500' />
      </div>
    );
  }

  if (!streak) {
    return (
      <div className='p-8 text-center text-gray-500'>
        <Calendar className='mx-auto mb-4 h-12 w-12 opacity-50' />
        <p>Start writing to build your streak!</p>
      </div>
    );
  }

  const upcomingMilestone = milestones
    .filter(m => !m.unlocked)
    .sort((a, b) => a.streak - b.streak)[0];

  const progressToNextMilestone = upcomingMilestone
    ? (streak.length / upcomingMilestone.streak) * 100
    : 100;

  return (
    <div className='rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800'>
      <div className='mb-6 flex items-center justify-between'>
        <h2 className='flex items-center gap-2 text-2xl font-bold'>
          <Flame className='h-6 w-6 text-orange-500' />
          Writing Streak
        </h2>
        <div className='text-right'>
          <div className='text-3xl font-bold text-orange-500'>{streak.length}</div>
          <div className='text-sm text-gray-600 dark:text-gray-400'>days</div>
        </div>
      </div>

      <div className='mb-6'>
        <div className='mb-2 flex justify-between text-sm'>
          <span className='text-gray-600 dark:text-gray-400'>Best Streak</span>
          <span className='font-semibold'>{streak.bestStreak} days</span>
        </div>
        {streak.recoveryDate && (
          <div className='mb-2 text-xs text-yellow-600 dark:text-yellow-400'>
            Recovered on {new Date(streak.recoveryDate).toLocaleDateString()}
          </div>
        )}
      </div>

      {upcomingMilestone && (
        <div className='mb-6 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20'>
          <div className='mb-2 flex items-center justify-between'>
            <span className='text-sm font-medium'>Next Milestone</span>
            <span className='text-sm text-gray-600 dark:text-gray-400'>
              {streak.length}/{upcomingMilestone.streak} days
            </span>
          </div>
          <div className='mb-2 flex items-center gap-2'>
            <TrendingUp className='h-4 w-4 text-blue-500' />
            <span className='font-semibold'>{upcomingMilestone.title}</span>
          </div>
          <p className='mb-3 text-sm text-gray-600 dark:text-gray-400'>
            {upcomingMilestone.description}
          </p>
          <div className='h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700'>
            <div
              className='h-2 rounded-full bg-blue-500 transition-all duration-300'
              style={{ width: `${Math.min(100, progressToNextMilestone)}%` }}
            />
          </div>
        </div>
      )}

      <div className='space-y-2'>
        <h3 className='mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300'>Milestones</h3>
        {milestones.map(milestone => (
          <div
            key={milestone.streak}
            className={cn(
              'flex items-center gap-3 rounded-lg p-3 transition-colors',
              milestone.unlocked
                ? 'bg-green-50 dark:bg-green-900/20'
                : 'bg-gray-50 dark:bg-gray-700/50',
            )}
          >
            <span className='text-2xl'>{milestone.icon}</span>
            <div className='flex-1'>
              <div className='font-semibold'>{milestone.title}</div>
              <div className='text-sm text-gray-600 dark:text-gray-400'>
                {milestone.description}
              </div>
            </div>
            {milestone.unlocked && (
              <div className='text-xs font-semibold text-green-600 dark:text-green-400'>
                ✓ Unlocked
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
