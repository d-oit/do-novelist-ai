import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';

import { SessionTimeline } from '@/features/analytics/components/SessionTimeline';

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
  };
});

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  TrendingUp: ({ className, 'data-testid': testId }: any) => (
    <div className={className} data-testid={testId || 'trendingup-icon'} />
  ),
  Flame: ({ className, 'data-testid': testId }: any) => (
    <div className={className} data-testid={testId || 'flame-icon'} />
  ),
  Brain: ({ className, 'data-testid': testId }: any) => (
    <div className={className} data-testid={testId || 'brain-icon'} />
  ),
  Target: ({ className, 'data-testid': testId }: any) => (
    <div className={className} data-testid={testId || 'target-icon'} />
  ),
}));

interface InsightData {
  productivity: number;
  currentStreak: number;
  aiAssistance: number;
  totalWords: number;
}

describe('SessionTimeline', () => {
  const defaultProps: InsightData = {
    productivity: 45,
    currentStreak: 7,
    aiAssistance: 25,
    totalWords: 15000,
  };

  describe('Rendering', () => {
    it('renders without errors', () => {
      render(<SessionTimeline insights={defaultProps} />);

      expect(screen.getByText('AI Insights & Recommendations')).toBeInTheDocument();
    });

    it('renders all insight cards', () => {
      render(<SessionTimeline insights={defaultProps} />);

      expect(screen.getByText('Peak Performance')).toBeInTheDocument();
      expect(screen.getByText('Streak Power')).toBeInTheDocument();
      expect(screen.getByText('AI Balance')).toBeInTheDocument();
      expect(screen.getByText('Next Milestone')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(<SessionTimeline insights={defaultProps} className='custom-class' />);

      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });

    it('renders icons for each insight', () => {
      render(<SessionTimeline insights={defaultProps} />);

      expect(screen.getByTestId('trendingup-icon')).toBeInTheDocument();
      expect(screen.getByTestId('flame-icon')).toBeInTheDocument();
      expect(screen.getAllByTestId('brain-icon')).toHaveLength(1);
      expect(screen.getByTestId('header-brain-icon')).toBeInTheDocument();
      expect(screen.getByTestId('target-icon')).toBeInTheDocument();
    });
  });

  describe('Peak Performance Card', () => {
    it('displays productivity value rounded to nearest integer', () => {
      render(<SessionTimeline insights={{ ...defaultProps, productivity: 45.7 }} />);

      expect(screen.getByTestId('productivity-value')).toHaveTextContent('46');
      expect(screen.getByText(/words\/hour/)).toBeInTheDocument();
    });

    it('shows peak writing hours message', () => {
      render(<SessionTimeline insights={defaultProps} />);

      expect(screen.getByText(/You write best between 9-11 AM/)).toBeInTheDocument();
    });
    it('displays "average of X words/hour"', () => {
      render(<SessionTimeline insights={{ ...defaultProps, productivity: 60 }} />);

      expect(screen.getByTestId('productivity-value')).toHaveTextContent('60');
      expect(screen.getByText(/average of/)).toBeInTheDocument();
      expect(screen.getByText(/words\/hour/)).toBeInTheDocument();
    });
  });

  describe('Streak Power Card', () => {
    it('displays current streak days', () => {
      render(<SessionTimeline insights={{ ...defaultProps, currentStreak: 10 }} />);

      expect(screen.getByTestId('streak-header')).toHaveTextContent('10 day streak!');
    });

    it('shows "on fire" message for streak >= 7 days', () => {
      render(<SessionTimeline insights={{ ...defaultProps, currentStreak: 7 }} />);

      expect(screen.getByTestId('streak-message')).toHaveTextContent('on fire');
    });

    it('shows "building momentum" message for streak < 7 days', () => {
      render(<SessionTimeline insights={{ ...defaultProps, currentStreak: 3 }} />);

      expect(screen.getByTestId('streak-message')).toHaveTextContent('building momentum');
    });

    it('handles zero streak', () => {
      render(<SessionTimeline insights={{ ...defaultProps, currentStreak: 0 }} />);

      expect(screen.getByTestId('streak-header')).toHaveTextContent('0 day streak!');
      expect(screen.getByTestId('streak-message')).toHaveTextContent('building momentum');
    });

    it('handles very long streak', () => {
      render(<SessionTimeline insights={{ ...defaultProps, currentStreak: 100 }} />);

      expect(screen.getByTestId('streak-header')).toHaveTextContent('100 day streak!');
      expect(screen.getByTestId('streak-message')).toHaveTextContent('on fire');
    });
  });

  describe('AI Balance Card', () => {
    it('displays AI assistance percentage rounded to nearest integer', () => {
      render(<SessionTimeline insights={{ ...defaultProps, aiAssistance: 25.8 }} />);

      expect(screen.getByTestId('ai-percentage')).toHaveTextContent('26%');
    });

    it('shows "consider more original writing" when AI > 30%', () => {
      render(<SessionTimeline insights={{ ...defaultProps, aiAssistance: 35 }} />);

      expect(screen.getByTestId('ai-message')).toHaveTextContent('consider more original writing');
    });

    it('shows "good balance of creativity" when AI <= 30%', () => {
      render(<SessionTimeline insights={{ ...defaultProps, aiAssistance: 25 }} />);

      expect(screen.getByTestId('ai-message')).toHaveTextContent('good balance of creativity');
    });

    it('handles 0% AI assistance', () => {
      render(<SessionTimeline insights={{ ...defaultProps, aiAssistance: 0 }} />);

      expect(screen.getByTestId('ai-percentage')).toHaveTextContent('0%');
      expect(screen.getByTestId('ai-message')).toHaveTextContent('good balance of creativity');
    });

    it('handles 100% AI assistance', () => {
      render(<SessionTimeline insights={{ ...defaultProps, aiAssistance: 100 }} />);

      expect(screen.getByTestId('ai-percentage')).toHaveTextContent('100%');
      expect(screen.getByTestId('ai-message')).toHaveTextContent('consider more original writing');
    });
  });

  describe('Next Milestone Card', () => {
    it('shows 10K milestone for words < 10,000', () => {
      render(<SessionTimeline insights={{ ...defaultProps, totalWords: 5000 }} />);

      expect(screen.getByText('10K words milestone ahead')).toBeInTheDocument();
    });

    it('shows 50K milestone for words between 10K and 50K', () => {
      render(<SessionTimeline insights={{ ...defaultProps, totalWords: 25000 }} />);

      expect(screen.getByText('50K words - halfway to novel')).toBeInTheDocument();
    });

    it('shows novel length achieved for words >= 50K', () => {
      render(<SessionTimeline insights={{ ...defaultProps, totalWords: 75000 }} />);

      expect(screen.getByText('Novel length achieved!')).toBeInTheDocument();
    });

    it('handles exactly 10,000 words', () => {
      render(<SessionTimeline insights={{ ...defaultProps, totalWords: 10000 }} />);

      expect(screen.getByText('50K words - halfway to novel')).toBeInTheDocument();
    });

    it('handles exactly 50,000 words', () => {
      render(<SessionTimeline insights={{ ...defaultProps, totalWords: 50000 }} />);

      expect(screen.getByText('Novel length achieved!')).toBeInTheDocument();
    });

    it('handles zero words', () => {
      render(<SessionTimeline insights={{ ...defaultProps, totalWords: 0 }} />);

      expect(screen.getByText('10K words milestone ahead')).toBeInTheDocument();
    });

    it('handles very large word counts', () => {
      render(<SessionTimeline insights={{ ...defaultProps, totalWords: 150000 }} />);

      expect(screen.getByText('Novel length achieved!')).toBeInTheDocument();
    });
  });

  describe('Memoization', () => {
    it('memoizes computed values correctly', () => {
      const { rerender } = render(<SessionTimeline insights={defaultProps} />);

      // Initial render
      expect(screen.getByText(/45/)).toBeInTheDocument();

      // Rerender with same props should use memoized values
      rerender(<SessionTimeline insights={defaultProps} />);
      expect(screen.getByText(/45/)).toBeInTheDocument();

      // Rerender with different productivity
      rerender(<SessionTimeline insights={{ ...defaultProps, productivity: 60 }} />);
      expect(screen.getByText(/60/)).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('handles all zero values', () => {
      const zeroInsights: InsightData = {
        productivity: 0,
        currentStreak: 0,
        aiAssistance: 0,
        totalWords: 0,
      };

      render(<SessionTimeline insights={zeroInsights} />);

      expect(screen.getByText('0 day streak!')).toBeInTheDocument();
      expect(screen.getByText(/0%/)).toBeInTheDocument();
      // Productivity card doesn't render when productivity is 0 (not meaningful data)
      expect(screen.queryByText(/0 words\/hour/)).not.toBeInTheDocument();
      expect(screen.getByText('10K words milestone ahead')).toBeInTheDocument();
    });

    it('handles fractional values', () => {
      render(<SessionTimeline insights={{ ...defaultProps, productivity: 42.3, aiAssistance: 33.7 }} />);

      // Should be rounded to 42 and 34
      expect(screen.getByText(/42/)).toBeInTheDocument();
      expect(screen.getByText(/34%/)).toBeInTheDocument();
    });

    it('handles negative productivity (edge case)', () => {
      render(<SessionTimeline insights={{ ...defaultProps, productivity: -5 }} />);

      expect(screen.getByText(/-5/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(<SessionTimeline insights={defaultProps} />);

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('AI Insights & Recommendations');
    });

    it('renders all content in card components', () => {
      const { container } = render(<SessionTimeline insights={defaultProps} />);

      // Card component uses rounded-xl class
      const cards = container.querySelectorAll('.rounded-xl');
      expect(cards.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Visual styling', () => {
    it('uses gradient backgrounds for cards', () => {
      const { container } = render(<SessionTimeline insights={defaultProps} />);

      // Check for gradient classes
      const gradientCards = container.querySelectorAll('.bg-gradient-to-br');
      expect(gradientCards.length).toBe(4);
    });

    it('applies color themes correctly', () => {
      const { container } = render(<SessionTimeline insights={defaultProps} />);

      // Check for theme classes in the cards
      const blueCard = container.querySelector('.border-blue-200');
      expect(blueCard).toBeInTheDocument();

      const greenCard = container.querySelector('.border-green-200');
      expect(greenCard).toBeInTheDocument();

      const purpleCard = container.querySelector('.border-purple-200');
      expect(purpleCard).toBeInTheDocument();

      const orangeCard = container.querySelector('.border-orange-200');
      expect(orangeCard).toBeInTheDocument();
    });
  });
});
