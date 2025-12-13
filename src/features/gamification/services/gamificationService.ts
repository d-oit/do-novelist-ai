import {
  type WritingStreak,
  type Achievement,
  type UserAchievement,
  type WritingChallenge,
  type GamificationProfile,
  type StreakMilestone,
  type GamificationStats,
  type Badge,
} from '@/features/gamification/types';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

class GamificationService {
  private readonly streaks = new Map<string, WritingStreak>();
  private readonly achievements = new Map<string, Achievement>();
  private readonly userAchievements = new Map<string, UserAchievement[]>();
  private readonly challenges = new Map<string, WritingChallenge[]>();
  private readonly profiles = new Map<string, GamificationProfile>();
  private readonly completedChapters = new Map<string, Set<string>>(); // userId -> Set of completed chapter IDs

  public constructor() {
    this.initializeDefaultAchievements();
  }

  /**
   * Mark a chapter as completed for a user
   */
  public markChapterCompleted(userId: string, chapterId: string): void {
    const userChapters = this.completedChapters.get(userId) ?? new Set<string>();
    userChapters.add(chapterId);
    this.completedChapters.set(userId, userChapters);
  }

  /**
   * Get the count of completed chapters for a user
   */
  private getCompletedChapterCount(userId: string): number {
    return this.completedChapters.get(userId)?.size ?? 0;
  }

  public init(userId: string): Promise<void> {
    // Initialize user profile if it doesn't exist
    if (!this.profiles.has(userId)) {
      const profile: GamificationProfile = {
        userId,
        level: 1,
        experiencePoints: 0,
        totalWordsWritten: 0,
        currentStreak: 0,
        longestStreak: 0,
        achievementsUnlocked: 0,
        badges: [],
        activeChallenges: [],
        completedChallenges: [],
        lastUpdated: new Date(),
      };
      this.profiles.set(userId, profile);
    }

    // Initialize active streak
    if (!this.streaks.has(userId)) {
      const streak: WritingStreak = {
        id: `streak_${userId}`,
        userId,
        startDate: new Date(),
        length: 0,
        isActive: false,
        bestStreak: 0,
      };
      this.streaks.set(userId, streak);
    }

    return Promise.resolve();
  }

  public async checkIn(
    userId: string,
    wordsWritten: number,
  ): Promise<{
    streak: WritingStreak;
    unlockedAchievements: Achievement[];
    milestones: StreakMilestone[];
  }> {
    await this.init(userId);

    const streak = this.streaks.get(userId);
    if (!streak) {
      throw new Error('Streak not found after initialization');
    }

    const today = this.getToday();
    const lastCheckIn = streak.endDate ? this.getDateOnly(streak.endDate) : null;
    const todayDateOnly = this.getDateOnly(new Date(today));

    let streakLength = streak.length;

    if (!streak.isActive) {
      // Starting a new streak
      streak.isActive = true;
      streak.startDate = new Date(today);
      streakLength = 1;
    } else if (
      lastCheckIn !== null &&
      lastCheckIn !== undefined &&
      this.daysBetween(lastCheckIn, todayDateOnly) === 1
    ) {
      // Continuing streak
      streakLength = streak.length + 1;
    } else if (
      lastCheckIn !== null &&
      lastCheckIn !== undefined &&
      this.daysBetween(lastCheckIn, todayDateOnly) > 1
    ) {
      // Streak broken, starting recovery
      streakLength = 1;
      streak.recoveryDate = new Date(today);
    }

    // Update streak
    streak.length = streakLength;
    streak.endDate = new Date(today);
    streak.bestStreak = Math.max(streak.bestStreak, streakLength);
    this.streaks.set(userId, streak);

    // Update profile
    const profile = this.profiles.get(userId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    profile.currentStreak = streakLength;
    profile.longestStreak = Math.max(profile.longestStreak, streakLength);
    profile.totalWordsWritten += wordsWritten;
    profile.experiencePoints += this.calculateXP(wordsWritten, streakLength);
    profile.level = this.calculateLevel(profile.experiencePoints);
    profile.lastUpdated = new Date();
    this.profiles.set(userId, profile);

    // Check for achievements
    const unlockedAchievements = await this.checkAchievements(userId, {
      wordsWritten,
      streakLength,
    });

    // Check for milestones
    const milestones = this.checkMilestones(streak);

    return {
      streak,
      unlockedAchievements,
      milestones,
    };
  }

  public async getStreak(userId: string): Promise<WritingStreak | null> {
    return Promise.resolve(this.streaks.get(userId) ?? null);
  }

  public async getProfile(userId: string): Promise<GamificationProfile | null> {
    return Promise.resolve(this.profiles.get(userId) ?? null);
  }

  public async getStats(userId: string): Promise<GamificationStats> {
    const profile = this.profiles.get(userId);
    const streak = this.streaks.get(userId);

    if (!profile || !streak) {
      throw new Error('User profile or streak not found');
    }

    const totalWritingDays = this.calculateTotalWritingDays(userId);
    const nextLevelXP = this.getXPForLevel(profile.level + 1);
    const nextLevelProgress =
      (profile.experiencePoints ?? 0) > 0
        ? Math.min(100, ((profile.experiencePoints ?? 0) / nextLevelXP) * 100)
        : 0;

    const result = {
      userId,
      totalWritingDays,
      currentStreak: streak.length,
      longestStreak: streak.bestStreak,
      totalAchievements: profile.achievementsUnlocked,
      totalBadges: profile.badges.length,
      totalChallengesCompleted: profile.completedChallenges.length,
      averageWordsPerDay: totalWritingDays > 0 ? profile.totalWordsWritten / totalWritingDays : 0,
      level: profile.level,
      experiencePoints: profile.experiencePoints,
      nextLevelProgress,
    };

    return Promise.resolve(result);
  }

  public async getAchievements(userId: string): Promise<{
    all: Achievement[];
    unlocked: UserAchievement[];
  }> {
    const userAchievements = this.userAchievements.get(userId) ?? [];
    return Promise.resolve({
      all: Array.from(this.achievements.values()),
      unlocked: userAchievements,
    });
  }

  public async getBadges(userId: string): Promise<Badge[]> {
    const profile = this.profiles.get(userId);
    return Promise.resolve(profile?.badges ?? []);
  }

  public async createChallenge(
    userId: string,
    challenge: Omit<WritingChallenge, 'id' | 'progress' | 'isCompleted'>,
  ): Promise<WritingChallenge> {
    const id = `challenge_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const newChallenge: WritingChallenge = {
      ...challenge,
      id,
      progress: 0,
      isCompleted: false,
    };

    const userChallenges = this.challenges.get(userId) ?? [];
    userChallenges.push(newChallenge);
    this.challenges.set(userId, userChallenges);

    const profile = this.profiles.get(userId);
    if (profile) {
      profile.activeChallenges.push(newChallenge);
      this.profiles.set(userId, profile);
    }

    return Promise.resolve(newChallenge);
  }

  public async getActiveChallenges(userId: string): Promise<WritingChallenge[]> {
    return Promise.resolve(this.challenges.get(userId)?.filter(c => c.isActive) ?? []);
  }

  private initializeDefaultAchievements(): void {
    const defaultAchievements: Achievement[] = [
      {
        id: 'first_words',
        title: 'First Steps',
        description: 'Write your first 100 words',
        icon: '✍️',
        category: 'milestone',
        rarity: 'common',
        condition: { type: 'word_count', target: 100, timeframe: 'all_time' },
        rewards: { experiencePoints: 10 },
        createdAt: new Date(),
      },
      {
        id: 'streak_3',
        title: 'Getting Started',
        description: 'Write for 3 days in a row',
        icon: '🔥',
        category: 'consistency',
        rarity: 'common',
        condition: { type: 'daily_streak', target: 3, timeframe: 'all_time' },
        rewards: { experiencePoints: 25, badge: 'streak_3' },
        createdAt: new Date(),
      },
      {
        id: 'streak_7',
        title: 'Week Warrior',
        description: 'Write for 7 days in a row',
        icon: '🔥',
        category: 'consistency',
        rarity: 'uncommon',
        condition: { type: 'daily_streak', target: 7, timeframe: 'all_time' },
        rewards: { experiencePoints: 50, badge: 'streak_7' },
        createdAt: new Date(),
      },
      {
        id: 'streak_30',
        title: 'Monthly Master',
        description: 'Write for 30 days in a row',
        icon: '🔥',
        category: 'consistency',
        rarity: 'epic',
        condition: { type: 'daily_streak', target: 30, timeframe: 'all_time' },
        rewards: { experiencePoints: 200, badge: 'streak_30', title: 'Dedicated Writer' },
        createdAt: new Date(),
      },
      {
        id: 'streak_100',
        title: 'Century Club',
        description: 'Write for 100 days in a row',
        icon: '🔥',
        category: 'consistency',
        rarity: 'legendary',
        condition: { type: 'daily_streak', target: 100, timeframe: 'all_time' },
        rewards: { experiencePoints: 500, badge: 'streak_100', title: 'Century Writer' },
        createdAt: new Date(),
      },
      {
        id: '1000_words',
        title: 'Novelist in Training',
        description: 'Write 1,000 words',
        icon: '📚',
        category: 'milestone',
        rarity: 'common',
        condition: { type: 'word_count', target: 1000, timeframe: 'all_time' },
        rewards: { experiencePoints: 50 },
        createdAt: new Date(),
      },
      {
        id: '10000_words',
        title: 'Story Weaver',
        description: 'Write 10,000 words',
        icon: '📖',
        category: 'milestone',
        rarity: 'uncommon',
        condition: { type: 'word_count', target: 10000, timeframe: 'all_time' },
        rewards: { experiencePoints: 150, badge: 'word_master' },
        createdAt: new Date(),
      },
      {
        id: '50000_words',
        title: 'Novelist',
        description: 'Write 50,000 words (NaNoWriMo distance!)',
        icon: '🏆',
        category: 'milestone',
        rarity: 'rare',
        condition: { type: 'word_count', target: 50000, timeframe: 'all_time' },
        rewards: { experiencePoints: 500, badge: 'novelist' },
        createdAt: new Date(),
      },
      {
        id: 'chapter_1',
        title: 'Chapter Complete',
        description: 'Complete your first chapter',
        icon: '📄',
        category: 'milestone',
        rarity: 'common',
        condition: { type: 'chapter_completion', target: 1, timeframe: 'all_time' },
        rewards: { experiencePoints: 30 },
        createdAt: new Date(),
      },
      {
        id: 'chapter_10',
        title: 'Deca-chapter',
        description: 'Complete 10 chapters',
        icon: '📑',
        category: 'milestone',
        rarity: 'rare',
        condition: { type: 'chapter_completion', target: 10, timeframe: 'all_time' },
        rewards: { experiencePoints: 200, badge: 'chapter_master' },
        createdAt: new Date(),
      },
    ];

    defaultAchievements.forEach(achievement => {
      this.achievements.set(achievement.id, achievement);
    });
  }

  private async checkAchievements(
    userId: string,
    stats: { wordsWritten: number; streakLength: number },
  ): Promise<Achievement[]> {
    const unlocked: Achievement[] = [];
    const userAchievements = this.userAchievements.get(userId) ?? [];
    const unlockedIds = new Set(userAchievements.map(ua => ua.achievementId));

    for (const achievement of this.achievements.values()) {
      if (unlockedIds.has(achievement.id)) continue;

      let isUnlocked = false;

      switch (achievement.condition.type) {
        case 'word_count':
          // Check total words written
          const profile = this.profiles.get(userId);
          isUnlocked = (profile?.totalWordsWritten ?? 0) >= achievement.condition.target;
          break;

        case 'daily_streak':
          isUnlocked = stats.streakLength >= achievement.condition.target;
          break;

        case 'chapter_completion':
          // Check actual chapter completions
          const completedCount = this.getCompletedChapterCount(userId);
          isUnlocked = completedCount >= (achievement.condition.target ?? 1);
          break;

        case 'custom':
          isUnlocked = false;
          break;

        default:
          isUnlocked = false;
      }

      if (isUnlocked) {
        const userAchievement: UserAchievement = {
          id: `ua_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          achievementId: achievement.id,
          unlockedAt: new Date(),
          progress: 100,
          value: stats.wordsWritten,
          isClaimed: false,
          rewards: achievement.rewards,
        };

        userAchievements.push(userAchievement);
        this.userAchievements.set(userId, userAchievements);

        // Update profile
        const profile = this.profiles.get(userId);
        if (profile) {
          profile.achievementsUnlocked += 1;
          if (achievement.rewards?.experiencePoints !== undefined) {
            profile.experiencePoints += achievement.rewards.experiencePoints;
          }
          if (achievement.rewards?.badge !== undefined) {
            const badge: Badge = {
              id: achievement.rewards.badge,
              name: achievement.title,
              description: achievement.description,
              icon: achievement.icon,
              color: this.getRarityColor(achievement.rarity),
              unlockedAt: new Date(),
              rarity: achievement.rarity,
            };
            profile.badges.push(badge);
          }
          this.profiles.set(userId, profile);
        }

        unlocked.push(achievement);
      }
    }

    return Promise.resolve(unlocked);
  }

  private checkMilestones(streak: WritingStreak): StreakMilestone[] {
    const milestones: StreakMilestone[] = [
      {
        streak: 1,
        title: 'Day One',
        description: 'Start your writing journey',
        icon: '🌱',
        unlocked: streak.length >= 1,
        unlockedAt: streak.length >= 1 ? new Date() : undefined,
      },
      {
        streak: 3,
        title: 'Small Steps',
        description: '3 days in a row',
        icon: '🔥',
        unlocked: streak.length >= 3,
        unlockedAt: streak.length >= 3 ? new Date() : undefined,
      },
      {
        streak: 7,
        title: 'Week Strong',
        description: '7 days in a row',
        icon: '🔥',
        unlocked: streak.length >= 7,
        unlockedAt: streak.length >= 7 ? new Date() : undefined,
      },
      {
        streak: 30,
        title: 'Monthly Legend',
        description: '30 days in a row',
        icon: '🔥',
        unlocked: streak.length >= 30,
        unlockedAt: streak.length >= 30 ? new Date() : undefined,
      },
      {
        streak: 100,
        title: 'Century Streak',
        description: '100 days in a row',
        icon: '👑',
        unlocked: streak.length >= 100,
        unlockedAt: streak.length >= 100 ? new Date() : undefined,
      },
    ];

    return milestones;
  }

  private calculateXP(wordsWritten: number, streakLength: number): number {
    const baseXP = Math.floor(wordsWritten / 10); // 1 XP per 10 words
    const streakBonus = streakLength * 2; // 2 XP per streak day
    return baseXP + streakBonus;
  }

  private calculateLevel(experiencePoints: number): number {
    // Level formula: level = floor(sqrt(XP / 100)) + 1
    return Math.floor(Math.sqrt(experiencePoints / 100)) + 1;
  }

  private getXPForLevel(level: number): number {
    // Inverse of calculateLevel: XP = (level - 1)^2 * 100
    return Math.pow(level - 1, 2) * 100;
  }

  private getToday(): string {
    const now = new Date();
    return now.toISOString().split('T')[0] ?? now.toISOString().substring(0, 10);
  }

  private getDateOnly(date: Date): string {
    return date.toISOString().split('T')[0] ?? date.toISOString().substring(0, 10);
  }

  private daysBetween(date1: string, date2: string): number {
    const d1 = new Date(`${date1}T00:00:00Z`);
    const d2 = new Date(`${date2}T00:00:00Z`);
    return Math.floor((d2.getTime() - d1.getTime()) / ONE_DAY_MS);
  }

  private calculateTotalWritingDays(userId: string): number {
    // This would normally query the analytics service
    // For now, return a placeholder
    return this.profiles.get(userId)?.currentStreak ?? 0;
  }

  private getRarityColor(rarity: string): string {
    const colors: Record<string, string> = {
      common: '#94a3b8',
      uncommon: '#22c55e',
      rare: '#3b82f6',
      epic: '#a855f7',
      legendary: '#f59e0b',
    };
    return (colors[rarity] ?? colors.common) as string;
  }
}

export const gamificationService = new GamificationService();
