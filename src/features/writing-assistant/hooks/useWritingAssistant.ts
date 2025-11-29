/**
 * Writing Assistant Hook
 * Manages writing assistant state and provides analysis functionality
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { writingAssistantService } from '../services/writingAssistantService';
import { writingAssistantDb } from '../services/writingAssistantDb';
import type {
  WritingAssistantState,
  WritingAssistantActions,
  WritingAssistantConfig,
  ContentAnalysis,
  WritingSuggestion,
  WritingSuggestionCategory
} from '../types';
import { DEFAULT_WRITING_ASSISTANT_CONFIG } from '../types';

interface UseWritingAssistantOptions {
  autoAnalyze?: boolean;
  analysisDelay?: number;
  chapterId?: string;
  projectId?: string;
  characterContext?: any[];
  plotContext?: string;
  enablePersistence?: boolean; // Whether to save analysis to database
}

interface UseWritingAssistantReturn extends WritingAssistantState, WritingAssistantActions {
  // Additional computed properties
  suggestionsByCategory: Record<WritingSuggestionCategory | 'all', WritingSuggestion[]>;
  filteredSuggestions: WritingSuggestion[];
  analysisStats: {
    totalSuggestions: number;
    highPrioritySuggestions: number;
    avgConfidence: number;
    topCategories: Array<{ category: WritingSuggestionCategory; count: number }>;
  };
  
  // Loading states
  isAnalyzing: boolean;
  lastAnalyzedAt?: Date;
  analysisError?: string;
  
  // Analytics and insights
  getWritingAnalytics: (timeRange?: 'week' | 'month' | 'year') => Promise<any>;
  suggestionAcceptanceRate: number;
  learningInsights: {
    preferredCategories: string[];
    improvementTrends: Record<string, number>;
    writingHabits: Record<string, any>;
  };
}

export function useWritingAssistant(
  content: string = '',
  options: UseWritingAssistantOptions = {}
): UseWritingAssistantReturn {
  const {
    autoAnalyze = true,
    analysisDelay: _analysisDelay = 1500,
    chapterId = '',
    projectId = '',
    characterContext = [],
    plotContext = '',
    enablePersistence = true
  } = options;

  // Core state
  const [state, setState] = useState<WritingAssistantState>({
    isActive: false,
    isAnalyzing: false,
    suggestions: [],
    config: DEFAULT_WRITING_ASSISTANT_CONFIG,
    showSuggestions: true,
    filterBy: 'all',
    sortBy: 'severity'
  });

  // Analysis state
  const [currentAnalysis, setCurrentAnalysis] = useState<ContentAnalysis | undefined>();
  const [lastAnalyzedAt, setLastAnalyzedAt] = useState<Date>();
  const [analysisError, setAnalysisError] = useState<string>();

  // Refs for debouncing and tracking
  const analysisTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastContentRef = useRef<string>('');
  
  // Track suggestion interactions for learning
  const appliedSuggestions = useRef<Set<string>>(new Set());
  const dismissedSuggestions = useRef<Set<string>>(new Set());
  const suggestionInteractions = useRef<Map<string, { action: 'applied' | 'dismissed' | 'viewed'; timestamp: Date }>>(new Map());

  /**
   * Load configuration with hybrid approach: localStorage first, then DB fallback
   */
  useEffect(() => {
    const loadConfiguration = async () => {
      try {
        // Fast path: Load from localStorage first for immediate UI response
        const localConfig = localStorage.getItem('novelist_writing_assistant_config');
        const isActive = localStorage.getItem('novelist_writing_assistant_active') === 'true';
        
        if (localConfig) {
          const config = JSON.parse(localConfig);
          setState(prev => ({ 
            ...prev, 
            config: { ...DEFAULT_WRITING_ASSISTANT_CONFIG, ...config },
            isActive 
          }));
        } else {
          setState(prev => ({ ...prev, isActive }));
        }

        // Background: Attempt to load from database for cross-device sync
        if (enablePersistence) {
          try {
            const dbConfig = await writingAssistantDb.loadPreferences();
            if (dbConfig && !localConfig) {
              // Only use DB config if we don't have local config
              setState(prev => ({ 
                ...prev, 
                config: { ...DEFAULT_WRITING_ASSISTANT_CONFIG, ...dbConfig }
              }));
              // Cache to localStorage for future fast access
              localStorage.setItem('novelist_writing_assistant_config', JSON.stringify(dbConfig));
            }
          } catch (error) {
            console.warn('Failed to load preferences from database:', error);
            // Gracefully continue with localStorage config
          }
        }
      } catch (error) {
        console.error('Failed to load writing assistant config:', error);
        // Fallback to default config
        setState(prev => ({ 
          ...prev, 
          config: DEFAULT_WRITING_ASSISTANT_CONFIG,
          isActive: false 
        }));
      }
    };

    loadConfiguration();
  }, [enablePersistence]);

  /**
   * Save configuration with hybrid approach: localStorage + optional DB sync
   */
  const saveConfig = useCallback(async (config: WritingAssistantConfig) => {
    try {
      // Immediate save to localStorage for instant UI response
      localStorage.setItem('novelist_writing_assistant_config', JSON.stringify(config));
      
      // Background sync to database for cross-device persistence
      if (enablePersistence) {
        try {
          await writingAssistantDb.syncPreferences(config);
        } catch (error) {
          console.warn('Failed to sync preferences to database:', error);
          // Continue gracefully - localStorage save still worked
        }
      }
    } catch (error) {
      console.error('Failed to save writing assistant config:', error);
    }
  }, [enablePersistence]);

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
  const analyzeContent = useCallback(async (
    contentToAnalyze: string = content,
    targetChapterId: string = chapterId
  ) => {
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
        plotContext
      );

      // Immediately update UI state
      setCurrentAnalysis(analysis);
      setState(prev => ({ 
        ...prev, 
        suggestions: analysis.suggestions,
        isAnalyzing: false 
      }));
      setLastAnalyzedAt(new Date());

      // Background: Save analysis to database for historical tracking
      if (enablePersistence && projectId) {
        try {
          const acceptedCount = appliedSuggestions.current.size;
          const dismissedCount = dismissedSuggestions.current.size;
          
          await writingAssistantDb.saveAnalysisHistory(
            analysis,
            projectId,
            acceptedCount,
            dismissedCount
          );
        } catch (error) {
          console.warn('Failed to save analysis history:', error);
          // Continue gracefully - analysis still worked
        }
      }

      // Track suggestion views for learning
      analysis.suggestions.forEach(suggestion => {
        suggestionInteractions.current.set(suggestion.id, {
          action: 'viewed',
          timestamp: new Date()
        });
      });

    } catch (error) {
      console.error('Analysis failed:', error);
      setAnalysisError(error instanceof Error ? error.message : 'Analysis failed');
      setState(prev => ({ ...prev, isAnalyzing: false }));
    }
  }, [content, chapterId, state.isActive, state.config, characterContext, plotContext, enablePersistence, projectId]);

  /**
   * Debounced content analysis
   */
  const debouncedAnalyze = useCallback((contentToAnalyze: string) => {
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
    }

    analysisTimeoutRef.current = setTimeout(() => {
      if (contentToAnalyze !== lastContentRef.current && state.config.enableRealTimeAnalysis) {
        analyzeContent(contentToAnalyze);
        lastContentRef.current = contentToAnalyze;
      }
    }, state.config.analysisDelay);
  }, [analyzeContent, state.config.enableRealTimeAnalysis, state.config.analysisDelay]);

  /**
   * Auto-analyze content when it changes
   */
  useEffect(() => {
    if (autoAnalyze && content && state.isActive && content !== lastContentRef.current) {
      debouncedAnalyze(content);
    }
    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
    };
  }, [content, autoAnalyze, state.isActive, debouncedAnalyze]);

  /**
   * Apply a suggestion with feedback tracking
   */
  const applySuggestion = useCallback(async (suggestionId: string) => {
    const suggestion = state.suggestions.find(s => s.id === suggestionId);
    if (!suggestion) return;

    // Immediately update UI state
    appliedSuggestions.current.add(suggestionId);
    setState(prev => ({
      ...prev,
      suggestions: prev.suggestions.filter(s => s.id !== suggestionId)
    }));

    // Track the interaction
    suggestionInteractions.current.set(suggestionId, {
      action: 'applied',
      timestamp: new Date()
    });

    // Background: Record feedback for machine learning
    if (enablePersistence && projectId && chapterId) {
      try {
        await writingAssistantDb.recordSuggestionFeedback(
          suggestion,
          'accepted',
          chapterId,
          projectId,
          suggestion.suggestedText // The text that was applied
        );
      } catch (error) {
        console.warn('Failed to record suggestion feedback:', error);
        // Continue gracefully - the suggestion was still applied
      }
    }

    // TODO: Integrate with editor to actually apply the text change
    // This would depend on the editor implementation
    
  }, [state.suggestions, enablePersistence, projectId, chapterId]);

  /**
   * Dismiss a suggestion with feedback tracking
   */
  const dismissSuggestion = useCallback(async (suggestionId: string) => {
    const suggestion = state.suggestions.find(s => s.id === suggestionId);
    if (!suggestion) return;

    // Immediately update UI state
    dismissedSuggestions.current.add(suggestionId);
    setState(prev => ({
      ...prev,
      suggestions: prev.suggestions.filter(s => s.id !== suggestionId)
    }));

    // Track the interaction
    suggestionInteractions.current.set(suggestionId, {
      action: 'dismissed',
      timestamp: new Date()
    });

    // Background: Record feedback for machine learning
    if (enablePersistence && projectId && chapterId) {
      try {
        await writingAssistantDb.recordSuggestionFeedback(
          suggestion,
          'dismissed',
          chapterId,
          projectId
        );
      } catch (error) {
        console.warn('Failed to record suggestion feedback:', error);
        // Continue gracefully - the suggestion was still dismissed
      }
    }
  }, [state.suggestions, enablePersistence, projectId, chapterId]);

  /**
   * Update configuration with immediate UI response + background persistence
   */
  const updateConfig = useCallback(async (configUpdate: Partial<WritingAssistantConfig>) => {
    setState(prev => {
      const newConfig = { ...prev.config, ...configUpdate };
      
      // Background save (async, non-blocking)
      saveConfig(newConfig).catch(error => {
        console.warn('Failed to save config update:', error);
      });
      
      return { ...prev, config: newConfig };
    });
  }, [saveConfig]);

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
  const getWritingAnalytics = useCallback(async (timeRange: 'week' | 'month' | 'year' = 'month') => {
    if (!enablePersistence || !projectId) {
      return {
        progressMetrics: [],
        improvementTrends: { readabilityTrend: 0, engagementTrend: 0, productivityTrend: 0 },
        suggestionInsights: { mostHelpfulCategories: [], acceptanceRate: 0, commonPatterns: [] }
      };
    }

    try {
      return await writingAssistantDb.getWritingAnalytics(projectId, timeRange);
    } catch (error) {
      console.error('Failed to get writing analytics:', error);
      return {
        progressMetrics: [],
        improvementTrends: { readabilityTrend: 0, engagementTrend: 0, productivityTrend: 0 },
        suggestionInsights: { mostHelpfulCategories: [], acceptanceRate: 0, commonPatterns: [] }
      };
    }
  }, [enablePersistence, projectId]);

  // Compute derived state
  const suggestionsByCategory = state.suggestions.reduce((acc, suggestion) => {
    const category = suggestion.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(suggestion);
    
    if (!acc.all) acc.all = [];
    acc.all.push(suggestion);
    
    return acc;
  }, {} as Record<WritingSuggestionCategory | 'all', WritingSuggestion[]>);

  const filteredSuggestions = state.filterBy === 'all' 
    ? state.suggestions 
    : suggestionsByCategory[state.filterBy] || [];

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
    highPrioritySuggestions: state.suggestions.filter(s => 
      s.severity === 'error' || s.severity === 'warning'
    ).length,
    avgConfidence: state.suggestions.length > 0 
      ? state.suggestions.reduce((sum, s) => sum + s.confidence, 0) / state.suggestions.length
      : 0,
    topCategories: Object.entries(suggestionsByCategory)
      .filter(([category]) => category !== 'all')
      .map(([category, suggestions]) => ({
        category: category as WritingSuggestionCategory,
        count: suggestions.length
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
  };

  // Calculate suggestion acceptance rate
  const totalInteractions = appliedSuggestions.current.size + dismissedSuggestions.current.size;
  const suggestionAcceptanceRate = totalInteractions > 0 
    ? appliedSuggestions.current.size / totalInteractions 
    : 0;

  // Generate learning insights
  const learningInsights = {
    preferredCategories: Object.entries(
      Array.from(suggestionInteractions.current.entries())
        .filter(([_, interaction]) => interaction.action === 'applied')
        .map(([suggestionId, _]) => {
          const suggestion = state.suggestions.find(s => s.id === suggestionId);
          return suggestion?.category || 'unknown';
        })
        .reduce((acc, category) => {
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
    )
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category, _]) => category),
    
    improvementTrends: {
      readability: currentAnalysis?.readabilityScore || 0,
      engagement: currentAnalysis?.engagementScore || 0,
      suggestionAcceptance: suggestionAcceptanceRate
    },
    
    writingHabits: {
      analysisFrequency: 'regular', // Could calculate from timestamps
      preferredAnalysisTime: 'afternoon', // Could analyze timestamps
      mostActiveCategories: analysisStats.topCategories.map(tc => tc.category)
    }
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
    
    // Analytics and insights
    getWritingAnalytics,
    suggestionAcceptanceRate,
    learningInsights
  };
}

export default useWritingAssistant;