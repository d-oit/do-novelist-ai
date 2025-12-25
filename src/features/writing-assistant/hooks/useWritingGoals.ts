/**
 * useWritingGoals Hook
 * Manages writing goals state and operations
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

import { goalsService } from '@/features/writing-assistant/services/goalsService';
import type {
  WritingGoal,
  GoalProgress,
  GoalPreset,
  GoalWithStatus,
  WritingGoalsConfig,
} from '@/features/writing-assistant/types';

// ============================================================================
// Hook Interface
// ============================================================================

interface UseWritingGoalsOptions {
  content?: string;
  autoTrackProgress?: boolean;
}

interface UseWritingGoalsReturn {
  // Goals
  goals: WritingGoal[];
  activeGoals: WritingGoal[];
  activeGoalIds: string[];

  // Presets
  presets: GoalPreset[];

  // Progress
  activeGoalsProgress: Map<string, GoalProgress>;

  // Goals with status
  goalsWithStatus: GoalWithStatus[];

  // Actions
  createGoal: (goal: Omit<WritingGoal, 'id' | 'createdAt' | 'updatedAt'>) => WritingGoal;
  updateGoal: (id: string, updates: Partial<WritingGoal>) => WritingGoal | null;
  deleteGoal: (id: string) => boolean;
  toggleGoalActive: (id: string) => void;
  setActiveGoals: (ids: string[]) => void;
  applyPreset: (presetId: string) => WritingGoal[];
  calculateProgress: (content: string) => Map<string, GoalProgress>;

  // Import/Export
  exportGoals: () => string;
  importGoals: (data: string) => WritingGoal[];

  // Configuration
  config: WritingGoalsConfig;
  updateConfig: (updates: Partial<WritingGoalsConfig>) => void;

  // Utility
  clearAllGoals: () => void;
  getGoalById: (id: string) => WritingGoal | undefined;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useWritingGoals(options: UseWritingGoalsOptions = {}): UseWritingGoalsReturn {
  const { content = '', autoTrackProgress = true } = options;

  // State
  const [goals, setGoals] = useState<WritingGoal[]>([]);
  const [activeGoalIds, setActiveGoalIds] = useState<string[]>([]);
  const [goalsProgress, setGoalsProgress] = useState<Map<string, GoalProgress>>(new Map());

  // Load goals on mount
  useEffect(() => {
    const loadedGoals = goalsService.getAllGoals();
    setGoals(loadedGoals);
    setActiveGoalIds(loadedGoals.filter(g => g.isActive).map(g => g.id));
  }, []);

  // Track progress when content changes
  useEffect(() => {
    if (autoTrackProgress && content) {
      const progress = goalsService.calculateAllProgress(content);
      setGoalsProgress(progress);
    }
  }, [content, autoTrackProgress]);

  // Get presets
  const presets = useMemo(() => goalsService.getAllPresets(), []);

  // Get active goals
  const activeGoals = useMemo(() => goals.filter(g => g.isActive), [goals]);

  // Get goals with status
  const goalsWithStatus = useMemo(() => goalsService.getGoalsWithStatus(content), [content]);

  // Create goal
  const createGoal = useCallback(
    (goalData: Omit<WritingGoal, 'id' | 'createdAt' | 'updatedAt'>): WritingGoal => {
      const newGoal = goalsService.createGoal(goalData);
      setGoals(prev => [...prev, newGoal]);
      if (newGoal.isActive) {
        setActiveGoalIds(prev => [...prev, newGoal.id]);
      }
      return newGoal;
    },
    [],
  );

  // Update goal
  const updateGoal = useCallback(
    (id: string, updates: Partial<WritingGoal>): WritingGoal | null => {
      const updatedGoal = goalsService.updateGoal(id, updates);
      if (updatedGoal) {
        setGoals(prev => prev.map(g => (g.id === id ? updatedGoal : g)));
        if ('isActive' in updates) {
          setActiveGoalIds(prev =>
            updatedGoal.isActive
              ? [...prev.filter(gid => gid !== id), id]
              : prev.filter(gid => gid !== id),
          );
        }
      }
      return updatedGoal;
    },
    [],
  );

  // Delete goal
  const deleteGoal = useCallback((id: string): boolean => {
    const success = goalsService.deleteGoal(id);
    if (success) {
      setGoals(prev => prev.filter(g => g.id !== id));
      setActiveGoalIds(prev => prev.filter(gid => gid !== id));
    }
    return success;
  }, []);

  // Toggle goal active state
  const toggleGoalActive = useCallback((id: string) => {
    const goal = goalsService.toggleGoalActive(id);
    if (goal) {
      setGoals(prev => prev.map(g => (g.id === id ? goal : g)));
      setActiveGoalIds(prev => (goal.isActive ? [...prev, id] : prev.filter(gid => gid !== id)));
    }
  }, []);

  // Set active goals
  const setActiveGoals = useCallback(
    (ids: string[]) => {
      setActiveGoalIds(ids);

      // Update each goal's active state
      ids.forEach(id => {
        const goal = goalsService.getGoal(id);
        if (goal && !goal.isActive) {
          goalsService.updateGoal(id, { isActive: true });
        }
      });

      // Deactivate goals not in the list
      goals.forEach(g => {
        if (!ids.includes(g.id) && g.isActive) {
          goalsService.updateGoal(g.id, { isActive: false });
        }
      });

      setGoals(goalsService.getAllGoals());
    },
    [goals],
  );

  // Apply preset
  const applyPreset = useCallback((presetId: string): WritingGoal[] => {
    const createdGoals = goalsService.applyPreset(presetId);
    setGoals(goalsService.getAllGoals());
    setActiveGoalIds(goalsService.getActiveGoals().map(g => g.id));
    return createdGoals;
  }, []);

  // Calculate progress
  const calculateProgress = useCallback((content: string): Map<string, GoalProgress> => {
    return goalsService.calculateAllProgress(content);
  }, []);

  // Export goals
  const exportGoals = useCallback((): string => {
    return goalsService.exportGoals();
  }, []);

  // Import goals
  const importGoals = useCallback((data: string): WritingGoal[] => {
    const imported = goalsService.importGoals(data);
    setGoals(goalsService.getAllGoals());
    setActiveGoalIds(goalsService.getActiveGoals().map(g => g.id));
    return imported;
  }, []);

  // Update configuration
  const updateConfig = useCallback((updates: Partial<WritingGoalsConfig>) => {
    goalsService.updateConfig(updates);
  }, []);

  // Clear all goals
  const clearAllGoals = useCallback(() => {
    goalsService.clearAllGoals();
    setGoals([]);
    setActiveGoalIds([]);
    setGoalsProgress(new Map());
  }, []);

  // Get goal by ID
  const getGoalById = useCallback((id: string): WritingGoal | undefined => {
    return goalsService.getGoal(id);
  }, []);

  return {
    // Goals
    goals,
    activeGoals,
    activeGoalIds,

    // Presets
    presets,

    // Progress
    activeGoalsProgress: goalsProgress,

    // Goals with status
    goalsWithStatus,

    // Actions
    createGoal,
    updateGoal,
    deleteGoal,
    toggleGoalActive,
    setActiveGoals,
    applyPreset,
    calculateProgress,

    // Import/Export
    exportGoals,
    importGoals,

    // Configuration
    config: goalsService.getConfig(),
    updateConfig,

    // Utility
    clearAllGoals,
    getGoalById,
  };
}

export default useWritingGoals;
