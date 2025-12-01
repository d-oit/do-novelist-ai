import React from 'react';
import { Flame, Award, Target, TrendingUp } from 'lucide-react';
import { useGamification } from '../hooks/useGamification';
import { StreakDisplay } from './StreakDisplay';
import { AchievementsList } from './AchievementsList';

interface GamificationDashboardProps {
  userId: string;
}

export const GamificationDashboard: React.FC<GamificationDashboardProps> = ({ userId }) => {
  const { streak, achievements, milestones, stats, badges, isLoading, error } =
    useGamification(userId);

  if (error !== null && error !== undefined) {
    return (
      <div className='rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20'>
        <p className='text-red-700 dark:text-red-400'>{error}</p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Stats Overview */}
      {stats && (
        <div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
          <div className='rounded-lg bg-white p-4 shadow dark:bg-gray-800'>
            <div className='mb-2 flex items-center gap-2'>
              <Flame className='h-5 w-5 text-orange-500' />
              <span className='text-sm text-gray-600 dark:text-gray-400'>Current Streak</span>
            </div>
            <div className='text-2xl font-bold'>{stats.currentStreak} days</div>
          </div>

          <div className='rounded-lg bg-white p-4 shadow dark:bg-gray-800'>
            <div className='mb-2 flex items-center gap-2'>
              <Award className='h-5 w-5 text-yellow-500' />
              <span className='text-sm text-gray-600 dark:text-gray-400'>Achievements</span>
            </div>
            <div className='text-2xl font-bold'>{stats.totalAchievements}</div>
          </div>

          <div className='rounded-lg bg-white p-4 shadow dark:bg-gray-800'>
            <div className='mb-2 flex items-center gap-2'>
              <Target className='h-5 w-5 text-blue-500' />
              <span className='text-sm text-gray-600 dark:text-gray-400'>Level</span>
            </div>
            <div className='text-2xl font-bold'>{stats.level}</div>
            <div className='mt-1 text-xs text-gray-500'>{stats.experiencePoints} XP</div>
          </div>

          <div className='rounded-lg bg-white p-4 shadow dark:bg-gray-800'>
            <div className='mb-2 flex items-center gap-2'>
              <TrendingUp className='h-5 w-5 text-green-500' />
              <span className='text-sm text-gray-600 dark:text-gray-400'>Avg Words/Day</span>
            </div>
            <div className='text-2xl font-bold'>{Math.round(stats.averageWordsPerDay)}</div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        {/* Streak Display */}
        <StreakDisplay streak={streak} milestones={milestones} isLoading={isLoading} />

        {/* Achievements List */}
        <AchievementsList
          achievements={achievements.all}
          userAchievements={achievements.unlocked}
          isLoading={isLoading}
        />
      </div>

      {/* Badges Section */}
      {badges.length > 0 && (
        <div className='rounded-lg bg-white p-6 shadow dark:bg-gray-800'>
          <h2 className='mb-4 flex items-center gap-2 text-xl font-bold'>
            <Award className='h-5 w-5 text-yellow-500' />
            Badges Earned
          </h2>
          <div className='flex flex-wrap gap-3'>
            {badges.map(badge => (
              <div
                key={badge.id}
                className='flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 dark:bg-gray-700'
                title={badge.description}
              >
                <span className='text-xl'>{badge.icon}</span>
                <span className='text-sm font-medium'>{badge.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
