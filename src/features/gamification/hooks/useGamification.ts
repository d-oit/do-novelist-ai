import { useState, useEffect, useCallback } from 'react';

import { gamificationService } from '../services/gamificationService';
import {
  type WritingStreak,
  type Achievement,
  type UserAchievement,
  type WritingChallenge,
  type GamificationProfile,
  type StreakMilestone,
  type GamificationStats,
  type Badge,
} from '../types';

export interface UseGamificationReturn {
  // Data
  streak: WritingStreak | null;
  profile: GamificationProfile | null;
  stats: GamificationStats | null;
  achievements: {
    all: Achievement[];
    unlocked: UserAchievement[];
  };
  badges: Badge[];
  milestones: StreakMilestone[];
  activeChallenges: WritingChallenge[];

  // Actions
  checkIn: (wordsWritten: number) => Promise<{
    streak: WritingStreak;
    unlockedAchievements: Achievement[];
    milestones: StreakMilestone[];
  }>;
  getStats: () => Promise<GamificationStats>;
  createChallenge: (
    challenge: Omit<WritingChallenge, 'id' | 'progress' | 'isCompleted'>,
  ) => Promise<WritingChallenge>;

  // State
  isLoading: boolean;
  error: string | null;
}

export const useGamification = (userId: string): UseGamificationReturn => {
  const [streak, setStreak] = useState<WritingStreak | null>(null);
  const [profile, setProfile] = useState<GamificationProfile | null>(null);
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [achievements, setAchievements] = useState<{
    all: Achievement[];
    unlocked: UserAchievement[];
  }>({ all: [], unlocked: [] });
  const [badges, setBadges] = useState<Badge[]>([]);
  const [milestones, setMilestones] = useState<StreakMilestone[]>([]);
  const [activeChallenges, setActiveChallenges] = useState<WritingChallenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize
  useEffect(() => {
    if (!userId) {
      return;
    }

    const initialize = async (): Promise<void> => {
      try {
        setIsLoading(true);
        setError(null);

        await gamificationService.init(userId);

        const [streakData, profileData, statsData, achievementsData, badgesData, challengesData] =
          await Promise.all([
            gamificationService.getStreak(userId),
            gamificationService.getProfile(userId),
            gamificationService.getStats(userId),
            gamificationService.getAchievements(userId),
            gamificationService.getBadges(userId),
            gamificationService.getActiveChallenges(userId),
          ]);

        setStreak(streakData);
        setProfile(profileData);
        setStats(statsData);
        setAchievements(achievementsData);
        setBadges(badgesData);
        setActiveChallenges(challengesData);

        // Calculate milestones
        if (streakData) {
          const milestoneData: StreakMilestone[] = [
            {
              streak: 1,
              title: 'Day One',
              description: 'Start your writing journey',
              icon: '🌱',
              unlocked: streakData.length >= 1,
              unlockedAt: streakData.length >= 1 ? new Date() : undefined,
            },
            {
              streak: 3,
              title: 'Small Steps',
              description: '3 days in a row',
              icon: '🔥',
              unlocked: streakData.length >= 3,
              unlockedAt: streakData.length >= 3 ? new Date() : undefined,
            },
            {
              streak: 7,
              title: 'Week Strong',
              description: '7 days in a row',
              icon: '🔥',
              unlocked: streakData.length >= 7,
              unlockedAt: streakData.length >= 7 ? new Date() : undefined,
            },
            {
              streak: 30,
              title: 'Monthly Legend',
              description: '30 days in a row',
              icon: '🔥',
              unlocked: streakData.length >= 30,
              unlockedAt: streakData.length >= 30 ? new Date() : undefined,
            },
            {
              streak: 100,
              title: 'Century Streak',
              description: '100 days in a row',
              icon: '👑',
              unlocked: streakData.length >= 100,
              unlockedAt: streakData.length >= 100 ? new Date() : undefined,
            },
          ];
          setMilestones(milestoneData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize gamification');
      } finally {
        setIsLoading(false);
      }
    };

    void initialize();
  }, [userId]);

  const checkIn = useCallback(
    async (wordsWritten: number) => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await gamificationService.checkIn(userId, wordsWritten);

        setStreak(result.streak);
        setProfile(await gamificationService.getProfile(userId));
        setStats(await gamificationService.getStats(userId));
        setAchievements(await gamificationService.getAchievements(userId));
        setBadges(await gamificationService.getBadges(userId));
        setMilestones(result.milestones);

        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Check-in failed';
        setError(msg);
        throw new Error(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [userId],
  );

  const getStats = useCallback(async () => {
    try {
      const statsData = await gamificationService.getStats(userId);
      setStats(statsData);
      return statsData;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to get stats';
      setError(msg);
      throw new Error(msg);
    }
  }, [userId]);

  const createChallenge = useCallback(
    async (challenge: Omit<WritingChallenge, 'id' | 'progress' | 'isCompleted'>) => {
      try {
        const newChallenge = await gamificationService.createChallenge(userId, challenge);
        setActiveChallenges(prev => [...prev, newChallenge]);
        return newChallenge;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to create challenge';
        setError(msg);
        throw new Error(msg);
      }
    },
    [userId],
  );

  return {
    streak,
    profile,
    stats,
    achievements,
    badges,
    milestones,
    activeChallenges,
    checkIn,
    getStats,
    createChallenge,
    isLoading,
    error,
  };
};
