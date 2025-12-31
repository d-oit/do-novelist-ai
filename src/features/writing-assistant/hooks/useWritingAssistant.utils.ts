/**
 * Utility functions for Writing Assistant Hook
 */

import {
  type WritingSuggestionCategory,
  type WritingSuggestion,
} from '@/features/writing-assistant/types';

/**
 * Group suggestions by category
 */
export function groupSuggestionsByCategory(suggestions: WritingSuggestion[]) {
  return suggestions.reduce(
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
}

/**
 * Sort suggestions by different criteria
 */
export function sortSuggestions(
  suggestions: WritingSuggestion[],
  sortBy: 'severity' | 'type' | 'position' | 'confidence',
) {
  return [...suggestions].sort((a, b) => {
    switch (sortBy) {
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
}

/**
 * Calculate analysis statistics
 */
export function calculateAnalysisStats(suggestions: WritingSuggestion[]) {
  const grouped = groupSuggestionsByCategory(suggestions);
  const categories = Object.entries(grouped)
    .filter(([category]) => category !== 'all')
    .map(([category, categorySuggestions]) => ({
      category: category as WritingSuggestionCategory,
      count: categorySuggestions.length,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return {
    totalSuggestions: suggestions.length,
    highPrioritySuggestions: suggestions.filter(
      s => s.severity === 'error' || s.severity === 'warning',
    ).length,
    avgConfidence:
      suggestions.length > 0
        ? suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length
        : 0,
    topCategories: categories,
  };
}

/**
 * Calculate suggestion acceptance rate
 */
export function calculateAcceptanceRate(
  appliedSuggestions: Set<string>,
  dismissedSuggestions: Set<string>,
) {
  const totalInteractions = appliedSuggestions.size + dismissedSuggestions.size;
  return totalInteractions > 0 ? appliedSuggestions.size / totalInteractions : 0;
}

/**
 * Generate learning insights from suggestion interactions
 */
export function generateLearningInsights(
  suggestions: WritingSuggestion[],
  suggestionInteractions: Map<
    string,
    { action: 'applied' | 'dismissed' | 'viewed'; timestamp: Date }
  >,
  currentAnalysis: { readabilityScore?: number; engagementScore?: number } | undefined,
  analysisStats: { topCategories: { category: WritingSuggestionCategory; count: number }[] },
) {
  const preferredCategories = Object.entries(
    Array.from(suggestionInteractions.entries())
      .filter(([, interaction]) => interaction.action === 'applied')
      .map(([suggestionId]) => {
        const suggestion = suggestions.find(s => s.id === suggestionId);
        return suggestion?.category ?? 'unknown';
      })
      .reduce<Record<string, number>>((acc, category) => {
        acc[category] = (acc[category] ?? 0) + 1;
        return acc;
      }, {}),
  )
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([category]) => category);

  return {
    preferredCategories,
    improvementTrends: {
      readability: currentAnalysis?.readabilityScore ?? 0,
      engagement: currentAnalysis?.engagementScore ?? 0,
    },
    writingHabits: {
      analysisFrequency: 'regular',
      preferredAnalysisTime: 'afternoon',
      mostActiveCategories: analysisStats.topCategories.map(tc => tc.category),
    },
  };
}
