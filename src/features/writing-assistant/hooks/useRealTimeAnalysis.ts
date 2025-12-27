/**
 * useRealTimeAnalysis Hook
 * Manages debounced content analysis with real-time feedback
 */

import { useState, useEffect, useCallback, useRef } from 'react';

import { grammarSuggestionService } from '@/features/writing-assistant/services/grammarSuggestionService';
import { realTimeAnalysisService } from '@/features/writing-assistant/services/realTimeAnalysisService';
import { styleAnalysisService } from '@/features/writing-assistant/services/styleAnalysisService';
import type {
  StyleAnalysisResult,
  GrammarSuggestion,
  InlineSuggestion,
  RealTimeConfig,
  AnalysisType,
} from '@/features/writing-assistant/types';
import { logger } from '@/lib/logging/logger';

// ============================================================================
// Hook Interface
// ============================================================================

interface UseRealTimeAnalysisOptions {
  initialContent?: string;
  enabled?: boolean;
  debounceMs?: number;
  onAnalysisComplete?: (results: AnalysisResults) => void;
  onGoalProgress?: (progress: Map<string, { progress: number; isAchieved: boolean }>) => void;
  analyses?: AnalysisType[];
}

interface AnalysisResults {
  style?: StyleAnalysisResult;
  grammar: GrammarSuggestion[];
  inlineSuggestions: InlineSuggestion[];
}

interface UseRealTimeAnalysisReturn {
  // State
  isActive: boolean;
  isAnalyzing: boolean;
  lastAnalyzedAt?: Date;

  // Analysis results
  styleResult?: StyleAnalysisResult;
  grammarSuggestions: GrammarSuggestion[];
  inlineSuggestions: InlineSuggestion[];

  // Actions
  start: () => void;
  stop: () => void;
  analyze: (content: string) => Promise<void>;
  updateContent: (content: string) => void;
  acceptSuggestion: (suggestionId: string) => boolean;
  dismissSuggestion: (suggestionId: string) => boolean;
  clearAllSuggestions: () => void;

  // Configuration
  config: RealTimeConfig;
  updateConfig: (updates: Partial<RealTimeConfig>) => void;

  // Metrics
  analysisDuration: number;
  pendingChanges: number;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useRealTimeAnalysis(
  options: UseRealTimeAnalysisOptions = {},
): UseRealTimeAnalysisReturn {
  const {
    initialContent = '',
    enabled = true,
    debounceMs = 500,
    onAnalysisComplete,
    onGoalProgress,
    analyses = ['all'],
  } = options;

  // Service state
  const [isActive, setIsActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalyzedAt, setLastAnalyzedAt] = useState<Date | undefined>();

  // Analysis results
  const [styleResult, setStyleResult] = useState<StyleAnalysisResult | undefined>();
  const [grammarSuggestions, setGrammarSuggestions] = useState<GrammarSuggestion[]>([]);
  const [inlineSuggestions, setInlineSuggestions] = useState<InlineSuggestion[]>([]);

  // Debounce ref
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef(initialContent);

  // Get current config from service
  const config = realTimeAnalysisService.getConfig();

  // Initialize
  useEffect(() => {
    if (enabled) {
      realTimeAnalysisService.updateConfig({ debounceMs });
      realTimeAnalysisService.start();
      setIsActive(true);

      // Set up content change callback
      realTimeAnalysisService.onContentChange(() => {
        // Content change handled via updateContent
      });
    } else {
      realTimeAnalysisService.stop();
      setIsActive(false);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      realTimeAnalysisService.stop();
    };
  }, [enabled, debounceMs]);

  // Perform analysis
  const performAnalysis = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      setIsAnalyzing(true);

      try {
        const results = await realTimeAnalysisService.analyzeNow(content, analyses);

        setStyleResult(results.currentStyleAnalysis);
        setGrammarSuggestions(results.currentGrammarSuggestions);
        setInlineSuggestions(results.currentInlineSuggestions);
        setLastAnalyzedAt(results.lastAnalysisTime);

        // Notify completion
        if (onAnalysisComplete) {
          onAnalysisComplete({
            style: results.currentStyleAnalysis,
            grammar: results.currentGrammarSuggestions,
            inlineSuggestions: results.currentInlineSuggestions,
          });
        }

        // Notify goal progress
        if (onGoalProgress) {
          const goalProgress = realTimeAnalysisService.getGoalProgress();
          const progressMap = new Map<string, { progress: number; isAchieved: boolean }>();
          goalProgress.forEach((progress, goalId) => {
            progressMap.set(goalId, {
              progress: progress.progress,
              isAchieved: progress.isAchieved,
            });
          });
          onGoalProgress(progressMap);
        }
      } catch (error) {
        logger.error('Analysis failed', { error, component: 'useRealTimeAnalysis' });
      } finally {
        setIsAnalyzing(false);
      }
    },
    [analyses, onAnalysisComplete, onGoalProgress],
  );

  // Update content with debouncing
  const updateContent = useCallback(
    (content: string) => {
      contentRef.current = content;

      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Schedule new analysis
      debounceTimerRef.current = setTimeout(() => {
        void performAnalysis(content);
      }, debounceMs);
    },
    [debounceMs, performAnalysis],
  );

  // Immediate analysis (no debouncing)
  const analyze = useCallback(
    async (content: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      await performAnalysis(content);
    },
    [performAnalysis],
  );

  // Start analysis
  const start = useCallback(() => {
    realTimeAnalysisService.start();
    setIsActive(true);

    if (contentRef.current) {
      void performAnalysis(contentRef.current);
    }
  }, [performAnalysis]);

  // Stop analysis
  const stop = useCallback(() => {
    realTimeAnalysisService.stop();
    setIsActive(false);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  // Accept suggestion
  const acceptSuggestion = useCallback((suggestionId: string) => {
    return realTimeAnalysisService.acceptSuggestion(suggestionId);
  }, []);

  // Dismiss suggestion
  const dismissSuggestion = useCallback((suggestionId: string) => {
    return realTimeAnalysisService.dismissSuggestion(suggestionId);
  }, []);

  // Clear all suggestions
  const clearAllSuggestions = useCallback(() => {
    realTimeAnalysisService.clearAllSuggestions();
    setInlineSuggestions([]);
    setGrammarSuggestions([]);
  }, []);

  // Update configuration
  const updateConfig = useCallback((updates: Partial<RealTimeConfig>) => {
    realTimeAnalysisService.updateConfig(updates);
  }, []);

  return {
    // State
    isActive,
    isAnalyzing,
    lastAnalyzedAt,

    // Analysis results
    styleResult,
    grammarSuggestions,
    inlineSuggestions,

    // Actions
    start,
    stop,
    analyze,
    updateContent,
    acceptSuggestion,
    dismissSuggestion,
    clearAllSuggestions,

    // Configuration
    config,
    updateConfig,

    // Metrics
    analysisDuration: realTimeAnalysisService.getAnalysisDuration(),
    pendingChanges: realTimeAnalysisService.getPendingChanges(),
  };
}

// ============================================================================
// Additional Analysis Hooks
// ============================================================================

/**
 * Hook for quick style analysis (non-real-time)
 */
export function useStyleAnalysis() {
  const [analysis, setAnalysis] = useState<StyleAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyze = useCallback(async (content: string) => {
    setIsAnalyzing(true);
    try {
      const result = styleAnalysisService.analyzeStyle(content);
      setAnalysis(result);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return {
    analysis,
    isAnalyzing,
    analyze,
  };
}

/**
 * Hook for quick grammar analysis (non-real-time)
 */
export function useGrammarAnalysis() {
  const [analysis, setAnalysis] = useState<{ suggestions: GrammarSuggestion[] } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyze = useCallback(async (content: string) => {
    setIsAnalyzing(true);
    try {
      const result = grammarSuggestionService.analyzeGrammar(content);
      setAnalysis({ suggestions: result.suggestions });
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return {
    analysis,
    isAnalyzing,
    analyze,
  };
}

export default useRealTimeAnalysis;
