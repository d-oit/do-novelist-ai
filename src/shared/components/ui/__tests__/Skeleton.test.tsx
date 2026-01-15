import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { Skeleton } from '@/shared/components/ui/Skeleton';

describe('Skeleton', () => {
  describe('basic rendering', () => {
    it('should render skeleton element', () => {
      render(<Skeleton data-testid='skeleton' />);

      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toBeInTheDocument();
    });

    it('should render as div element', () => {
      render(<Skeleton data-testid='skeleton' />);

      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton.tagName).toBe('DIV');
    });

    it('should have default skeleton classes', () => {
      render(<Skeleton data-testid='skeleton' />);

      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveClass('animate-pulse', 'rounded-md', 'bg-muted');
    });
  });

  describe('custom styling', () => {
    it('should apply custom className', () => {
      render(<Skeleton className='custom-skeleton' data-testid='skeleton' />);

      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveClass('custom-skeleton');
    });

    it('should preserve default classes when custom className is added', () => {
      render(<Skeleton className='h-4 w-full' data-testid='skeleton' />);

      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveClass('animate-pulse', 'rounded-md', 'bg-muted', 'h-4', 'w-full');
    });

    it('should support height and width classes', () => {
      render(<Skeleton className='h-10 w-20' data-testid='skeleton' />);

      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveClass('h-10', 'w-20');
    });

    it('should support rounded shape variations', () => {
      render(<Skeleton className='rounded-full' data-testid='skeleton' />);

      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveClass('rounded-full');
    });
  });

  describe('props forwarding', () => {
    it('should forward additional HTML attributes', () => {
      render(<Skeleton data-testid='skeleton' aria-label='Loading...' role='status' />);

      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveAttribute('aria-label', 'Loading...');
      expect(skeleton).toHaveAttribute('role', 'status');
    });

    it('should forward data attributes', () => {
      render(<Skeleton data-testid='skeleton' data-custom='value' />);

      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveAttribute('data-custom', 'value');
    });

    it('should forward style prop', () => {
      render(<Skeleton data-testid='skeleton' style={{ marginTop: '10px' }} />);

      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveStyle({ marginTop: '10px' });
    });

    it('should forward id attribute', () => {
      render(<Skeleton data-testid='skeleton' id='unique-skeleton' />);

      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveAttribute('id', 'unique-skeleton');
    });
  });

  describe('common skeleton patterns', () => {
    it('should render text line skeleton', () => {
      render(<Skeleton className='h-4 w-full' data-testid='text-skeleton' />);

      const skeleton = screen.getByTestId('text-skeleton');
      expect(skeleton).toHaveClass('h-4', 'w-full');
    });

    it('should render avatar skeleton', () => {
      render(<Skeleton className='h-12 w-12 rounded-full' data-testid='avatar-skeleton' />);

      const skeleton = screen.getByTestId('avatar-skeleton');
      expect(skeleton).toHaveClass('h-12', 'w-12', 'rounded-full');
    });

    it('should render card skeleton', () => {
      render(<Skeleton className='h-32 w-full rounded-lg' data-testid='card-skeleton' />);

      const skeleton = screen.getByTestId('card-skeleton');
      expect(skeleton).toHaveClass('h-32', 'w-full', 'rounded-lg');
    });

    it('should render button skeleton', () => {
      render(<Skeleton className='h-10 w-24' data-testid='button-skeleton' />);

      const skeleton = screen.getByTestId('button-skeleton');
      expect(skeleton).toHaveClass('h-10', 'w-24');
    });
  });

  describe('multiple skeletons', () => {
    it('should render multiple skeleton elements', () => {
      render(
        <div>
          <Skeleton data-testid='skeleton-1' />
          <Skeleton data-testid='skeleton-2' />
          <Skeleton data-testid='skeleton-3' />
        </div>,
      );

      expect(screen.getByTestId('skeleton-1')).toBeInTheDocument();
      expect(screen.getByTestId('skeleton-2')).toBeInTheDocument();
      expect(screen.getByTestId('skeleton-3')).toBeInTheDocument();
    });

    it('should support complex skeleton layouts', () => {
      render(
        <div data-testid='skeleton-layout'>
          <div>
            <Skeleton className='h-12 w-12 rounded-full' data-testid='avatar' />
            <Skeleton className='h-4 w-32' data-testid='title' />
            <Skeleton className='h-3 w-full' data-testid='description' />
          </div>
        </div>,
      );

      expect(screen.getByTestId('skeleton-layout')).toBeInTheDocument();
      expect(screen.getByTestId('avatar')).toBeInTheDocument();
      expect(screen.getByTestId('title')).toBeInTheDocument();
      expect(screen.getByTestId('description')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should support aria-label for screen readers', () => {
      render(<Skeleton aria-label='Loading content' data-testid='skeleton' />);

      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveAttribute('aria-label', 'Loading content');
    });

    it('should support role attribute', () => {
      render(<Skeleton role='status' data-testid='skeleton' />);

      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveAttribute('role', 'status');
    });

    it('should support aria-busy attribute', () => {
      render(<Skeleton aria-busy='true' data-testid='skeleton' />);

      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('edge cases', () => {
    it('should handle empty className', () => {
      render(<Skeleton className='' data-testid='skeleton' />);

      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveClass('animate-pulse', 'rounded-md', 'bg-muted');
    });

    it('should handle undefined className', () => {
      render(<Skeleton className={undefined} data-testid='skeleton' />);

      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveClass('animate-pulse', 'rounded-md', 'bg-muted');
    });

    it('should handle multiple space-separated classes', () => {
      render(<Skeleton className='class1 class2 class3' data-testid='skeleton' />);

      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveClass('class1', 'class2', 'class3');
    });

    it('should render without any props except data-testid', () => {
      render(<Skeleton data-testid='minimal-skeleton' />);

      expect(screen.getByTestId('minimal-skeleton')).toBeInTheDocument();
    });
  });

  describe('animation', () => {
    it('should have animate-pulse class for animation', () => {
      render(<Skeleton data-testid='skeleton' />);

      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveClass('animate-pulse');
    });

    it('should allow animation override via className', () => {
      render(<Skeleton className='animate-none' data-testid='skeleton' />);

      const skeleton = screen.getByTestId('skeleton');
      // animate-none should be present as it's in the className
      expect(skeleton).toHaveClass('animate-none');
    });
  });
});
