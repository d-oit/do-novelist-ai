import { Award, Lock } from 'lucide-react';
import React from 'react';

import { cn } from '../../../lib/utils';
import { type Achievement, type UserAchievement } from '../types';

interface AchievementBadgeProps {
  achievement: Achievement;
  userAchievement?: UserAchievement;
  showProgress?: boolean;
}

const rarityColors = {
  common: 'border-gray-400 bg-gray-50 dark:bg-gray-800',
  uncommon: 'border-green-400 bg-green-50 dark:bg-green-900/20',
  rare: 'border-blue-400 bg-blue-50 dark:bg-blue-900/20',
  epic: 'border-purple-400 bg-purple-50 dark:bg-purple-900/20',
  legendary: 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
};

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  achievement,
  userAchievement,
  showProgress = false,
}) => {
  const isUnlocked = !!userAchievement;
  const rarity = rarityColors[achievement.rarity];

  return (
    <div
      className={cn(
        'relative rounded-lg border-2 p-4 transition-all hover:shadow-md',
        isUnlocked ? rarity : 'border-gray-300 bg-gray-100 dark:bg-gray-800/50',
        !isUnlocked ? 'opacity-60' : '',
      )}
    >
      <div className='flex items-start gap-3'>
        <div className='text-4xl'>{achievement.icon}</div>
        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-2'>
            <h3 className='text-sm font-bold'>{achievement.title}</h3>
            {!isUnlocked && <Lock className='h-4 w-4 text-gray-400' />}
          </div>
          <p className='mt-1 text-xs text-gray-600 dark:text-gray-400'>{achievement.description}</p>

          <div className='mt-2 flex items-center justify-between'>
            <span
              className={cn(
                'rounded-full px-2 py-1 text-xs font-semibold',
                achievement.rarity === 'legendary'
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                  : achievement.rarity === 'epic'
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                    : achievement.rarity === 'rare'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                      : achievement.rarity === 'uncommon'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
              )}
            >
              {achievement.rarity}
            </span>

            {userAchievement?.rewards?.experiencePoints !== undefined && (
              <div className='flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400'>
                <Award className='h-3 w-3' />
                <span>{userAchievement.rewards.experiencePoints} XP</span>
              </div>
            )}
          </div>

          {showProgress && userAchievement && userAchievement.progress < 100 && (
            <div className='mt-2'>
              <div className='mb-1 flex justify-between text-xs'>
                <span>Progress</span>
                <span>{userAchievement.progress}%</span>
              </div>
              <div className='h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700'>
                <div
                  className='h-1.5 rounded-full bg-blue-500'
                  style={{ width: `${userAchievement.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
