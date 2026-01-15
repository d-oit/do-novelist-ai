import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { BottomNav } from '@/shared/components/layout/BottomNav';

describe('BottomNav', () => {
  const mockOnNavigate = vi.fn();

  const defaultProps = {
    currentView: 'dashboard' as const,
    onNavigate: mockOnNavigate,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render all navigation buttons', () => {
      render(<BottomNav {...defaultProps} />);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Projects')).toBeInTheDocument();
      expect(screen.getByText('Metrics')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should render as a nav element', () => {
      const { container } = render(<BottomNav {...defaultProps} />);

      expect(container.querySelector('nav')).toBeInTheDocument();
    });

    it('should have proper styling classes', () => {
      const { container } = render(<BottomNav {...defaultProps} />);
      const nav = container.querySelector('nav');

      expect(nav).toHaveClass('fixed', 'bottom-0', 'left-0', 'right-0');
      expect(nav).toHaveClass('border-t', 'bg-background/80', 'backdrop-blur-md');
    });
  });

  describe('active state', () => {
    it('should highlight dashboard button when on dashboard', () => {
      render(<BottomNav currentView='dashboard' onNavigate={mockOnNavigate} />);

      const dashboardButton = screen.getByText('Dashboard').closest('button');
      expect(dashboardButton).toHaveClass('text-primary');
    });

    it('should highlight projects button when on projects', () => {
      render(<BottomNav currentView='projects' onNavigate={mockOnNavigate} />);

      const projectsButton = screen.getByText('Projects').closest('button');
      expect(projectsButton).toHaveClass('text-primary');
    });

    it('should highlight metrics button when on metrics', () => {
      render(<BottomNav currentView='metrics' onNavigate={mockOnNavigate} />);

      const metricsButton = screen.getByText('Metrics').closest('button');
      expect(metricsButton).toHaveClass('text-primary');
    });

    it('should highlight settings button when on settings', () => {
      render(<BottomNav currentView='settings' onNavigate={mockOnNavigate} />);

      const settingsButton = screen.getByText('Settings').closest('button');
      expect(settingsButton).toHaveClass('text-primary');
    });

    it('should not highlight inactive buttons', () => {
      render(<BottomNav currentView='dashboard' onNavigate={mockOnNavigate} />);

      const projectsButton = screen.getByText('Projects').closest('button');
      const metricsButton = screen.getByText('Metrics').closest('button');
      const settingsButton = screen.getByText('Settings').closest('button');

      expect(projectsButton).toHaveClass('text-muted-foreground');
      expect(metricsButton).toHaveClass('text-muted-foreground');
      expect(settingsButton).toHaveClass('text-muted-foreground');
    });
  });

  describe('navigation', () => {
    it('should call onNavigate with "dashboard" when dashboard button clicked', () => {
      render(<BottomNav {...defaultProps} currentView='projects' />);

      fireEvent.click(screen.getByText('Dashboard'));

      expect(mockOnNavigate).toHaveBeenCalledWith('dashboard');
      expect(mockOnNavigate).toHaveBeenCalledTimes(1);
    });

    it('should call onNavigate with "projects" when projects button clicked', () => {
      render(<BottomNav {...defaultProps} />);

      fireEvent.click(screen.getByText('Projects'));

      expect(mockOnNavigate).toHaveBeenCalledWith('projects');
      expect(mockOnNavigate).toHaveBeenCalledTimes(1);
    });

    it('should call onNavigate with "metrics" when metrics button clicked', () => {
      render(<BottomNav {...defaultProps} />);

      fireEvent.click(screen.getByText('Metrics'));

      expect(mockOnNavigate).toHaveBeenCalledWith('metrics');
      expect(mockOnNavigate).toHaveBeenCalledTimes(1);
    });

    it('should call onNavigate with "settings" when settings button clicked', () => {
      render(<BottomNav {...defaultProps} />);

      fireEvent.click(screen.getByText('Settings'));

      expect(mockOnNavigate).toHaveBeenCalledWith('settings');
      expect(mockOnNavigate).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple navigation clicks', () => {
      render(<BottomNav {...defaultProps} />);

      fireEvent.click(screen.getByText('Projects'));
      fireEvent.click(screen.getByText('Metrics'));
      fireEvent.click(screen.getByText('Settings'));

      expect(mockOnNavigate).toHaveBeenCalledTimes(3);
      expect(mockOnNavigate).toHaveBeenNthCalledWith(1, 'projects');
      expect(mockOnNavigate).toHaveBeenNthCalledWith(2, 'metrics');
      expect(mockOnNavigate).toHaveBeenNthCalledWith(3, 'settings');
    });
  });

  describe('icons', () => {
    it('should render icons for all buttons', () => {
      const { container } = render(<BottomNav {...defaultProps} />);

      // Check that SVG icons are rendered (lucide-react renders as SVGs)
      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThanOrEqual(4);
    });

    it('should apply scale transform to active icon', () => {
      render(<BottomNav currentView='dashboard' onNavigate={mockOnNavigate} />);

      const dashboardButton = screen.getByText('Dashboard').closest('button');
      expect(dashboardButton).toBeTruthy();

      const iconWrapper = dashboardButton!.querySelector('div');
      expect(iconWrapper).toHaveClass('scale-110');
    });

    it('should not apply scale transform to inactive icons', () => {
      render(<BottomNav currentView='dashboard' onNavigate={mockOnNavigate} />);

      const projectsButton = screen.getByText('Projects').closest('button');
      expect(projectsButton).toBeTruthy();

      const iconWrapper = projectsButton!.querySelector('div');
      expect(iconWrapper).not.toHaveClass('scale-110');
    });
  });

  describe('accessibility', () => {
    it('should have button type="button" for all navigation buttons', () => {
      render(<BottomNav {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });

    it('should be keyboard accessible', () => {
      render(<BottomNav {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      const dashboardButton = buttons[0]!; // First button is Dashboard

      dashboardButton.focus();
      expect(dashboardButton).toHaveFocus();

      fireEvent.click(dashboardButton);
      expect(mockOnNavigate).toHaveBeenCalledWith('dashboard');
    });

    it('should be navigable via tab key', () => {
      render(<BottomNav {...defaultProps} />);

      const buttons = screen.getAllByRole('button');

      // Simulate tabbing through buttons
      buttons[0]!.focus();
      expect(buttons[0]).toHaveFocus();

      buttons[1]!.focus();
      expect(buttons[1]).toHaveFocus();

      buttons[2]!.focus();
      expect(buttons[2]).toHaveFocus();

      buttons[3]!.focus();
      expect(buttons[3]).toHaveFocus();
    });
  });

  describe('responsive behavior', () => {
    it('should have mobile-specific class (md:hidden)', () => {
      const { container } = render(<BottomNav {...defaultProps} />);
      const nav = container.querySelector('nav');

      expect(nav).toHaveClass('md:hidden');
    });

    it('should have safe area padding class', () => {
      const { container } = render(<BottomNav {...defaultProps} />);
      const innerDiv = container.querySelector('.pb-safe');

      expect(innerDiv).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle clicking the same navigation item multiple times', () => {
      render(<BottomNav {...defaultProps} currentView='dashboard' />);

      fireEvent.click(screen.getByText('Dashboard'));
      fireEvent.click(screen.getByText('Dashboard'));
      fireEvent.click(screen.getByText('Dashboard'));

      expect(mockOnNavigate).toHaveBeenCalledTimes(3);
      expect(mockOnNavigate).toHaveBeenCalledWith('dashboard');
    });

    it('should render correctly with different view values', () => {
      // Test dashboard view
      const { rerender } = render(<BottomNav currentView='dashboard' onNavigate={mockOnNavigate} />);
      let buttons = screen.getAllByRole('button');
      expect(buttons[0]).toHaveClass('text-primary');

      // Test projects view
      rerender(<BottomNav currentView='projects' onNavigate={mockOnNavigate} />);
      buttons = screen.getAllByRole('button');
      expect(buttons[1]).toHaveClass('text-primary');

      // Test metrics view
      rerender(<BottomNav currentView='metrics' onNavigate={mockOnNavigate} />);
      buttons = screen.getAllByRole('button');
      expect(buttons[2]).toHaveClass('text-primary');

      // Test settings view
      rerender(<BottomNav currentView='settings' onNavigate={mockOnNavigate} />);
      buttons = screen.getAllByRole('button');
      expect(buttons[3]).toHaveClass('text-primary');
    });
  });

  describe('visual design', () => {
    it('should have proper layout classes', () => {
      const { container } = render(<BottomNav {...defaultProps} />);
      const innerDiv = container.querySelector('.pb-safe');

      expect(innerDiv).toHaveClass('flex', 'h-16', 'items-center', 'justify-around');
    });

    it('should apply transition classes to buttons', () => {
      render(<BottomNav {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('transition-colors');
      });
    });

    it('should apply hover classes to inactive buttons', () => {
      render(<BottomNav currentView='dashboard' onNavigate={mockOnNavigate} />);

      const projectsButton = screen.getByText('Projects').closest('button');
      expect(projectsButton).toHaveClass('hover:text-foreground');
    });
  });
});
