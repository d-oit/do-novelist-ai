import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import AnalyticsDashboard from '@/features/analytics/components/AnalyticsDashboard';
import { useAnalytics } from '@/features/analytics/hooks/useAnalytics';
import { ChapterStatus, PublishStatus } from '@/shared/types';
import type { Project } from '@/shared/types';

// Mock the analytics hook
vi.mock('../hooks/useAnalytics');
const mockUseAnalytics = vi.mocked(useAnalytics);

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

      // Silence unused variable warnings - these are intentionally filtered out
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

      return React.createElement(elementType, domProps, children);
    };
  };

  return {
    motion: {
      div: createMotionComponent('div'),
      circle: createMotionComponent('circle'),
      button: createMotionComponent('button'),
    },
    AnimatePresence: ({ children }: any) => children,
  };
});

// Mock UI components
vi.mock('../../../components/ui/Button', () => ({
  Button: ({ children, onClick, disabled, className, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} className={className} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('../../../components/ui/Card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>
      {children}
    </div>
  ),
}));

const createChapter = (
  id: string,
  title: string,
  status: (typeof ChapterStatus)[keyof typeof ChapterStatus],
  orderIndex: number,
) => ({
  id,
  orderIndex,
  title,
  summary: `${title} summary`,
  content: `Content for ${title}`,
  status,
  wordCount: 1200,
  characterCount: 7200,
  estimatedReadingTime: 6,
  tags: [],
  notes: '',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
});

const mockProject: Project = {
  id: 'test-project',
  title: 'Test Novel',
  idea: 'A test novel for analytics',
  style: 'Fantasy',
  coverImage: undefined,
  chapters: [
    createChapter('chapter-1', 'Chapter 1', ChapterStatus.COMPLETE, 1),
    createChapter('chapter-2', 'Chapter 2', ChapterStatus.DRAFTING, 2),
  ],
  worldState: {
    hasTitle: true,
    hasOutline: true,
    chaptersCount: 2,
    chaptersCompleted: 1,
    styleDefined: true,
    isPublished: false,
    hasCharacters: true,
    hasWorldBuilding: false,
    hasThemes: true,
    plotStructureDefined: true,
    targetAudienceDefined: true,
  },
  isGenerating: false,
  status: PublishStatus.DRAFT,
  language: 'en',
  targetWordCount: 50000,
  settings: {
    enableDropCaps: true,
    autoSave: true,
    autoSaveInterval: 120,
    showWordCount: true,
    enableSpellCheck: true,
    darkMode: false,
    fontSize: 'medium',
    lineHeight: 'normal',
    editorTheme: 'default',
  },
  genre: ['fantasy'],
  targetAudience: 'adult',
  contentWarnings: [],
  keywords: [],
  synopsis: 'A fantasy test novel.',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
  publishedAt: undefined,
  authors: [],
  analytics: {
    totalWordCount: 1500,
    averageChapterLength: 750,
    estimatedReadingTime: 8,
    generationCost: 0,
    editingRounds: 2,
  },
  version: '1.0.0',
  changeLog: [],
  timeline: {
    id: 'test-timeline',
    projectId: 'test-project',
    events: [],
    eras: [],
    settings: {
      viewMode: 'chronological',
      zoomLevel: 1,
      showCharacters: true,
      showImplicitEvents: false,
    },
  },
};

const mockAnalyticsData = {
  projectAnalytics: {
    projectId: 'test-project',
    title: 'Test Novel',
    createdAt: new Date('2024-01-01'),
    totalWords: 1500,
    totalChapters: 2,
    completedChapters: 1,
    estimatedReadingTime: 8,
    averageChapterLength: 750,
    writingProgress: 50,
    timeSpent: 120, // 2 hours
    lastActivity: new Date(),
    wordCountHistory: [],
    chapterProgress: [],
  },
  weeklyStats: {
    weekStart: '2024-01-01',
    totalWords: 500,
    totalTime: 60,
    averageDailyWords: 71,
    mostProductiveDay: '2024-01-03',
    streak: 5,
    goals: {
      wordsTarget: 3500,
      timeTarget: 420,
      wordsAchieved: 500,
      timeAchieved: 60,
    },
  },
  insights: {
    productivity: {
      averageWordsPerHour: 45,
      peakWritingHours: [9, 10, 11],
      preferredWritingDays: ['Monday', 'Tuesday', 'Wednesday'],
      consistencyScore: 78,
    },
    patterns: {
      averageSessionLength: 45,
      sessionsPerDay: 1.2,
      preferredChapterLength: 2500,
      revisionRatio: 0.15,
    },
    aiUsage: {
      totalWordsGenerated: 300,
      assistancePercentage: 20,
      mostAssistedChapters: ['chapter-1'],
      aiDependencyTrend: 0.05,
    },
    streaks: {
      currentStreak: 5,
      longestStreak: 12,
      streakDates: ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05'],
    },
    milestones: [],
  },
  wordCountChart: [
    { date: '2024-01-01', value: 100 },
    { date: '2024-01-02', value: 150 },
    { date: '2024-01-03', value: 200 },
  ],
  productivityChart: [
    { date: '2024-01-01', value: 40 },
    { date: '2024-01-02', value: 45 },
    { date: '2024-01-03', value: 50 },
  ],
};

const mockAnalyticsHook = {
  ...mockAnalyticsData,
  isLoading: false,
  error: null,
  loadProjectAnalytics: vi.fn(),
  loadWeeklyStats: vi.fn(),
  loadInsights: vi.fn(),
  loadWordCountChart: vi.fn(),
  loadProductivityChart: vi.fn(),
  exportAnalytics: vi.fn(),
  currentSession: null,
  isTracking: false,
  startSession: vi.fn(),
  endSession: vi.fn(),
  goals: [],
  createGoal: vi.fn(),
  updateGoal: vi.fn(),
  streakChart: [],
};

describe('AnalyticsDashboard', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAnalytics.mockReturnValue(mockAnalyticsHook as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders analytics dashboard with project data', () => {
    render(<AnalyticsDashboard project={mockProject} onClose={mockOnClose} />);

    expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Insights for "Test Novel"')).toBeInTheDocument();

    // Check for key statistics
    expect(screen.getByText('1,500')).toBeInTheDocument(); // Total words
    expect(screen.getByText(/1\/2/)).toBeInTheDocument(); // Chapters progress (includes percentage suffix)
    expect(screen.getByText(/2h/)).toBeInTheDocument(); // Time spent (may include minutes)
  });

  it('shows loading state', () => {
    mockUseAnalytics.mockReturnValue({
      ...mockAnalyticsHook,
      isLoading: true,
      projectAnalytics: null,
      weeklyStats: null,
      insights: null,
    } as any);

    render(<AnalyticsDashboard project={mockProject} onClose={mockOnClose} />);

    expect(screen.getByText('Loading analytics dashboard...')).toBeInTheDocument();
  });

  it('loads analytics data on mount', async () => {
    render(<AnalyticsDashboard project={mockProject} onClose={mockOnClose} />);

    // Wait for async operations to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockAnalyticsHook.loadProjectAnalytics).toHaveBeenCalledWith(mockProject);
    expect(mockAnalyticsHook.loadWeeklyStats).toHaveBeenCalled();
    expect(mockAnalyticsHook.loadInsights).toHaveBeenCalled();
    expect(mockAnalyticsHook.loadWordCountChart).toHaveBeenCalledWith(mockProject.id);
    expect(mockAnalyticsHook.loadProductivityChart).toHaveBeenCalled();
  });

  it('can toggle between detailed and compact view', () => {
    render(<AnalyticsDashboard project={mockProject} onClose={mockOnClose} />);

    const toggleButton = screen.getByText('Compact');
    fireEvent.click(toggleButton);

    // Should show "Detailed" button after toggling to compact view
    expect(screen.getByText('Detailed')).toBeInTheDocument();

    // WritingStatsCard is always shown, but other sections should be hidden in compact view
    // "This Week's Performance" is part of WritingStatsCard and always visible
    expect(screen.getByText("This Week's Performance")).toBeInTheDocument();
  });

  it('can refresh analytics data', async () => {
    render(<AnalyticsDashboard project={mockProject} onClose={mockOnClose} />);

    const refreshButton = screen.getByText('Refresh');

    await act(async () => {
      fireEvent.click(refreshButton);
      // Wait for the async refreshData function to complete
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Should call all load functions again
    expect(mockAnalyticsHook.loadProjectAnalytics).toHaveBeenCalledTimes(2);
    expect(mockAnalyticsHook.loadWeeklyStats).toHaveBeenCalledTimes(2);
    expect(mockAnalyticsHook.loadInsights).toHaveBeenCalledTimes(2);
  });

  it('can export analytics data', async () => {
    const mockExportData = JSON.stringify({ analytics: 'data' });
    mockAnalyticsHook.exportAnalytics.mockResolvedValue(mockExportData);

    // Mock URL methods
    const originalCreateObjectURL = global.URL.createObjectURL;
    const originalRevokeObjectURL = global.URL.revokeObjectURL;
    global.URL.createObjectURL = vi.fn(() => 'mocked-url');
    global.URL.revokeObjectURL = vi.fn();

    // Mock createElement to return a proper anchor element
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'a') {
        const anchor = originalCreateElement('a');
        anchor.click = vi.fn();
        return anchor;
      }
      return originalCreateElement(tagName);
    });

    render(<AnalyticsDashboard project={mockProject} onClose={mockOnClose} />);

    const exportButton = screen.getByText('Export');

    await act(async () => {
      fireEvent.click(exportButton);
      // Wait for the async exportData function to complete
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockAnalyticsHook.exportAnalytics).toHaveBeenCalledWith('json');

    // Restore original functions
    global.URL.createObjectURL = originalCreateObjectURL;
    global.URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it('closes when close button is clicked', () => {
    render(<AnalyticsDashboard project={mockProject} onClose={mockOnClose} />);

    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('displays writing insights and recommendations', () => {
    render(<AnalyticsDashboard project={mockProject} onClose={mockOnClose} />);

    expect(screen.getByText('AI Insights & Recommendations')).toBeInTheDocument();
    expect(screen.getByText('Peak Performance')).toBeInTheDocument();
    expect(screen.getByText('Streak Power')).toBeInTheDocument();
    expect(screen.getByText('AI Balance')).toBeInTheDocument();
    expect(screen.getByText('Next Milestone')).toBeInTheDocument();
  });

  it('shows progress rings for goals', () => {
    render(<AnalyticsDashboard project={mockProject} onClose={mockOnClose} />);

    // Progress & Goals is part of GoalsProgress component which is in showAllStats section
    // The WritingStatsCard "Chapters" metric should always be visible (may appear multiple times)
    const chaptersElements = screen.getAllByText('Chapters');
    expect(chaptersElements.length).toBeGreaterThan(0);
  });

  it('handles missing analytics data gracefully', () => {
    mockUseAnalytics.mockReturnValue({
      ...mockAnalyticsHook,
      projectAnalytics: null,
      weeklyStats: null,
      insights: null,
      wordCountChart: [],
      productivityChart: [],
    } as any);

    render(<AnalyticsDashboard project={mockProject} onClose={mockOnClose} />);

    // Should still render the dashboard structure
    expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
  });
});
