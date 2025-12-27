/**
 * Tests for GoalsService
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock logger to avoid noisy output and to ensure no console usage
vi.mock('@/lib/logging/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock styleAnalysisService since GoalsService depends on it for other metrics
vi.mock('@/features/writing-assistant/services/styleAnalysisService', () => ({
  styleAnalysisService: {
    analyzeStyle: vi.fn(() => ({
      fleschReadingEase: 70,
      fleschKincaidGrade: 8,
      primaryTone: 'neutral',
      toneIntensity: 50,
      voiceType: 'active',
      perspective: 'third_limited',
    })),
  },
}));

// Minimal localStorage mock used by GoalsService persistence
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

describe('goalsService', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('calculates vocabulary diversity progress (type-token ratio)', async () => {
    const { goalsService } = await import('@/features/writing-assistant/services/goalsService');

    goalsService.clearAllGoals();

    const goal = goalsService.createGoal({
      name: 'Vocab diversity',
      description: 'Keep vocab diverse',
      isActive: true,
      isTemplate: false,
      targetVocabulary: {
        minVocabularyDiversity: 0.5,
      },
    });

    // 4 words total, 2 unique => 0.5
    const progress = goalsService.calculateGoalProgress('hello hello world world', goal);

    const metric = progress.metrics.find(m => m.metricKey === 'vocabularyDiversity');
    expect(metric).toBeDefined();
    expect(metric?.currentValue).toBe(50);
    expect(metric?.targetValue).toBe(50);
    expect(metric?.status).toBe('achieved');
  });
});
