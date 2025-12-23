import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import AnalyticsDashboard from '@/features/analytics/components/AnalyticsDashboard';
import AnalyticsHeader from '@/features/analytics/components/AnalyticsHeader';
import { ChapterStatus, PublishStatus } from '@/types';

// Mock Project data with correct typing
const mockProject = {
  id: 'test-project-123',
  title: 'Test Novel',
  idea: 'A test novel for analytics testing',
  style: 'General Fiction' as const,
  chapters: [
    {
      id: 'ch1',
      orderIndex: 1,
      title: 'Chapter 1',
      summary: 'First chapter',
      content: 'Chapter 1 content',
      status: ChapterStatus.COMPLETE,
      wordCount: 1000,
      characterCount: 5000,
      estimatedReadingTime: 5,
      tags: [],
      notes: '',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'ch2',
      orderIndex: 2,
      title: 'Chapter 2',
      summary: 'Second chapter',
      content: 'Chapter 2 content',
      status: ChapterStatus.PENDING,
      wordCount: 0,
      characterCount: 0,
      estimatedReadingTime: 0,
      tags: [],
      notes: '',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  ],
  worldState: {
    hasTitle: true,
    hasOutline: true,
    chaptersCount: 2,
    chaptersCompleted: 1,
    styleDefined: true,
    isPublished: false,
    hasCharacters: false,
    hasWorldBuilding: false,
    hasThemes: false,
    plotStructureDefined: false,
    targetAudienceDefined: false,
  },
  isGenerating: false,
  status: PublishStatus.DRAFT,
  language: 'en' as const,
  targetWordCount: 50000,
  settings: {
    enableDropCaps: false,
    autoSave: true,
    autoSaveInterval: 30,
    showWordCount: true,
    enableSpellCheck: true,
    darkMode: false,
    fontSize: 'medium' as const,
    lineHeight: 'normal' as const,
    editorTheme: 'default' as const,
  },
  genre: ['Fiction'],
  targetAudience: 'adult' as const,
  contentWarnings: [],
  keywords: ['test'],
  synopsis: 'Test novel synopsis',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  authors: [
    {
      id: 'author1',
      name: 'Test Author',
      email: 'test@example.com',
      role: 'owner' as const,
    },
  ],
  analytics: {
    totalWordCount: 1000,
    averageChapterLength: 1000,
    estimatedReadingTime: 5,
    generationCost: 0,
    editingRounds: 0,
  },
  version: '1.0.0',
  changeLog: [],
  timeline: {
    id: 'timeline1',
    projectId: 'test-project-123',
    events: [],
    eras: [],
    settings: {
      viewMode: 'chronological' as const,
      zoomLevel: 1,
      showCharacters: true,
      showImplicitEvents: true,
    },
  },
};

describe('AnalyticsDashboard', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it('renders without errors', () => {
    render(<AnalyticsDashboard project={mockProject} onClose={mockOnClose} />);

    expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
    expect(screen.getByText(mockProject.title)).toBeInTheDocument();
  });

  it('renders modal structure correctly', () => {
    render(<AnalyticsDashboard project={mockProject} onClose={mockOnClose} />);

    // Check modal overlay
    const modal = screen.getByRole('dialog');
    expect(modal).toBeInTheDocument();

    // Check that the modal has proper structure
    expect(modal).toHaveClass('fixed', 'inset-0', 'z-50');
  });

  it('handles export button functionality', () => {
    render(<AnalyticsDashboard project={mockProject} onClose={mockOnClose} />);

    const exportButton = screen.getByRole('button', { name: /export/i });
    expect(exportButton).toBeInTheDocument();

    // Test that button can be clicked without errors
    fireEvent.click(exportButton);
    expect(exportButton).toBeEnabled();
  });

  it('toggles compact view', () => {
    render(<AnalyticsDashboard project={mockProject} onClose={mockOnClose} />);

    const compactButton = screen.getByRole('button', { name: /compact/i });
    expect(compactButton).toBeInTheDocument();

    fireEvent.click(compactButton);

    // Button should change to show "Detailed"
    expect(screen.getByRole('button', { name: /detailed/i })).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<AnalyticsDashboard project={mockProject} onClose={mockOnClose} />);

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('handles keyboard shortcuts', () => {
    render(<AnalyticsDashboard project={mockProject} onClose={mockOnClose} />);

    // Test Escape key
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('passes correct props to AnalyticsHeader', () => {
    render(<AnalyticsDashboard project={mockProject} onClose={mockOnClose} />);

    // Header should be rendered with project title
    expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
    expect(screen.getByText(mockProject.title)).toBeInTheDocument();
  });

  it('renders main component areas', () => {
    render(<AnalyticsDashboard project={mockProject} onClose={mockOnClose} />);

    // Should have navigation elements
    expect(screen.getByText('Overview')).toBeInTheDocument();

    // Should have content area with stats cards
    expect(screen.getByText('Writing Overview')).toBeInTheDocument();
    expect(screen.getByText("This Week's Performance")).toBeInTheDocument();
  });

  it('displays analytics data calculations', () => {
    render(<AnalyticsDashboard project={mockProject} onClose={mockOnClose} />);

    // Should show word count in some form
    const wordCountElements = screen.getAllByText('1,000');
    expect(wordCountElements.length).toBeGreaterThan(0);

    // Should show chapter progress
    expect(screen.getByText('1/2')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<AnalyticsDashboard project={mockProject} onClose={mockOnClose} />);

    // Check for ARIA labels on buttons
    const exportButton = screen.getByRole('button', { name: /export/i });
    expect(exportButton).toHaveAttribute('aria-label', 'Export analytics data');

    const closeButton = screen.getByRole('button', { name: /close/i });
    expect(closeButton).toHaveAttribute('aria-label', 'Close analytics dashboard');
  });

  it('supports navigation between views', () => {
    render(<AnalyticsDashboard project={mockProject} onClose={mockOnClose} />);

    // Check that all navigation options are present in sidebar
    const sidebarItems = screen.getAllByText(/Overview|Productivity|Goals|Timeline/);
    expect(sidebarItems.length).toBeGreaterThanOrEqual(4);

    // Check specific navigation items in sidebar
    const sidebarNavigation = screen.getByText('Views');
    expect(sidebarNavigation).toBeInTheDocument();
  });

  it('renders analytics sidebar with stats', () => {
    render(<AnalyticsDashboard project={mockProject} onClose={mockOnClose} />);

    // Sidebar should contain stats section
    expect(screen.getByText('Quick Stats')).toBeInTheDocument();
  });
});

describe('AnalyticsHeader', () => {
  const mockProps = {
    project: mockProject,
    isCompact: false,
    onToggleCompact: vi.fn(),
    onExport: vi.fn(),
    onRefresh: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with correct project title', () => {
    render(<AnalyticsHeader {...mockProps} />);

    expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
    expect(screen.getByText(mockProject.title)).toBeInTheDocument();
  });

  it('shows compact button when not compact', () => {
    render(<AnalyticsHeader {...mockProps} />);

    expect(screen.getByText('Compact')).toBeInTheDocument();
    expect(screen.getByLabelText('Switch to compact view')).toBeInTheDocument();
  });

  it('shows detailed button when compact', () => {
    render(<AnalyticsHeader {...mockProps} isCompact={true} />);

    expect(screen.getByText('Detailed')).toBeInTheDocument();
    expect(screen.getByLabelText('Switch to detailed view')).toBeInTheDocument();
  });

  it('calls onToggleCompact when compact button is clicked', () => {
    render(<AnalyticsHeader {...mockProps} />);

    const compactButton = screen.getByText('Compact');
    fireEvent.click(compactButton);

    expect(mockProps.onToggleCompact).toHaveBeenCalledTimes(1);
  });

  it('calls onExport when export button is clicked', () => {
    render(<AnalyticsHeader {...mockProps} />);

    const exportButton = screen.getByText('Export');
    fireEvent.click(exportButton);

    expect(mockProps.onExport).toHaveBeenCalledTimes(1);
  });

  it('calls onRefresh when refresh button is clicked', () => {
    render(<AnalyticsHeader {...mockProps} />);

    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    expect(mockProps.onRefresh).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when close button is clicked', () => {
    render(<AnalyticsHeader {...mockProps} />);

    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    expect(mockProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('renders all header buttons', () => {
    render(<AnalyticsHeader {...mockProps} />);

    expect(screen.getByText('Compact')).toBeInTheDocument();
    expect(screen.getByText('Export')).toBeInTheDocument();
    expect(screen.getByText('Refresh')).toBeInTheDocument();
    expect(screen.getByText('Close')).toBeInTheDocument();
  });

  it('has correct button accessibility', () => {
    render(<AnalyticsHeader {...mockProps} />);

    const exportButton = screen.getByRole('button', { name: /export/i });
    expect(exportButton).toHaveAttribute('aria-label', 'Export analytics data');

    const closeButton = screen.getByRole('button', { name: /close/i });
    expect(closeButton).toHaveAttribute('aria-label', 'Close analytics dashboard');
  });
});
