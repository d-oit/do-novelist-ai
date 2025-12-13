import type {
  WritingSession,
  DailyStats,
  WeeklyStats,
  ProjectAnalytics,
  WritingGoals,
  WritingInsights,
  AnalyticsFilter,
  ChartDataPoint,
} from '@/features/analytics/types';
import type { Project } from '@/types';

interface SessionProgress {
  wordsWritten: number;
  chapterIds: string[];
  timeSpent: number;
}

const buildDailyKey = (projectId: string, date: string): string => `${projectId}|${date}`;

const START_OF_WEEK = 1; // Monday

class AnalyticsService {
  private readonly sessions = new Map<string, WritingSession>();
  private readonly sessionProjects = new Map<string, string>();
  private readonly goals = new Map<string, WritingGoals>();
  private readonly dailyStats = new Map<string, DailyStats>();

  public async init(): Promise<void> {
    return Promise.resolve();
  }

  public async startWritingSession(projectId: string, chapterId?: string): Promise<WritingSession> {
    const id = `session_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const now = new Date();

    const baseSession: WritingSession = {
      id,
      projectId,
      ...(chapterId !== undefined ? { chapterId } : {}),
      startTime: now,
      endTime: now,
      duration: 0,
      wordsAdded: 0,
      wordsRemoved: 0,
      netWordCount: 0,
      charactersTyped: 0,
      backspacesPressed: 0,
      aiAssistanceUsed: false,
      aiWordsGenerated: 0,
    };

    this.sessions.set(id, baseSession);
    this.sessionProjects.set(id, projectId);
    return Promise.resolve(baseSession);
  }

  public async endWritingSession(
    sessionId: string,
    metrics: {
      wordsAdded: number;
      wordsRemoved: number;
      charactersTyped: number;
      backspacesPressed: number;
      aiWordsGenerated?: number;
    },
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const endTime = new Date();
    const duration = endTime.getTime() - session.startTime.getTime();
    const aiWords = metrics.aiWordsGenerated ?? 0;

    const updated: WritingSession = {
      ...session,
      endTime,
      duration,
      wordsAdded: metrics.wordsAdded,
      wordsRemoved: metrics.wordsRemoved,
      netWordCount: metrics.wordsAdded - metrics.wordsRemoved,
      charactersTyped: metrics.charactersTyped,
      backspacesPressed: metrics.backspacesPressed,
      aiAssistanceUsed: aiWords > 0,
      aiWordsGenerated: aiWords,
    };

    this.sessions.set(sessionId, updated);
    await this.updateDailyStatsForSession(updated);
  }

  public async trackProgress(sessionId: string, progress: SessionProgress): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const updated: WritingSession = {
      ...session,
      wordsAdded: session.wordsAdded + progress.wordsWritten,
      netWordCount: session.netWordCount + progress.wordsWritten,
      duration: session.duration + progress.timeSpent,
    };

    this.sessions.set(sessionId, updated);
    return Promise.resolve();
  }

  public async getProjectAnalytics(project: Project): Promise<ProjectAnalytics> {
    const totalWords = project.chapters.reduce(
      (sum, chapter) => sum + this.countWords(chapter.content),
      0,
    );
    const totalChapters = project.chapters.length;
    const completedChapters = project.chapters.filter(
      chapter => chapter.status.toLowerCase() === 'complete',
    ).length;
    const averageChapterLength = totalChapters > 0 ? totalWords / totalChapters : 0;
    const writingProgress = totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;
    const projectStats = this.collectDailyStatsForProject(project.id);

    return Promise.resolve({
      projectId: project.id,
      title: project.title,
      createdAt: new Date(project.createdAt ?? Date.now()),
      totalWords,
      totalChapters,
      completedChapters,
      estimatedReadingTime: Math.ceil(totalWords / 200),
      averageChapterLength,
      writingProgress,
      timeSpent: projectStats.reduce((sum, stat) => sum + stat.totalWritingTime, 0),
      lastActivity:
        projectStats.length > 0
          ? new Date(
              `${projectStats[projectStats.length - 1]?.date ?? new Date().toISOString().substring(0, 10)}T00:00:00Z`,
            )
          : new Date(),
      wordCountHistory: projectStats.map(stat => ({
        date: stat.date,
        wordCount: stat.wordsWritten,
      })),
      chapterProgress: project.chapters.map(chapter => {
        const base = {
          chapterId: chapter.id,
          title: chapter.title,
          wordCount: this.countWords(chapter.content),
          status: chapter.status,
        };

        return chapter.status.toLowerCase() === 'complete'
          ? { ...base, completionDate: new Date() }
          : base;
      }),
    });
  }

  public async getGoals(projectId: string): Promise<WritingGoals[]> {
    return Promise.resolve(
      Array.from(this.goals.values()).filter(
        goal => goal.projectId === projectId || goal.projectId === undefined,
      ),
    );
  }

  public async createGoal(goal: Omit<WritingGoals, 'id' | 'current'>): Promise<WritingGoals> {
    const id = `goal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const created: WritingGoals = {
      ...goal,
      id,
      current: {
        words: 0,
        time: 0,
        chapters: 0,
      },
    };

    this.goals.set(id, created);
    return Promise.resolve(created);
  }

  public async updateGoalProgress(id: string): Promise<void> {
    const goal = this.goals.get(id);
    if (!goal) {
      throw new Error('Goal not found');
    }

    goal.current = {
      words: goal.target.words ?? goal.current.words,
      time: goal.target.time ?? goal.current.time,
      chapters: goal.target.chapters ?? goal.current.chapters,
    };

    this.goals.set(id, goal);
    return Promise.resolve();
  }

  public async deleteGoal(id: string): Promise<void> {
    this.goals.delete(id);
    return Promise.resolve();
  }

  public async getWritingInsights(filter?: AnalyticsFilter): Promise<WritingInsights> {
    const range = filter?.dateRange ?? {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date(),
    };

    const statsInRange = this.collectStatsInRange(range.start, range.end);
    const totalWords = statsInRange.reduce((sum, stat) => sum + stat.wordsWritten, 0);
    const totalTime = statsInRange.reduce((sum, stat) => sum + stat.totalWritingTime, 0);
    const totalSessions = statsInRange.reduce((sum, stat) => sum + stat.sessionsCount, 0);

    const averageWordsPerHour = totalTime > 0 ? totalWords / (totalTime / 60) : 0;
    const averageSessionLength =
      totalSessions > 0
        ? statsInRange.reduce(
            (sum, stat) => sum + stat.averageSessionLength * stat.sessionsCount,
            0,
          ) / totalSessions
        : 0;

    const peakHours = statsInRange
      .map(stat => stat.peakWritingHour)
      .filter((hour, index, arr) => arr.indexOf(hour) === index && hour !== undefined);

    const preferredDays = this.collectPreferredDays(statsInRange);
    const consistencyScore = Math.min(100, totalSessions * 5);

    return Promise.resolve({
      productivity: {
        averageWordsPerHour,
        peakWritingHours: peakHours.length > 0 ? peakHours : [8, 9, 10],
        preferredWritingDays: preferredDays,
        consistencyScore,
      },
      patterns: {
        averageSessionLength,
        sessionsPerDay: statsInRange.length > 0 ? totalSessions / statsInRange.length : 0,
        preferredChapterLength: totalWords,
        revisionRatio: totalWords > 0 ? Math.min(1, statsInRange.length / 10) : 0,
      },
      aiUsage: {
        totalWordsGenerated: statsInRange.reduce(
          (sum, stat) => sum + (stat.aiAssistancePercentage / 100) * stat.wordsWritten,
          0,
        ),
        assistancePercentage:
          statsInRange.length > 0
            ? statsInRange.reduce((sum, stat) => sum + stat.aiAssistancePercentage, 0) /
              statsInRange.length
            : 0,
        mostAssistedChapters: [],
        aiDependencyTrend: 0,
      },
      streaks: this.computeStreaks(statsInRange),
      milestones: [],
    });
  }

  public async getWeeklyStats(weekStart: Date): Promise<WeeklyStats> {
    const start = this.getStartOfWeek(weekStart);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const stats = this.collectStatsInRange(start, end);
    const totalWords = stats.reduce((sum, stat) => sum + stat.wordsWritten, 0);
    const totalTime = stats.reduce((sum, stat) => sum + stat.totalWritingTime, 0);

    const mostProductive =
      stats.length > 0
        ? stats.reduce((max, current) => (current.wordsWritten > max.wordsWritten ? current : max))
        : undefined;

    return Promise.resolve({
      weekStart: start.toISOString().slice(0, 10),
      totalWords,
      totalTime,
      averageDailyWords: stats.length > 0 ? totalWords / stats.length : 0,
      mostProductiveDay: mostProductive?.date ?? start.toISOString().slice(0, 10),
      streak: this.computeStreakLength(stats),
      goals: {
        wordsTarget: totalWords,
        timeTarget: totalTime,
        wordsAchieved: totalWords,
        timeAchieved: totalTime,
      },
    });
  }

  public async getWordCountChartData(projectId: string, days: number): Promise<ChartDataPoint[]> {
    const now = new Date();
    const result: ChartDataPoint[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dateKey = date.toISOString().split('T')[0] ?? date.toISOString().substring(0, 10);
      const stats = this.dailyStats.get(buildDailyKey(projectId, dateKey));

      result.push({
        date: dateKey,
        value: stats ? stats.wordsWritten : 0,
      });
    }

    return Promise.resolve(result);
  }

  private updateDailyStatsForSession(session: WritingSession): Promise<void> {
    const projectId = this.sessionProjects.get(session.id);
    if (projectId === undefined) return Promise.resolve();

    const dateKey =
      session.endTime.toISOString().split('T')[0] ?? session.endTime.toISOString().substring(0, 10);
    const key = buildDailyKey(projectId, dateKey);

    const existing = this.dailyStats.get(key);
    const currentWords = Math.max(0, session.netWordCount);
    const currentMinutes = session.duration / (1000 * 60);

    if (!existing) {
      const stats: DailyStats = {
        date: dateKey,
        totalWritingTime: currentMinutes,
        wordsWritten: currentWords,
        sessionsCount: 1,
        averageSessionLength: currentMinutes,
        peakWritingHour: session.endTime.getHours(),
        productivity: currentMinutes > 0 ? currentWords / (currentMinutes / 60) : 0,
        aiAssistancePercentage:
          currentWords > 0 ? (session.aiWordsGenerated / currentWords) * 100 : 0,
      };

      this.dailyStats.set(key, stats);
      return Promise.resolve();
    }

    const previousWords = existing.wordsWritten;
    const previousAiWords = (existing.aiAssistancePercentage / 100) * previousWords;
    const totalWords = previousWords + currentWords;
    const totalTime = existing.totalWritingTime + currentMinutes;
    const totalSessions = existing.sessionsCount + 1;
    const totalAiWords = previousAiWords + session.aiWordsGenerated;

    existing.wordsWritten = totalWords;
    existing.totalWritingTime = totalTime;
    existing.sessionsCount = totalSessions;
    existing.averageSessionLength = totalSessions > 0 ? totalTime / totalSessions : 0;
    existing.productivity = totalTime > 0 ? totalWords / (totalTime / 60) : 0;
    existing.peakWritingHour = session.endTime.getHours();
    existing.aiAssistancePercentage = totalWords > 0 ? (totalAiWords / totalWords) * 100 : 0;

    this.dailyStats.set(key, existing);
    return Promise.resolve();
  }

  private collectDailyStatsForProject(projectId: string): DailyStats[] {
    return Array.from(this.dailyStats.entries())
      .filter(([key]) => key.startsWith(`${projectId}|`))
      .map(([, value]) => value)
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private collectStatsInRange(start: Date, end: Date): DailyStats[] {
    const startKey = start.toISOString().slice(0, 10);
    const endKey = end.toISOString().slice(0, 10);

    return Array.from(this.dailyStats.values())
      .filter(stat => stat.date >= startKey && stat.date <= endKey)
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private computeStreaks(stats: DailyStats[]): WritingInsights['streaks'] {
    const streakLength = this.computeStreakLength(stats);
    const dates = stats.filter(stat => stat.wordsWritten > 0).map(stat => stat.date);

    return {
      currentStreak: streakLength,
      longestStreak: streakLength,
      streakDates: dates,
    };
  }

  private computeStreakLength(stats: DailyStats[]): number {
    if (stats.length === 0) return 0;

    let longest = 0;
    let current = 0;
    let previousDate: Date | null = null;

    for (const stat of stats) {
      if (stat.wordsWritten <= 0) {
        current = 0;
        previousDate = null;
        continue;
      }

      const currentDate = new Date(`${stat.date}T00:00:00Z`);
      if (!previousDate) {
        current = 1;
      } else {
        const diff = (currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24);
        current = diff === 1 ? current + 1 : 1;
      }

      longest = Math.max(longest, current);
      previousDate = currentDate;
    }

    return longest;
  }

  private collectPreferredDays(stats: DailyStats[]): string[] {
    const dayCounts = new Map<string, number>();

    stats.forEach(stat => {
      const date = new Date(`${stat.date}T00:00:00Z`);
      const day = date.toLocaleDateString('en-US', { weekday: 'long' });
      dayCounts.set(day, (dayCounts.get(day) ?? 0) + stat.wordsWritten);
    });

    return Array.from(dayCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([day]) => day);
  }

  private getStartOfWeek(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay();
    const diff = (day < START_OF_WEEK ? 7 : 0) + day - START_OF_WEEK;
    result.setDate(result.getDate() - diff);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  private countWords(content: string): number {
    return content.trim().length === 0 ? 0 : content.trim().split(/\s+/).length;
  }
}

export const analyticsService = new AnalyticsService();
