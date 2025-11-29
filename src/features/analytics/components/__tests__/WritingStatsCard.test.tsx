import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WritingStatsCard } from '../WritingStatsCard';

// Mock framer-motion with complete prop handling
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, whileHover, whileTap, transition, animate, initial, ...props }: any) => (
      <div className={className} {...props} data-testid="motion-div">
        {children}
      </div>
    ),
  },
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  BookOpen: ({ className }: any) => <div className={className} data-testid="bookopen-icon" />,
  Target: ({ className }: any) => <div className={className} data-testid="target-icon" />,
  Clock: ({ className }: any) => <div className={className} data-testid="clock-icon" />,
  Zap: ({ className }: any) => <div className={className} data-testid="zap-icon" />,
  PieChart: ({ className }: any) => <div className={className} data-testid="piechart-icon" />,
  Flame: ({ className }: any) => <div className={className} data-testid="flame-icon" />,
  Brain: ({ className }: any) => <div className={className} data-testid="brain-icon" />,
  Activity: ({ className }: any) => <div className={className} data-testid="activity-icon" />,
  TrendingUp: ({ className }: any) => <div className={className} data-testid="trendingup-icon" />,
}));

describe('WritingStatsCard', () => {
  const defaultProps = {
    totalWords: 5000,
    chaptersCompleted: 5,
    totalChapters: 10,
    timeSpent: 120,
    productivity: 45,
    weeklyWords: 1500,
    currentStreak: 7,
    aiAssistance: 25,
  };

  describe('Rendering with props', () => {
    it('renders writing overview section', () => {
      render(<WritingStatsCard {...defaultProps} />);

      expect(screen.getByText('Writing Overview')).toBeInTheDocument();
      expect(screen.getByTestId('activity-icon')).toBeInTheDocument();
    });

    it('renders weekly performance section', () => {
      render(<WritingStatsCard {...defaultProps} />);

      expect(screen.getByText('This Week\'s Performance')).toBeInTheDocument();
      expect(screen.getAllByTestId('piechart-icon')).toHaveLength(2);
    });

    it('displays total words metric', () => {
      render(<WritingStatsCard {...defaultProps} />);

      expect(screen.getByText('Total Words')).toBeInTheDocument();
      expect(screen.getByText('5,000')).toBeInTheDocument();
    });

    it('displays chapters metric with completion percentage', () => {
      render(<WritingStatsCard {...defaultProps} />);

      expect(screen.getByText('Chapters')).toBeInTheDocument();
      expect(screen.getByText('5/10 (50%)')).toBeInTheDocument();
    });

    it('displays time invested metric', () => {
      render(<WritingStatsCard {...defaultProps} />);

      expect(screen.getByText('Time Invested')).toBeInTheDocument();
      expect(screen.getByText('2h 0m')).toBeInTheDocument();
    });

    it('displays productivity metric', () => {
      render(<WritingStatsCard {...defaultProps} />);

      expect(screen.getByText('Productivity')).toBeInTheDocument();
      expect(screen.getByText(/45/)).toBeInTheDocument();
      expect(screen.getByText(/wph/)).toBeInTheDocument();
    });

    it('displays weekly words metric', () => {
      render(<WritingStatsCard {...defaultProps} />);

      expect(screen.getByText('Weekly Words')).toBeInTheDocument();
      expect(screen.getByText('1,500')).toBeInTheDocument();
    });

    it('displays writing streak metric', () => {
      render(<WritingStatsCard {...defaultProps} />);

      expect(screen.getByText('Writing Streak')).toBeInTheDocument();
      expect(screen.getByText('7 days')).toBeInTheDocument();
    });

    it('displays AI assistance metric', () => {
      render(<WritingStatsCard {...defaultProps} />);

      expect(screen.getByText('AI Assistance')).toBeInTheDocument();
      expect(screen.getByText(/25/)).toBeInTheDocument();
    });

    it('applies custom className when provided', () => {
      const { container } = render(<WritingStatsCard {...defaultProps} className="custom-class" />);

      const element = container.querySelector('.custom-class');
      expect(element).toBeInTheDocument();
    });
  });

  describe('Data calculations', () => {
    it('calculates completion percentage correctly', () => {
      render(<WritingStatsCard {...defaultProps} chaptersCompleted={3} totalChapters={10} />);

      expect(screen.getByText('3/10 (30%)')).toBeInTheDocument();
    });

    it('handles 100% completion', () => {
      render(<WritingStatsCard {...defaultProps} chaptersCompleted={10} totalChapters={10} />);

      expect(screen.getByText('10/10 (100%)')).toBeInTheDocument();
    });

    it('handles zero chapters correctly', () => {
      render(<WritingStatsCard {...defaultProps} chaptersCompleted={0} totalChapters={0} />);

      expect(screen.getByText('0/0 (0%)')).toBeInTheDocument();
    });

    it('converts time spent to hours and minutes correctly', () => {
      render(<WritingStatsCard {...defaultProps} timeSpent={150} />);

      expect(screen.getByText('3h 30m')).toBeInTheDocument();
    });

    it('handles time with only hours', () => {
      render(<WritingStatsCard {...defaultProps} timeSpent={180} />);

      expect(screen.getByText('3h 0m')).toBeInTheDocument();
    });

    it('handles time less than an hour', () => {
      render(<WritingStatsCard {...defaultProps} timeSpent={45} />);

      expect(screen.getByText('1h 45m')).toBeInTheDocument();
    });

    it('rounds productivity to nearest integer', () => {
      render(<WritingStatsCard {...defaultProps} productivity={45.7} />);

      expect(screen.getByText(/46/)).toBeInTheDocument();
    });

    it('rounds AI assistance to nearest integer', () => {
      render(<WritingStatsCard {...defaultProps} aiAssistance={25.8} />);

      expect(screen.getByText(/26/)).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('handles zero values correctly', () => {
      render(
        <WritingStatsCard
          totalWords={0}
          chaptersCompleted={0}
          totalChapters={0}
          timeSpent={0}
          productivity={0}
          weeklyWords={0}
          currentStreak={0}
          aiAssistance={0}
        />
      );

      expect(screen.getByText('0 days')).toBeInTheDocument();
      expect(screen.getByText('0h 0m')).toBeInTheDocument();
    });

    it('handles very large word counts', () => {
      render(<WritingStatsCard {...defaultProps} totalWords={1000000} />);

      expect(screen.getByText('1,000,000')).toBeInTheDocument();
    });

    it('handles very long time spans', () => {
      render(<WritingStatsCard {...defaultProps} timeSpent={999} />);

      expect(screen.getByText('17h 39m')).toBeInTheDocument();
    });

    it('handles single day streak', () => {
      render(<WritingStatsCard {...defaultProps} currentStreak={1} />);

      expect(screen.getByText('1 days')).toBeInTheDocument();
    });

    it('displays all section titles', () => {
      render(<WritingStatsCard {...defaultProps} />);

      expect(screen.getByText('Writing Overview')).toBeInTheDocument();
      expect(screen.getByText('This Week\'s Performance')).toBeInTheDocument();
    });

    it('displays all metric titles', () => {
      render(<WritingStatsCard {...defaultProps} />);

      expect(screen.getByText('Total Words')).toBeInTheDocument();
      expect(screen.getByText('Chapters')).toBeInTheDocument();
      expect(screen.getByText('Time Invested')).toBeInTheDocument();
      expect(screen.getByText('Productivity')).toBeInTheDocument();
      expect(screen.getByText('Weekly Words')).toBeInTheDocument();
      expect(screen.getByText('Writing Streak')).toBeInTheDocument();
      expect(screen.getByText('AI Assistance')).toBeInTheDocument();
    });

    it('renders with partial data', () => {
      render(
        <WritingStatsCard
          {...defaultProps}
          chaptersCompleted={0}
          weeklyWords={0}
        />
      );

      expect(screen.getByText('Writing Overview')).toBeInTheDocument();
    });

    it('handles fractional productivity values', () => {
      render(<WritingStatsCard {...defaultProps} productivity={42.3} />);

      expect(screen.getByText(/42/)).toBeInTheDocument();
    });

    it('handles high AI assistance percentage', () => {
      render(<WritingStatsCard {...defaultProps} aiAssistance={99} />);

      expect(screen.getByText(/99/)).toBeInTheDocument();
    });
  });
});
