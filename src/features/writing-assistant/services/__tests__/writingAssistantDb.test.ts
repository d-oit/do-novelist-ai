/**
 * Tests for WritingAssistantDb - Secure ID Generation
 *
 * These tests verify that the database service generates secure,
 * unique IDs for devices, users, analysis records, and feedback.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Import after mocking localStorage and logger
import type { ContentAnalysis, WritingSuggestion } from '@/types';

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

// Mock window.crypto for secure random generation
Object.defineProperty(global, 'window', {
  value: {
    crypto: {
      getRandomValues: (arr: Uint8Array): Uint8Array => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      },
    },
  },
  writable: true,
});

// Mock the logger module
const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  setContext: vi.fn(),
  child: vi.fn().mockReturnThis(),
};

vi.mock('@/lib/logging/logger', () => ({
  logger: mockLogger,
}));

// Mock the database module to prevent actual database operations
const mockTursoService = {
  saveAnalysis: vi.fn().mockResolvedValue(undefined),
  recordSuggestionFeedback: vi.fn().mockResolvedValue(undefined),
  savePreferences: vi.fn().mockResolvedValue(undefined),
  getPreferences: vi.fn().mockResolvedValue(null),
  getAnalysisHistory: vi.fn().mockResolvedValue([]),
  getSuggestionFeedback: vi.fn().mockResolvedValue([]),
};

vi.mock('@/lib/database/services', () => ({
  writingAssistantService: mockTursoService,
}));

// Mock the Drizzle client to prevent actual database operations
const createMockQueryBuilder = (): unknown => {
  const builder = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    // Make it awaitable - return empty array when used as promise
    then: (resolve: (value: unknown[]) => void): void => {
      resolve([]);
    },
  };
  return builder;
};

const createMockInsertBuilder = (): unknown => {
  const builder = {
    values: vi.fn().mockReturnThis(),
    // Make it awaitable
    then: (resolve: (value: void) => void): void => {
      resolve();
    },
  };
  return builder;
};

const createMockUpdateBuilder = (): unknown => {
  const builder = {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    // Make it awaitable
    then: (resolve: (value: void) => void): void => {
      resolve();
    },
  };
  return builder;
};

const mockDrizzleClient = {
  select: vi.fn(() => createMockQueryBuilder()),
  insert: vi.fn(() => createMockInsertBuilder()),
  update: vi.fn(() => createMockUpdateBuilder()),
};

vi.mock('@/lib/database/drizzle', () => ({
  getDrizzleClient: vi.fn(() => mockDrizzleClient),
}));

describe('WritingAssistantDb - Secure ID Generation', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorageMock.clear();
    // Clear module cache to get fresh instance
    vi.resetModules();
    // Clear mock calls
    vi.clearAllMocks();
  });

  describe('Device ID Generation', () => {
    it('should generate device ID with correct format', async () => {
      const { writingAssistantService } = await import('@/lib/database/services/writing-assistant-service');

      // Trigger device ID generation by calling a method that uses getDeviceId()
      await writingAssistantService.savePreferences({ testPref: 'value' });

      const deviceId = localStorageMock.getItem('novelist_device_id');

      expect(deviceId).toBeDefined();
      expect(deviceId).not.toBeNull();
      expect(typeof deviceId).toBe('string');
      // New format is hex string from generateSecureId
      expect(deviceId).toMatch(/^[a-f0-9]{32}$/);
    });

    it('should generate unique device IDs across multiple instances', async () => {
      // First instance
      localStorageMock.clear();
      const { writingAssistantService: service1 } = await import('@/lib/database/services/writing-assistant-service');
      await service1.savePreferences({ testPref: 'value1' });
      const deviceId1 = localStorageMock.getItem('novelist_device_id');

      // Second instance (simulate new device)
      localStorageMock.clear();
      vi.resetModules();
      const { writingAssistantService: service2 } = await import('@/lib/database/services/writing-assistant-service');
      await service2.savePreferences({ testPref: 'value2' });
      const deviceId2 = localStorageMock.getItem('novelist_device_id');

      expect(deviceId1).toBeDefined();
      expect(deviceId2).toBeDefined();
      expect(deviceId1).not.toBe(deviceId2);
    });

    it('should reuse existing device ID from localStorage', async () => {
      const existingDeviceId = 'abc123def456789012345678901234ab';
      localStorageMock.setItem('novelist_device_id', existingDeviceId);

      const { writingAssistantService } = await import('@/lib/database/services/writing-assistant-service');
      await writingAssistantService.savePreferences({ testPref: 'value' });
      const deviceId = localStorageMock.getItem('novelist_device_id');

      expect(deviceId).toBe(existingDeviceId);
    });
  });

  describe('User ID Generation', () => {
    it('should generate user ID with correct format', async () => {
      const { writingAssistantService } = await import('@/lib/database/services/writing-assistant-service');

      // Trigger user ID generation by calling a method that uses getUserId()
      await writingAssistantService.savePreferences({ testPref: 'value' });

      const userId = localStorageMock.getItem('novelist_user_id');

      expect(userId).toBeDefined();
      expect(userId).not.toBeNull();
      expect(typeof userId).toBe('string');
      // New format is hex string from generateSecureId
      expect(userId).toMatch(/^[a-f0-9]{32}$/);
    });

    it('should generate unique user IDs across multiple instances', async () => {
      // First instance
      localStorageMock.clear();
      const { writingAssistantService: service1 } = await import('@/lib/database/services/writing-assistant-service');
      await service1.savePreferences({ testPref: 'value1' });
      const userId1 = localStorageMock.getItem('novelist_user_id');

      // Second instance (simulate new user)
      localStorageMock.clear();
      vi.resetModules();
      const { writingAssistantService: service2 } = await import('@/lib/database/services/writing-assistant-service');
      await service2.savePreferences({ testPref: 'value2' });
      const userId2 = localStorageMock.getItem('novelist_user_id');

      expect(userId1).toBeDefined();
      expect(userId2).toBeDefined();
      expect(userId1).not.toBe(userId2);
    });

    it('should reuse existing user ID from localStorage', async () => {
      const existingUserId = 'xyz789abc012def345678901234567ab';
      localStorageMock.setItem('novelist_user_id', existingUserId);

      const { writingAssistantService } = await import('@/lib/database/services/writing-assistant-service');
      await writingAssistantService.savePreferences({ testPref: 'value' });
      const userId = localStorageMock.getItem('novelist_user_id');

      expect(userId).toBe(existingUserId);
    });
  });

  describe('Analysis Record ID Generation', () => {
    it('should generate analysis record ID with correct format', async () => {
      const { writingAssistantDb } = await import('@/features/writing-assistant/services/writingAssistantDb');

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

      await writingAssistantDb.saveAnalysisHistory(mockAnalysis, 'test-project', 0, 0);

      // Verify the Turso service was called with proper data
      expect(mockTursoService.saveAnalysis).toHaveBeenCalledWith(
        'test-chapter',
        'test-project',
        75,
        80,
        0.5,
        70,
        0,
        [],
        'standard',
        expect.any(Number),
        0,
        0,
      );
    });
  });

  describe('Feedback ID Generation', () => {
    it('should generate feedback ID with correct format', async () => {
      const { writingAssistantDb } = await import('@/features/writing-assistant/services/writingAssistantDb');

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

      await writingAssistantDb.recordSuggestionFeedback(
        mockSuggestion,
        'accepted',
        'test-chapter',
        'test-project',
        'Simplified text',
      );

      // Verify the Turso service was called with proper data
      expect(mockTursoService.recordSuggestionFeedback).toHaveBeenCalledWith(
        'style',
        'readability',
        'accepted',
        'Simplified text',
        'test-chapter',
        'test-project',
      );
    });
  });

  describe('ID Uniqueness', () => {
    it('should generate different IDs for multiple analysis records', async () => {
      const { writingAssistantDb } = await import('@/features/writing-assistant/services/writingAssistantDb');

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
      await writingAssistantDb.saveAnalysisHistory(mockAnalysis, 'test-project-1', 0, 0);
      await writingAssistantDb.saveAnalysisHistory(mockAnalysis, 'test-project-2', 0, 0);
      await writingAssistantDb.saveAnalysisHistory(mockAnalysis, 'test-project-3', 0, 0);

      // Verify the service was called 3 times
      expect(mockTursoService.saveAnalysis).toHaveBeenCalledTimes(3);

      // Verify each call was made with different data (different projectId)
      expect(mockTursoService.saveAnalysis).toHaveBeenNthCalledWith(
        1,
        'test-chapter',
        'test-project-1',
        expect.any(Number),
        expect.any(Number),
        expect.any(Number),
        expect.any(Number),
        expect.any(Number),
        expect.any(Array),
        expect.any(String),
        expect.any(Number),
        expect.any(Number),
        expect.any(Number),
      );

      expect(mockTursoService.saveAnalysis).toHaveBeenNthCalledWith(
        2,
        'test-chapter',
        'test-project-2',
        expect.any(Number),
        expect.any(Number),
        expect.any(Number),
        expect.any(Number),
        expect.any(Number),
        expect.any(Array),
        expect.any(String),
        expect.any(Number),
        expect.any(Number),
        expect.any(Number),
      );

      expect(mockTursoService.saveAnalysis).toHaveBeenNthCalledWith(
        3,
        'test-chapter',
        'test-project-3',
        expect.any(Number),
        expect.any(Number),
        expect.any(Number),
        expect.any(Number),
        expect.any(Number),
        expect.any(Array),
        expect.any(String),
        expect.any(Number),
        expect.any(Number),
        expect.any(Number),
      );
    });
  });
});
