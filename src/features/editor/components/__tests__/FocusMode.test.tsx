/**
 * FocusMode Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

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

    it('starts timer when play button is clicked', () => {
      render(<FocusMode {...mockProps} />);
      const playButton = screen.getByTitle('Start Timer');
      fireEvent.click(playButton);

      // Timer should be running (button changed to Pause)
      expect(screen.getByTitle('Pause Timer')).toBeInTheDocument();
    });

    it('pauses timer when pause button is clicked', () => {
      render(<FocusMode {...mockProps} />);
      const playButton = screen.getByTitle('Start Timer');
      fireEvent.click(playButton);

      const pauseButton = screen.getByTitle('Pause Timer');
      fireEvent.click(pauseButton);

      // Timer should be paused
      expect(screen.getByTitle('Start Timer')).toBeInTheDocument();
    });

    it('resets timer to initial duration', () => {
      render(<FocusMode {...mockProps} />);
      const playButton = screen.getByTitle('Start Timer');
      fireEvent.click(playButton);

      const resetButton = screen.getByTitle('Reset Timer');
      fireEvent.click(resetButton);

      expect(screen.getByText('25:00')).toBeInTheDocument();
    });

    it('changes timer duration via settings', () => {
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

      // Settings should close and timer should update
      expect(screen.getByText('45:00')).toBeInTheDocument();
    });
  });

  describe('Word Count Goals', () => {
    it('allows setting a word count goal', () => {
      render(<FocusMode {...mockProps} content='one two three' />);

      // Open settings
      const buttons = screen.getAllByRole('button');
      const settingsButton = buttons.find(btn =>
        btn.querySelector('svg')?.getAttribute('class')?.includes('lucide-settings'),
      );
      fireEvent.click(settingsButton!);

      // Set goal
      const goalInput = screen.getByPlaceholderText('e.g., 500');
      fireEvent.change(goalInput, { target: { value: '10' } });

      const setGoalButton = screen.getByRole('button', { name: /Set Goal/i });
      fireEvent.click(setGoalButton);

      // Goal should be displayed
      expect(screen.getByText(/Goal/)).toBeInTheDocument();
      expect(screen.getByText(/0 \/ 10/)).toBeInTheDocument();
    });

    it('tracks progress toward word count goal', () => {
      const { rerender } = render(<FocusMode {...mockProps} content='one two three' />);

      // Open settings and set goal
      const buttons = screen.getAllByRole('button');
      const settingsButton = buttons.find(btn =>
        btn.querySelector('svg')?.getAttribute('class')?.includes('lucide-settings'),
      );
      fireEvent.click(settingsButton!);

      const goalInput = screen.getByPlaceholderText('e.g., 500');
      fireEvent.change(goalInput, { target: { value: '5' } });
      fireEvent.click(screen.getByRole('button', { name: /Set Goal/i }));

      // Add more words
      rerender(<FocusMode {...mockProps} content='one two three four five six seven eight' />);

      // Progress should be updated
      expect(screen.getByText(/5 \/ 5/)).toBeInTheDocument();
    });

    it('shows achievement message when goal is reached', () => {
      const { rerender } = render(<FocusMode {...mockProps} content='one two' />);

      // Set goal
      const buttons = screen.getAllByRole('button');
      const settingsButton = buttons.find(btn =>
        btn.querySelector('svg')?.getAttribute('class')?.includes('lucide-settings'),
      );
      fireEvent.click(settingsButton!);

      const goalInput = screen.getByPlaceholderText('e.g., 500');
      fireEvent.change(goalInput, { target: { value: '3' } });
      fireEvent.click(screen.getByRole('button', { name: /Set Goal/i }));

      // Reach goal
      rerender(<FocusMode {...mockProps} content='one two three four five' />);

      // Achievement message should be shown
      expect(screen.getByText(/Goal achieved!/)).toBeInTheDocument();
    });

    it('clears word count goal', () => {
      render(<FocusMode {...mockProps} content='one two three' />);

      // Set goal
      const buttons = screen.getAllByRole('button');
      const settingsButton = buttons.find(btn =>
        btn.querySelector('svg')?.getAttribute('class')?.includes('lucide-settings'),
      );
      fireEvent.click(settingsButton!);

      const goalInput = screen.getByPlaceholderText('e.g., 500');
      fireEvent.change(goalInput, { target: { value: '10' } });
      fireEvent.click(screen.getByRole('button', { name: /Set Goal/i }));

      expect(screen.getByText(/Goal/)).toBeInTheDocument();

      // Open settings again and clear
      fireEvent.click(settingsButton!);
      const clearButton = screen.getByText('Clear Goal');
      fireEvent.click(clearButton);

      // Goal should be cleared
      expect(screen.queryByText(/0 \/ 10/)).not.toBeInTheDocument();
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
