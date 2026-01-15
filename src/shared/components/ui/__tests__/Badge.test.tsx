import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { Badge } from '@/shared/components/ui/Badge';

describe('Badge', () => {
  describe('rendering', () => {
    it('should render with children text', () => {
      render(<Badge>Test Badge</Badge>);

      expect(screen.getByText('Test Badge')).toBeInTheDocument();
    });

    it('should render with default variant', () => {
      render(<Badge>Default</Badge>);
      const badge = screen.getByText('Default');

      expect(badge).toHaveClass('bg-primary', 'text-primary-foreground');
    });

    it('should render with secondary variant', () => {
      render(<Badge variant='secondary'>Secondary</Badge>);
      const badge = screen.getByText('Secondary');

      expect(badge).toHaveClass('bg-secondary', 'text-secondary-foreground');
    });

    it('should render with destructive variant', () => {
      render(<Badge variant='destructive'>Error</Badge>);
      const badge = screen.getByText('Error');

      expect(badge).toHaveClass('bg-destructive', 'text-destructive-foreground');
    });

    it('should render with outline variant', () => {
      render(<Badge variant='outline'>Outline</Badge>);
      const badge = screen.getByText('Outline');

      expect(badge).toHaveClass('text-foreground');
    });

    it('should render with success variant', () => {
      render(<Badge variant='success'>Success</Badge>);
      const badge = screen.getByText('Success');

      expect(badge).toHaveClass('bg-green-500', 'text-white');
    });

    it('should render with warning variant', () => {
      render(<Badge variant='warning'>Warning</Badge>);
      const badge = screen.getByText('Warning');

      expect(badge).toHaveClass('bg-yellow-500', 'text-white');
    });

    it('should render with info variant', () => {
      render(<Badge variant='info'>Info</Badge>);
      const badge = screen.getByText('Info');

      expect(badge).toHaveClass('bg-blue-500', 'text-white');
    });
  });

  describe('styling', () => {
    it('should apply base styles', () => {
      render(<Badge>Test</Badge>);
      const badge = screen.getByText('Test');

      expect(badge).toHaveClass(
        'inline-flex',
        'items-center',
        'rounded-full',
        'border',
        'px-2.5',
        'py-0.5',
        'text-xs',
        'font-semibold',
      );
    });

    it('should merge custom className', () => {
      render(<Badge className='custom-badge'>Test</Badge>);
      const badge = screen.getByText('Test');

      expect(badge).toHaveClass('custom-badge');
      expect(badge).toHaveClass('inline-flex'); // Base class should still be there
    });

    it('should apply transition classes', () => {
      render(<Badge>Test</Badge>);
      const badge = screen.getByText('Test');

      expect(badge).toHaveClass('transition-colors');
    });

    it('should apply focus styles', () => {
      render(<Badge>Test</Badge>);
      const badge = screen.getByText('Test');

      expect(badge).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-ring');
    });
  });

  describe('accessibility', () => {
    it('should render as a div element', () => {
      const { container } = render(<Badge>Test</Badge>);
      const badge = container.querySelector('div');

      expect(badge).toBeInTheDocument();
    });

    it('should support ARIA attributes', () => {
      render(<Badge aria-label='Status badge'>Active</Badge>);
      const badge = screen.getByLabelText('Status badge');

      expect(badge).toBeInTheDocument();
    });

    it('should support role attribute', () => {
      render(<Badge role='status'>Loading</Badge>);
      const badge = screen.getByRole('status');

      expect(badge).toBeInTheDocument();
    });
  });

  describe('forwarded ref', () => {
    it('should forward ref to the badge element', () => {
      const ref = { current: null as HTMLDivElement | null };
      render(<Badge ref={ref}>Test</Badge>);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current?.textContent).toBe('Test');
    });
  });

  describe('additional props', () => {
    it('should pass through HTML attributes', () => {
      render(
        <Badge data-testid='my-badge' id='badge-1'>
          Test
        </Badge>,
      );
      const badge = screen.getByTestId('my-badge');

      expect(badge).toHaveAttribute('id', 'badge-1');
    });

    it('should apply title attribute', () => {
      render(<Badge title='Badge tooltip'>Hover me</Badge>);
      const badge = screen.getByText('Hover me');

      expect(badge).toHaveAttribute('title', 'Badge tooltip');
    });

    it('should support onClick handler', () => {
      const handleClick = vi.fn();
      render(<Badge onClick={handleClick}>Clickable</Badge>);
      const badge = screen.getByText('Clickable');

      badge.click();
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('children content', () => {
    it('should render text children', () => {
      render(<Badge>Simple Text</Badge>);

      expect(screen.getByText('Simple Text')).toBeInTheDocument();
    });

    it('should render numeric children', () => {
      render(<Badge>{42}</Badge>);

      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('should render complex children', () => {
      render(
        <Badge>
          <span>Icon</span> Text
        </Badge>,
      );

      expect(screen.getByText('Icon')).toBeInTheDocument();
      expect(screen.getByText('Text')).toBeInTheDocument();
    });
  });

  describe('variant combinations', () => {
    it('should apply variant with custom className', () => {
      render(
        <Badge variant='success' className='mx-2'>
          Success
        </Badge>,
      );
      const badge = screen.getByText('Success');

      expect(badge).toHaveClass('bg-green-500', 'mx-2');
    });

    it('should handle undefined variant (uses default)', () => {
      render(<Badge variant={undefined}>Test</Badge>);
      const badge = screen.getByText('Test');

      expect(badge).toHaveClass('bg-primary');
    });
  });
});
