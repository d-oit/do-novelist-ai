/**
 * Writing Assistant Hook
 * Manages writing assistant state and provides analysis functionality
 */

import { useState, useEffect, useCallback, useRef } from 'react';

import { type Character } from '@/features/characters/types';
import { writingAssistantDb } from '@/features/writing-assistant/services/writingAssistantDb';
import { writingAssistantService } from '@/features/writing-assistant/services/writingAssistantService';
import { DEFAULT_WRITING_ASSISTANT_CONFIG } from '@/features/writing-assistant/types';
import {
  type WritingAssistantState,
  type WritingAssistantActions,
  type WritingAssistantConfig,
  type ContentAnalysis,
  type WritingSuggestion,
  type WritingSuggestionCategory,
  type WritingProgressMetrics,
} from '@/features/writing-assistant/types';
import { logger } from '@/lib/logging/logger';

import {
  groupSuggestionsByCategory,
  calculateAnalysisStats,
  calculateAcceptanceRate,
  generateLearningInsights,
} from './useWritingAssistant.utils';

interface UseWritingAssistantOptions {
  autoAnalyze?: boolean;
  analysisDelay?: number;
  chapterId?: string;
  projectId?: string;
  characterContext?: Character[];
  plotContext?: string;
  enablePersistence?: boolean;
  onContentChange?: (newContent: string, suggestionId: string) => void;
}

interface UseWritingAssistantReturn extends WritingAssistantState, WritingAssistantActions {
  suggestionsByCategory: Record<WritingSuggestionCategory | 'all', WritingSuggestion[]>;
  filteredSuggestions: WritingSuggestion[];
  analysisStats: {
    totalSuggestions: number;
    highPrioritySuggestions: number;
    avgConfidence: number;
    topCategories: { category: WritingSuggestionCategory; count: number }[];
  };
  isAnalyzing: boolean;
  isAnalyzingLocal: boolean;
  lastAnalyzedAt?: Date;
  analysisError?: string;
  getWritingAnalytics: (timeRange?: 'week' | 'month' | 'year') => {
    progressMetrics: WritingProgressMetrics[];
    improvementTrends: {
      readabilityTrend: number;
      engagementTrend: number;
      productivityTrend: number;
    };
    suggestionInsights: {
      mostHelpfulCategories: string[];
      acceptanceRate: number;
      commonPatterns: string[];
    };
  };
  suggestionAcceptanceRate: number;
  learningInsights: {
    preferredCategories: string[];
    improvementTrends: Record<string, number>;
    writingHabits: {
      analysisFrequency: string;
      preferredAnalysisTime: string;
      mostActiveCategories: string[];
    };
  };
}

export function useWritingAssistant(
  content = '',
  options: UseWritingAssistantOptions = {},
): UseWritingAssistantReturn {
  const {
    autoAnalyze = true,
    chapterId = '',
    projectId = '',
    characterContext = [],
    plotContext = '',
    enablePersistence = true,
    onContentChange,
  } = options;

  // Core state
  const [state, setState] = useState<WritingAssistantState>({
    isActive: false,
    isAnalyzing: false,
    suggestions: [],
    config: DEFAULT_WRITING_ASSISTANT_CONFIG,
    showSuggestions: true,
    filterBy: 'all',
    sortBy: 'severity',
  });

  const [isAnalyzingLocal, setIsAnalyzingLocal] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<ContentAnalysis | undefined>();
  const [lastAnalyzedAt, setLastAnalyzedAt] = useState<Date>();
  const [analysisError, setAnalysisError] = useState<string>();

  // Refs
  const lastContentRef = useRef<string>('');
  const appliedSuggestions = useRef<Set<string>>(new Set());
  const dismissedSuggestions = useRef<Set<string>>(new Set());
  const suggestionInteractions = useRef<
    Map<string, { action: 'applied' | 'dismissed' | 'viewed'; timestamp: Date }>
  >(new Map());
  const localAnalysisTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const aiAnalysisTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Configuration management
  useEffect(() => {
    const loadConfiguration = () => {
      try {
        const localConfig = localStorage.getItem('novelist_writing_assistant_config');
        const isActive = localStorage.getItem('novelist_writing_assistant_active') === 'true';

        if (localConfig != null) {
          const config = JSON.parse(localConfig) as Partial<WritingAssistantConfig>;
          setState(prev => ({
            ...prev,
            config: { ...DEFAULT_WRITING_ASSISTANT_CONFIG, ...config },
            isActive,
          }));
        } else {
          setState(prev => ({ ...prev, isActive }));
        }

        // Background DB sync
        if (enablePersistence) {
          try {
            const dbConfig = writingAssistantDb.loadPreferences();
            if (dbConfig != null && localConfig == null) {
              setState(prev => ({
                ...prev,
                config: { ...DEFAULT_WRITING_ASSISTANT_CONFIG, ...dbConfig },
              }));
              localStorage.setItem('novelist_writing_assistant_config', JSON.stringify(dbConfig));
            }
          } catch (error) {
            logger.warn('Failed to load preferences from database', {
              component: 'useWritingAssistant',
              error,
            });
          }
        }
      } catch (error) {
        logger.error('Failed to load writing assistant config', {
          component: 'useWritingAssistant',
          error,
        });
        setState(prev => ({
          ...prev,
          config: DEFAULT_WRITING_ASSISTANT_CONFIG,
          isActive: false,
        }));
      }
    };

    void loadConfiguration();
  }, [enablePersistence]);

  const saveConfig = useCallback(
    (config: WritingAssistantConfig) => {
      try {
        localStorage.setItem('novelist_writing_assistant_config', JSON.stringify(config));
        if (enablePersistence) {
          try {
            writingAssistantDb.syncPreferences(config);
          } catch (error) {
            logger.warn('Failed to sync preferences to database', {
              component: 'useWritingAssistant',
              error,
            });
          }
        }
      } catch (error) {
        logger.error('Failed to save writing assistant config', {
          component: 'useWritingAssistant',
          error,
        });
      }
    },
    [enablePersistence],
  );

  // Core analysis functions
  const analyzeContent = useCallback(
    async (contentToAnalyze: string = content) => {
      if (!contentToAnalyze.trim() || !state.isActive) return;

      setState(prev => ({ ...prev, isAnalyzing: true }));
      setAnalysisError(undefined);

      try {
        const analysis = await writingAssistantService.analyzeContent(
          contentToAnalyze,
          chapterId,
          state.config,
          characterContext,
          plotContext,
        );

        setCurrentAnalysis(analysis);
        setState(prev => ({
          ...prev,
          suggestions: analysis.suggestions,
          isAnalyzing: false,
        }));
        setLastAnalyzedAt(new Date());

        // Background persistence
        if (enablePersistence && projectId) {
          try {
            writingAssistantDb.saveAnalysisHistory(
              analysis,
              projectId,
              appliedSuggestions.current.size,
              dismissedSuggestions.current.size,
            );
          } catch (error) {
            logger.warn('Failed to save analysis history', {
              component: 'useWritingAssistant',
              error,
            });
          }
        }

        // Track interactions
        analysis.suggestions.forEach(suggestion => {
          suggestionInteractions.current.set(suggestion.id, {
            action: 'viewed',
            timestamp: new Date(),
          });
        });
      } catch (error) {
        logger.error('Analysis failed', { component: 'useWritingAssistant', error });
        setAnalysisError(error instanceof Error ? error.message : 'Analysis failed');
        setState(prev => ({ ...prev, isAnalyzing: false }));
      }
    },
    [
      content,
      chapterId,
      state.isActive,
      state.config,
      characterContext,
      plotContext,
      enablePersistence,
      projectId,
    ],
  );

  const analyzeLocal = useCallback(
    (contentToAnalyze: string = content) => {
      if (!contentToAnalyze.trim() || !state.isActive) return;

      setIsAnalyzingLocal(true);
      try {
        const localMetrics = writingAssistantService.analyzeLocalMetrics(
          contentToAnalyze,
          state.config,
        );
        setCurrentAnalysis(
          prev =>
            ({
              ...prev,
              chapterId,
              content: contentToAnalyze,
              timestamp: new Date(),
              ...localMetrics,
              suggestions: prev?.suggestions || [],
              plotHoles: prev?.plotHoles || [],
              characterIssues: prev?.characterIssues || [],
              dialogueAnalysis: prev?.dialogueAnalysis || {
                totalDialogue: 0,
                dialoguePercentage: 0,
                speakerVariety: 0,
                averageDialogueLength: 0,
                issues: [],
                voiceConsistency: [],
                tagAnalysis: { totalTags: 0, varietyScore: 0, overusedTags: [], suggestions: [] },
              },
            }) as ContentAnalysis,
        );
      } finally {
        setIsAnalyzingLocal(false);
      }
    },
    [content, state.isActive, state.config, chapterId],
  );

  const debouncedAnalyze = useCallback(
    (contentToAnalyze: string) => {
      // Local analysis
      if (localAnalysisTimeoutRef.current) {
        clearTimeout(localAnalysisTimeoutRef.current);
      }
      localAnalysisTimeoutRef.current = setTimeout(() => {
        if (state.config.enableRealTimeAnalysis) {
          analyzeLocal(contentToAnalyze);
        }
      }, 300);

      // AI analysis
      if (aiAnalysisTimeoutRef.current) {
        clearTimeout(aiAnalysisTimeoutRef.current);
      }
      aiAnalysisTimeoutRef.current = setTimeout(
        () => {
          if (contentToAnalyze !== lastContentRef.current && state.config.enableRealTimeAnalysis) {
            void analyzeContent(contentToAnalyze);
            lastContentRef.current = contentToAnalyze;
          }
        },
        Math.max(state.config.analysisDelay, 2000),
      );
    },
    [analyzeLocal, analyzeContent, state.config.enableRealTimeAnalysis, state.config.analysisDelay],
  );

  // Auto-analysis effect
  useEffect(() => {
    if (autoAnalyze && content && state.isActive && content !== lastContentRef.current) {
      debouncedAnalyze(content);
    }
    return () => {
      if (localAnalysisTimeoutRef.current) {
        clearTimeout(localAnalysisTimeoutRef.current);
      }
      if (aiAnalysisTimeoutRef.current) {
        clearTimeout(aiAnalysisTimeoutRef.current);
      }
    };
  }, [content, autoAnalyze, state.isActive, debouncedAnalyze]);

  // Action functions
  const toggleAssistant = useCallback(() => {
    setState(prev => {
      const newIsActive = !prev.isActive;
      localStorage.setItem('novelist_writing_assistant_active', newIsActive.toString());
      return { ...prev, isActive: newIsActive };
    });
  }, []);

  const applySuggestion = useCallback(
    (suggestionId: string) => {
      const suggestion = state.suggestions.find(s => s.id === suggestionId);
      if (!suggestion) return;

      appliedSuggestions.current.add(suggestionId);
      setState(prev => ({
        ...prev,
        suggestions: prev.suggestions.filter(s => s.id !== suggestionId),
      }));

      suggestionInteractions.current.set(suggestionId, {
        action: 'applied',
        timestamp: new Date(),
      });

      // Background persistence
      if (enablePersistence && projectId && chapterId) {
        try {
          writingAssistantDb.recordSuggestionFeedback(
            suggestion,
            'accepted',
            chapterId,
            projectId,
            suggestion.suggestedText,
          );
        } catch (error) {
          logger.warn('Failed to record suggestion feedback', {
            component: 'useWritingAssistant',
            error,
            suggestionId,
          });
        }
      }

      // Apply text change
      if (
        onContentChange &&
        suggestion.originalText &&
        suggestion.suggestedText &&
        suggestion.originalText !== '' &&
        suggestion.suggestedText !== ''
      ) {
        const newContent = content.replace(suggestion.originalText, suggestion.suggestedText);
        onContentChange(newContent, suggestionId);
      }
    },
    [state.suggestions, enablePersistence, projectId, chapterId, onContentChange, content],
  );

  const dismissSuggestion = useCallback(
    (suggestionId: string) => {
      const suggestion = state.suggestions.find(s => s.id === suggestionId);
      if (!suggestion) return;

      dismissedSuggestions.current.add(suggestionId);
      setState(prev => ({
        ...prev,
        suggestions: prev.suggestions.filter(s => s.id !== suggestionId),
      }));

      suggestionInteractions.current.set(suggestionId, {
        action: 'dismissed',
        timestamp: new Date(),
      });

      if (enablePersistence && projectId && chapterId) {
        try {
          writingAssistantDb.recordSuggestionFeedback(
            suggestion,
            'dismissed',
            chapterId,
            projectId,
          );
        } catch (error) {
          logger.warn('Failed to record suggestion feedback', {
            component: 'useWritingAssistant',
            error,
            suggestionId,
          });
        }
      }
    },
    [state.suggestions, enablePersistence, projectId, chapterId],
  );

  const updateConfig = useCallback(
    (configUpdate: Partial<WritingAssistantConfig>) => {
      setState(prev => {
        const newConfig = { ...prev.config, ...configUpdate };
        saveConfig(newConfig);
        return { ...prev, config: newConfig };
      });
    },
    [saveConfig],
  );

  const selectSuggestion = useCallback((suggestionId: string) => {
    setState(prev => ({ ...prev, selectedSuggestion: suggestionId }));
  }, []);

  const toggleSuggestions = useCallback(() => {
    setState(prev => ({ ...prev, showSuggestions: !prev.showSuggestions }));
  }, []);

  const filterSuggestions = useCallback((category: WritingSuggestionCategory | 'all') => {
    setState(prev => ({ ...prev, filterBy: category }));
  }, []);

  const sortSuggestions = useCallback((sortBy: WritingAssistantState['sortBy']) => {
    setState(prev => ({ ...prev, sortBy }));
  }, []);

  const getWritingAnalytics = useCallback(
    (timeRange: 'week' | 'month' | 'year' = 'month') => {
      if (!enablePersistence || !projectId) {
        return {
          progressMetrics: [],
          improvementTrends: { readabilityTrend: 0, engagementTrend: 0, productivityTrend: 0 },
          suggestionInsights: { mostHelpfulCategories: [], acceptanceRate: 0, commonPatterns: [] },
        };
      }

      try {
        return writingAssistantDb.getWritingAnalytics(projectId, timeRange);
      } catch (error) {
        logger.error('Failed to get writing analytics', {
          component: 'useWritingAssistant',
          error,
          projectId,
          timeRange,
        });
        return {
          progressMetrics: [],
          improvementTrends: { readabilityTrend: 0, engagementTrend: 0, productivityTrend: 0 },
          suggestionInsights: { mostHelpfulCategories: [], acceptanceRate: 0, commonPatterns: [] },
        };
      }
    },
    [enablePersistence, projectId],
  );

  // Computed values
  const suggestionsByCategory = groupSuggestionsByCategory(state.suggestions);
  const filteredSuggestions =
    state.filterBy === 'all' ? state.suggestions : (suggestionsByCategory[state.filterBy] ?? []);
  const sortedSuggestions = filteredSuggestions.sort((a, b) => {
    switch (state.sortBy) {
      case 'severity':
        const severityOrder = { error: 4, warning: 3, suggestion: 2, info: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      case 'type':
        return a.type.localeCompare(b.type);
      case 'position':
        return a.position.start - b.position.start;
      case 'confidence':
        return b.confidence - a.confidence;
      default:
        return 0;
    }
  });
  const analysisStats = calculateAnalysisStats(state.suggestions);
  const suggestionAcceptanceRate = calculateAcceptanceRate(
    appliedSuggestions.current,
    dismissedSuggestions.current,
  );
  const learningInsights = generateLearningInsights(
    state.suggestions,
    suggestionInteractions.current,
    currentAnalysis,
    analysisStats,
  );

  return {
    // State
    ...state,
    currentAnalysis,

    // Actions
    toggleAssistant,
    analyzeContent,
    applySuggestion,
    dismissSuggestion,
    updateConfig,
    selectSuggestion,
    toggleSuggestions,
    filterSuggestions,
    sortSuggestions,

    // Computed properties
    suggestionsByCategory,
    filteredSuggestions: sortedSuggestions,
    analysisStats,

    // Status
    lastAnalyzedAt,
    analysisError,
    isAnalyzingLocal,

    // Analytics and insights
    getWritingAnalytics,
    suggestionAcceptanceRate,
    learningInsights,
  };
}

export default useWritingAssistant;
