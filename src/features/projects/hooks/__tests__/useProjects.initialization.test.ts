import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { type Project, type Language } from '@/types';
import { PublishStatus, ChapterStatus } from '@/types';
import { projectService } from '../../services/projectService';
import { useProjects } from '../useProjects';

// Mock the project service
vi.mock('../../services/projectService');
const mockProjectService = vi.mocked(projectService);

const createMockProject = (overrides: Partial<Project> = {}): Project => ({
  id: crypto.randomUUID(),
  title: 'Test Project',
  idea: 'A thrilling adventure story',
  style: {
    tone: 'dramatic',
    pacing: 'fast',
    perspective: 'third-person',
    tense: 'past',
    complexity: 'moderate',
  } as any,
  status: PublishStatus.DRAFT as any,
  chapters: [],
  coverImage: '',
  createdAt: new Date(Date.now() - 86400000),
  updatedAt: new Date(),
  worldState: {
    hasTitle: true,
    hasOutline: false,
    chaptersCount: 0,
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
  language: 'en' as Language,
  targetWordCount: 50000,
  settings: {
    enableDropCaps: true,
  },
  genre: ['fantasy'],
  targetAudience: 'adult',
  contentWarnings: [],
  keywords: [],
  synopsis: '',
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
    id: crypto.randomUUID(),
    projectId: '',
    events: [],
    eras: [],
    settings: {
      viewMode: 'chronological',
      zoomLevel: 1,
      showCharacters: true,
      showImplicitEvents: false,
    },
  },
  ...overrides,
});

describe('useProjects - Initialization', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset Zustand store state
    useProjects.setState({
      projects: [],
      selectedProject: null,
      stats: null,
      filters: {
        search: '',
        status: 'all',
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      },
      isLoading: false,
      error: null,
    });

    mockProjectService.init.mockResolvedValue();
    mockProjectService.getAll.mockResolvedValue([]);
    mockProjectService.create.mockImplementation(async data =>
      createMockProject({ title: data.title, idea: data.idea }),
    );
    mockProjectService.update.mockResolvedValue();
    mockProjectService.delete.mockResolvedValue();
  });

  it('initializes projects on init', async () => {
    const mockProjects = [createMockProject()];
    mockProjectService.getAll.mockResolvedValue(mockProjects);

    const { result } = renderHook(() => useProjects());

    await act(async () => {
      await result.current.init();
    });

    expect(mockProjectService.init).toHaveBeenCalled();
    expect(mockProjectService.getAll).toHaveBeenCalled();
    expect(result.current.projects).toEqual(mockProjects);
  });

  it('loads stats during initialization', async () => {
    const project = createMockProject({
      status: PublishStatus.EDITING,
      chapters: [
        {
          id: 'ch1',
          title: 'Chapter 1',
          summary: 'Summary',
          content: 'This is a test chapter with some words',
          status: ChapterStatus.COMPLETE as any,
          orderIndex: 0,
          wordCount: 10,
          characterCount: 50,
          estimatedReadingTime: 1,
          tags: [],
          notes: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          scenes: [],
        },
      ],
    });
    mockProjectService.getAll.mockResolvedValue([project]);

    const { result } = renderHook(() => useProjects());

    await act(async () => {
      await result.current.init();
    });

    expect(result.current.stats).not.toBeNull();
    expect(result.current.stats?.totalProjects).toBe(1);
    expect(result.current.stats?.totalChapters).toBe(1);
  });

  it('handles initialization errors', async () => {
    mockProjectService.init.mockRejectedValue(new Error('Init failed'));

    const { result } = renderHook(() => useProjects());

    await act(async () => {
      await result.current.init();
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Init failed');
    });
  });

  it('loads all projects', async () => {
    const mockProjects = [createMockProject({ title: 'Project 1' }), createMockProject({ title: 'Project 2' })];
    mockProjectService.getAll.mockResolvedValue(mockProjects);

    const { result } = renderHook(() => useProjects());

    await act(async () => {
      await result.current.loadAll();
    });

    expect(mockProjectService.getAll).toHaveBeenCalled();
    expect(result.current.projects).toEqual(mockProjects);
    expect(result.current.isLoading).toBe(false);
  });

  it('sets loading state while loading', async () => {
    mockProjectService.getAll.mockImplementation(() => {
      return new Promise(resolve => setTimeout(() => resolve([]), 100));
    });

    const { result } = renderHook(() => useProjects());

    act(() => {
      result.current.loadAll();
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('handles load errors', async () => {
    mockProjectService.getAll.mockRejectedValue(new Error('Load failed'));

    const { result } = renderHook(() => useProjects());

    await act(async () => {
      await result.current.loadAll();
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Load failed');
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('maintains initial state correctly', () => {
    const { result } = renderHook(() => useProjects());

    expect(result.current.projects).toEqual([]);
    expect(result.current.selectedProject).toBeNull();
    expect(result.current.stats).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.filters).toEqual({
      search: '',
      status: 'all',
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    });
  });
});
