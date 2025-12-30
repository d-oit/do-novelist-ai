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

interface UseWritingAssistantOptions {
  autoAnalyze?: boolean;
  analysisDelay?: number;
  chapterId?: string;
  projectId?: string;
  characterContext?: Character[];
  plotContext?: string;
  enablePersistence?: boolean; // Whether to save analysis to database
  onContentChange?: (newContent: string, suggestionId: string) => void; // Callback to apply text changes to editor
}

interface UseWritingAssistantReturn extends WritingAssistantState, WritingAssistantActions {
  // Additional computed properties
  suggestionsByCategory: Record<WritingSuggestionCategory | 'all', WritingSuggestion[]>;
  filteredSuggestions: WritingSuggestion[];
  analysisStats: {
    totalSuggestions: number;
    highPrioritySuggestions: number;
    avgConfidence: number;
    topCategories: { category: WritingSuggestionCategory; count: number }[];
  };

  // Status
  isAnalyzing: boolean;
  isAnalyzingLocal: boolean;
  lastAnalyzedAt?: Date;
  analysisError?: string;

  // Analytics and insights
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
    isAnalyzing: false, // This will now represent "deep" (AI) analysis
    suggestions: [],
    config: DEFAULT_WRITING_ASSISTANT_CONFIG,
    showSuggestions: true,
    filterBy: 'all',
    sortBy: 'severity',
  });

  const [isAnalyzingLocal, setIsAnalyzingLocal] = useState(false);

  // Analysis state
  const [currentAnalysis, setCurrentAnalysis] = useState<ContentAnalysis | undefined>();
  const [lastAnalyzedAt, setLastAnalyzedAt] = useState<Date>();
  const [analysisError, setAnalysisError] = useState<string>();

  // Refs for debouncing and tracking
  const lastContentRef = useRef<string>('');

  // Track suggestion interactions for learning
  const appliedSuggestions = useRef<Set<string>>(new Set());
  const dismissedSuggestions = useRef<Set<string>>(new Set());
  const suggestionInteractions = useRef<
    Map<string, { action: 'applied' | 'dismissed' | 'viewed'; timestamp: Date }>
  >(new Map());

  /**
   * Load configuration with hybrid approach: localStorage first, then DB fallback
   */
  useEffect(() => {
    const loadConfiguration = (): void => {
      try {
        // Fast path: Load from localStorage first for immediate UI response
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

        // Background: Attempt to load from database for cross-device sync
        if (enablePersistence) {
          try {
            const dbConfig = writingAssistantDb.loadPreferences();
            if (dbConfig != null && localConfig == null) {
              // Only use DB config if we don't have local config
              setState(prev => ({
                ...prev,
                config: { ...DEFAULT_WRITING_ASSISTANT_CONFIG, ...dbConfig },
              }));
              // Cache to localStorage for future fast access
              localStorage.setItem('novelist_writing_assistant_config', JSON.stringify(dbConfig));
            }
          } catch (error) {
            logger.warn('Failed to load preferences from database', {
              component: 'useWritingAssistant',
              error,
            });
            // Gracefully continue with localStorage config
          }
        }
      } catch (error) {
        logger.error('Failed to load writing assistant config', {
          component: 'useWritingAssistant',
          error,
        });
        // Fallback to default config
        setState(prev => ({
          ...prev,
          config: DEFAULT_WRITING_ASSISTANT_CONFIG,
          isActive: false,
        }));
      }
    };

    void loadConfiguration();
  }, [enablePersistence]);

  /**
   * Save configuration with hybrid approach: localStorage + optional DB sync
   */
  const saveConfig = useCallback(
    (config: WritingAssistantConfig) => {
      try {
        // Immediate save to localStorage for instant UI response
        localStorage.setItem('novelist_writing_assistant_config', JSON.stringify(config));

        // Background sync to database for cross-device persistence
        if (enablePersistence) {
          try {
            writingAssistantDb.syncPreferences(config);
          } catch (error) {
            logger.warn('Failed to sync preferences to database', {
              component: 'useWritingAssistant',
              error,
            });
            // Continue gracefully - localStorage save still worked
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

  /**
   * Toggle writing assistant on/off
   */
  const toggleAssistant = useCallback(() => {
    setState(prev => {
      const newIsActive = !prev.isActive;
      localStorage.setItem('novelist_writing_assistant_active', newIsActive.toString());
      return { ...prev, isActive: newIsActive };
    });
  }, []);

  /**
   * Analyze content with hybrid persistence: immediate analysis + background DB saving
   */
  const analyzeContent = useCallback(
    async (
      contentToAnalyze: string = content,
      targetChapterId: string = chapterId,
    ): Promise<void> => {
      if (!contentToAnalyze.trim() || !state.isActive) return;

      setState(prev => ({ ...prev, isAnalyzing: true }));
      setAnalysisError(undefined);

      try {
        // Run the analysis
        const analysis = await writingAssistantService.analyzeContent(
          contentToAnalyze,
          targetChapterId,
          state.config,
          characterContext,
          plotContext,
        );

        // Immediately update UI state
        setCurrentAnalysis(analysis);
        setState(prev => ({
          ...prev,
          suggestions: analysis.suggestions,
          isAnalyzing: false,
        }));
        setLastAnalyzedAt(new Date());

        // Background: Save analysis to database for historical tracking
        if (enablePersistence && projectId) {
          try {
            const acceptedCount = appliedSuggestions.current.size;
            const dismissedCount = dismissedSuggestions.current.size;

            writingAssistantDb.saveAnalysisHistory(
              analysis,
              projectId,
              acceptedCount,
              dismissedCount,
            );
          } catch (error) {
            logger.warn('Failed to save analysis history', {
              component: 'useWritingAssistant',
              error,
            });
            // Continue gracefully - analysis still worked
          }
        }

        // Track suggestion views for learning
        analysis.suggestions.forEach(suggestion => {
          suggestionInteractions.current.set(suggestion.id, {
            action: 'viewed',
            timestamp: new Date(),
          });
        });

        // Ensure the function returns a Promise
        await Promise.resolve();
      } catch (error) {
        logger.error('Analysis failed', {
          component: 'useWritingAssistant',
          error,
        });
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

  /**
   * Fast local analysis for immediate feedback
   */
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

  const localAnalysisTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const aiAnalysisTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  /**
   * Debounced content analysis
   */
  const debouncedAnalyze = useCallback(
    (contentToAnalyze: string) => {
      // Local analysis - fast cycle
      if (localAnalysisTimeoutRef.current) {
        clearTimeout(localAnalysisTimeoutRef.current);
      }
      localAnalysisTimeoutRef.current = setTimeout(() => {
        if (state.config.enableRealTimeAnalysis) {
          analyzeLocal(contentToAnalyze);
        }
      }, 300); // Quick feedback

      // AI analysis - deep cycle
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
      ); // Longer pause for AI
    },
    [analyzeLocal, analyzeContent, state.config.enableRealTimeAnalysis, state.config.analysisDelay],
  );

  /**
   * Auto-analyze content when it changes
   */
  useEffect(() => {
    if (autoAnalyze && content && state.isActive && content !== lastContentRef.current) {
      debouncedAnalyze(content);
    }
    return (): void => {
      if (localAnalysisTimeoutRef.current) {
        clearTimeout(localAnalysisTimeoutRef.current);
      }
      if (aiAnalysisTimeoutRef.current) {
        clearTimeout(aiAnalysisTimeoutRef.current);
      }
    };
  }, [content, autoAnalyze, state.isActive, debouncedAnalyze]);

  /**
   * Apply a suggestion with feedback tracking
   */
  const applySuggestion = useCallback(
    (suggestionId: string): void => {
      const suggestion = state.suggestions.find(s => s.id === suggestionId);
      if (!suggestion) return;

      // Immediately update UI state
      appliedSuggestions.current.add(suggestionId);
      setState(prev => ({
        ...prev,
        suggestions: prev.suggestions.filter(s => s.id !== suggestionId),
      }));

      // Track the interaction
      suggestionInteractions.current.set(suggestionId, {
        action: 'applied',
        timestamp: new Date(),
      });

      // Background: Record feedback for machine learning
      if (enablePersistence && projectId && chapterId) {
        try {
          writingAssistantDb.recordSuggestionFeedback(
            suggestion,
            'accepted',
            chapterId,
            projectId,
            suggestion.suggestedText, // The text that was applied
          );
        } catch (error) {
          logger.warn('Failed to record suggestion feedback', {
            component: 'useWritingAssistant',
            error,
            suggestionId,
          });
          // Continue gracefully - the suggestion was still applied
        }
      }

      // Apply the text change to the editor via callback
      if (
        onContentChange !== undefined &&
        suggestion.originalText !== null &&
        suggestion.originalText !== undefined &&
        suggestion.originalText !== '' &&
        suggestion.suggestedText !== null &&
        suggestion.suggestedText !== undefined &&
        suggestion.suggestedText !== ''
      ) {
        // Calculate the new content by replacing the original text with suggested text
        const newContent = content.replace(suggestion.originalText, suggestion.suggestedText);
        onContentChange(newContent, suggestionId);
      }
    },
    [state.suggestions, enablePersistence, projectId, chapterId, onContentChange, content],
  );

  /**
   * Dismiss a suggestion with feedback tracking
   */
  const dismissSuggestion = useCallback(
    (suggestionId: string): void => {
      const suggestion = state.suggestions.find(s => s.id === suggestionId);
      if (!suggestion) return;

      // Immediately update UI state
      dismissedSuggestions.current.add(suggestionId);
      setState(prev => ({
        ...prev,
        suggestions: prev.suggestions.filter(s => s.id !== suggestionId),
      }));

      // Track the interaction
      suggestionInteractions.current.set(suggestionId, {
        action: 'dismissed',
        timestamp: new Date(),
      });

      // Background: Record feedback for machine learning
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
          // Continue gracefully - the suggestion was still dismissed
        }
      }
    },
    [state.suggestions, enablePersistence, projectId, chapterId],
  );

  /**
   * Update configuration with immediate UI response + background persistence
   */
  const updateConfig = useCallback(
    (configUpdate: Partial<WritingAssistantConfig>): void => {
      setState(prev => {
        const newConfig = { ...prev.config, ...configUpdate };

        // Background save (synchronous for now)
        saveConfig(newConfig);

        return { ...prev, config: newConfig };
      });
    },
    [saveConfig],
  );

  /**
   * Select a specific suggestion
   */
  const selectSuggestion = useCallback((suggestionId: string) => {
    setState(prev => ({ ...prev, selectedSuggestion: suggestionId }));
  }, []);

  /**
   * Toggle suggestions panel visibility
   */
  const toggleSuggestions = useCallback(() => {
    setState(prev => ({ ...prev, showSuggestions: !prev.showSuggestions }));
  }, []);

  /**
   * Filter suggestions by category
   */
  const filterSuggestions = useCallback((category: WritingSuggestionCategory | 'all') => {
    setState(prev => ({ ...prev, filterBy: category }));
  }, []);

  /**
   * Sort suggestions
   */
  const sortSuggestions = useCallback((sortBy: WritingAssistantState['sortBy']) => {
    setState(prev => ({ ...prev, sortBy }));
  }, []);

  /**
   * Get writing analytics and insights
   */
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

  // Compute derived state
  const suggestionsByCategory = state.suggestions.reduce(
    (acc, suggestion) => {
      const category = suggestion.category;
      acc[category] ??= [];
      acc[category].push(suggestion);

      acc.all ??= [];
      acc.all.push(suggestion);

      return acc;
    },
    {} as Record<WritingSuggestionCategory | 'all', WritingSuggestion[]>,
  );

  const filteredSuggestions =
    state.filterBy === 'all' ? state.suggestions : (suggestionsByCategory[state.filterBy] ?? []);

  // Sort filtered suggestions
  const sortedSuggestions = [...filteredSuggestions].sort((a, b) => {
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

  // Compute analysis stats
  const analysisStats = {
    totalSuggestions: state.suggestions.length,
    highPrioritySuggestions: state.suggestions.filter(
      s => s.severity === 'error' || s.severity === 'warning',
    ).length,
    avgConfidence:
      state.suggestions.length > 0
        ? state.suggestions.reduce((sum, s) => sum + s.confidence, 0) / state.suggestions.length
        : 0,
    topCategories: Object.entries(suggestionsByCategory)
      .filter(([category]) => category !== 'all')
      .map(([category, suggestions]) => ({
        category: category as WritingSuggestionCategory,
        count: suggestions.length,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3),
  };

  // Calculate suggestion acceptance rate
  const totalInteractions = appliedSuggestions.current.size + dismissedSuggestions.current.size;
  const suggestionAcceptanceRate =
    totalInteractions > 0 ? appliedSuggestions.current.size / totalInteractions : 0;

  // Generate learning insights
  const learningInsights = {
    preferredCategories: Object.entries(
      Array.from(suggestionInteractions.current.entries())
        .filter(([, interaction]) => interaction.action === 'applied')
        .map(([suggestionId]) => {
          const suggestion = state.suggestions.find(s => s.id === suggestionId);
          return suggestion?.category ?? 'unknown';
        })
        .reduce<Record<string, number>>((acc, category) => {
          acc[category] = (acc[category] ?? 0) + 1;
          return acc;
        }, {}),
    )
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category]) => category),

    improvementTrends: {
      readability: currentAnalysis?.readabilityScore ?? 0,
      engagement: currentAnalysis?.engagementScore ?? 0,
      suggestionAcceptance: suggestionAcceptanceRate,
    },

    writingHabits: {
      analysisFrequency: 'regular', // Could calculate from timestamps
      preferredAnalysisTime: 'afternoon', // Could analyze timestamps
      mostActiveCategories: analysisStats.topCategories.map(tc => tc.category),
    },
  };

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
