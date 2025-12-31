/**
 * WritingGoalsPanel Component
 * UI for managing writing goals including creation, presets, and progress display
 */

import React, { useCallback } from 'react';

import { useWritingGoals } from '@/features/writing-assistant/hooks/useWritingGoals';
import type { WritingGoal, GoalPreset, GoalProgress } from '@/features/writing-assistant/types';
import { cn } from '@/lib/utils';

import { GoalCreateForm } from './GoalCreateForm';
import { GoalsImportExport } from './GoalsImportExport';
import { GoalsList } from './GoalsList';
import { GoalsPanelHeader } from './GoalsPanelHeader';
import { GoalsPresetSelector } from './GoalsPresetSelector';
import { useGoalsPanelState } from './useGoalsPanelState';

// ============================================================================
// Component
// ============================================================================

interface WritingGoalsPanelProps {
  content?: string;
  className?: string;
  onGoalProgressChange?: (progress: Map<string, GoalProgress>) => void;
}

export const WritingGoalsPanel: React.FC<WritingGoalsPanelProps> = ({
  content = '',
  className,
  onGoalProgressChange,
}) => {
  const {
    goals,
    activeGoals,
    presets,
    activeGoalsProgress,
    createGoal,
    updateGoal,
    deleteGoal,
    toggleGoalActive,
    applyPreset,
    exportGoals,
    importGoals,
  } = useWritingGoals({ content, autoTrackProgress: true });

  const {
    isCreating,
    editingId,
    showPresets,
    showImportExport,
    handleStartCreate,
    handleCancelCreate,
    handleStartEdit,
    handleCancelEdit,
    handleTogglePresets,
    handleToggleImportExport,
    handleClosePresets,
    handleCloseImportExport,
  } = useGoalsPanelState();

  // Notify progress changes
  React.useEffect(() => {
    onGoalProgressChange?.(activeGoalsProgress);
  }, [activeGoalsProgress, onGoalProgressChange]);

  // Handle create goal
  const handleCreateGoal = useCallback(
    (goalData: Omit<WritingGoal, 'id' | 'createdAt' | 'updatedAt'>) => {
      createGoal(goalData);
      handleCancelCreate();
    },
    [createGoal, handleCancelCreate],
  );

  // Handle apply preset
  const handleApplyPreset = useCallback(
    (preset: GoalPreset) => {
      applyPreset(preset.id);
      handleClosePresets();
    },
    [applyPreset, handleClosePresets],
  );

  // Handle import
  const handleImport = useCallback(
    (data: string) => {
      importGoals(data);
      handleCloseImportExport();
    },
    [importGoals, handleCloseImportExport],
  );

  return (
    <div className={cn('rounded-lg bg-white shadow-sm dark:bg-gray-800', className)}>
      <GoalsPanelHeader
        activeCount={activeGoals.length}
        onTogglePresets={handleTogglePresets}
        onToggleImportExport={handleToggleImportExport}
        onCreateNew={handleStartCreate}
      />

      {showPresets && <GoalsPresetSelector presets={presets} onApplyPreset={handleApplyPreset} />}

      {showImportExport && (
        <GoalsImportExport
          onExport={exportGoals}
          onImport={handleImport}
          onClose={handleCloseImportExport}
        />
      )}

      {isCreating && <GoalCreateForm onCancel={handleCancelCreate} onCreate={handleCreateGoal} />}

      <div className='max-h-[400px] overflow-y-auto'>
        <GoalsList
          goals={goals}
          activeGoalsProgress={activeGoalsProgress}
          editingId={editingId}
          onToggleActive={toggleGoalActive}
          onStartEdit={handleStartEdit}
          onCancelEdit={handleCancelEdit}
          onSave={updateGoal}
          onDelete={deleteGoal}
        />
      </div>
    </div>
  );
};

export default WritingGoalsPanel;
