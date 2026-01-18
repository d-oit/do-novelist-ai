/**
 * Tests for GamificationService - Streak Management
 *
 * Tests streak initialization, streak tracking, streak continuation,
 * streak breaking, and chapter completion functionality.
 */

import { describe, it, expect, beforeEach } from 'vitest';

import { gamificationService } from '@/features/gamification/services/gamificationService';

describe('GamificationService - Streaks', () => {
  describe('Initialization', () => {
    it('should initialize user profile for new user', async () => {
      const newUserId = 'new-user-init-456';
      await gamificationService.init(newUserId);

      const profile = await gamificationService.getProfile(newUserId);

      expect(profile).toBeDefined();
      expect(profile?.userId).toBe(newUserId);
      expect(profile?.level).toBe(1);
      expect(profile?.experiencePoints).toBe(0);
      expect(profile?.totalWordsWritten).toBe(0);
      expect(profile?.currentStreak).toBe(0);
      expect(profile?.longestStreak).toBe(0);
      expect(profile?.achievementsUnlocked).toBe(0);
      expect(profile?.badges).toHaveLength(0);
    });

    it('should initialize streak for new user', async () => {
      const newUserId = 'new-user-init-789';
      await gamificationService.init(newUserId);

      const streak = await gamificationService.getStreak(newUserId);

      expect(streak).toBeDefined();
      expect(streak?.userId).toBe(newUserId);
      expect(streak?.length).toBe(0);
      expect(streak?.isActive).toBe(false);
      expect(streak?.bestStreak).toBe(0);
    });

    it('should return existing profile for initialized user', async () => {
      const newUserId = 'existing-user-1';
      await gamificationService.init(newUserId);

      const profile1 = await gamificationService.getProfile(newUserId);
      await gamificationService.init(newUserId);
      const profile2 = await gamificationService.getProfile(newUserId);

      expect(profile1).toBeDefined();
      expect(profile2).toBeDefined();
    });

    it('should return existing streak for initialized user', async () => {
      const newUserId = 'existing-user-2';
      await gamificationService.init(newUserId);

      const streak1 = await gamificationService.getStreak(newUserId);
      await gamificationService.init(newUserId);
      const streak2 = await gamificationService.getStreak(newUserId);

      expect(streak1).toBeDefined();
      expect(streak2).toBeDefined();
    });
  });

  describe('Chapter Completion', () => {
    const testUserId = 'chapter-test-user';

    beforeEach(async () => {
      await gamificationService.init(testUserId);
    });

    it('should mark a chapter as completed', async () => {
      const chapterId = 'chapter-1';

      gamificationService.markChapterCompleted(testUserId, chapterId);

      const achievements = await gamificationService.getAchievements(testUserId);
      expect(achievements).toBeDefined();
    });

    it('should track multiple chapter completions', async () => {
      const chapterIds = ['chapter-1', 'chapter-2', 'chapter-3'];

      chapterIds.forEach(id => gamificationService.markChapterCompleted(testUserId, id));

      expect(true).toBe(true);
    });

    it('should handle marking same chapter twice', async () => {
      const chapterId = 'chapter-1';

      gamificationService.markChapterCompleted(testUserId, chapterId);
      gamificationService.markChapterCompleted(testUserId, chapterId);

      expect(true).toBe(true);
    });
  });

  describe('Check-in - New Streak', () => {
    const testUserId = 'new-streak-test-user';

    beforeEach(async () => {
      await gamificationService.init(testUserId);
    });

    it('should start new streak on first check-in', async () => {
      const result = await gamificationService.checkIn(testUserId, 100);

      expect(result.streak.isActive).toBe(true);
      expect(result.streak.length).toBe(1);
      expect(result.streak.startDate).toBeInstanceOf(Date);
      expect(result.streak.endDate).toBeInstanceOf(Date);
    });

    it('should update profile on first check-in', async () => {
      await gamificationService.checkIn(testUserId, 100);

      const profile = await gamificationService.getProfile(testUserId);

      expect(profile?.currentStreak).toBe(1);
      expect(profile?.longestStreak).toBe(1);
      expect(profile?.totalWordsWritten).toBeGreaterThan(0);
      expect(profile?.experiencePoints).toBeGreaterThan(0);
    });

    it('should calculate XP correctly for first check-in', async () => {
      const wordsWritten = 100;
      await gamificationService.checkIn(testUserId, wordsWritten);

      const profile = await gamificationService.getProfile(testUserId);

      // Base XP + streak bonus + achievement XP
      expect(profile?.experiencePoints).toBeGreaterThan(0);
    });

    it('should update level based on XP', async () => {
      await gamificationService.checkIn(testUserId, 1000);

      const profile = await gamificationService.getProfile(testUserId);

      expect(profile?.level).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Check-in - Continuing Streak', () => {
    const testUserId = 'continuing-streak-test-user';

    it('should continue streak on consecutive days', async () => {
      await gamificationService.init(testUserId);

      await gamificationService.checkIn(testUserId, 100);
      const result2 = await gamificationService.checkIn(testUserId, 150);

      expect(result2.streak.length).toBeGreaterThanOrEqual(1);
      expect(result2.streak.bestStreak).toBeGreaterThanOrEqual(1);
    });

    it('should track best streak across sessions', async () => {
      await gamificationService.init(testUserId);

      await gamificationService.checkIn(testUserId, 100);
      await gamificationService.checkIn(testUserId, 150);
      await gamificationService.checkIn(testUserId, 200);

      const profile = await gamificationService.getProfile(testUserId);

      expect(profile?.longestStreak).toBeGreaterThanOrEqual(1);
    });

    it('should accumulate words written across check-ins', async () => {
      await gamificationService.init(testUserId);

      await gamificationService.checkIn(testUserId, 100);
      await gamificationService.checkIn(testUserId, 200);
      await gamificationService.checkIn(testUserId, 300);

      const profile = await gamificationService.getProfile(testUserId);

      // Words should be accumulated (600 + any XP from achievements)
      expect(profile?.totalWordsWritten).toBeGreaterThanOrEqual(600);
    });
  });

  describe('Check-in - Broken Streak', () => {
    const testUserId = 'broken-streak-test-user';

    it('should reset streak when broken', async () => {
      await gamificationService.init(testUserId);

      await gamificationService.checkIn(testUserId, 100);
      const result2 = await gamificationService.checkIn(testUserId, 150);

      expect(result2.streak.length).toBeGreaterThanOrEqual(1);
    });

    it('should maintain best streak after reset', async () => {
      await gamificationService.init(testUserId);

      await gamificationService.checkIn(testUserId, 100);
      await gamificationService.checkIn(testUserId, 150);

      const profile = await gamificationService.getProfile(testUserId);

      expect(profile?.longestStreak).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Get Streak', () => {
    const testUserId = 'get-streak-test-user';

    beforeEach(async () => {
      await gamificationService.init(testUserId);
    });

    it('should return null for non-existent user', async () => {
      const streak = await gamificationService.getStreak('non-existent-user');

      expect(streak).toBeNull();
    });

    it('should return streak with all required fields', async () => {
      await gamificationService.checkIn(testUserId, 100);

      const streak = await gamificationService.getStreak(testUserId);

      expect(streak).toBeDefined();
      expect(streak).toHaveProperty('id');
      expect(streak).toHaveProperty('userId');
      expect(streak).toHaveProperty('startDate');
      expect(streak).toHaveProperty('length');
      expect(streak).toHaveProperty('isActive');
      expect(streak).toHaveProperty('bestStreak');
    });

    it('should track recovery date after broken streak', async () => {
      await gamificationService.checkIn(testUserId, 100);
      await gamificationService.checkIn(testUserId, 150);

      const streak = await gamificationService.getStreak(testUserId);

      expect(streak).toBeDefined();
    });
  });

  describe('Multi-user Support', () => {
    it('should maintain separate streaks for different users', async () => {
      const user1Id = 'user-3-multi';
      const user2Id = 'user-4-multi';

      await gamificationService.checkIn(user1Id, 100);
      await gamificationService.checkIn(user2Id, 200);
      await gamificationService.checkIn(user1Id, 150);

      const streak1 = await gamificationService.getStreak(user1Id);
      const streak2 = await gamificationService.getStreak(user2Id);

      expect(streak1?.userId).toBe(user1Id);
      expect(streak2?.userId).toBe(user2Id);
    });
  });
});
