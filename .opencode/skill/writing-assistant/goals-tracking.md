# Goals Tracking

## Core Concepts

Writing goals tracking with daily targets, streak tracking, achievements, and
gamification.

## Goal Types

```typescript
enum GoalType {
  WORD_COUNT = 'word_count',
  TIME_SPENT = 'time_spent',
  CHAPTERS = 'chapters',
  DAYS_WRITTEN = 'days_written',
  CONSISTENCY = 'consistency',
}

enum GoalPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  PROJECT = 'project',
}
```

## Goal Data Model

```typescript
interface WritingGoal {
  id: string;
  name: string;
  description: string;
  type: GoalType;
  period: GoalPeriod;
  target: number;
  current: number;
  unit: string;
  startDate: Date;
  endDate?: Date;
  status: GoalStatus;
  priority: GoalPriority;
  reminders?: GoalReminder[];
  isCompleted: boolean;
  completedAt?: Date;
  streak: StreakInfo;
}

enum GoalStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

enum GoalPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

interface StreakInfo {
  current: number;
  longest: number;
  lastDate?: Date;
  history: StreakEntry[];
}

interface StreakEntry {
  startDate: Date;
  endDate: Date;
  length: number;
}
```

## Goal Progress Tracking

```typescript
class GoalTracker {
  async trackProgress(
    goalId: string,
    progress: number,
  ): Promise<GoalUpdateResult> {
    const goal = await this.getGoal(goalId);

    if (goal.status !== GoalStatus.ACTIVE) {
      return {
        success: false,
        error: 'Goal is not active',
      };
    }

    const previous = goal.current;
    goal.current = Math.min(goal.current + progress, goal.target);

    if (goal.current >= goal.target) {
      await this.completeGoal(goal);
    } else {
      await this.updateGoal(goal);
    }

    const streakInfo = await this.updateStreak(goal);

    return {
      success: true,
      goal,
      progress: {
        previous,
        current: goal.current,
        remaining: Math.max(0, goal.target - goal.current),
        percentage: (goal.current / goal.target) * 100,
      },
      streak: streakInfo,
      achievements: await this.checkAchievements(goal),
    };
  }

  private async completeGoal(goal: WritingGoal): Promise<void> {
    goal.status = GoalStatus.COMPLETED;
    goal.isCompleted = true;
    goal.completedAt = new Date();

    await this.saveGoal(goal);
    await this.triggerCompletionEvent(goal);
  }
}
```

## Streak Tracking

```typescript
class StreakTracker {
  async updateStreak(goal: WritingGoal): Promise<StreakInfo> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const history = goal.streak.history;
    const currentStreak = goal.streak.current;

    if (this.isGoalMetToday(goal)) {
      if (this.isYesterday(goal.streak.lastDate)) {
        goal.streak.current = currentStreak + 1;
      } else if (!this.isToday(goal.streak.lastDate)) {
        goal.streak.current = 1;
        history.push({
          startDate: today,
          endDate: today,
          length: 1,
        });
      }

      goal.streak.lastDate = today;
    } else if (this.isToday(goal.streak.lastDate)) {
      // Already updated today, no change
    } else {
      // Streak broken
      if (currentStreak > 0) {
        history[history.length - 1].endDate = goal.streak.lastDate!;
      }

      goal.streak.current = 0;
      goal.streak.lastDate = undefined;
    }

    goal.streak.longest = Math.max(goal.streak.longest, goal.streak.current);

    return goal.streak;
  }

  private isGoalMetToday(goal: WritingGoal): boolean {
    const today = new Date();
    return goal.current >= goal.target && this.isSameDay(today, goal.startDate);
  }

  private isYesterday(date: Date | undefined): boolean {
    if (!date) return false;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return this.isSameDay(date, yesterday);
  }

  private isToday(date: Date | undefined): boolean {
    if (!date) return false;
    return this.isSameDay(date, new Date());
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }
}
```

## Achievement System

```typescript
interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirement: AchievementRequirement;
  unlockedAt?: Date;
  progress: AchievementProgress;
}

interface AchievementRequirement {
  type: AchievementType;
  threshold: number;
  condition?: (goal: WritingGoal) => boolean;
}

enum AchievementType {
  WORDS_WRITTEN = 'words_written',
  DAYS_CONSECUTIVE = 'days_consecutive',
  GOALS_COMPLETED = 'goals_completed',
  PROJECTS_FINISHED = 'projects_finished',
  WORD_COUNT_STREAK = 'word_count_streak',
}

interface AchievementProgress {
  current: number;
  target: number;
  percentage: number;
  isUnlocked: boolean;
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-words',
    name: 'First Words',
    description: 'Write your first 100 words',
    icon: '✍️',
    rarity: 'common',
    requirement: {
      type: AchievementType.WORDS_WRITTEN,
      threshold: 100,
    },
    progress: { current: 0, target: 100, percentage: 0, isUnlocked: false },
  },
  {
    id: 'week-streak',
    name: 'Week Warrior',
    description: 'Write every day for a week',
    icon: '🔥',
    rarity: 'rare',
    requirement: {
      type: AchievementType.DAYS_CONSECUTIVE,
      threshold: 7,
    },
    progress: { current: 0, target: 7, percentage: 0, isUnlocked: false },
  },
  {
    id: 'novel-finished',
    name: 'Novelist',
    description: 'Complete a novel (50,000+ words)',
    icon: '📚',
    rarity: 'legendary',
    requirement: {
      type: AchievementType.WORDS_WRITTEN,
      threshold: 50000,
      condition: goal =>
        goal.type === GoalType.WORD_COUNT && goal.period === GoalPeriod.PROJECT,
    },
    progress: { current: 0, target: 50000, percentage: 0, isUnlocked: false },
  },
];

class AchievementTracker {
  async checkAchievements(goal: WritingGoal): Promise<Achievement[]> {
    const unlocked: Achievement[] = [];
    const userAchievements = await this.getUserAchievements();

    for (const achievement of ACHIEVEMENTS) {
      const existing = userAchievements.find(a => a.id === achievement.id);

      if (existing?.unlockedAt) {
        continue; // Already unlocked
      }

      const progress = this.calculateAchievementProgress(achievement, goal);

      if (progress.isUnlocked) {
        achievement.progress = progress;
        achievement.unlockedAt = new Date();

        await this.unlockAchievement(achievement);
        unlocked.push(achievement);
      }
    }

    return unlocked;
  }

  private calculateAchievementProgress(
    achievement: Achievement,
    goal: WritingGoal,
  ): AchievementProgress {
    let current = 0;

    switch (achievement.requirement.type) {
      case AchievementType.WORDS_WRITTEN:
        current = goal.current;
        break;
      case AchievementType.DAYS_CONSECUTIVE:
        current = goal.streak.current;
        break;
      case AchievementType.GOALS_COMPLETED:
        current = await this.getCompletedGoalsCount();
        break;
    }

    const isUnlocked =
      current >= achievement.requirement.threshold &&
      achievement.requirement.condition?.(goal) !== false;

    return {
      current,
      target: achievement.requirement.threshold,
      percentage: Math.min(
        (current / achievement.requirement.threshold) * 100,
        100,
      ),
      isUnlocked,
    };
  }
}
```

## Goal Presets

```typescript
interface GoalPreset {
  id: string;
  name: string;
  description: string;
  goals: Omit<
    WritingGoal,
    'id' | 'current' | 'status' | 'isCompleted' | 'streak'
  >[];
}

const GOAL_PRESETS: GoalPreset[] = [
  {
    id: 'nanowrimo',
    name: 'NaNoWriMo',
    description: 'Write 50,000 words in November',
    goals: [
      {
        name: 'NaNoWriMo Word Count',
        description: 'Complete 50,000 words in November',
        type: GoalType.WORD_COUNT,
        period: GoalPeriod.MONTHLY,
        target: 50000,
        unit: 'words',
        startDate: new Date(2026, 10, 1),
        endDate: new Date(2026, 10, 30),
        priority: GoalPriority.HIGH,
        streak: { current: 0, longest: 0, history: [] },
      },
    ],
  },
  {
    id: 'daily-writer',
    name: 'Daily Writer',
    description: 'Write 500 words every day',
    goals: [
      {
        name: 'Daily 500 Words',
        description: 'Write 500 words every day',
        type: GoalType.WORD_COUNT,
        period: GoalPeriod.DAILY,
        target: 500,
        unit: 'words',
        startDate: new Date(),
        priority: GoalPriority.MEDIUM,
        streak: { current: 0, longest: 0, history: [] },
      },
    ],
  },
  {
    id: 'novel-project',
    name: 'Novel Project',
    description: 'Complete a novel over 6 months',
    goals: [
      {
        name: 'Total Word Count',
        description: 'Write 80,000 words total',
        type: GoalType.WORD_COUNT,
        period: GoalPeriod.PROJECT,
        target: 80000,
        unit: 'words',
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 6)),
        priority: GoalPriority.HIGH,
        streak: { current: 0, longest: 0, history: [] },
      },
      {
        name: 'Weekly Chapters',
        description: 'Write 1 chapter per week',
        type: GoalType.CHAPTERS,
        period: GoalPeriod.WEEKLY,
        target: 1,
        unit: 'chapters',
        startDate: new Date(),
        priority: GoalPriority.MEDIUM,
        streak: { current: 0, longest: 0, history: [] },
      },
    ],
  },
];
```

## Progress Visualization

```typescript
interface ProgressVisualization {
  daily: DailyProgress[];
  weekly: WeeklyProgress;
  monthly: MonthlyProgress;
}

interface DailyProgress {
  date: Date;
  words: number;
  time: number;
  goalsMet: number;
  goalsTotal: number;
}

interface WeeklyProgress {
  totalWords: number;
  averageDailyWords: number;
  goalsMet: number;
  goalsTotal: number;
  streak: number;
}

class ProgressVisualizer {
  async generateProgress(
    userId: string,
    period: TimePeriod,
  ): Promise<ProgressVisualization> {
    const startDate = this.getStartDate(period);
    const endDate = new Date();

    const dailyProgress = await this.getDailyProgress(
      userId,
      startDate,
      endDate,
    );

    return {
      daily: dailyProgress,
      weekly: this.aggregateWeekly(dailyProgress),
      monthly: this.aggregateMonthly(dailyProgress),
    };
  }

  private aggregateWeekly(daily: DailyProgress[]): WeeklyProgress {
    const totalWords = daily.reduce((sum, d) => sum + d.words, 0);
    const averageDailyWords = totalWords / daily.length;
    const goalsMet = daily.reduce((sum, d) => sum + d.goalsMet, 0);
    const goalsTotal = daily.reduce((sum, d) => sum + d.goalsTotal, 0);

    return {
      totalWords,
      averageDailyWords,
      goalsMet,
      goalsTotal,
      streak: this.calculateCurrentStreak(daily),
    };
  }
}
```

## Performance Optimization

- Cache goal progress
- Batch database updates
- Use indexed queries
- Implement lazy loading for history
- Optimize streak calculations

## Testing

```typescript
describe('goal-tracker', () => {
  it('tracks progress correctly', async () => {
    const tracker = new GoalTracker();
    const result = await tracker.trackProgress('goal-1', 100);

    expect(result.success).toBe(true);
    expect(result.progress.current).toBe(100);
  });

  it('completes goal when target reached', async () => {
    const tracker = new GoalTracker();
    const goal = await tracker.getGoal('goal-1');
    goal.current = 900;

    const result = await tracker.trackProgress('goal-1', 100);

    expect(result.progress.remaining).toBe(0);
    expect(result.progress.percentage).toBe(100);
  });
});
```

## Integration

- Writing analytics for metrics
- Inline suggestions for goal completion
- Style analysis for quality tracking
