import { Zap, TrendingUp } from 'lucide-react';
import React, { useState } from 'react';

import { useGamification } from '../hooks/useGamification';

interface GamificationPanelProps {
  userId: string;
  wordsWritten: number;
}

export const GamificationPanel: React.FC<GamificationPanelProps> = ({ userId, wordsWritten }) => {
  const { checkIn, streak, stats } = useGamification(userId);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkInResult, setCheckInResult] = useState<{
    unlockedAchievements: number;
    newStreak: number;
  } | null>(null);

  const handleCheckIn = async (): Promise<void> => {
    try {
      setIsCheckingIn(true);
      const result = await checkIn(wordsWritten);
      setCheckInResult({
        unlockedAchievements: result.unlockedAchievements.length,
        newStreak: result.streak.length,
      });
    } catch (error) {
      console.error('Check-in failed:', error);
    } finally {
      setIsCheckingIn(false);
      // Clear result after 3 seconds
      setTimeout(() => setCheckInResult(null), 3000);
    }
  };

  return (
    <div className='rounded-lg border border-orange-200 bg-gradient-to-r from-orange-50 to-red-50 p-4 dark:border-orange-800 dark:from-orange-900/20 dark:to-red-900/20'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <div className='rounded-lg bg-orange-100 p-2 dark:bg-orange-900/30'>
            <Zap className='h-5 w-5 text-orange-500' />
          </div>
          <div>
            <h3 className='font-semibold text-gray-900 dark:text-gray-100'>Daily Writing Streak</h3>
            <p className='text-sm text-gray-600 dark:text-gray-400'>
              Track your progress and earn achievements
            </p>
          </div>
        </div>

        <div className='text-right'>
          <div className='text-2xl font-bold text-orange-600 dark:text-orange-400'>
            {streak?.length ?? 0} days
          </div>
          <div className='text-xs text-gray-600 dark:text-gray-400'>Current streak</div>
        </div>
      </div>

      <div className='mt-4 flex items-center justify-between'>
        <div className='flex items-center gap-2 text-sm'>
          <TrendingUp className='h-4 w-4 text-green-500' />
          <span className='text-gray-600 dark:text-gray-400'>
            Level {stats?.level ?? 1} • {stats?.experiencePoints ?? 0} XP
          </span>
        </div>

        <button
          onClick={() => {
            void handleCheckIn();
          }}
          disabled={isCheckingIn}
          className='rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:bg-gray-400'
        >
          {isCheckingIn ? 'Checking in...' : 'Check In'}
        </button>
      </div>

      {checkInResult && (
        <div className='mt-4 rounded-lg border border-green-200 bg-green-100 p-3 dark:border-green-800 dark:bg-green-900/30'>
          <div className='flex items-center gap-2 text-green-700 dark:text-green-400'>
            <span className='text-lg'>🎉</span>
            <span className='font-semibold'>
              {checkInResult.newStreak > (streak?.length ?? 0)
                ? `New streak: ${checkInResult.newStreak} days!`
                : 'Checked in successfully!'}
            </span>
          </div>
          {checkInResult.unlockedAchievements > 0 && (
            <p className='mt-1 text-sm text-green-600 dark:text-green-400'>
              {checkInResult.unlockedAchievements} achievement
              {checkInResult.unlockedAchievements > 1 ? 's' : ''} unlocked!
            </p>
          )}
        </div>
      )}
    </div>
  );
};
