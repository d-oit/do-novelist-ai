/**
 * Gamification System Types
 * Streaks, achievements, badges, and rewards for writing engagement
 */

export interface WritingStreak {
  id: string;
  userId: string;
  startDate: Date;
  endDate?: Date;
  length: number;
  isActive: boolean;
  bestStreak: number;
  recoveryDate?: Date; // Date when streak was recovered after breaking
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'writing' | 'productivity' | 'consistency' | 'creativity' | 'milestone';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  condition: AchievementCondition;
  rewards?: AchievementRewards;
  createdAt: Date;
  isHidden?: boolean; // Hidden until unlocked
}

export type AchievementCondition = {
  type:
    | 'word_count'
    | 'daily_streak'
    | 'weekly_streak'
    | 'monthly_streak'
    | 'session_count'
    | 'project_completion'
    | 'chapter_completion'
    | 'ai_usage'
    | 'custom';
  target: number;
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'all_time';
  projectId?: string;
};

export interface AchievementRewards {
  experiencePoints?: number;
  badge?: string;
  title?: string;
  unlockFeature?: string;
}

export interface UserAchievement {
  id: string;
  achievementId: string;
  unlockedAt: Date;
  progress: number; // 0-100
  value: number; // actual value achieved
  isClaimed: boolean;
  claimedAt?: Date;
  rewards?: AchievementRewards;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  unlockedAt?: Date;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export interface WritingChallenge {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  target: {
    words?: number;
    time?: number; // minutes
    chapters?: number;
    sessions?: number;
  };
  startDate: Date;
  endDate: Date;
  progress: number; // 0-100
  isCompleted: boolean;
  isActive: boolean;
  reward?: {
    points: number;
    badge?: string;
  };
}

export interface GamificationProfile {
  userId: string;
  level: number;
  experiencePoints: number;
  totalWordsWritten: number;
  currentStreak: number;
  longestStreak: number;
  achievementsUnlocked: number;
  badges: Badge[];
  activeChallenges: WritingChallenge[];
  completedChallenges: WritingChallenge[];
  lastUpdated: Date;
}

export interface StreakMilestone {
  streak: number;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: Date;
}

export interface GamificationStats {
  userId: string;
  totalWritingDays: number;
  currentStreak: number;
  longestStreak: number;
  totalAchievements: number;
  totalBadges: number;
  totalChallengesCompleted: number;
  averageWordsPerDay: number;
  level: number;
  experiencePoints: number;
  nextLevelProgress: number; // 0-100
}
