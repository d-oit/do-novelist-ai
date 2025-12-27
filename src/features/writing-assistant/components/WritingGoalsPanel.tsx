/**
 * WritingGoalsPanel Component
 * UI for managing writing goals including creation, presets, and progress display
 */

import {
  Plus,
  Trash2,
  Target,
  Check,
  ChevronDown,
  ChevronUp,
  Edit2,
  RotateCcw,
  Download,
} from 'lucide-react';
import React, { useState, useCallback } from 'react';

import { useWritingGoals } from '@/features/writing-assistant/hooks/useWritingGoals';
import type { WritingGoal, GoalPreset, GoalProgress } from '@/features/writing-assistant/types';
import { cn } from '@/lib/utils';

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

  // UI state
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [importData, setImportData] = useState('');

  // New goal form state
  const [newGoal, setNewGoal] = useState<Partial<WritingGoal>>({
    name: '',
    description: '',
    isActive: true,
  });

  // Notify progress changes
  React.useEffect(() => {
    onGoalProgressChange?.(activeGoalsProgress);
  }, [activeGoalsProgress, onGoalProgressChange]);

  // Handle create goal
  const handleCreateGoal = useCallback(() => {
    if (!newGoal.name) return;

    createGoal({
      ...newGoal,
      name: newGoal.name,
      description: newGoal.description || `Goal: ${newGoal.name}`,
      isActive: newGoal.isActive ?? true,
      targetReadability: newGoal.targetReadability,
      targetLength: newGoal.targetLength,
      targetTone: newGoal.targetTone,
      targetStyle: newGoal.targetStyle,
    } as Omit<WritingGoal, 'id' | 'createdAt' | 'updatedAt'>);

    setNewGoal({ name: '', description: '', isActive: true });
    setIsCreating(false);
  }, [newGoal, createGoal]);

  // Handle apply preset
  const handleApplyPreset = useCallback(
    (preset: GoalPreset) => {
      applyPreset(preset.id);
      setShowPresets(false);
    },
    [applyPreset],
  );

  // Handle import
  const handleImport = useCallback(() => {
    if (!importData.trim()) return;
    importGoals(importData);
    setImportData('');
    setShowImportExport(false);
  }, [importData, importGoals]);

  return (
    <div className={cn('rounded-lg bg-white shadow-sm dark:bg-gray-800', className)}>
      {/* Header */}
      <div className='flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700'>
        <div className='flex items-center gap-2'>
          <Target className='h-5 w-5 text-indigo-500' />
          <h3 className='font-semibold text-gray-900 dark:text-white'>Writing Goals</h3>
          <span className='text-xs text-gray-500 dark:text-gray-400'>
            {activeGoals.length} active
          </span>
        </div>
        <div className='flex items-center gap-2'>
          <button
            onClick={() => setShowPresets(!showPresets)}
            className='rounded p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700'
            title='Apply preset'
          >
            <RotateCcw className='h-4 w-4' />
          </button>
          <button
            onClick={() => setShowImportExport(!showImportExport)}
            className='rounded p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700'
            title='Import/Export'
          >
            <Download className='h-4 w-4' />
          </button>
          <button
            onClick={() => setIsCreating(true)}
            className='flex items-center gap-1 rounded bg-indigo-500 px-2 py-1 text-sm text-white transition-colors hover:bg-indigo-600'
          >
            <Plus className='h-4 w-4' />
            New Goal
          </button>
        </div>
      </div>

      {/* Presets dropdown */}
      {showPresets && (
        <div className='border-b border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50'>
          <h4 className='mb-2 text-sm font-medium'>Apply Preset</h4>
          <div className='grid grid-cols-2 gap-2'>
            {presets.map(preset => (
              <button
                key={preset.id}
                onClick={() => handleApplyPreset(preset)}
                className={cn(
                  'rounded-lg border p-3 text-left',
                  'hover:bg-indigo-50 dark:hover:bg-indigo-900/20',
                  'border-gray-200 dark:border-gray-700',
                  'transition-colors',
                )}
              >
                <div className='text-sm font-medium'>{preset.name}</div>
                <div className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                  {preset.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Import/Export */}
      {showImportExport && (
        <div className='border-b border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50'>
          <div className='space-y-3'>
            <div>
              <label className='mb-1 block text-sm font-medium'>Export Goals</label>
              <button
                onClick={() => {
                  void navigator.clipboard.writeText(exportGoals());
                }}
                className='text-sm text-indigo-600 hover:underline dark:text-indigo-400'
              >
                Copy to clipboard
              </button>
            </div>
            <div>
              <label className='mb-1 block text-sm font-medium'>Import Goals</label>
              <textarea
                value={importData}
                onChange={e => setImportData(e.target.value)}
                placeholder='Paste exported goals JSON...'
                className={cn(
                  'w-full rounded border p-2 text-sm',
                  'bg-white dark:bg-gray-800',
                  'border-gray-200 dark:border-gray-700',
                )}
                rows={3}
              />
              <button
                onClick={() => {
                  void handleImport();
                }}
                disabled={!importData.trim()}
                className={cn(
                  'mt-2 rounded px-3 py-1 text-sm',
                  'bg-indigo-500 text-white',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                )}
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create goal form */}
      {isCreating && (
        <div className='border-b border-gray-200 p-4 dark:border-gray-700'>
          <div className='space-y-3'>
            <input
              type='text'
              value={newGoal.name || ''}
              onChange={e => setNewGoal(prev => ({ ...prev, name: e.target.value }))}
              placeholder='Goal name...'
              className={cn(
                'w-full rounded border px-3 py-2',
                'bg-white dark:bg-gray-800',
                'border-gray-200 dark:border-gray-700',
              )}
            />
            <input
              type='text'
              value={newGoal.description || ''}
              onChange={e => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
              placeholder='Description (optional)...'
              className={cn(
                'w-full rounded border px-3 py-2',
                'bg-white dark:bg-gray-800',
                'border-gray-200 dark:border-gray-700',
              )}
            />
            <div className='flex items-center gap-2'>
              <label className='flex items-center gap-2 text-sm'>
                <input
                  type='checkbox'
                  checked={newGoal.isActive ?? true}
                  onChange={e => setNewGoal(prev => ({ ...prev, isActive: e.target.checked }))}
                  className='rounded'
                />
                Active
              </label>
            </div>
            <div className='flex justify-end gap-2'>
              <button
                onClick={() => setIsCreating(false)}
                className='rounded px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGoal}
                disabled={!newGoal.name}
                className={cn(
                  'rounded px-3 py-1.5 text-sm',
                  'bg-indigo-500 text-white',
                  'disabled:opacity-50',
                )}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Goals list */}
      <div className='max-h-[400px] overflow-y-auto'>
        {goals.length === 0 ? (
          <div className='p-8 text-center text-gray-500 dark:text-gray-400'>
            <Target className='mx-auto mb-3 h-12 w-12 opacity-50' />
            <p>No goals yet</p>
            <p className='mt-1 text-sm'>Create a goal or apply a preset to get started</p>
          </div>
        ) : (
          <div className='divide-y divide-gray-100 dark:divide-gray-700'>
            {goals.map(goal => (
              <GoalItem
                key={goal.id}
                goal={goal}
                progress={activeGoalsProgress.get(goal.id)}
                isEditing={editingId === goal.id}
                onToggleActive={() => toggleGoalActive(goal.id)}
                onStartEdit={() => setEditingId(goal.id)}
                onCancelEdit={() => setEditingId(null)}
                onSave={updates => {
                  updateGoal(goal.id, updates);
                  setEditingId(null);
                }}
                onDelete={() => deleteGoal(goal.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Goal Item Component
// ============================================================================

interface GoalItemProps {
  goal: WritingGoal;
  progress?: GoalProgress;
  isEditing: boolean;
  onToggleActive: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: (updates: Partial<WritingGoal>) => void;
  onDelete: () => void;
}

const GoalItem: React.FC<GoalItemProps> = ({
  goal,
  progress,
  isEditing,
  onToggleActive,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const [draftName, setDraftName] = useState(goal.name);
  const [draftDescription, setDraftDescription] = useState(goal.description);
  const [draftMinVocabDiversity, setDraftMinVocabDiversity] = useState<number | ''>(
    goal.targetVocabulary?.minVocabularyDiversity !== undefined
      ? Math.round(goal.targetVocabulary.minVocabularyDiversity * 100)
      : '',
  );

  React.useEffect(() => {
    if (!isEditing) return;
    setDraftName(goal.name);
    setDraftDescription(goal.description);
    setDraftMinVocabDiversity(
      goal.targetVocabulary?.minVocabularyDiversity !== undefined
        ? Math.round(goal.targetVocabulary.minVocabularyDiversity * 100)
        : '',
    );
  }, [goal, isEditing]);

  return (
    <div className={cn('p-4', !goal.isActive && 'opacity-60')}>
      <div className='flex items-start gap-3'>
        {/* Active toggle */}
        <button
          onClick={onToggleActive}
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded border-2',
            'transition-colors',
            goal.isActive
              ? 'border-indigo-500 bg-indigo-500 text-white'
              : 'border-gray-300 dark:border-gray-600',
          )}
          aria-label={goal.isActive ? 'Deactivate goal' : 'Activate goal'}
        >
          {goal.isActive && <Check className='h-3 w-3' />}
        </button>

        {/* Goal info */}
        <div className='min-w-0 flex-1'>
          {isEditing ? (
            <div className='space-y-2'>
              <div className='space-y-2'>
                <input
                  type='text'
                  value={draftName}
                  onChange={e => setDraftName(e.target.value)}
                  className={cn(
                    'w-full rounded border px-2 py-1 text-sm',
                    'bg-white dark:bg-gray-800',
                    'border-gray-200 dark:border-gray-700',
                  )}
                  aria-label='Goal name'
                />
                <input
                  type='text'
                  value={draftDescription}
                  onChange={e => setDraftDescription(e.target.value)}
                  className={cn(
                    'w-full rounded border px-2 py-1 text-sm',
                    'bg-white dark:bg-gray-800',
                    'border-gray-200 dark:border-gray-700',
                  )}
                  aria-label='Goal description'
                />
              </div>

              <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
                <label className='text-xs text-gray-600 dark:text-gray-400'>
                  Min vocabulary diversity (%)
                  <input
                    type='number'
                    min={0}
                    max={100}
                    value={draftMinVocabDiversity}
                    onChange={e => {
                      const raw = e.target.value;
                      setDraftMinVocabDiversity(raw === '' ? '' : Number(raw));
                    }}
                    className={cn(
                      'mt-1 w-full rounded border px-2 py-1 text-sm',
                      'bg-white dark:bg-gray-800',
                      'border-gray-200 dark:border-gray-700',
                    )}
                    aria-label='Min vocabulary diversity'
                  />
                </label>
              </div>

              <div className='flex justify-end gap-2'>
                <button
                  onClick={onCancelEdit}
                  className='rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!draftName.trim()) return;

                    const minVocabRatio =
                      draftMinVocabDiversity === ''
                        ? undefined
                        : Math.min(1, Math.max(0, draftMinVocabDiversity / 100));

                    onSave({
                      name: draftName.trim(),
                      description: draftDescription.trim(),
                      targetVocabulary:
                        minVocabRatio === undefined
                          ? undefined
                          : {
                              ...goal.targetVocabulary,
                              minVocabularyDiversity: minVocabRatio,
                            },
                    });
                  }}
                  className={cn(
                    'rounded bg-indigo-500 px-2 py-1 text-xs text-white',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                  )}
                  disabled={!draftName.trim()}
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className='flex items-center gap-2'>
                <h4 className='truncate font-medium text-gray-900 dark:text-white'>{goal.name}</h4>
                {progress?.isAchieved && (
                  <span className='rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-300'>
                    Achieved
                  </span>
                )}
              </div>
              {goal.description && (
                <p className='mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400'>
                  {goal.description}
                </p>
              )}

              {/* Progress bar */}
              {progress && (
                <div className='mt-2'>
                  <div className='mb-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400'>
                    <span>Progress</span>
                    <span>{progress.progress}%</span>
                  </div>
                  <div className='h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700'>
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-300',
                        progress.isAchieved ? 'bg-green-500' : 'bg-indigo-500',
                      )}
                      style={{ width: `${progress.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Goal targets */}
              {(goal.targetReadability ||
                goal.targetLength ||
                goal.targetTone ||
                goal.targetVocabulary) && (
                <>
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className='mt-2 flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  >
                    {isExpanded ? (
                      <ChevronUp className='h-3 w-3' />
                    ) : (
                      <ChevronDown className='h-3 w-3' />
                    )}
                    {isExpanded ? 'Hide targets' : 'Show targets'}
                  </button>

                  {isExpanded && (
                    <div className='mt-2 space-y-1 rounded bg-gray-50 p-2 text-xs dark:bg-gray-900/50'>
                      {goal.targetReadability && (
                        <div className='flex justify-between'>
                          <span className='text-gray-500'>Readability:</span>
                          <span>
                            {goal.targetReadability.minScore ?? 0}-
                            {goal.targetReadability.maxScore ?? 100} Flesch
                          </span>
                        </div>
                      )}
                      {goal.targetLength && (
                        <div className='flex justify-between'>
                          <span className='text-gray-500'>Length:</span>
                          <span>
                            {goal.targetLength.targetWords
                              ? `${goal.targetLength.targetWords} words`
                              : `${goal.targetLength.minWords ?? 0}-${goal.targetLength.maxWords ?? '∞'} words`}
                          </span>
                        </div>
                      )}
                      {goal.targetTone && (
                        <div className='flex justify-between'>
                          <span className='text-gray-500'>Tone:</span>
                          <span>{goal.targetTone.primary}</span>
                        </div>
                      )}
                      {goal.targetVocabulary?.minVocabularyDiversity !== undefined && (
                        <div className='flex justify-between'>
                          <span className='text-gray-500'>Vocab diversity:</span>
                          <span>
                            {Math.round(goal.targetVocabulary.minVocabularyDiversity * 100)}%
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className='flex items-center gap-1'>
          <button
            onClick={isEditing ? onCancelEdit : onStartEdit}
            className='rounded p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700'
            title={isEditing ? 'Cancel' : 'Edit'}
            aria-label={isEditing ? 'Cancel edit goal' : 'Edit goal'}
          >
            <Edit2 className='h-4 w-4' />
          </button>
          <button
            onClick={onDelete}
            className='rounded p-1.5 text-red-600 transition-colors hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30'
            title='Delete'
            aria-label='Delete goal'
          >
            <Trash2 className='h-4 w-4' />
          </button>
        </div>
      </div>
    </div>
  );
};

export default WritingGoalsPanel;
