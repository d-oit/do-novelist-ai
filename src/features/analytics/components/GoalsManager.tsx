import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  Plus,
  Edit3,
  Trash2,
  Calendar,
  BookOpen,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Trophy,
  Flame,
  X,
} from 'lucide-react';
import React, { useState, useMemo } from 'react';

import { logger } from '@/lib/logging/logger';

import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { cn, iconButtonTarget } from '../../../lib/utils';
import { useAnalytics } from '../hooks/useAnalytics';
import type { WritingGoals } from '../types';

interface GoalsManagerProps {
  projectId?: string;
  onClose?: () => void;
  className?: string;
}

const goalTypeIcons = {
  daily: Calendar,
  weekly: TrendingUp,
  monthly: Target,
  project: BookOpen,
};

const goalTypeColors = {
  daily: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  weekly: 'text-green-500 bg-green-500/10 border-green-500/20',
  monthly: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
  project: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
};

const GoalCard: React.FC<{
  goal: WritingGoals;
  onEdit: (goal: WritingGoals) => void;
  onDelete: (goalId: string) => void;
}> = ({ goal, onEdit, onDelete }) => {
  const IconComponent = goalTypeIcons[goal.type];
  const colorClass = goalTypeColors[goal.type];

  const progressPercentage = useMemo(() => {
    if (
      goal.target.words !== undefined &&
      goal.current.words !== undefined &&
      goal.current.words >= 0
    ) {
      return Math.min((goal.current.words / goal.target.words) * 100, 100);
    }
    if (
      goal.target.time !== undefined &&
      goal.current.time !== undefined &&
      goal.current.time >= 0
    ) {
      return Math.min((goal.current.time / goal.target.time) * 100, 100);
    }
    if (
      goal.target.chapters !== undefined &&
      goal.current.chapters !== undefined &&
      goal.current.chapters >= 0
    ) {
      return Math.min((goal.current.chapters / goal.target.chapters) * 100, 100);
    }
    return 0;
  }, [goal]);

  const isCompleted = progressPercentage >= 100;
  const isOverdue = goal.endDate !== undefined && new Date() > goal.endDate && !isCompleted;

  const getProgressText = (): string => {
    if (goal.target.words !== undefined) {
      return `${goal.current.words.toLocaleString()} / ${goal.target.words.toLocaleString()} words`;
    }
    if (goal.target.time !== undefined) {
      return `${Math.round(goal.current.time / 60)}h / ${Math.round(goal.target.time / 60)}h`;
    }
    if (goal.target.chapters !== undefined) {
      return `${goal.current.chapters} / ${goal.target.chapters} chapters`;
    }
    return '';
  };

  const getDaysRemaining = (): number | null => {
    if (goal.endDate === undefined) return null;
    const today = new Date();
    const diffTime = goal.endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = getDaysRemaining();

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
      <Card
        className={cn(
          'relative overflow-hidden p-4',
          isCompleted && 'bg-green-500/5 ring-2 ring-green-500/30',
          isOverdue && 'bg-red-500/5 ring-2 ring-red-500/30',
        )}
      >
        <div className='mb-3 flex items-start justify-between'>
          <div className='flex items-center gap-3'>
            <div className={cn('rounded-lg p-2', colorClass)}>
              <IconComponent className='h-4 w-4' />
            </div>
            <div>
              <div className='flex items-center gap-2'>
                <h4 className='text-sm font-medium capitalize'>{goal.type} Goal</h4>
                {isCompleted && <CheckCircle2 className='h-4 w-4 text-green-500' />}
                {isOverdue && <AlertCircle className='h-4 w-4 text-red-500' />}
              </div>
              <p className='text-xs text-muted-foreground'>
                Started {goal.startDate.toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className='flex items-center gap-1'>
            <button
              onClick={() => void onEdit(goal)}
              className={iconButtonTarget(
                'rounded opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100',
              )}
              aria-label='Edit goal'
            >
              <Edit3 className='h-4 w-4' />
            </button>
            <button
              onClick={() => void onDelete(goal.id)}
              className={iconButtonTarget(
                'rounded text-red-500 opacity-0 transition-opacity hover:bg-red-500/10 hover:text-red-600 group-hover:opacity-100',
              )}
              aria-label='Delete goal'
            >
              <Trash2 className='h-4 w-4' />
            </button>
            <button
              onClick={() => onDelete(goal.id)}
              className={iconButtonTarget(
                'rounded text-red-500 opacity-0 transition-opacity hover:bg-red-500/10 hover:text-red-600 group-hover:opacity-100',
              )}
              aria-label='Delete goal'
            >
              <Trash2 className='h-4 w-4' />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className='mb-3'>
          <div className='mb-2 flex items-center justify-between'>
            <span className='text-xs text-muted-foreground'>Progress</span>
            <span className='text-xs font-medium'>{Math.round(progressPercentage)}%</span>
          </div>
          <div className='h-2 w-full rounded-full bg-secondary/50'>
            <motion.div
              className={cn(
                'h-2 rounded-full',
                isCompleted ? 'bg-green-500' : isOverdue ? 'bg-red-500' : 'bg-primary',
              )}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Goal Details */}
        <div className='space-y-2 text-xs'>
          <div className='flex justify-between'>
            <span className='text-muted-foreground'>Target:</span>
            <span className='font-medium'>{getProgressText()}</span>
          </div>

          {daysRemaining !== null && (
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>
                {daysRemaining > 0
                  ? 'Days remaining:'
                  : daysRemaining === 0
                    ? 'Due today'
                    : 'Overdue by:'}
              </span>
              <span
                className={cn(
                  'font-medium',
                  daysRemaining <= 0
                    ? 'text-red-500'
                    : daysRemaining <= 3
                      ? 'text-orange-500'
                      : 'text-muted-foreground',
                )}
              >
                {daysRemaining > 0
                  ? `${daysRemaining} days`
                  : daysRemaining === 0
                    ? 'Today'
                    : `${Math.abs(daysRemaining)} days`}
              </span>
            </div>
          )}

          {isCompleted && (
            <div className='mt-3 flex items-center gap-1 rounded bg-green-500/10 p-2 text-green-600'>
              <Trophy className='h-3 w-3' />
              <span className='font-medium'>Goal Completed!</span>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

const GoalForm: React.FC<{
  goal?: WritingGoals;
  projectId?: string;
  onSave: (goal: Omit<WritingGoals, 'id' | 'current'>) => Promise<void>;
  onCancel: () => void;
}> = ({ goal, projectId, onSave, onCancel }) => {
  const [type, setType] = useState<WritingGoals['type']>(goal?.type ?? 'daily');
  const [targetWords, setTargetWords] = useState(goal?.target.words?.toString() ?? '');
  const [targetTime, setTargetTime] = useState(goal?.target.time?.toString() ?? '');
  const [targetChapters, setTargetChapters] = useState(goal?.target.chapters?.toString() ?? '');
  const [endDate, setEndDate] = useState(goal?.endDate?.toISOString().split('T')[0] ?? '');

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    const target: WritingGoals['target'] = {};
    if (targetWords) target.words = parseInt(targetWords, 10);
    if (targetTime) target.time = parseInt(targetTime, 10);
    if (targetChapters) target.chapters = parseInt(targetChapters, 10);

    const goalData: Omit<WritingGoals, 'id' | 'current'> = {
      type,
      target,
      startDate: goal?.startDate ?? new Date(),
      endDate: endDate ? new Date(endDate) : undefined,
      isActive: true,
      ...(projectId != null ? { projectId } : {}),
    };

    await onSave(goalData);
  };

  const getDefaultTarget = (): string => {
    switch (type) {
      case 'daily':
        return '500';
      case 'weekly':
        return '3500';
      case 'monthly':
        return '15000';
      case 'project':
        return '80000';
      default:
        return '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm'
    >
      <Card className='w-full max-w-md p-6'>
        <div className='mb-4 flex items-center justify-between'>
          <h3 className='font-serif text-lg font-semibold'>
            {goal ? 'Edit Goal' : 'Create New Goal'}
          </h3>
          <Button variant='ghost' size='sm' onClick={onCancel}>
            <X className='h-4 w-4' />
          </Button>
        </div>

        <form onSubmit={e => void handleSubmit(e)} className='space-y-4'>
          {/* Goal Type */}
          <div>
            <label className='mb-2 block text-sm font-medium'>Goal Type</label>
            <div className='grid grid-cols-2 gap-2'>
              {(['daily', 'weekly', 'monthly', 'project'] as const).map(t => (
                <button
                  key={t}
                  type='button'
                  onClick={() => {
                    setType(t);
                    if (!targetWords) setTargetWords(getDefaultTarget());
                  }}
                  className={cn(
                    'rounded-lg border p-3 text-sm font-medium capitalize transition-colors',
                    type === t
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-secondary hover:bg-secondary/80',
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Target Words */}
          <div>
            <label className='mb-2 block text-sm font-medium'>
              Target Words
              <span className='ml-1 text-muted-foreground'>(optional)</span>
            </label>
            <input
              type='number'
              value={targetWords}
              onChange={e => setTargetWords(e.target.value)}
              placeholder={getDefaultTarget()}
              className='w-full rounded-lg border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20'
            />
          </div>

          {/* Target Time */}
          <div>
            <label className='mb-2 block text-sm font-medium'>
              Target Time (minutes)
              <span className='ml-1 text-muted-foreground'>(optional)</span>
            </label>
            <input
              type='number'
              value={targetTime}
              onChange={e => setTargetTime(e.target.value)}
              placeholder='60'
              className='w-full rounded-lg border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20'
            />
          </div>

          {/* Target Chapters */}
          {(type === 'monthly' || type === 'project') && (
            <div>
              <label className='mb-2 block text-sm font-medium'>
                Target Chapters
                <span className='ml-1 text-muted-foreground'>(optional)</span>
              </label>
              <input
                type='number'
                value={targetChapters}
                onChange={e => setTargetChapters(e.target.value)}
                placeholder='5'
                className='w-full rounded-lg border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20'
              />
            </div>
          )}

          {/* End Date */}
          {type !== 'daily' && (
            <div>
              <label className='mb-2 block text-sm font-medium'>
                End Date
                <span className='ml-1 text-muted-foreground'>(optional)</span>
              </label>
              <input
                type='date'
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className='w-full rounded-lg border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20'
              />
            </div>
          )}

          <div className='flex gap-2 pt-4'>
            <Button type='submit' className='flex-1'>
              {goal ? 'Update Goal' : 'Create Goal'}
            </Button>
            <Button type='button' variant='outline' onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </motion.div>
  );
};

const GoalsManager: React.FC<GoalsManagerProps> = ({ projectId, onClose, className }) => {
  const analytics = useAnalytics();
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<WritingGoals | undefined>();

  const handleCreateGoal = async (
    goalData: Omit<WritingGoals, 'id' | 'current'>,
  ): Promise<void> => {
    try {
      await analytics.createGoal(goalData);
      setShowForm(false);
      setEditingGoal(undefined);
    } catch (error) {
      console.error('Failed to create goal:', error);
    }
  };

  const handleEditGoal = (goal: WritingGoals): void => {
    setEditingGoal(goal);
    setShowForm(true);
  };

  const handleDeleteGoal = (goalId: string): void => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      // Implementation would call analytics service to delete goal
      logger.info('Delete goal:', { goalId });
    }
  };

  const activeGoals = analytics.goals.filter(goal => goal.isActive);
  const completedGoals = analytics.goals.filter(goal => !goal.isActive);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <Target className='h-6 w-6 text-primary' />
          <div>
            <h2 className='font-serif text-xl font-semibold'>Writing Goals</h2>
            <p className='text-sm text-muted-foreground'>Set and track your writing targets</p>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <Button onClick={() => setShowForm(true)} className='text-sm'>
            <Plus className='mr-1 h-4 w-4' />
            New Goal
          </Button>
          {onClose && (
            <Button variant='outline' onClick={onClose} className='text-sm'>
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div>
          <h3 className='mb-4 flex items-center gap-2 text-lg font-medium'>
            <Flame className='h-5 w-5 text-orange-500' />
            Active Goals ({activeGoals.length})
          </h3>
          <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
            {activeGoals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={handleEditGoal}
                onDelete={handleDeleteGoal}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div>
          <h3 className='mb-4 flex items-center gap-2 text-lg font-medium'>
            <Trophy className='h-5 w-5 text-green-500' />
            Completed Goals ({completedGoals.length})
          </h3>
          <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
            {completedGoals.slice(0, 4).map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={handleEditGoal}
                onDelete={handleDeleteGoal}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {activeGoals.length === 0 && completedGoals.length === 0 && (
        <div className='py-12 text-center'>
          <Target className='mx-auto mb-4 h-12 w-12 text-muted-foreground/50' />
          <h3 className='mb-2 text-lg font-medium'>No Goals Set</h3>
          <p className='mb-4 text-muted-foreground'>
            Create your first writing goal to start tracking progress
          </p>
          <Button onClick={() => setShowForm(true)}>
            <Plus className='mr-1 h-4 w-4' />
            Create Your First Goal
          </Button>
        </div>
      )}

      {/* Goal Form Modal */}
      <AnimatePresence>
        {showForm && (
          <GoalForm
            goal={editingGoal}
            projectId={projectId}
            onSave={handleCreateGoal}
            onCancel={() => {
              setShowForm(false);
              setEditingGoal(undefined);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default GoalsManager;
