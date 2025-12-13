
import { Award } from 'lucide-react';
import React from 'react';

import { AchievementBadge } from '@/features/gamification/components/AchievementBadge';
import { type Achievement, type UserAchievement } from '@/types';

interface AchievementsListProps {
  achievements: Achievement[];
  userAchievements: UserAchievement[];
  isLoading?: boolean;
}

export const AchievementsList: React.FC<AchievementsListProps> = ({
  achievements,
  userAchievements,
  isLoading,
}) => {
  if (isLoading ?? false) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500' />
      </div>
    );
  }

  const unlockedIds = new Set(userAchievements.map(ua => ua.achievementId));
  const unlocked = achievements.filter(a => unlockedIds.has(a.id));
  const locked = achievements.filter(a => !unlockedIds.has(a.id));

  return (
    <div className='rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800'>
      <div className='mb-6 flex items-center justify-between'>
        <h2 className='flex items-center gap-2 text-2xl font-bold'>
          <Award className='h-6 w-6 text-yellow-500' />
          Achievements
        </h2>
        <div className='text-right'>
          <div className='text-sm text-gray-600 dark:text-gray-400'>
            {unlocked.length} / {achievements.length} Unlocked
          </div>
        </div>
      </div>

      {unlocked.length > 0 && (
        <div className='mb-8'>
          <h3 className='mb-3 flex items-center gap-2 text-sm font-semibold text-green-600 dark:text-green-400'>
            <span>✓</span> Unlocked ({unlocked.length})
          </h3>
          <div className='space-y-3'>
            {unlocked.map(achievement => {
              const userAchievement = userAchievements.find(
                ua => ua.achievementId === achievement.id,
              );
              return (
                <AchievementBadge
                  key={achievement.id}
                  achievement={achievement}
                  userAchievement={userAchievement}
                />
              );
            })}
          </div>
        </div>
      )}

      {locked.length > 0 && (
        <div>
          <h3 className='mb-3 flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-400'>
            <span>🔒</span> Locked ({locked.length})
          </h3>
          <div className='space-y-3'>
            {locked.map(achievement => (
              <AchievementBadge key={achievement.id} achievement={achievement} />
            ))}
          </div>
        </div>
      )}

      {achievements.length === 0 && (
        <div className='p-8 text-center text-gray-500'>
          <Award className='mx-auto mb-4 h-12 w-12 opacity-50' />
          <p>No achievements available yet.</p>
        </div>
      )}
    </div>
  );
};
