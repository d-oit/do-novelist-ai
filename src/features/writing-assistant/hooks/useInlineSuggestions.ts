/**
 * useInlineSuggestions Hook
 * Manages inline suggestions display and interaction
 */

import { useState, useCallback, useMemo, useRef } from 'react';

import { realTimeAnalysisService } from '@/features/writing-assistant/services/realTimeAnalysisService';
import type { InlineSuggestion, SuggestionAction } from '@/features/writing-assistant/types';

// ============================================================================
// Hook Interface
// ============================================================================

interface UseInlineSuggestionsOptions {
  onAccept?: (suggestion: InlineSuggestion) => void;
  onDismiss?: (suggestion: InlineSuggestion) => void;
  onAction?: (action: SuggestionAction) => void;
}

interface UseInlineSuggestionsReturn {
  // State
  suggestions: InlineSuggestion[];
  expandedSuggestionId: string | null;
  dismissedIds: Set<string>;

  // Computed
  errorSuggestions: InlineSuggestion[];
  warningSuggestions: InlineSuggestion[];
  suggestionSuggestions: InlineSuggestion[];
  groupedByLine: Map<number, InlineSuggestion[]>;
  suggestionCount: number;

  // Actions
  expandSuggestion: (suggestionId: string) => void;
  collapseSuggestion: (suggestionId: string) => void;
  acceptSuggestion: (suggestionId: string) => boolean;
  dismissSuggestion: (suggestionId: string) => boolean;
  acceptAll: () => number;
  dismissAll: () => number;
  dismissAllByType: (type: InlineSuggestion['type']) => number;
  undoDismiss: (suggestionId: string) => void;
  clearAll: () => void;

  // Service integration
  syncWithService: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useInlineSuggestions(
  options: UseInlineSuggestionsOptions = {},
): UseInlineSuggestionsReturn {
  const { onAccept, onDismiss, onAction } = options;

  // State
  const [suggestions, setSuggestions] = useState<InlineSuggestion[]>([]);
  const [expandedSuggestionId, setExpandedSuggestionId] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const actionHistoryRef = useRef<SuggestionAction[]>([]);
  const setActionHistory = useCallback(
    (value: SuggestionAction[] | ((prev: SuggestionAction[]) => SuggestionAction[])) => {
      if (typeof value === 'function') {
        actionHistoryRef.current = value(actionHistoryRef.current);
      } else {
        actionHistoryRef.current = value;
      }
    },
    [],
  );

  // Computed: Filter out dismissed suggestions
  const activeSuggestions = useMemo(
    () => suggestions.filter(s => !dismissedIds.has(s.id)),
    [suggestions, dismissedIds],
  );

  // Computed: Group by type
  const errorSuggestions = useMemo(
    () => activeSuggestions.filter(s => s.severity === 'error'),
    [activeSuggestions],
  );

  const warningSuggestions = useMemo(
    () => activeSuggestions.filter(s => s.severity === 'warning'),
    [activeSuggestions],
  );

  const suggestionSuggestions = useMemo(
    () => activeSuggestions.filter(s => s.severity === 'suggestion'),
    [activeSuggestions],
  );

  // Computed: Group by line number
  const groupedByLine = useMemo(() => {
    const map = new Map<number, InlineSuggestion[]>();
    activeSuggestions.forEach(suggestion => {
      const line = suggestion.position.line;
      if (!map.has(line)) {
        map.set(line, []);
      }
      map.get(line)!.push(suggestion);
    });
    return map;
  }, [activeSuggestions]);

  // Computed: Total count
  const suggestionCount = useMemo(() => activeSuggestions.length, [activeSuggestions]);

  // Actions
  const expandSuggestion = useCallback((suggestionId: string) => {
    setExpandedSuggestionId(suggestionId);
  }, []);

  const collapseSuggestion = useCallback(
    (suggestionId: string) => {
      if (expandedSuggestionId === suggestionId) {
        setExpandedSuggestionId(null);
      }
    },
    [expandedSuggestionId],
  );

  const acceptSuggestion = useCallback(
    (suggestionId: string): boolean => {
      const suggestion = activeSuggestions.find(s => s.id === suggestionId);
      if (!suggestion) return false;

      const success = realTimeAnalysisService.acceptSuggestion(suggestionId);
      if (success) {
        setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
        setDismissedIds(prev => new Set([...prev, suggestionId]));

        // Record action
        const action: SuggestionAction = {
          type: 'accept',
          suggestionId,
          timestamp: new Date(),
        };
        setActionHistory(prev => [...prev, action]);

        onAccept?.(suggestion);
        onAction?.(action);
      }

      return success;
    },
    [activeSuggestions, onAccept, onAction, setActionHistory],
  );

  const dismissSuggestion = useCallback(
    (suggestionId: string): boolean => {
      const suggestion = activeSuggestions.find(s => s.id === suggestionId);
      if (!suggestion) return false;

      const success = realTimeAnalysisService.dismissSuggestion(suggestionId);
      if (success) {
        setDismissedIds(prev => new Set([...prev, suggestionId]));

        // Record action
        const action: SuggestionAction = {
          type: 'dismiss',
          suggestionId,
          timestamp: new Date(),
        };
        setActionHistory(prev => [...prev, action]);

        onDismiss?.(suggestion);
        onAction?.(action);
      }

      return success;
    },
    [activeSuggestions, onDismiss, onAction, setActionHistory],
  );

  const acceptAll = useCallback((): number => {
    let count = 0;
    activeSuggestions.forEach(suggestion => {
      if (realTimeAnalysisService.acceptSuggestion(suggestion.id)) {
        count++;
      }
    });

    if (count > 0) {
      const allIds = new Set(dismissedIds);
      activeSuggestions.forEach(s => allIds.add(s.id));
      setDismissedIds(allIds);
      setSuggestions([]);

      // Record action
      const action: SuggestionAction = {
        type: 'accept',
        suggestionId: 'all',
        timestamp: new Date(),
      };
      setActionHistory(prev => [...prev, action]);
      onAction?.(action);
    }

    return count;
  }, [activeSuggestions, dismissedIds, onAction, setActionHistory]);

  const dismissAll = useCallback((): number => {
    const count = activeSuggestions.length;

    if (count > 0) {
      const allIds = new Set(dismissedIds);
      activeSuggestions.forEach(s => allIds.add(s.id));
      setDismissedIds(allIds);

      // Record action
      const action: SuggestionAction = {
        type: 'dismiss',
        suggestionId: 'all',
        timestamp: new Date(),
      };
      setActionHistory(prev => [...prev, action]);
      onAction?.(action);
    }

    return count;
  }, [activeSuggestions, dismissedIds, onAction, setActionHistory]);

  const dismissAllByType = useCallback(
    (type: InlineSuggestion['type']): number => {
      const filtered = activeSuggestions.filter(s => s.type === type);
      const count = filtered.length;

      if (count > 0) {
        setDismissedIds(prev => {
          const updated = new Set(prev);
          filtered.forEach(s => updated.add(s.id));
          return updated;
        });

        // Record action
        const action: SuggestionAction = {
          type: 'dismiss',
          suggestionId: `type-${type}`,
          timestamp: new Date(),
        };
        setActionHistory(prev => [...prev, action]);
        onAction?.(action);
      }

      return count;
    },
    [activeSuggestions, onAction, setActionHistory],
  );

  const undoDismiss = useCallback((suggestionId: string) => {
    setDismissedIds(prev => {
      const updated = new Set(prev);
      updated.delete(suggestionId);
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    realTimeAnalysisService.clearAllSuggestions();
    setSuggestions([]);
    setDismissedIds(new Set());
    setExpandedSuggestionId(null);
  }, []);

  // Sync with service
  const syncWithService = useCallback(() => {
    const serviceSuggestions = realTimeAnalysisService.getSuggestions();
    setSuggestions(serviceSuggestions);
  }, []);

  return {
    // State
    suggestions: activeSuggestions,
    expandedSuggestionId,
    dismissedIds,

    // Computed
    errorSuggestions,
    warningSuggestions,
    suggestionSuggestions,
    groupedByLine,
    suggestionCount,

    // Actions
    expandSuggestion,
    collapseSuggestion,
    acceptSuggestion,
    dismissSuggestion,
    acceptAll,
    dismissAll,
    dismissAllByType,
    undoDismiss,
    clearAll,

    // Service integration
    syncWithService,
  };
}

// ============================================================================
// Suggestion Selection Hook
// ============================================================================

interface UseSuggestionSelectionOptions {
  suggestions: InlineSuggestion[];
  onSelect?: (suggestion: InlineSuggestion | null) => void;
}

interface UseSuggestionSelectionReturn {
  selectedSuggestion: InlineSuggestion | null;
  selectedId: string | null;
  selectSuggestion: (suggestionId: string) => void;
  clearSelection: () => void;
  selectNext: () => void;
  selectPrevious: () => void;
  hasSelection: boolean;
}

export function useSuggestionSelection(
  options: UseSuggestionSelectionOptions,
): UseSuggestionSelectionReturn {
  const { suggestions, onSelect } = options;

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedSuggestion = useMemo(
    () => suggestions.find(s => s.id === selectedId) ?? null,
    [suggestions, selectedId],
  );

  const selectSuggestion = useCallback(
    (suggestionId: string) => {
      setSelectedId(suggestionId);
      const suggestion = suggestions.find(s => s.id === suggestionId);
      onSelect?.(suggestion ?? null);
    },
    [suggestions, onSelect],
  );

  const clearSelection = useCallback(() => {
    setSelectedId(null);
    onSelect?.(null);
  }, [onSelect]);

  const selectNext = useCallback(() => {
    if (suggestions.length === 0) return;

    const currentIndex = suggestions.findIndex(s => s.id === selectedId);
    const nextIndex = currentIndex < suggestions.length - 1 ? currentIndex + 1 : 0;
    const nextSuggestion = suggestions[nextIndex];
    if (nextSuggestion) {
      selectSuggestion(nextSuggestion.id);
    }
  }, [suggestions, selectedId, selectSuggestion]);

  const selectPrevious = useCallback(() => {
    if (suggestions.length === 0) return;

    const currentIndex = suggestions.findIndex(s => s.id === selectedId);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : suggestions.length - 1;
    const prevSuggestion = suggestions[prevIndex];
    if (prevSuggestion) {
      selectSuggestion(prevSuggestion.id);
    }
  }, [suggestions, selectedId, selectSuggestion]);

  const hasSelection = selectedId !== null;

  return {
    selectedSuggestion,
    selectedId,
    selectSuggestion,
    clearSelection,
    selectNext,
    selectPrevious,
    hasSelection,
  };
}

export default useInlineSuggestions;
