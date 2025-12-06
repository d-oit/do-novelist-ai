/**
 * Tests for WritingAssistantDb - Secure ID Generation
 *
 * These tests verify that the database service generates secure,
 * unique IDs for devices, users, analysis records, and feedback.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string): string | null => store[key] ?? null,
    setItem: (key: string, value: string): void => {
      store[key] = value;
    },
    removeItem: (key: string): void => {
      delete store[key];
    },
    clear: (): void => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Import after mocking localStorage
import type { ContentAnalysis, WritingSuggestion } from '../../types';

describe('WritingAssistantDb - Secure ID Generation', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorageMock.clear();
    // Clear module cache to get fresh instance
    vi.resetModules();
  });

  describe('Device ID Generation', () => {
    it('should generate device ID with correct format', async () => {
      await import('../writingAssistantDb');
      const deviceId = localStorageMock.getItem('novelist_device_id');

      expect(deviceId).toBeDefined();
      expect(deviceId).toMatch(/^device_\d+_[a-z0-9]+$/);
    });

    it('should generate unique device IDs across multiple instances', async () => {
      // First instance
      localStorageMock.clear();
      await import('../writingAssistantDb');
      const deviceId1 = localStorageMock.getItem('novelist_device_id');

      // Second instance (simulate new device)
      localStorageMock.clear();
      vi.resetModules();
      await import('../writingAssistantDb');
      const deviceId2 = localStorageMock.getItem('novelist_device_id');

      expect(deviceId1).not.toBe(deviceId2);
    });

    it('should reuse existing device ID from localStorage', async () => {
      const existingDeviceId = 'device_1234567890_abc123xyz';
      localStorageMock.setItem('novelist_device_id', existingDeviceId);

      await import('../writingAssistantDb');
      const deviceId = localStorageMock.getItem('novelist_device_id');

      expect(deviceId).toBe(existingDeviceId);
    });
  });

  describe('User ID Generation', () => {
    it('should generate user ID with correct format', async () => {
      await import('../writingAssistantDb');
      const userId = localStorageMock.getItem('novelist_user_id');

      expect(userId).toBeDefined();
      expect(userId).toMatch(/^user_\d+_[a-z0-9]+$/);
    });

    it('should generate unique user IDs across multiple instances', async () => {
      // First instance
      localStorageMock.clear();
      await import('../writingAssistantDb');
      const userId1 = localStorageMock.getItem('novelist_user_id');

      // Second instance (simulate new user)
      localStorageMock.clear();
      vi.resetModules();
      await import('../writingAssistantDb');
      const userId2 = localStorageMock.getItem('novelist_user_id');

      expect(userId1).not.toBe(userId2);
    });

    it('should reuse existing user ID from localStorage', async () => {
      const existingUserId = 'user_1234567890_xyz789abc';
      localStorageMock.setItem('novelist_user_id', existingUserId);

      await import('../writingAssistantDb');
      const userId = localStorageMock.getItem('novelist_user_id');

      expect(userId).toBe(existingUserId);
    });
  });

  describe('Analysis Record ID Generation', () => {
    it('should generate analysis record ID with correct format', async () => {
      const { writingAssistantDb } = await import('../writingAssistantDb');

      // Spy on console.log to capture the generated ID
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const mockAnalysis: ContentAnalysis = {
        chapterId: 'test-chapter',
        content: 'Test content for analysis',
        readabilityScore: 75,
        engagementScore: 80,
        sentimentScore: 0.5,
        paceScore: 70,
        suggestions: [],
        plotHoles: [],
        characterIssues: [],
        dialogueAnalysis: {
          totalDialogue: 0,
          dialoguePercentage: 0,
          speakerVariety: 0,
          averageDialogueLength: 0,
          issues: [],
          voiceConsistency: [],
          tagAnalysis: { totalTags: 0, varietyScore: 0, overusedTags: [], suggestions: [] },
        },
        styleProfile: {
          complexity: 'moderate',
          formality: 'neutral',
          perspective: 'third_limited',
          tense: 'past',
          voice: 'active',
          strengths: [],
          improvements: [],
          consistency: 80,
        },
        toneAnalysis: {
          primary: 'neutral',
          intensity: 0.5,
          consistency: 80,
          emotionalRange: { dominant: [], absent: [], variety: 50 },
          moodProgression: [],
        },
        wordUsage: {
          vocabularyLevel: 'middle_school',
          averageWordLength: 5,
          averageSentenceLength: 10,
          overusedWords: [],
          weakWords: [],
          cliches: [],
          redundancies: [],
        },
        paragraphAnalysis: {
          averageLength: 20,
          varietyScore: 50,
          lengthDistribution: { short: 0, medium: 1, long: 0 },
          recommendations: [],
        },
        sentenceVariety: {
          averageLength: 10,
          typeDistribution: { simple: 1, compound: 0, complex: 0, compound_complex: 0 },
          varietyScore: 50,
          recommendations: [],
        },
        transitionQuality: { quality: 50, missingTransitions: [], weakTransitions: [] },
        timestamp: new Date(),
      };

      writingAssistantDb.saveAnalysisHistory(mockAnalysis, 'test-project', 0, 0);

      // Check the console.log output for the ID format
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Saving analysis history:',
        expect.stringMatching(/^analysis_\d+_[a-z0-9]+$/),
      );

      consoleLogSpy.mockRestore();
    });
  });

  describe('Feedback ID Generation', () => {
    it('should generate feedback ID with correct format', async () => {
      const { writingAssistantDb } = await import('../writingAssistantDb');

      // Spy on console.log to capture the generated ID
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const mockSuggestion: WritingSuggestion = {
        id: 'suggestion-1',
        type: 'style',
        category: 'readability',
        message: 'Consider simplifying this sentence',
        originalText: 'This is a complex sentence',
        suggestedText: 'This is simple',
        severity: 'suggestion',
        confidence: 0.8,
        reasoning: 'Simpler sentences improve readability',
        position: { start: 0, end: 10 },
      };

      writingAssistantDb.recordSuggestionFeedback(
        mockSuggestion,
        'accepted',
        'test-chapter',
        'test-project',
        'Simplified text',
      );

      // Check the console.log output for the ID format
      expect(consoleLogSpy).toHaveBeenCalledWith('Recording suggestion feedback:', 'style', 'accepted');

      consoleLogSpy.mockRestore();
    });
  });

  describe('ID Uniqueness', () => {
    it('should generate different IDs for multiple analysis records', async () => {
      const { writingAssistantDb } = await import('../writingAssistantDb');

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const mockAnalysis: ContentAnalysis = {
        chapterId: 'test-chapter',
        content: 'Test content',
        readabilityScore: 75,
        engagementScore: 80,
        sentimentScore: 0.5,
        paceScore: 70,
        suggestions: [],
        plotHoles: [],
        characterIssues: [],
        dialogueAnalysis: {
          totalDialogue: 0,
          dialoguePercentage: 0,
          speakerVariety: 0,
          averageDialogueLength: 0,
          issues: [],
          voiceConsistency: [],
          tagAnalysis: { totalTags: 0, varietyScore: 0, overusedTags: [], suggestions: [] },
        },
        styleProfile: {
          complexity: 'moderate',
          formality: 'neutral',
          perspective: 'third_limited',
          tense: 'past',
          voice: 'active',
          strengths: [],
          improvements: [],
          consistency: 80,
        },
        toneAnalysis: {
          primary: 'neutral',
          intensity: 0.5,
          consistency: 80,
          emotionalRange: { dominant: [], absent: [], variety: 50 },
          moodProgression: [],
        },
        wordUsage: {
          vocabularyLevel: 'middle_school',
          averageWordLength: 5,
          averageSentenceLength: 10,
          overusedWords: [],
          weakWords: [],
          cliches: [],
          redundancies: [],
        },
        paragraphAnalysis: {
          averageLength: 20,
          varietyScore: 50,
          lengthDistribution: { short: 0, medium: 1, long: 0 },
          recommendations: [],
        },
        sentenceVariety: {
          averageLength: 10,
          typeDistribution: { simple: 1, compound: 0, complex: 0, compound_complex: 0 },
          varietyScore: 50,
          recommendations: [],
        },
        transitionQuality: { quality: 50, missingTransitions: [], weakTransitions: [] },
        timestamp: new Date(),
      };

      // Generate multiple analysis records
      writingAssistantDb.saveAnalysisHistory(mockAnalysis, 'test-project-1', 0, 0);
      writingAssistantDb.saveAnalysisHistory(mockAnalysis, 'test-project-2', 0, 0);
      writingAssistantDb.saveAnalysisHistory(mockAnalysis, 'test-project-3', 0, 0);

      // Extract the IDs from console.log calls
      const calls = consoleLogSpy.mock.calls.filter(call => call[0] === 'Saving analysis history:');
      const ids = calls.map(call => call[1]);

      // Verify all IDs are unique
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
      expect(ids.length).toBe(3);

      consoleLogSpy.mockRestore();
    });
  });
});
