import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { Progress } from '@/shared/components/ui/Progress';

describe('Progress', () => {
  describe('rendering', () => {
    it('should render with default props', () => {
      const { container } = render(<Progress />);
      const progressBar = container.querySelector('[role="progressbar"]');

      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });

    it('should render with specific value', () => {
      const { container } = render(<Progress value={50} />);
      const progressBar = container.querySelector('[role="progressbar"]');

      expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    });

    it('should render with 0% progress', () => {
      const { container } = render(<Progress value={0} />);
      const progressBar = container.querySelector('[role="progressbar"]');

      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
    });

    it('should render with 100% progress', () => {
      const { container } = render(<Progress value={100} />);
      const progressBar = container.querySelector('[role="progressbar"]');

      expect(progressBar).toHaveAttribute('aria-valuenow', '100');
    });

    it('should handle null value', () => {
      const { container } = render(<Progress value={null} />);
      const progressBar = container.querySelector('[role="progressbar"]');

      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
    });
  });

  describe('styling', () => {
    it('should apply default styles', () => {
      const { container } = render(<Progress value={50} />);
      const progressBar = container.querySelector('[role="progressbar"]');

      expect(progressBar).toHaveClass('relative', 'h-4', 'w-full', 'overflow-hidden', 'rounded-full', 'bg-secondary');
    });

    it('should merge custom className', () => {
      const { container } = render(<Progress value={50} className='custom-class' />);
      const progressBar = container.querySelector('[role="progressbar"]');

      expect(progressBar).toHaveClass('custom-class');
      expect(progressBar).toHaveClass('relative'); // Default class should still be there
    });

    it('should have correct transform style for progress indicator', () => {
      const { container } = render(<Progress value={75} />);
      const indicator = container.querySelector('.bg-primary');

      expect(indicator).toHaveStyle({ transform: 'translateX(-25%)' });
    });

    it('should have correct transform for 0% progress', () => {
      const { container } = render(<Progress value={0} />);
      const indicator = container.querySelector('.bg-primary');

      expect(indicator).toHaveStyle({ transform: 'translateX(-100%)' });
    });

    it('should have correct transform for 100% progress', () => {
      const { container } = render(<Progress value={100} />);
      const indicator = container.querySelector('.bg-primary');

      expect(indicator).toHaveStyle({ transform: 'translateX(-0%)' });
    });
  });

  describe('accessibility', () => {
    it('should have progressbar role', () => {
      const { container } = render(<Progress value={50} />);
      const progressBar = container.querySelector('[role="progressbar"]');

      expect(progressBar).toBeInTheDocument();
    });

    it('should have correct ARIA attributes', () => {
      const { container } = render(<Progress value={65} />);
      const progressBar = container.querySelector('[role="progressbar"]');

      expect(progressBar).toHaveAttribute('aria-valuenow', '65');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });

    it('should be accessible by screen readers', () => {
      render(<Progress value={45} />);
      const progressBar = screen.getByRole('progressbar');

      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle values above 100', () => {
      const { container } = render(<Progress value={150} />);
      const progressBar = container.querySelector('[role="progressbar"]');

      expect(progressBar).toHaveAttribute('aria-valuenow', '150');
    });

    it('should handle negative values', () => {
      const { container } = render(<Progress value={-10} />);
      const progressBar = container.querySelector('[role="progressbar"]');

      expect(progressBar).toHaveAttribute('aria-valuenow', '-10');
    });

    it('should handle decimal values', () => {
      const { container } = render(<Progress value={45.7} />);
      const progressBar = container.querySelector('[role="progressbar"]');

      expect(progressBar).toHaveAttribute('aria-valuenow', '45.7');
    });
  });

  describe('forwarded ref', () => {
    it('should forward ref to the progress element', () => {
      const ref = { current: null as HTMLDivElement | null };
      render(<Progress value={50} ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current).toHaveAttribute('role', 'progressbar');
    });
  });

  describe('additional props', () => {
    it('should pass through additional HTML attributes', () => {
      const { container } = render(<Progress value={50} data-testid='my-progress' id='progress-1' />);
      const progressBar = container.querySelector('[role="progressbar"]');

      expect(progressBar).toHaveAttribute('data-testid', 'my-progress');
      expect(progressBar).toHaveAttribute('id', 'progress-1');
    });

    it('should apply title attribute', () => {
      const { container } = render(<Progress value={50} title='Loading progress' />);
      const progressBar = container.querySelector('[role="progressbar"]');

      expect(progressBar).toHaveAttribute('title', 'Loading progress');
    });
  });
});
