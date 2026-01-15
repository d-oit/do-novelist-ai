import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { Toaster } from '@/shared/components/ui/Toaster';

// Mock the toast store
const mockToasts: any[] = [];
const mockDismissToast = vi.fn();

vi.mock('@/lib/stores/toastStore', () => ({
  useToastStore: () => ({
    toasts: mockToasts,
    dismissToast: mockDismissToast,
  }),
}));

describe('Toaster', () => {
  beforeEach(() => {
    mockToasts.length = 0;
    mockDismissToast.mockClear();
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Toaster container', () => {
    it('should render toaster container', () => {
      const { container } = render(<Toaster />);

      const toasterContainer = container.querySelector('.fixed');
      expect(toasterContainer).toBeInTheDocument();
    });

    it('should have correct positioning classes', () => {
      const { container } = render(<Toaster />);

      const toasterContainer = container.querySelector('.fixed');
      expect(toasterContainer).toHaveClass('bottom-20', 'right-4', 'z-50');
    });

    it('should render empty when no toasts', () => {
      render(<Toaster />);

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  describe('Toast rendering', () => {
    it('should render toast with title', () => {
      mockToasts.push({
        id: '1',
        title: 'Test Toast',
        variant: 'default',
      });

      render(<Toaster />);

      expect(screen.getByText('Test Toast')).toBeInTheDocument();
    });

    it('should render toast with description', () => {
      mockToasts.push({
        id: '1',
        title: 'Toast Title',
        description: 'Toast description text',
        variant: 'default',
      });

      render(<Toaster />);

      expect(screen.getByText('Toast Title')).toBeInTheDocument();
      expect(screen.getByText('Toast description text')).toBeInTheDocument();
    });

    it('should render toast without title', () => {
      mockToasts.push({
        id: '1',
        description: 'Description only',
        variant: 'default',
      });

      render(<Toaster />);

      expect(screen.getByText('Description only')).toBeInTheDocument();
    });

    it('should render multiple toasts', () => {
      mockToasts.push(
        {
          id: '1',
          title: 'Toast 1',
          variant: 'default',
        },
        {
          id: '2',
          title: 'Toast 2',
          variant: 'success',
        },
        {
          id: '3',
          title: 'Toast 3',
          variant: 'destructive',
        },
      );

      render(<Toaster />);

      expect(screen.getByText('Toast 1')).toBeInTheDocument();
      expect(screen.getByText('Toast 2')).toBeInTheDocument();
      expect(screen.getByText('Toast 3')).toBeInTheDocument();
    });
  });

  describe('Toast variants', () => {
    it('should render default variant with correct styling', () => {
      mockToasts.push({
        id: '1',
        title: 'Default Toast',
        variant: 'default',
      });

      const { container } = render(<Toaster />);

      const toast = container.querySelector('[role="status"]');
      expect(toast).toHaveClass('border-border', 'bg-background');
    });

    it('should render success variant with green styling', () => {
      mockToasts.push({
        id: '1',
        title: 'Success Toast',
        variant: 'success',
      });

      const { container } = render(<Toaster />);

      const toast = container.querySelector('[role="status"]');
      expect(toast).toHaveClass('border-green-200', 'bg-green-50');
    });

    it('should render destructive variant with red styling', () => {
      mockToasts.push({
        id: '1',
        title: 'Error Toast',
        variant: 'destructive',
      });

      const { container } = render(<Toaster />);

      const toast = container.querySelector('[role="status"]');
      expect(toast).toHaveClass('border-red-200', 'bg-red-50');
    });

    it('should default to default variant when not specified', () => {
      mockToasts.push({
        id: '1',
        title: 'No Variant Toast',
      });

      const { container } = render(<Toaster />);

      const toast = container.querySelector('[role="status"]');
      expect(toast).toHaveClass('border-border', 'bg-background');
    });
  });

  describe('Toast icons', () => {
    it('should show info icon for default variant', () => {
      mockToasts.push({
        id: '1',
        title: 'Default Toast',
        variant: 'default',
      });

      const { container } = render(<Toaster />);

      // Check for info icon (blue color)
      const icon = container.querySelector('.text-blue-500');
      expect(icon).toBeInTheDocument();
    });

    it('should show check circle icon for success variant', () => {
      mockToasts.push({
        id: '1',
        title: 'Success Toast',
        variant: 'success',
      });

      const { container } = render(<Toaster />);

      // Check for success icon (green color)
      const icon = container.querySelector('.text-green-500');
      expect(icon).toBeInTheDocument();
    });

    it('should show alert circle icon for destructive variant', () => {
      mockToasts.push({
        id: '1',
        title: 'Error Toast',
        variant: 'destructive',
      });

      const { container } = render(<Toaster />);

      // Check for error icon (red color)
      const icon = container.querySelector('.text-red-500');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Toast actions', () => {
    it('should render custom action element', () => {
      mockToasts.push({
        id: '1',
        title: 'Action Toast',
        action: <button>Undo</button>,
        variant: 'default',
      });

      render(<Toaster />);

      expect(screen.getByText('Undo')).toBeInTheDocument();
    });

    it('should render action button below description', () => {
      mockToasts.push({
        id: '1',
        title: 'Title',
        description: 'Description',
        action: <button data-testid='action-button'>Action</button>,
        variant: 'default',
      });

      render(<Toaster />);

      const actionButton = screen.getByTestId('action-button');
      expect(actionButton).toBeInTheDocument();
    });
  });

  describe('Toast dismiss functionality', () => {
    it('should dismiss toast when close button is clicked', () => {
      mockToasts.push({
        id: 'test-1',
        title: 'Dismissible Toast',
        variant: 'default',
      });

      render(<Toaster />);

      const closeButton = screen.getByRole('button');
      fireEvent.click(closeButton);

      expect(mockDismissToast).toHaveBeenCalledWith('test-1');
    });

    it('should auto-dismiss after default duration', () => {
      mockToasts.push({
        id: 'auto-dismiss-1',
        title: 'Auto Dismiss Toast',
        variant: 'default',
      });

      render(<Toaster />);

      expect(mockDismissToast).not.toHaveBeenCalled();

      // Fast-forward 5000ms (default duration)
      vi.advanceTimersByTime(5000);

      expect(mockDismissToast).toHaveBeenCalledWith('auto-dismiss-1');
    });

    it('should auto-dismiss after custom duration', () => {
      mockToasts.push({
        id: 'custom-duration-1',
        title: 'Custom Duration Toast',
        duration: 3000,
        variant: 'default',
      });

      render(<Toaster />);

      expect(mockDismissToast).not.toHaveBeenCalled();

      // Fast-forward 3000ms
      vi.advanceTimersByTime(3000);

      expect(mockDismissToast).toHaveBeenCalledWith('custom-duration-1');
    });

    it('should not auto-dismiss when duration is Infinity', () => {
      mockToasts.push({
        id: 'permanent-1',
        title: 'Permanent Toast',
        duration: Infinity,
        variant: 'default',
      });

      render(<Toaster />);

      // Fast-forward a long time
      vi.advanceTimersByTime(100000);

      // Should not have been dismissed
      expect(mockDismissToast).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have role="status" for screen readers', () => {
      mockToasts.push({
        id: '1',
        title: 'Accessible Toast',
        variant: 'default',
      });

      render(<Toaster />);

      const toast = screen.getByRole('status');
      expect(toast).toBeInTheDocument();
    });

    it('should have aria-live="off"', () => {
      mockToasts.push({
        id: '1',
        title: 'Toast',
        variant: 'default',
      });

      render(<Toaster />);

      const toast = screen.getByRole('status');
      expect(toast).toHaveAttribute('aria-live', 'off');
    });

    it('should have accessible close button', () => {
      mockToasts.push({
        id: '1',
        title: 'Toast',
        variant: 'default',
      });

      render(<Toaster />);

      const closeButton = screen.getByRole('button');
      expect(closeButton).toHaveAttribute('type', 'button');
    });
  });

  describe('Complex scenarios', () => {
    it('should handle multiple toasts with different variants', () => {
      mockToasts.push(
        {
          id: '1',
          title: 'Info',
          description: 'Information message',
          variant: 'default',
        },
        {
          id: '2',
          title: 'Success',
          description: 'Operation successful',
          variant: 'success',
        },
        {
          id: '3',
          title: 'Error',
          description: 'Something went wrong',
          variant: 'destructive',
        },
      );

      render(<Toaster />);

      expect(screen.getByText('Info')).toBeInTheDocument();
      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('should render toast with all features', () => {
      mockToasts.push({
        id: 'full-featured',
        title: 'Complete Toast',
        description: 'This toast has all features',
        action: <button>Take Action</button>,
        variant: 'success',
        duration: 3000,
      });

      render(<Toaster />);

      expect(screen.getByText('Complete Toast')).toBeInTheDocument();
      expect(screen.getByText('This toast has all features')).toBeInTheDocument();
      expect(screen.getByText('Take Action')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty toast array', () => {
      render(<Toaster />);

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('should handle toast with only id', () => {
      mockToasts.push({
        id: '1',
      });

      render(<Toaster />);

      // Should still render the toast container
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should handle very long titles', () => {
      mockToasts.push({
        id: '1',
        title: 'A'.repeat(200),
        variant: 'default',
      });

      render(<Toaster />);

      expect(screen.getByText('A'.repeat(200))).toBeInTheDocument();
    });

    it('should handle very long descriptions', () => {
      mockToasts.push({
        id: '1',
        description: 'Lorem ipsum dolor sit amet '.repeat(20),
        variant: 'default',
      });

      render(<Toaster />);

      const description = screen.getByText(/Lorem ipsum/);
      expect(description).toBeInTheDocument();
    });
  });
});
