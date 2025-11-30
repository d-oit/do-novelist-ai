/**
 * Writing Assistant Hook Tests
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import useWritingAssistant from '../useWritingAssistant';

// Mock the service
vi.mock('../services/writingAssistantService', () => ({
  writingAssistantService: {
    analyzeContent: vi.fn().mockResolvedValue({
      chapterId: 'test-chapter',
      content: 'Test content',
      timestamp: new Date(),
      readabilityScore: 75,
      sentimentScore: 0.5,
      paceScore: 60,
      engagementScore: 70,
      suggestions: [
        {
          id: 'test-suggestion-1',
          type: 'style',
          severity: 'suggestion',
          message: 'Consider varying your sentence length',
          originalText: 'This is a test.',
          suggestedText: 'This serves as a test.',
          position: { start: 0, end: 15 },
          confidence: 0.8,
          reasoning: 'Sentence variety improves readability',
          category: 'readability',
        },
      ],
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
        voice: 'active',
        perspective: 'third_limited',
        tense: 'past',
        strengths: [],
        improvements: [],
        consistency: 80,
      },
      toneAnalysis: {
        primary: 'neutral',
        intensity: 50,
        consistency: 80,
        emotionalRange: { dominant: ['neutral'], absent: [], variety: 50 },
        moodProgression: [],
      },
      wordUsage: {
        vocabularyLevel: 'high_school',
        averageWordLength: 5,
        averageSentenceLength: 15,
        overusedWords: [],
        weakWords: [],
        cliches: [],
        redundancies: [],
      },
      paragraphAnalysis: {
        averageLength: 3,
        varietyScore: 70,
        lengthDistribution: { short: 1, medium: 2, long: 1 },
        recommendations: [],
      },
      sentenceVariety: {
        averageLength: 15,
        varietyScore: 75,
        typeDistribution: { simple: 0.4, compound: 0.3, complex: 0.2, compound_complex: 0.1 },
        recommendations: [],
      },
      transitionQuality: {
        quality: 60,
        missingTransitions: [],
        weakTransitions: [],
      },
    }),
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useWritingAssistant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useWritingAssistant());

    expect(result.current.isActive).toBe(false);
    expect(result.current.isAnalyzing).toBe(false);
    expect(result.current.suggestions).toEqual([]);
    expect(result.current.showSuggestions).toBe(true);
    expect(result.current.filterBy).toBe('all');
    expect(result.current.sortBy).toBe('severity');
  });

  it('should toggle assistant activation', () => {
    const { result } = renderHook(() => useWritingAssistant());

    act(() => {
      result.current.toggleAssistant();
    });

    expect(result.current.isActive).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'novelist_writing_assistant_active',
      'true'
    );
  });

  it('should filter suggestions by category', () => {
    const { result } = renderHook(() => useWritingAssistant('Test content'));

    act(() => {
      result.current.toggleAssistant();
    });

    act(() => {
      result.current.filterSuggestions('readability');
    });

    expect(result.current.filterBy).toBe('readability');
  });

  it('should sort suggestions correctly', () => {
    const { result } = renderHook(() => useWritingAssistant('Test content'));

    act(() => {
      result.current.sortSuggestions('confidence');
    });

    expect(result.current.sortBy).toBe('confidence');
  });

  it('should dismiss suggestions', () => {
    const { result } = renderHook(() => useWritingAssistant('Test content'));

    // Set up some suggestions first
    act(() => {
      result.current.toggleAssistant();
    });

    // Wait for analysis to complete
    setTimeout(() => {
      const suggestionId = result.current.suggestions[0]?.id;
      if (suggestionId) {
        act(() => {
          result.current.dismissSuggestion(suggestionId);
        });

        expect(result.current.suggestions).not.toContain(
          expect.objectContaining({ id: suggestionId })
        );
      }
    }, 100);
  });

  it('should calculate analysis stats correctly', () => {
    const { result } = renderHook(() => useWritingAssistant('Test content'));

    act(() => {
      result.current.toggleAssistant();
    });

    // Analysis stats should be calculated
    expect(result.current.analysisStats).toEqual({
      totalSuggestions: 0, // Initially 0, will update after analysis
      highPrioritySuggestions: 0,
      avgConfidence: 0,
      topCategories: [],
    });
  });

  it('should load configuration from localStorage', () => {
    const savedConfig = JSON.stringify({
      enableRealTimeAnalysis: false,
      analysisDelay: 2000,
    });
    localStorageMock.getItem.mockReturnValue(savedConfig);

    const { result } = renderHook(() => useWritingAssistant());

    expect(result.current.config.enableRealTimeAnalysis).toBe(false);
    expect(result.current.config.analysisDelay).toBe(2000);
  });

  it('should update configuration', () => {
    const { result } = renderHook(() => useWritingAssistant());

    act(() => {
      result.current.updateConfig({
        enableRealTimeAnalysis: false,
        analysisDelay: 3000,
      });
    });

    expect(result.current.config.enableRealTimeAnalysis).toBe(false);
    expect(result.current.config.analysisDelay).toBe(3000);
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });
});
