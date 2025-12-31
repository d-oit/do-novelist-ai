import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';

import { Button } from '@/shared/components/ui/Button';

// Mock framer-motion
vi.mock('framer-motion', () => {
  const createMotionComponent = (elementType: string) => {
    return ({ children, ...props }: any) => {
      // Filter out Framer Motion specific props that cause React warnings
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
        ...domProps
      } = props;

      // Silence unused variable warnings
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
      ];

      return React.createElement(elementType, domProps, children);
    };
  };

  return {
    motion: {
      button: createMotionComponent('button'),
    },
  };
});

describe('Button', () => {
  it('renders with default variant', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('Click me');
    expect(button).toHaveClass('bg-primary');
  });

  it('renders with different variants', () => {
    const { rerender } = render(<Button variant='default'>Default</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-primary');

    rerender(<Button variant='destructive'>Destructive</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-destructive');

    rerender(<Button variant='outline'>Outline</Button>);
    expect(screen.getByRole('button')).toHaveClass('border');

    rerender(<Button variant='secondary'>Secondary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-secondary');

    rerender(<Button variant='ghost'>Ghost</Button>);
    expect(screen.getByRole('button')).toHaveClass('hover:bg-accent-hover');

    rerender(<Button variant='link'>Link</Button>);
    expect(screen.getByRole('button')).toHaveClass('text-primary');
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<Button size='sm'>Small</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-9');

    rerender(<Button size='default'>Default</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-10');

    rerender(<Button size='lg'>Large</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-11');
  });

  it('applies custom className', () => {
    render(<Button className='custom-class'>Custom</Button>);
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:opacity-50');
  });

  it('handles click events', () => {
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not handle click when disabled', () => {
    const handleClick = vi.fn();

    render(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>,
    );
    fireEvent.click(screen.getByRole('button'));

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('has focus-visible styles', () => {
    render(<Button>Focus me</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('focus-visible:ring-2');
    expect(button).toHaveClass('focus-visible:ring-primary/20');
  });

  it('has hover state classes', () => {
    render(<Button variant='default'>Hover me</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('hover:scale-[0.98]');
    expect(button).toHaveClass('hover:bg-primary-hover');
  });

  it('has active state classes with proper feedback', () => {
    render(<Button variant='default'>Press me</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('active:scale-97');
    expect(button).toHaveClass('active:bg-primary-active');
    expect(button).toHaveClass('active:shadow-inner');
  });

  it('has active state for outline variant', () => {
    render(<Button variant='outline'>Press me</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('active:bg-accent-active');
    expect(button).toHaveClass('active:shadow-inner');
  });

  it('has active state for ghost variant', () => {
    render(<Button variant='ghost'>Press me</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('active:bg-accent-active');
    expect(button).toHaveClass('active:shadow-inner');
  });

  it('has active state for secondary variant', () => {
    render(<Button variant='secondary'>Press me</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('active:bg-secondary-active');
    expect(button).toHaveClass('active:shadow-inner');
  });

  it('has active state for destructive variant', () => {
    render(<Button variant='destructive'>Press me</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('active:bg-destructive-active');
    expect(button).toHaveClass('active:shadow-inner');
  });

  it('has accessibility attributes', () => {
    render(<Button aria-label='Close'>X</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Close');
  });

  it('supports ref forwarding', () => {
    const ref = { current: null };
    render(<Button ref={ref}>Ref button</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('passes through additional props', () => {
    render(
      <Button data-testid='test-button' type='submit' form='my-form'>
        Submit
      </Button>,
    );
    const button = screen.getByTestId('test-button');
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toHaveAttribute('form', 'my-form');
  });

  it('has btn-press-effect utility class', () => {
    render(<Button>Press me</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('btn-press-effect');
  });

  it('has correct focus ring color for primary variant', () => {
    render(<Button variant='default'>Focus</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('focus-visible:ring-primary/20');
  });

  it('has correct focus ring color for destructive variant', () => {
    render(<Button variant='destructive'>Focus</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('focus-visible:ring-destructive/20');
  });

  it('has correct focus ring color for secondary variant', () => {
    render(<Button variant='secondary'>Focus</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('focus-visible:ring-secondary/20');
  });

  it('has correct focus ring color for outline/ghost variant', () => {
    render(<Button variant='ghost'>Focus</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('focus-visible:ring-accent/20');
  });
});
