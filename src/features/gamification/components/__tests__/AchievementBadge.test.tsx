import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { AchievementBadge } from '@/features/gamification/components/AchievementBadge';
import type { Achievement, UserAchievement } from '@/types';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Award: ({ className }: any) => <div className={className} data-testid='award-icon' />,
  Lock: ({ className }: any) => <div className={className} data-testid='lock-icon' />,
}));

describe('AchievementBadge', () => {
  const mockAchievement: Achievement = {
    id: 'ach1',
    title: 'First Chapter',
    description: 'Complete your first chapter',
    icon: '📖',
    category: 'milestone',
    rarity: 'common',
    condition: {
      type: 'chapter_completion',
      target: 1,
    },
    createdAt: new Date('2024-01-01'),
  };

  const mockUserAchievement: UserAchievement = {
    id: 'ua1',
    achievementId: 'ach1',
    unlockedAt: new Date('2024-01-15'),
    progress: 100,
    value: 1,
    isClaimed: true,
    rewards: {
      experiencePoints: 100,
    },
  };

  describe('Rendering - Basic', () => {
    it('renders without errors', () => {
      render(<AchievementBadge achievement={mockAchievement} />);

      expect(screen.getByText('First Chapter')).toBeInTheDocument();
      expect(screen.getByText('Complete your first chapter')).toBeInTheDocument();
    });

    it('renders achievement icon', () => {
      render(<AchievementBadge achievement={mockAchievement} />);

      expect(screen.getByText('📖')).toBeInTheDocument();
    });

    it('renders achievement rarity', () => {
      render(<AchievementBadge achievement={mockAchievement} />);

      expect(screen.getByText('common')).toBeInTheDocument();
    });

    it('renders lock icon when not unlocked', () => {
      render(<AchievementBadge achievement={mockAchievement} />);

      expect(screen.getByTestId('lock-icon')).toBeInTheDocument();
    });

    it('does not render lock icon when unlocked', () => {
      render(<AchievementBadge achievement={mockAchievement} userAchievement={mockUserAchievement} />);

      expect(screen.queryByTestId('lock-icon')).not.toBeInTheDocument();
    });
  });

  describe('Rendering - Unlocked State', () => {
    it('displays user achievement progress', () => {
      const partialProgress: UserAchievement = {
        ...mockUserAchievement,
        progress: 50,
        value: 0.5,
      };

      render(<AchievementBadge achievement={mockAchievement} userAchievement={partialProgress} showProgress />);

      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText('Progress')).toBeInTheDocument();
    });

    it('displays experience points reward', () => {
      render(<AchievementBadge achievement={mockAchievement} userAchievement={mockUserAchievement} />);

      expect(screen.getByTestId('award-icon')).toBeInTheDocument();
      expect(screen.getByText('100 XP')).toBeInTheDocument();
    });

    it('hides progress when showProgress is false', () => {
      const partialProgress: UserAchievement = {
        ...mockUserAchievement,
        progress: 50,
        value: 0.5,
      };

      render(<AchievementBadge achievement={mockAchievement} userAchievement={partialProgress} showProgress={false} />);

      expect(screen.queryByText('Progress')).not.toBeInTheDocument();
      expect(screen.queryByText('50%')).not.toBeInTheDocument();
    });

    it('shows progress even when progress is 100%', () => {
      render(<AchievementBadge achievement={mockAchievement} userAchievement={mockUserAchievement} showProgress />);

      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('Progress')).toBeInTheDocument();
    });
  });

  describe('Rarity Styling', () => {
    it('applies common rarity styling', () => {
      const commonAchievement: Achievement = { ...mockAchievement, rarity: 'common' };
      const { container } = render(
        <AchievementBadge achievement={commonAchievement} userAchievement={mockUserAchievement} />,
      );

      const badge = container.querySelector('.rounded-lg');
      expect(badge).toHaveClass('border-gray-400');
    });

    it('applies uncommon rarity styling', () => {
      const uncommonAchievement: Achievement = { ...mockAchievement, rarity: 'uncommon' };
      const { container } = render(
        <AchievementBadge achievement={uncommonAchievement} userAchievement={mockUserAchievement} />,
      );

      const badge = container.querySelector('.rounded-lg');
      expect(badge).toHaveClass('border-green-400');
    });

    it('applies rare rarity styling', () => {
      const rareAchievement: Achievement = { ...mockAchievement, rarity: 'rare' };
      const { container } = render(
        <AchievementBadge achievement={rareAchievement} userAchievement={mockUserAchievement} />,
      );

      const badge = container.querySelector('.rounded-lg');
      expect(badge).toHaveClass('border-blue-400');
    });

    it('applies epic rarity styling', () => {
      const epicAchievement: Achievement = { ...mockAchievement, rarity: 'epic' };
      const { container } = render(
        <AchievementBadge achievement={epicAchievement} userAchievement={mockUserAchievement} />,
      );

      const badge = container.querySelector('.rounded-lg');
      expect(badge).toHaveClass('border-purple-400');
    });

    it('applies legendary rarity styling', () => {
      const legendaryAchievement: Achievement = { ...mockAchievement, rarity: 'legendary' };
      const { container } = render(
        <AchievementBadge achievement={legendaryAchievement} userAchievement={mockUserAchievement} />,
      );

      const badge = container.querySelector('.rounded-lg');
      expect(badge).toHaveClass('border-yellow-400');
    });
  });

  describe('Rarity Badge Colors', () => {
    it('displays common rarity badge with gray colors', () => {
      const commonAchievement: Achievement = { ...mockAchievement, rarity: 'common' };
      const { container } = render(<AchievementBadge achievement={commonAchievement} />);

      const rarityBadge = container.querySelector('.rounded-full');
      expect(rarityBadge).toHaveClass('bg-gray-100');
    });

    it('displays uncommon rarity badge with green colors', () => {
      const uncommonAchievement: Achievement = { ...mockAchievement, rarity: 'uncommon' };
      const { container } = render(<AchievementBadge achievement={uncommonAchievement} />);

      const rarityBadge = container.querySelector('.rounded-full');
      expect(rarityBadge).toHaveClass('bg-green-100');
    });

    it('displays rare rarity badge with blue colors', () => {
      const rareAchievement: Achievement = { ...mockAchievement, rarity: 'rare' };
      const { container } = render(<AchievementBadge achievement={rareAchievement} />);

      const rarityBadge = container.querySelector('.rounded-full');
      expect(rarityBadge).toHaveClass('bg-blue-100');
    });

    it('displays epic rarity badge with purple colors', () => {
      const epicAchievement: Achievement = { ...mockAchievement, rarity: 'epic' };
      const { container } = render(<AchievementBadge achievement={epicAchievement} />);

      const rarityBadge = container.querySelector('.rounded-full');
      expect(rarityBadge).toHaveClass('bg-purple-100');
    });

    it('displays legendary rarity badge with yellow colors', () => {
      const legendaryAchievement: Achievement = { ...mockAchievement, rarity: 'legendary' };
      const { container } = render(<AchievementBadge achievement={legendaryAchievement} />);

      const rarityBadge = container.querySelector('.rounded-full');
      expect(rarityBadge).toHaveClass('bg-yellow-100');
    });
  });

  describe('Locked State Styling', () => {
    it('applies opacity when locked', () => {
      const { container } = render(<AchievementBadge achievement={mockAchievement} />);

      const badge = container.querySelector('.rounded-lg');
      expect(badge).toHaveClass('opacity-60');
    });

    it('applies generic gray styling when locked', () => {
      const { container } = render(<AchievementBadge achievement={mockAchievement} />);

      const badge = container.querySelector('.rounded-lg');
      expect(badge).toHaveClass('border-gray-300');
    });

    it('does not apply opacity when unlocked', () => {
      const { container } = render(
        <AchievementBadge achievement={mockAchievement} userAchievement={mockUserAchievement} />,
      );

      const badge = container.querySelector('.rounded-lg');
      expect(badge).not.toHaveClass('opacity-60');
    });
  });

  describe('Progress Bar', () => {
    it('renders progress bar with correct width', () => {
      const partialProgress: UserAchievement = {
        ...mockUserAchievement,
        progress: 75,
        value: 0.75,
      };

      const { container } = render(
        <AchievementBadge achievement={mockAchievement} userAchievement={partialProgress} showProgress />,
      );

      const progressBar = container.querySelector('.bg-blue-500');
      expect(progressBar).toHaveStyle({ width: '75%' });
    });

    it('does not render progress bar when showProgress is false', () => {
      const { container } = render(
        <AchievementBadge achievement={mockAchievement} userAchievement={mockUserAchievement} showProgress={false} />,
      );

      const progressBar = container.querySelector('.bg-blue-500');
      expect(progressBar).toBeNull();
    });

    it('renders progress bar when progress is 100%', () => {
      const { container } = render(
        <AchievementBadge achievement={mockAchievement} userAchievement={mockUserAchievement} showProgress />,
      );

      const progressBar = container.querySelector('.bg-blue-500');
      expect(progressBar).not.toBeNull();
    });

    it('renders progress bar with 0% width', () => {
      const noProgress: UserAchievement = {
        ...mockUserAchievement,
        progress: 0,
        value: 0,
      };

      const { container } = render(
        <AchievementBadge achievement={mockAchievement} userAchievement={noProgress} showProgress />,
      );

      const progressBar = container.querySelector('.bg-blue-500');
      expect(progressBar).toHaveStyle({ width: '0%' });
    });

    it('renders progress bar with 100% width', () => {
      const completeProgress: UserAchievement = {
        ...mockUserAchievement,
        progress: 100,
        value: 1,
      };

      const { container } = render(
        <AchievementBadge achievement={mockAchievement} userAchievement={completeProgress} showProgress />,
      );

      const progressBar = container.querySelector('.bg-blue-500');
      expect(progressBar).toHaveStyle({ width: '100%' });
    });
  });

  describe('Edge Cases', () => {
    it('handles achievement with no rewards', () => {
      const userAchievementNoRewards: UserAchievement = {
        ...mockUserAchievement,
        rewards: undefined,
      };

      render(<AchievementBadge achievement={mockAchievement} userAchievement={userAchievementNoRewards} />);

      expect(screen.queryByText('XP')).not.toBeInTheDocument();
      expect(screen.queryByTestId('award-icon')).not.toBeInTheDocument();
    });

    it('handles achievement with rewards but no experience points', () => {
      const userAchievementOtherRewards: UserAchievement = {
        ...mockUserAchievement,
        rewards: { badge: 'gold' },
      };

      render(<AchievementBadge achievement={mockAchievement} userAchievement={userAchievementOtherRewards} />);

      expect(screen.queryByText('XP')).not.toBeInTheDocument();
      expect(screen.queryByTestId('award-icon')).not.toBeInTheDocument();
    });

    it('handles zero XP reward', () => {
      const userAchievementZeroXP: UserAchievement = {
        ...mockUserAchievement,
        rewards: { experiencePoints: 0 },
      };

      render(<AchievementBadge achievement={mockAchievement} userAchievement={userAchievementZeroXP} />);

      expect(screen.getByText('0 XP')).toBeInTheDocument();
      expect(screen.getByTestId('award-icon')).toBeInTheDocument();
    });

    it('handles very large XP reward', () => {
      const userAchievementLargeXP: UserAchievement = {
        ...mockUserAchievement,
        rewards: { experiencePoints: 10000 },
      };

      render(<AchievementBadge achievement={mockAchievement} userAchievement={userAchievementLargeXP} />);

      expect(screen.getByText('10,000 XP')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper semantic structure', () => {
      render(<AchievementBadge achievement={mockAchievement} />);

      const badge = screen.getByText('First Chapter');
      expect(badge.tagName.toLowerCase()).toBe('h3');
      expect(badge).toHaveClass('text-sm');
    });

    it('has visible text for icon-only elements', () => {
      render(<AchievementBadge achievement={mockAchievement} />);

      // Achievement icon should have visual representation
      expect(screen.getByText('📖')).toBeInTheDocument();
    });
  });

  describe('Visual Styling', () => {
    it('applies hover transition effect', () => {
      const { container } = render(<AchievementBadge achievement={mockAchievement} />);

      const badge = container.querySelector('.rounded-lg');
      expect(badge).toHaveClass('transition-all');
    });

    it('applies hover shadow effect', () => {
      const { container } = render(<AchievementBadge achievement={mockAchievement} />);

      const badge = container.querySelector('.rounded-lg');
      expect(badge).toHaveClass('hover:shadow-md');
    });

    it('has proper padding and spacing', () => {
      const { container } = render(<AchievementBadge achievement={mockAchievement} />);

      const badge = container.querySelector('.rounded-lg');
      expect(badge).toHaveClass('p-4');
    });
  });

  describe('Responsive Design', () => {
    it('maintains layout on different screen sizes', () => {
      const { container } = render(<AchievementBadge achievement={mockAchievement} />);

      const badge = container.querySelector('.rounded-lg');
      expect(badge).toBeInTheDocument();

      // Should work regardless of viewport
      expect(badge).toHaveClass('relative');
    });
  });
});
