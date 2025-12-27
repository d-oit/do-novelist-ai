/**
 * Tests for WritingGoalsPanel
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { WritingGoal } from '@/features/writing-assistant/types';

const mockUpdateGoal = vi.fn();

vi.mock('@/features/writing-assistant/hooks/useWritingGoals', () => ({
  useWritingGoals: () => {
    const goal: WritingGoal = {
      id: 'goal-1',
      name: 'Goal One',
      description: 'Desc',
      isActive: true,
      isTemplate: false,
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      updatedAt: new Date('2025-01-01T00:00:00.000Z'),
      targetVocabulary: undefined,
      targetLength: undefined,
      targetReadability: undefined,
      targetTone: undefined,
      targetStyle: undefined,
      targetPacing: undefined,
    };

    return {
      goals: [goal],
      activeGoals: [goal],
      presets: [],
      activeGoalsProgress: new Map(),
      createGoal: vi.fn(),
      updateGoal: mockUpdateGoal,
      deleteGoal: vi.fn(),
      toggleGoalActive: vi.fn(),
      applyPreset: vi.fn(),
      exportGoals: vi.fn(() => '[]'),
      importGoals: vi.fn(),
    };
  },
}));

// Clipboard is used by export button
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: vi.fn() },
  writable: true,
});

describe('WritingGoalsPanel', () => {
  beforeEach(() => {
    mockUpdateGoal.mockReset();
  });

  it('allows editing a goal and saving vocabulary diversity target', async () => {
    const { WritingGoalsPanel } = await import('@/features/writing-assistant/components/WritingGoalsPanel');

    render(<WritingGoalsPanel />);

    // Start editing
    fireEvent.click(screen.getByLabelText('Edit goal'));

    // Set min vocab diversity to 60%
    fireEvent.change(screen.getByLabelText('Min vocabulary diversity'), {
      target: { value: '60' },
    });

    fireEvent.click(screen.getByText('Save'));

    expect(mockUpdateGoal).toHaveBeenCalledTimes(1);
    expect(mockUpdateGoal).toHaveBeenCalledWith('goal-1', {
      name: 'Goal One',
      description: 'Desc',
      targetVocabulary: {
        minVocabularyDiversity: 0.6,
      },
    });
  });
});
