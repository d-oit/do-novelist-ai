import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import type { Project } from '@shared/types';
import { ChapterStatus, PublishStatus } from '@shared/types';

// eslint-disable-next-line import-x/no-relative-parent-imports
import BookViewer from '../BookViewer';

// Mock child components
vi.mock('@/features/publishing/components/CoverGenerator', () => ({
  default: () => <div data-testid='cover-generator'>Cover Generator</div>,
}));

vi.mock('@/features/publishing/components/PublishPanel', () => ({
  default: () => <div data-testid='publish-panel'>Publish Panel</div>,
}));

// Mock icons
vi.mock('lucide-react', () => ({
  BookOpen: () => <span>BookOpen</span>,
  CheckCircle2: () => <span>CheckCircle2</span>,
  Wand2: () => <span>Wand2</span>,
  Loader2: () => <span>Loader2</span>,
  Menu: () => <span>Menu</span>,
  X: () => <span>X</span>,
  Maximize2: () => <span>Maximize2</span>,
  Minimize2: () => <span>Minimize2</span>,
  AlignLeft: () => <span>AlignLeft</span>,
  Type: () => <span>Type</span>,
  UploadCloud: () => <span>UploadCloud</span>,
  RefreshCw: () => <span>RefreshCw</span>,
  Clock: () => <span>Clock</span>,
  Edit3: () => <span>Edit3</span>,
  Plus: () => <span>Plus</span>,
  Sparkles: () => <span>Sparkles</span>,
}));

describe('BookViewer', () => {
  const mockProject: Project = {
    id: 'proj_1',
    title: 'Test Project',
    idea: 'Test Idea',
    style: 'General Fiction',
    chapters: [
      {
        id: 'ch_1',
        orderIndex: 1,
        title: 'Chapter 1',
        content: 'Once upon a time',
        summary: 'Intro',
        status: ChapterStatus.DRAFTING,
        createdAt: new Date(),
        updatedAt: new Date(),
        wordCount: 4,
        characterCount: 16,
        estimatedReadingTime: 1,
        tags: [],
        notes: '',
      },
    ],
    worldState: {
      hasTitle: true,
      hasOutline: true,
      chaptersCount: 1,
      chaptersCompleted: 0,
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
    language: 'en',
    targetWordCount: 50000,
    settings: {}, // Add required Mock if needed based on detailed schema, but partial might work if typed loosely in test
    genre: [],
    targetAudience: 'adult',
    contentWarnings: [],
    keywords: [],
    synopsis: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    authors: [],
    analytics: {
      totalWordCount: 0,
      averageChapterLength: 0,
      estimatedReadingTime: 0,
      generationCost: 0,
      editingRounds: 0,
    },
    version: '1.0.0',
    changeLog: [],
    timeline: {
      id: 'timeline_1',
      projectId: 'proj_1',
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

  const mockHandlers = {
    onSelectChapter: vi.fn(),
    onUpdateChapter: vi.fn(),
    onUpdateProject: vi.fn(),
    onRefineChapter: vi.fn(),
    onAddChapter: vi.fn(),
  };

  it('renders project overview when selected', () => {
    render(<BookViewer project={mockProject} selectedChapterId='overview' {...mockHandlers} />);
    expect(screen.getByTestId('overview-panel')).toBeInTheDocument();
    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('renders publisher panel when selected', () => {
    render(<BookViewer project={mockProject} selectedChapterId='publish' {...mockHandlers} />);
    expect(screen.getByTestId('publish-panel')).toBeInTheDocument();
  });

  it('renders chapter content when chapter selected', () => {
    render(<BookViewer project={mockProject} selectedChapterId='ch_1' {...mockHandlers} />);
    expect(screen.getByTestId('chapter-editor')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Once upon a time')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Intro')).toBeInTheDocument();
  });

  it('calls onSelectChapter when sidebar item clicked', () => {
    render(<BookViewer project={mockProject} selectedChapterId='ch_1' {...mockHandlers} />);
    // Find the overview button in sidebar
    const overviewBtn = screen.getByTestId('chapter-item-overview');
    fireEvent.click(overviewBtn);
    expect(mockHandlers.onSelectChapter).toHaveBeenCalledWith('overview');
  });

  it('updates content when typing', () => {
    render(<BookViewer project={mockProject} selectedChapterId='ch_1' {...mockHandlers} />);
    const textarea = screen.getByTestId('chapter-content-input');
    fireEvent.change(textarea, { target: { value: 'New content' } });

    // Auto-save triggers after delay or unmount.
    // We can check if state updated locally (controlled input)
    expect(screen.getByDisplayValue('New content')).toBeInTheDocument();
  });
});
