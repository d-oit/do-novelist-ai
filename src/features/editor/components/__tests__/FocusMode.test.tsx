/**
 * FocusMode Component Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { FocusMode } from '@/features/editor/components/FocusMode';
import type { Chapter } from '@/shared/types';

describe('FocusMode', () => {
  const mockChapter: Chapter = {
    id: 'chapter-1',
    title: 'Test Chapter',
    content: 'Initial content',
    summary: 'Test summary',
    orderIndex: 1,
    status: 'drafting' as any,
    wordCount: 0,
    characterCount: 0,
    estimatedReadingTime: 0,
    tags: [],
    notes: '',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProps = {
    isActive: true,
    onExit: vi.fn(),
    chapter: mockChapter,
    content: 'Test content for word count',
    onContentChange: vi.fn(),
    onSave: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('renders nothing when isActive is false', () => {
      const { container } = render(<FocusMode {...mockProps} isActive={false} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders focus mode UI when isActive is true', () => {
      render(<FocusMode {...mockProps} />);
      expect(screen.getByPlaceholderText('Just write...')).toBeInTheDocument();
      expect(screen.getByText('Exit Focus Mode')).toBeInTheDocument();
    });

    it('displays chapter title in header', () => {
      render(<FocusMode {...mockProps} />);
      expect(screen.getByText('Test Chapter')).toBeInTheDocument();
    });

    it('displays word count', () => {
      render(<FocusMode {...mockProps} content='one two three four' />);
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('Words')).toBeInTheDocument();
    });
  });

  describe('Timer Functionality', () => {
    it('displays timer with default 25 minutes', () => {
      render(<FocusMode {...mockProps} />);
      expect(screen.getByText('25:00')).toBeInTheDocument();
    });

    it('starts timer when play button is clicked', async () => {
      render(<FocusMode {...mockProps} />);
      const playButton = screen.getByTitle('Start Timer');
      fireEvent.click(playButton);

      await waitFor(() => {
        expect(screen.getByTitle('Pause Timer')).toBeInTheDocument();
      });

      // Timer should be running (button changed to Pause)
      expect(screen.getByTitle('Pause Timer')).toBeInTheDocument();
    });

    it('pauses timer when pause button is clicked', () => {
      render(<FocusMode {...mockProps} />);
      const playButton = screen.getByTitle('Start Timer');
      fireEvent.click(playButton);

      vi.advanceTimersByTime(2000);

      const pauseButton = screen.getByTitle('Pause Timer');
      fireEvent.click(pauseButton);

      const timeAfterPause = screen.getByText(/24:58/);
      vi.advanceTimersByTime(2000);
      expect(timeAfterPause).toBeInTheDocument();
    });

    it('resets timer to initial duration', () => {
      render(<FocusMode {...mockProps} />);
      const playButton = screen.getByTitle('Start Timer');
      fireEvent.click(playButton);

      vi.advanceTimersByTime(5000);

      const resetButton = screen.getByTitle('Reset Timer');
      fireEvent.click(resetButton);

      expect(screen.getByText('25:00')).toBeInTheDocument();
    });

    it('changes timer duration via settings', async () => {
      render(<FocusMode {...mockProps} />);

      // Open settings
      const buttons = screen.getAllByRole('button');
      const settingsButton = buttons.find(btn =>
        btn.querySelector('svg')?.getAttribute('class')?.includes('lucide-settings'),
      );
      fireEvent.click(settingsButton!);

      // Select 45 minute duration
      const duration45Button = screen.getByRole('button', { name: '45m' });
      fireEvent.click(duration45Button);

      await waitFor(
        () => {
          expect(screen.getByText('45:00')).toBeInTheDocument();
        },
        { timeout: 2000 },
      );
    });
  });

  describe('Word Count Goals', () => {
    it('allows setting a word count goal', async () => {
      render(<FocusMode {...mockProps} content='one two three' />);

      // Open settings
      const buttons = screen.getAllByRole('button');
      const settingsButton = buttons.find(btn =>
        btn.querySelector('svg')?.getAttribute('class')?.includes('lucide-settings'),
      );
      fireEvent.click(settingsButton!);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('e.g., 500')).toBeInTheDocument();
      });

      // Set goal
      const goalInput = screen.getByPlaceholderText('e.g., 500');
      fireEvent.change(goalInput, { target: { value: '10' } });

      const setGoalButton = screen.getByRole('button', { name: /Set Goal/i });
      fireEvent.click(setGoalButton);

      await waitFor(
        () => {
          expect(screen.getByText(/Goal/)).toBeInTheDocument();
          expect(screen.getByText(/0 \/ 10/)).toBeInTheDocument();
        },
        { timeout: 2000 },
      );
    });

    it('tracks progress toward word count goal', async () => {
      const { rerender } = render(<FocusMode {...mockProps} content='one two three' />);

      // Open settings and set goal
      const buttons = screen.getAllByRole('button');
      const settingsButton = buttons.find(btn =>
        btn.querySelector('svg')?.getAttribute('class')?.includes('lucide-settings'),
      );
      fireEvent.click(settingsButton!);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('e.g., 500')).toBeInTheDocument();
      });

      const goalInput = screen.getByPlaceholderText('e.g., 500');
      fireEvent.change(goalInput, { target: { value: '5' } });
      fireEvent.click(screen.getByRole('button', { name: /Set Goal/i }));

      // Add more words
      rerender(<FocusMode {...mockProps} content='one two three four five six seven eight' />);

      await waitFor(
        () => {
          expect(screen.getByText(/5 \/ 5/)).toBeInTheDocument();
        },
        { timeout: 2000 },
      );
    });

    it('shows achievement message when goal is reached', async () => {
      const { rerender } = render(<FocusMode {...mockProps} content='one two' />);

      // Set goal
      const buttons = screen.getAllByRole('button');
      const settingsButton = buttons.find(btn =>
        btn.querySelector('svg')?.getAttribute('class')?.includes('lucide-settings'),
      );
      fireEvent.click(settingsButton!);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('e.g., 500')).toBeInTheDocument();
      });

      const goalInput = screen.getByPlaceholderText('e.g., 500');
      fireEvent.change(goalInput, { target: { value: '3' } });
      fireEvent.click(screen.getByRole('button', { name: /Set Goal/i }));

      // Reach goal
      rerender(<FocusMode {...mockProps} content='one two three four five' />);

      await waitFor(
        () => {
          expect(screen.getByText(/Goal achieved!/)).toBeInTheDocument();
        },
        { timeout: 2000 },
      );
    });

    it('clears word count goal', async () => {
      render(<FocusMode {...mockProps} content='one two three' />);

      // Set goal
      const buttons = screen.getAllByRole('button');
      const settingsButton = buttons.find(btn =>
        btn.querySelector('svg')?.getAttribute('class')?.includes('lucide-settings'),
      );
      fireEvent.click(settingsButton!);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('e.g., 500')).toBeInTheDocument();
      });

      const goalInput = screen.getByPlaceholderText('e.g., 500');
      fireEvent.change(goalInput, { target: { value: '10' } });
      fireEvent.click(screen.getByRole('button', { name: /Set Goal/i }));

      await waitFor(() => {
        expect(screen.getByText(/Goal/)).toBeInTheDocument();
      });

      // Open settings again and clear
      fireEvent.click(settingsButton!);
      await waitFor(() => {
        expect(screen.getByText('Clear Goal')).toBeInTheDocument();
      });
      const clearButton = screen.getByText('Clear Goal');
      fireEvent.click(clearButton);

      await waitFor(
        () => {
          expect(screen.queryByText(/0 \/ 10/)).not.toBeInTheDocument();
        },
        { timeout: 2000 },
      );
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('exits focus mode on Escape key', () => {
      render(<FocusMode {...mockProps} />);
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(mockProps.onExit).toHaveBeenCalledTimes(1);
    });

    it('saves content on Ctrl+S', () => {
      render(<FocusMode {...mockProps} />);
      fireEvent.keyDown(document, { key: 's', ctrlKey: true });
      expect(mockProps.onSave).toHaveBeenCalledTimes(1);
    });

    it('saves content on Cmd+S (Mac)', () => {
      render(<FocusMode {...mockProps} />);
      fireEvent.keyDown(document, { key: 's', metaKey: true });
      expect(mockProps.onSave).toHaveBeenCalledTimes(1);
    });

    it('toggles settings on Ctrl+G', () => {
      render(<FocusMode {...mockProps} />);

      // Open settings
      fireEvent.keyDown(document, { key: 'g', ctrlKey: true });
      expect(screen.getByText('Focus Settings')).toBeInTheDocument();

      // Close settings
      fireEvent.keyDown(document, { key: 'g', ctrlKey: true });
      expect(screen.queryByText('Focus Settings')).not.toBeInTheDocument();
    });
  });

  describe('Content Editing', () => {
    it('calls onContentChange when text is typed', () => {
      render(<FocusMode {...mockProps} />);
      const textarea = screen.getByPlaceholderText('Just write...');

      fireEvent.change(textarea, { target: { value: 'New content' } });
      expect(mockProps.onContentChange).toHaveBeenCalledWith('New content');
    });

    it('displays current content', () => {
      render(<FocusMode {...mockProps} content='Display this content' />);
      const textarea = screen.getByPlaceholderText('Just write...') as HTMLTextAreaElement;
      expect(textarea.value).toBe('Display this content');
    });

    it('autofocuses the textarea', () => {
      render(<FocusMode {...mockProps} />);
      const textarea = screen.getByPlaceholderText('Just write...');
      expect(textarea).toHaveFocus();
    });
  });

  describe('Settings Panel', () => {
    it('toggles settings panel', () => {
      render(<FocusMode {...mockProps} />);
      const settingsButton = screen
        .getAllByRole('button')
        .find(btn => btn.querySelector('svg[class*="lucide-settings"]'));

      // Open
      fireEvent.click(settingsButton!);
      expect(screen.getByText('Focus Settings')).toBeInTheDocument();

      // Close
      fireEvent.click(settingsButton!);
      expect(screen.queryByText('Focus Settings')).not.toBeInTheDocument();
    });

    it('displays timer duration options', () => {
      render(<FocusMode {...mockProps} />);
      const settingsButton = screen
        .getAllByRole('button')
        .find(btn => btn.querySelector('svg[class*="lucide-settings"]'));
      fireEvent.click(settingsButton!);

      expect(screen.getByText('15m')).toBeInTheDocument();
      expect(screen.getByText('25m')).toBeInTheDocument();
      expect(screen.getByText('45m')).toBeInTheDocument();
      expect(screen.getByText('60m')).toBeInTheDocument();
    });

    it('displays keyboard shortcuts help', () => {
      render(<FocusMode {...mockProps} />);
      const settingsButton = screen
        .getAllByRole('button')
        .find(btn => btn.querySelector('svg[class*="lucide-settings"]'));
      fireEvent.click(settingsButton!);

      expect(screen.getByText(/ESC to exit/)).toBeInTheDocument();
      expect(screen.getByText(/Ctrl\+S to save/)).toBeInTheDocument();
    });
  });
});
