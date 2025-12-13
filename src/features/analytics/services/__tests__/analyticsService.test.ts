import { describe, it, expect, beforeEach } from 'vitest';

import { analyticsService } from '@/features/analytics/services/analyticsService';

describe('AnalyticsService', () => {
  beforeEach(async () => {
    // Initialize service before each test
    await analyticsService.init();
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await expect(analyticsService.init()).resolves.toBeUndefined();
    });
  });

  describe('Session Management', () => {
    it('should start a writing session', async () => {
      const projectId = 'test-project-123';
      const session = await analyticsService.startWritingSession(projectId);

      expect(session).toBeDefined();
      expect(session.id).toMatch(/^session_/);
      expect(session.projectId).toBe(projectId);
      expect(session.startTime).toBeInstanceOf(Date);
      expect(session.duration).toBe(0);
    });

    it('should start a session with chapter ID', async () => {
      const projectId = 'test-project-123';
      const chapterId = 'chapter-1';
      const session = await analyticsService.startWritingSession(projectId, chapterId);

      expect(session.chapterId).toBe(chapterId);
    });

    it('should end a writing session', async () => {
      const projectId = 'test-project-123';
      const session = await analyticsService.startWritingSession(projectId);

      await expect(
        analyticsService.endWritingSession(session.id, {
          wordsAdded: 500,
          wordsRemoved: 50,
          charactersTyped: 2500,
          backspacesPressed: 100,
        })
      ).resolves.toBeUndefined();
    });

    it('should throw error when ending non-existent session', async () => {
      await expect(
        analyticsService.endWritingSession('invalid-session', {
          wordsAdded: 500,
          wordsRemoved: 50,
          charactersTyped: 2500,
          backspacesPressed: 100,
        })
      ).rejects.toThrow('Session not found');
    });
  });

  describe('Goals Management', () => {
    it('should create a writing goal', async () => {
      const goal = await analyticsService.createGoal({
        projectId: 'test-project',
        target: { words: 1000 },
        startDate: new Date(),
        endDate: new Date('2025-12-31'),
        type: 'daily',
        isActive: true,
      });

      expect(goal).toBeDefined();
      expect(goal.id).toBeDefined();
      expect(goal.target.words).toBe(1000);
    });

    it('should get goals for a project', async () => {
      const projectId = 'test-project';

      const goals = await analyticsService.getGoals(projectId);

      expect(Array.isArray(goals)).toBe(true);
    });

    it('should delete a goal', async () => {
      const goal = await analyticsService.createGoal({
        projectId: 'test-project',
        target: { words: 500 },
        startDate: new Date(),
        type: 'daily',
        isActive: true,
      });

      await expect(analyticsService.deleteGoal(goal.id)).resolves.toBeUndefined();
    });
  });

  describe('Statistics', () => {
    it('should get weekly stats', async () => {
      const weekStart = new Date();
      const stats = await analyticsService.getWeeklyStats(weekStart);

      expect(stats).toBeDefined();
      expect(typeof stats.totalWords).toBe('number');
      expect(typeof stats.totalWords).toBe('number');
      // expect(typeof stats.totalSessions).toBe('number'); // Not in WeeklyStats
    });

    it('should get word count chart data', async () => {
      const projectId = 'test-project';
      const days = 7;

      const chartData = await analyticsService.getWordCountChartData(projectId, days);

      expect(Array.isArray(chartData)).toBe(true);
      expect(chartData).toHaveLength(days);
    });
  });

  describe('Insights', () => {
    it('should get writing insights', async () => {
      const insights = await analyticsService.getWritingInsights();

      expect(insights).toBeDefined();
      expect(insights).toBeDefined();
      expect(typeof insights.streaks.currentStreak).toBe('number');
      expect(typeof insights.streaks.longestStreak).toBe('number');
      expect(typeof insights.productivity.averageWordsPerHour).toBe('number');
    });

    it('should get insights with filter', async () => {
      const filter = {
        projectIds: ['test-project'],
        dateRange: {
          start: new Date('2025-01-01'),
          end: new Date('2025-12-31'),
        },
        granularity: 'day' as const,
      };

      const insights = await analyticsService.getWritingInsights(filter);

      expect(insights).toBeDefined();
    });
  });
});
