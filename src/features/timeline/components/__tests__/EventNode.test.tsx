import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';

import { EventNode } from '@/features/timeline/components/EventNode';
import type { TimelineEvent } from '@/types';

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
  Calendar: ({ className }: any) => <div className={className} data-testid='calendar-icon' />,
  MapPin: ({ className }: any) => <div className={className} data-testid='mappin-icon' />,
  Users: ({ className }: any) => <div className={className} data-testid='users-icon' />,
}));

// Mock Badge component
vi.mock('@/shared/components/ui/Badge', () => ({
  Badge: ({ children, className, variant }: any) => (
    <span className={className} data-variant={variant} data-testid='badge'>
      {children}
    </span>
  ),
}));

describe('EventNode', () => {
  const mockEvent: TimelineEvent = {
    id: 'event-1',
    title: 'First Event',
    description: 'This is the first event in the timeline',
    chronologicalIndex: 1,
    date: 'Year 1',
    relatedChapterId: 'chapter-1',
    charactersInvolved: ['char-1', 'char-2'],
    locationId: 'location-1',
    tags: ['important', 'climax'],
    importance: 'major',
  };

  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnClick.mockClear();
  });

  describe('Rendering - Basic', () => {
    it('renders without errors', () => {
      render(<EventNode event={mockEvent} onClick={mockOnClick} isSelected={false} />);

      expect(screen.getByText('First Event')).toBeInTheDocument();
      expect(screen.getByText('This is the first event in the timeline')).toBeInTheDocument();
    });

    it('renders chronological index', () => {
      render(<EventNode event={mockEvent} onClick={mockOnClick} isSelected={false} />);

      expect(screen.getByText('#1')).toBeInTheDocument();
    });

    it('renders event title', () => {
      render(<EventNode event={mockEvent} onClick={mockOnClick} isSelected={false} />);

      expect(screen.getByText('First Event')).toBeInTheDocument();
    });

    it('renders event description', () => {
      render(<EventNode event={mockEvent} onClick={mockOnClick} isSelected={false} />);

      expect(screen.getByText('This is the first event in the timeline')).toBeInTheDocument();
    });
  });

  describe('Event Properties', () => {
    it('renders date when provided', () => {
      render(<EventNode event={mockEvent} onClick={mockOnClick} isSelected={false} />);

      expect(screen.getByText('Year 1')).toBeInTheDocument();
      expect(screen.getByTestId('calendar-icon')).toBeInTheDocument();
    });

    it('renders location when provided', () => {
      render(<EventNode event={mockEvent} onClick={mockOnClick} isSelected={false} />);

      expect(screen.getByText('location-1')).toBeInTheDocument();
      expect(screen.getByTestId('mappin-icon')).toBeInTheDocument();
    });

    it('renders characters involved count', () => {
      render(<EventNode event={mockEvent} onClick={mockOnClick} isSelected={false} />);

      expect(screen.getByText('2 Characters')).toBeInTheDocument();
      expect(screen.getByTestId('users-icon')).toBeInTheDocument();
    });

    it('renders tags when provided', () => {
      render(<EventNode event={mockEvent} onClick={mockOnClick} isSelected={false} />);

      expect(screen.getByText('important')).toBeInTheDocument();
      expect(screen.getByText('climax')).toBeInTheDocument();
    });
  });

  describe('Importance Badge', () => {
    it('renders major importance badge', () => {
      render(<EventNode event={mockEvent} onClick={mockOnClick} isSelected={false} />);

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveTextContent('Major');
      expect(badge).toHaveAttribute('data-variant', 'destructive');
    });

    it('does not render badge for minor importance', () => {
      const minorEvent: TimelineEvent = { ...mockEvent, importance: 'minor' };
      render(<EventNode event={minorEvent} onClick={mockOnClick} isSelected={false} />);

      expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
    });

    it('does not render badge for background importance', () => {
      const backgroundEvent: TimelineEvent = { ...mockEvent, importance: 'background' };
      render(<EventNode event={backgroundEvent} onClick={mockOnClick} isSelected={false} />);

      expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
    });
  });

  describe('Selection State', () => {
    it('applies selection ring when selected', () => {
      const { container } = render(<EventNode event={mockEvent} onClick={mockOnClick} isSelected={true} />);

      const node = container.querySelector('[data-testid="motion-div"]');
      expect(node).toHaveClass('ring-2');
      expect(node).toHaveClass('ring-blue-500');
    });

    it('does not apply selection ring when not selected', () => {
      const { container } = render(<EventNode event={mockEvent} onClick={mockOnClick} isSelected={false} />);

      const node = container.querySelector('[data-testid="motion-div"]');
      expect(node).not.toHaveClass('ring-2');
    });
  });

  describe('User Interactions', () => {
    it('calls onClick when clicked', () => {
      render(<EventNode event={mockEvent} onClick={mockOnClick} isSelected={false} />);

      const node = screen.getByText('First Event').closest('[data-testid="motion-div"]');
      if (node) {
        fireEvent.click(node);
      }

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('is clickable element', () => {
      const { container } = render(<EventNode event={mockEvent} onClick={mockOnClick} isSelected={false} />);

      const node = container.querySelector('[data-testid="motion-div"]');
      expect(node).toHaveClass('cursor-pointer');
    });
  });

  describe('Missing Properties', () => {
    it('renders without date', () => {
      const eventWithoutDate: TimelineEvent = { ...mockEvent, date: undefined };
      render(<EventNode event={eventWithoutDate} onClick={mockOnClick} isSelected={false} />);

      expect(screen.queryByTestId('calendar-icon')).not.toBeInTheDocument();
      expect(screen.queryByText('Year 1')).not.toBeInTheDocument();
    });

    it('renders without location', () => {
      const eventWithoutLocation: TimelineEvent = { ...mockEvent, locationId: undefined };
      render(<EventNode event={eventWithoutLocation} onClick={mockOnClick} isSelected={false} />);

      expect(screen.queryByTestId('mappin-icon')).not.toBeInTheDocument();
      expect(screen.queryByText('location-1')).not.toBeInTheDocument();
    });

    it('renders without characters', () => {
      const eventWithoutChars: TimelineEvent = { ...mockEvent, charactersInvolved: [] };
      render(<EventNode event={eventWithoutChars} onClick={mockOnClick} isSelected={false} />);

      expect(screen.queryByTestId('users-icon')).not.toBeInTheDocument();
      expect(screen.queryByText(/Characters/)).not.toBeInTheDocument();
    });

    it('renders without tags', () => {
      const eventWithoutTags: TimelineEvent = { ...mockEvent, tags: [] };
      render(<EventNode event={eventWithoutTags} onClick={mockOnClick} isSelected={false} />);

      expect(screen.queryByText('important')).not.toBeInTheDocument();
      expect(screen.queryByText('climax')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles very long title', () => {
      const longTitleEvent: TimelineEvent = {
        ...mockEvent,
        title: 'A'.repeat(100),
      };
      render(<EventNode event={longTitleEvent} onClick={mockOnClick} isSelected={false} />);

      const titleElement = screen.getByText('A'.repeat(100));
      expect(titleElement).toBeInTheDocument();
    });

    it('handles very long description', () => {
      const longDescEvent: TimelineEvent = {
        ...mockEvent,
        description: 'B'.repeat(500),
      };
      render(<EventNode event={longDescEvent} onClick={mockOnClick} isSelected={false} />);

      const descElement = screen.getByText('B'.repeat(500));
      expect(descElement).toBeInTheDocument();
    });

    it('handles single character involved', () => {
      const singleCharEvent: TimelineEvent = {
        ...mockEvent,
        charactersInvolved: ['char-1'],
      };
      render(<EventNode event={singleCharEvent} onClick={mockOnClick} isSelected={false} />);

      expect(screen.getByText('1 Characters')).toBeInTheDocument();
    });

    it('handles many characters involved', () => {
      const manyCharsEvent: TimelineEvent = {
        ...mockEvent,
        charactersInvolved: Array.from({ length: 10 }, (_, i) => `char-${i}`),
      };
      render(<EventNode event={manyCharsEvent} onClick={mockOnClick} isSelected={false} />);

      expect(screen.getByText('10 Characters')).toBeInTheDocument();
    });

    it('handles many tags', () => {
      const manyTagsEvent: TimelineEvent = {
        ...mockEvent,
        tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'],
      };
      render(<EventNode event={manyTagsEvent} onClick={mockOnClick} isSelected={false} />);

      expect(screen.getByText('tag1')).toBeInTheDocument();
      expect(screen.getByText('tag5')).toBeInTheDocument();
    });

    it('handles chronological index 0', () => {
      const indexZeroEvent: TimelineEvent = { ...mockEvent, chronologicalIndex: 0 };
      render(<EventNode event={indexZeroEvent} onClick={mockOnClick} isSelected={false} />);

      expect(screen.getByText('#0')).toBeInTheDocument();
    });

    it('handles large chronological index', () => {
      const largeIndexEvent: TimelineEvent = { ...mockEvent, chronologicalIndex: 1000 };
      render(<EventNode event={largeIndexEvent} onClick={mockOnClick} isSelected={false} />);

      expect(screen.getByText('#1000')).toBeInTheDocument();
    });
  });

  describe('Visual Styling', () => {
    it('applies card styling', () => {
      const { container } = render(<EventNode event={mockEvent} onClick={mockOnClick} isSelected={false} />);

      const card = container.querySelector('.rounded-lg');
      expect(card).toHaveClass('border');
      expect(card).toHaveClass('shadow-sm');
    });

    it('applies fixed width', () => {
      const { container } = render(<EventNode event={mockEvent} onClick={mockOnClick} isSelected={false} />);

      const node = container.querySelector('[data-testid="motion-div"]');
      expect(node).toHaveClass('w-[250px]');
      expect(node).toHaveClass('min-w-[250px]');
    });

    it('applies text truncation to description', () => {
      const { container } = render(<EventNode event={mockEvent} onClick={mockOnClick} isSelected={false} />);

      const desc = container.querySelector('.line-clamp-3');
      expect(desc).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('renders semantic heading for title', () => {
      render(<EventNode event={mockEvent} onClick={mockOnClick} isSelected={false} />);

      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toHaveTextContent('First Event');
    });

    it('has clickable element with onClick handler', () => {
      const { container } = render(<EventNode event={mockEvent} onClick={mockOnClick} isSelected={false} />);

      // The motion.div should be clickable (cursor-pointer class)
      const node = container.querySelector('[data-testid="motion-div"]');
      expect(node).toHaveClass('cursor-pointer');
    });
  });

  describe('Layout Structure', () => {
    it('has proper card structure', () => {
      const { container } = render(<EventNode event={mockEvent} onClick={mockOnClick} isSelected={false} />);

      const card = container.querySelector('.rounded-lg');
      expect(card).toHaveClass('bg-card');
      expect(card).toHaveClass('text-card-foreground');
    });

    it('has header section with index and badge', () => {
      render(<EventNode event={mockEvent} onClick={mockOnClick} isSelected={false} />);

      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('Major')).toBeInTheDocument();
    });

    it('has footer section with metadata', () => {
      render(<EventNode event={mockEvent} onClick={mockOnClick} isSelected={false} />);

      // Check for metadata icons
      expect(screen.getByTestId('calendar-icon')).toBeInTheDocument();
      expect(screen.getByTestId('mappin-icon')).toBeInTheDocument();
      expect(screen.getByTestId('users-icon')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('maintains layout on different viewport sizes', () => {
      const { container } = render(<EventNode event={mockEvent} onClick={mockOnClick} isSelected={false} />);

      const node = container.querySelector('[data-testid="motion-div"]');
      expect(node).toHaveClass('w-[250px]');
      // Fixed width ensures consistent layout
    });
  });
});
