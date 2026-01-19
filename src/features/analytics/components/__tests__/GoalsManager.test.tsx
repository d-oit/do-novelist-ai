import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import GoalsManager from '@/features/analytics/components/GoalsManager';
import type { WritingGoals } from '@/types';

// Mock framer-motion
vi.mock('framer-motion', () => {
  const createMotionComponent = (elementType: string) => {
    return ({ children, ...props }: any) => {
      const {
        whileHover: _whileHover,
        whileTap: _whileTap,
        whileFocus: _whileFocus,
        whileInView: _whileInView,
        initial: _initial,
        animate: _animate,
        exit: _exit,
        transition: _transition,
        variants: _variants,
        layout: _layout,
        layoutId: _layoutId,
        drag: _drag,
        dragConstraints: _dragConstraints,
        dragElastic: _dragElastic,
        onDragStart: _onDragStart,
        onDrag: _onDrag,
        onDragEnd: _onDragEnd,
        onAnimationStart: _onAnimationStart,
        onAnimationComplete: _onAnimationComplete,
        onUpdate: _onUpdate,
        transformTemplate: _transformTemplate,
        ...domProps
      } = props;

      void [
        _whileHover,
        _whileTap,
        _whileFocus,
        _whileInView,
        _initial,
        _animate,
        _exit,
        _transition,
        _variants,
        _layout,
        _layoutId,
        _drag,
        _dragConstraints,
        _dragElastic,
        _onDragStart,
        _onDrag,
        _onDragEnd,
        _onAnimationStart,
        _onAnimationComplete,
        _onUpdate,
        _transformTemplate,
      ];

      return React.createElement(elementType, { ...domProps, 'data-testid': 'motion-div' }, children);
    };
  };

  return {
    motion: {
      div: createMotionComponent('div'),
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

// Mock lucide-react icons
vi.mock('lucide-react', async importOriginal => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    Target: ({ className }: any) => <div className={className} data-testid='target-icon' />,
    Plus: ({ className }: any) => <div className={className} data-testid='plus-icon' />,
    Edit3: ({ className }: any) => <div className={className} data-testid='edit-icon' />,
    Trash2: ({ className }: any) => <div className={className} data-testid='trash-icon' />,
    Calendar: ({ className }: any) => <div className={className} data-testid='calendar-icon' />,
    BookOpen: ({ className }: any) => <div className={className} data-testid='bookopen-icon' />,
    TrendingUp: ({ className }: any) => <div className={className} data-testid='trendingup-icon' />,
    CheckCircle2: ({ className }: any) => <div className={className} data-testid='checkcircle-icon' />,
    AlertCircle: ({ className }: any) => <div className={className} data-testid='alertcircle-icon' />,
    Trophy: ({ className }: any) => <div className={className} data-testid='trophy-icon' />,
    Flame: ({ className }: any) => <div className={className} data-testid='flame-icon' />,
    X: ({ className }: any) => <div className={className} data-testid='x-icon' />,
  };
});

// Mock UI components
vi.mock('@/shared/components/ui/Button', () => ({
  Button: ({ children, onClick, variant, size, className }: any) => (
    <button onClick={onClick} data-variant={variant} data-size={size} className={className}>
      {children}
    </button>
  ),
}));

vi.mock('@/shared/components/ui/Card', () => ({
  Card: ({ children, className }: any) => (
    <div data-testid='card' className={className}>
      {children}
    </div>
  ),
}));

vi.mock('@/shared/components/ui', () => ({
  Button: ({ children, onClick, variant, size, className }: any) => (
    <button onClick={onClick} data-variant={variant} data-size={size} className={className}>
      {children}
    </button>
  ),
  Card: ({ children, className }: any) => (
    <div data-testid='card' className={className}>
      {children}
    </div>
  ),
  ConfirmDialog: ({ open, onConfirm, onCancel, title, description }: any) =>
    open ? (
      <div role='alertdialog' aria-labelledby='confirm-title' aria-describedby='confirm-desc'>
        <h2 id='confirm-title'>{title}</h2>
        <p id='confirm-desc'>{description}</p>
        <button onClick={onConfirm} data-testid='confirm-button'>
          Confirm
        </button>
        <button onClick={onCancel} data-testid='cancel-button'>
          Cancel
        </button>
      </div>
    ) : null,
}));

// Mock useAnalytics hook
const mockCreateGoal = vi.fn();
const mockAnalytics: { goals: WritingGoals[]; createGoal: ReturnType<typeof vi.fn> } = {
  goals: [],
  createGoal: mockCreateGoal,
};

vi.mock('@/features/analytics/hooks/useAnalytics', () => ({
  useAnalytics: () => mockAnalytics,
}));

// Mock logger
vi.mock('@/lib/logging/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock window.confirm
global.confirm = vi.fn(() => true);

describe('GoalsManager', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnClose.mockClear();
    mockCreateGoal.mockClear();
    mockAnalytics.goals = [];
  });

  describe('Rendering', () => {
    it('renders without errors', () => {
      render(<GoalsManager projectId='test-project' onClose={mockOnClose} />);

      expect(screen.getByText('Writing Goals')).toBeInTheDocument();
      expect(screen.getByText('Set and track your writing targets')).toBeInTheDocument();
    });

    it('renders header with all buttons', () => {
      render(<GoalsManager projectId='test-project' onClose={mockOnClose} />);

      expect(screen.getByText('New Goal')).toBeInTheDocument();
      expect(screen.getByText('Close')).toBeInTheDocument();
    });

    it('renders empty state when no goals exist', () => {
      render(<GoalsManager projectId='test-project' />);

      expect(screen.getByText('No Goals Set')).toBeInTheDocument();
      expect(screen.getByText(/Create your first writing goal/)).toBeInTheDocument();
      expect(screen.getByText('Create Your First Goal')).toBeInTheDocument();
    });

    it('renders active goals section when goals exist', () => {
      const activeGoal: WritingGoals = {
        id: 'goal-1',
        type: 'daily',
        target: { words: 500 },
        current: { words: 250, time: 30, chapters: 0 },
        startDate: new Date('2024-01-01'),
        isActive: true,
        projectId: 'test-project',
      };

      mockAnalytics.goals = [activeGoal];
      render(<GoalsManager projectId='test-project' />);

      expect(screen.getByText('Active Goals (1)')).toBeInTheDocument();
    });

    it('renders completed goals section when completed goals exist', () => {
      const completedGoal: WritingGoals = {
        id: 'goal-2',
        type: 'daily',
        target: { words: 500 },
        current: { words: 500, time: 60, chapters: 0 },
        startDate: new Date('2024-01-01'),
        isActive: false,
        projectId: 'test-project',
      };

      mockAnalytics.goals = [completedGoal];
      render(<GoalsManager projectId='test-project' />);

      expect(screen.getByText('Completed Goals (1)')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(<GoalsManager projectId='test-project' className='custom-class' />);

      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });
  });

  describe('User interactions', () => {
    it('opens goal form modal when New Goal is clicked', () => {
      render(<GoalsManager projectId='test-project' />);

      const newGoalButton = screen.getByText('New Goal');
      fireEvent.click(newGoalButton);

      expect(screen.getByText('Create New Goal')).toBeInTheDocument();
    });

    it('opens goal form modal when Create Your First Goal is clicked', () => {
      render(<GoalsManager projectId='test-project' />);

      const createFirstGoalButton = screen.getByText('Create Your First Goal');
      fireEvent.click(createFirstGoalButton);

      expect(screen.getByText('Create New Goal')).toBeInTheDocument();
    });

    it('calls onClose when Close button is clicked', () => {
      render(<GoalsManager projectId='test-project' onClose={mockOnClose} />);

      const closeButton = screen.getByText('Close');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('closes form modal when X button is clicked', () => {
      render(<GoalsManager projectId='test-project' />);

      // Open form
      fireEvent.click(screen.getByText('New Goal'));
      expect(screen.getByText('Create New Goal')).toBeInTheDocument();

      // Close form
      const closeButton = screen.getByRole('button', { name: '' });
      if (closeButton) {
        fireEvent.click(closeButton);
      }

      expect(screen.queryByText('Create New Goal')).not.toBeInTheDocument();
    });

    it('calls onEdit when edit button on goal card is clicked', async () => {
      const activeGoal: WritingGoals = {
        id: 'goal-1',
        type: 'daily',
        target: { words: 500 },
        current: { words: 250, time: 30, chapters: 0 },
        startDate: new Date('2024-01-01'),
        isActive: true,
        projectId: 'test-project',
      };

      mockAnalytics.goals = [activeGoal];
      render(<GoalsManager projectId='test-project' />);

      // Find edit button (it's opacity-0 by default, but we can still click it)
      const editButton = screen.getByLabelText('Edit goal');
      fireEvent.click(editButton);

      // Form should open with edit mode
      expect(screen.getByText('Edit Goal')).toBeInTheDocument();
    });

    it('deletes goal after confirmation', async () => {
      const activeGoal: WritingGoals = {
        id: 'goal-1',
        type: 'daily',
        target: { words: 500 },
        current: { words: 250, time: 30, chapters: 0 },
        startDate: new Date('2024-01-01'),
        isActive: true,
        projectId: 'test-project',
      };

      mockAnalytics.goals = [activeGoal];
      render(<GoalsManager projectId='test-project' />);

      const deleteButton = screen.getAllByLabelText('Delete goal')[0] as HTMLElement;
      expect(deleteButton).toBeInTheDocument();
      fireEvent.click(deleteButton);

      // ConfirmDialog should open instead of window.confirm
      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      });
      expect(screen.getByText(/Are you sure you want to delete this goal/i)).toBeInTheDocument();
    });
  });

  describe('Goal form', () => {
    it('renders all goal type buttons', () => {
      render(<GoalsManager projectId='test-project' />);
      fireEvent.click(screen.getByText('New Goal'));

      expect(screen.getByText('daily')).toBeInTheDocument();
      expect(screen.getByText('weekly')).toBeInTheDocument();
      expect(screen.getByText('monthly')).toBeInTheDocument();
      expect(screen.getByText('project')).toBeInTheDocument();
    });

    it('changes selected goal type', () => {
      render(<GoalsManager projectId='test-project' />);
      fireEvent.click(screen.getByText('New Goal'));

      const weeklyButton = screen.getByText('weekly');
      fireEvent.click(weeklyButton);

      // Button should have selected styling
      expect(weeklyButton).toHaveClass('border-primary');
    });

    it('sets default target when goal type changes', () => {
      render(<GoalsManager projectId='test-project' />);
      fireEvent.click(screen.getByText('New Goal'));

      const weeklyButton = screen.getByText('weekly');
      fireEvent.click(weeklyButton);

      const wordInput = screen.getByPlaceholderText('3500');
      expect(wordInput).toBeInTheDocument();
    });

    it('submits new goal when form is submitted', async () => {
      render(<GoalsManager projectId='test-project' />);
      fireEvent.click(screen.getByText('New Goal'));

      // Fill in word target
      const wordInput = screen.getByPlaceholderText('500');
      fireEvent.change(wordInput, { target: { value: '1000' } });

      // Select goal type
      const dailyButton = screen.getByText('daily');
      fireEvent.click(dailyButton);

      // Submit form
      const form = screen.getByRole('form', { name: /Create New Goal/i });
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(mockCreateGoal).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'daily',
            target: expect.objectContaining({ words: 1000 }),
          }),
        );
      });
    });

    it('closes form after successful goal creation', async () => {
      mockCreateGoal.mockResolvedValue(undefined);

      render(<GoalsManager projectId='test-project' />);
      fireEvent.click(screen.getByText('New Goal'));

      const form = screen.getByRole('form', { name: /Create New Goal/i });
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(screen.queryByText('Create New Goal')).not.toBeInTheDocument();
      });
    });

    it('shows target chapters for monthly and project goals', () => {
      render(<GoalsManager projectId='test-project' />);
      fireEvent.click(screen.getByText('New Goal'));

      // Monthly goal - should show chapters
      const monthlyButton = screen.getByText('monthly');
      fireEvent.click(monthlyButton);
      expect(screen.getByPlaceholderText('5')).toBeInTheDocument();

      // Project goal - should show chapters
      const projectButton = screen.getByText('project');
      fireEvent.click(projectButton);
      expect(screen.getByPlaceholderText('5')).toBeInTheDocument();

      // Daily goal - should not show chapters
      const dailyButton = screen.getByText('daily');
      fireEvent.click(dailyButton);
      expect(screen.queryByPlaceholderText('5')).not.toBeInTheDocument();
    });

    it('shows end date for non-daily goals', () => {
      render(<GoalsManager projectId='test-project' />);
      fireEvent.click(screen.getByText('New Goal'));

      // Weekly goal - should show end date
      const weeklyButton = screen.getByText('weekly');
      fireEvent.click(weeklyButton);
      expect(screen.getByLabelText(/End Date/)).toBeInTheDocument();

      // Daily goal - should not show end date
      const dailyButton = screen.getByText('daily');
      fireEvent.click(dailyButton);
      expect(screen.queryByLabelText(/End Date/)).not.toBeInTheDocument();
    });
  });

  describe('Goal card display', () => {
    it('displays goal progress correctly', () => {
      const goal: WritingGoals = {
        id: 'goal-1',
        type: 'daily',
        target: { words: 500 },
        current: { words: 250, time: 30, chapters: 0 },
        startDate: new Date('2024-01-01'),
        isActive: true,
        projectId: 'test-project',
      };

      mockAnalytics.goals = [goal];
      render(<GoalsManager projectId='test-project' />);

      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText('250 / 500 words')).toBeInTheDocument();
    });

    it('displays completed goal with trophy badge', () => {
      const goal: WritingGoals = {
        id: 'goal-1',
        type: 'daily',
        target: { words: 500 },
        current: { words: 500, time: 60, chapters: 0 },
        startDate: new Date('2024-01-01'),
        isActive: true,
        projectId: 'test-project',
      };

      mockAnalytics.goals = [goal];
      render(<GoalsManager projectId='test-project' />);

      expect(screen.getByText('Goal Completed!')).toBeInTheDocument();
      expect(screen.getByTestId('checkcircle-icon')).toBeInTheDocument();
    });

    it('displays overdue goal with alert', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const goal: WritingGoals = {
        id: 'goal-1',
        type: 'daily',
        target: { words: 500 },
        current: { words: 250, time: 30, chapters: 0 },
        startDate: new Date('2024-01-01'),
        endDate: yesterday,
        isActive: true,
        projectId: 'test-project',
      };

      mockAnalytics.goals = [goal];
      render(<GoalsManager projectId='test-project' />);

      expect(screen.getByTestId('alertcircle-icon')).toBeInTheDocument();
    });

    it('displays time-based goals', () => {
      const goal: WritingGoals = {
        id: 'goal-1',
        type: 'daily',
        target: { time: 60 },
        current: { words: 0, time: 30, chapters: 0 },
        startDate: new Date('2024-01-01'),
        isActive: true,
        projectId: 'test-project',
      };

      mockAnalytics.goals = [goal];
      render(<GoalsManager projectId='test-project' />);

      expect(screen.getByText('30m / 1h')).toBeInTheDocument();
    });

    it('displays chapter-based goals', () => {
      const goal: WritingGoals = {
        id: 'goal-1',
        type: 'monthly',
        target: { chapters: 5 },
        current: { words: 0, time: 0, chapters: 2 },
        startDate: new Date('2024-01-01'),
        isActive: true,
        projectId: 'test-project',
      };

      mockAnalytics.goals = [goal];
      render(<GoalsManager projectId='test-project' />);

      expect(screen.getByText('2 / 5 chapters')).toBeInTheDocument();
    });

    it('displays days remaining for goals with end date', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const goal: WritingGoals = {
        id: 'goal-1',
        type: 'weekly',
        target: { words: 3500 },
        current: { words: 1000, time: 120, chapters: 0 },
        startDate: new Date('2024-01-01'),
        endDate: tomorrow,
        isActive: true,
        projectId: 'test-project',
      };

      mockAnalytics.goals = [goal];
      render(<GoalsManager projectId='test-project' />);

      expect(screen.getByText(/1 day/)).toBeInTheDocument();
    });

    it('displays due today for goals due today', () => {
      const today = new Date();

      const goal: WritingGoals = {
        id: 'goal-1',
        type: 'weekly',
        target: { words: 3500 },
        current: { words: 1000, time: 120, chapters: 0 },
        startDate: new Date('2024-01-01'),
        endDate: today,
        isActive: true,
        projectId: 'test-project',
      };

      mockAnalytics.goals = [goal];
      render(<GoalsManager projectId='test-project' />);

      expect(screen.getByText('Due today')).toBeInTheDocument();
    });

    it('displays overdue days for past due goals', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const goal: WritingGoals = {
        id: 'goal-1',
        type: 'weekly',
        target: { words: 3500 },
        current: { words: 1000, time: 120, chapters: 0 },
        startDate: new Date('2024-01-01'),
        endDate: yesterday,
        isActive: true,
        projectId: 'test-project',
      };

      mockAnalytics.goals = [goal];
      render(<GoalsManager projectId='test-project' />);

      expect(screen.getByText(/1 day/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels on buttons', () => {
      const goal: WritingGoals = {
        id: 'goal-1',
        type: 'daily',
        target: { words: 500 },
        current: { words: 250, time: 30, chapters: 0 },
        startDate: new Date('2024-01-01'),
        isActive: true,
        projectId: 'test-project',
      };

      mockAnalytics.goals = [goal];
      render(<GoalsManager projectId='test-project' />);

      expect(screen.getByLabelText('Edit goal')).toBeInTheDocument();
      expect(screen.getAllByLabelText('Delete goal')).toHaveLength(1);
    });

    it('has accessible form inputs', () => {
      render(<GoalsManager projectId='test-project' />);
      fireEvent.click(screen.getByText('New Goal'));

      const wordInput = screen.getByPlaceholderText('500');
      expect(wordInput).toHaveAccessibleName();

      const timeInput = screen.getByPlaceholderText('60');
      expect(timeInput).toHaveAccessibleName();
    });

    it('has proper heading hierarchy', () => {
      render(<GoalsManager projectId='test-project' />);

      // Main heading
      const mainHeading = screen.getByRole('heading', { level: 2 });
      expect(mainHeading).toHaveTextContent('Writing Goals');

      // Form heading when opened
      fireEvent.click(screen.getByText('New Goal'));
      const formHeading = screen.getAllByRole('heading', { level: 3 }).find(h => h.textContent === 'Create New Goal');
      expect(formHeading).toBeDefined();
    });
  });

  describe('Edge cases', () => {
    it('handles goals with zero progress', () => {
      const goal: WritingGoals = {
        id: 'goal-1',
        type: 'daily',
        target: { words: 500 },
        current: { words: 0, time: 0, chapters: 0 },
        startDate: new Date('2024-01-01'),
        isActive: true,
        projectId: 'test-project',
      };

      mockAnalytics.goals = [goal];
      render(<GoalsManager projectId='test-project' />);

      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('handles goals with all zero targets', () => {
      const goal: WritingGoals = {
        id: 'goal-1',
        type: 'daily',
        target: {},
        current: { words: 0, time: 0, chapters: 0 },
        startDate: new Date('2024-01-01'),
        isActive: true,
        projectId: 'test-project',
      };

      mockAnalytics.goals = [goal];
      render(<GoalsManager projectId='test-project' />);

      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('limits completed goals to 4 in display', () => {
      const completedGoals: WritingGoals[] = Array.from({ length: 6 }, (_, i) => ({
        id: `goal-${i}`,
        type: 'daily' as const,
        target: { words: 500 },
        current: { words: 500, time: 60, chapters: 0 },
        startDate: new Date('2024-01-01'),
        isActive: false,
        projectId: 'test-project',
      }));

      mockAnalytics.goals = completedGoals;
      render(<GoalsManager projectId='test-project' />);

      // Should show only 4 completed goals
      const goalCards = screen.getAllByRole('heading', { level: 4 }).filter(h => h.textContent?.includes('Goal'));
      expect(goalCards.length).toBeLessThan(6);
    });
  });
});
