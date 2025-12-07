import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { type Project, type Language } from '../../../../types';
import { PublishStatus, ChapterStatus } from '../../../../types';
import { projectService } from '../../services/projectService';
import { useProjects, selectFilteredProjects } from '../useProjects';

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

describe('useProjects - Filtering and Sorting', () => {
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

  // Filter Tests
  it('sets search filter', () => {
    const { result } = renderHook(() => useProjects());

    act(() => {
      result.current.setFilters({ search: 'test query' });
    });

    expect(result.current.filters.search).toBe('test query');
  });

  it('sets status filter', () => {
    const { result } = renderHook(() => useProjects());

    act(() => {
      result.current.setFilters({ status: 'active' });
    });

    expect(result.current.filters.status).toBe('active');
  });

  it('sets sort options', () => {
    const { result } = renderHook(() => useProjects());

    act(() => {
      result.current.setFilters({ sortBy: 'title', sortOrder: 'asc' });
    });

    expect(result.current.filters.sortBy).toBe('title');
    expect(result.current.filters.sortOrder).toBe('asc');
  });

  it('merges filter updates', () => {
    const { result } = renderHook(() => useProjects());

    act(() => {
      result.current.setFilters({ search: 'test' });
      result.current.setFilters({ status: 'active' });
    });

    expect(result.current.filters.search).toBe('test');
    expect(result.current.filters.status).toBe('active');
  });

  // Stats Calculation Tests
  it('calculates total projects correctly', async () => {
    const projects = [createMockProject(), createMockProject(), createMockProject()];
    mockProjectService.getAll.mockResolvedValue(projects);

    const { result } = renderHook(() => useProjects());

    await act(async () => {
      await result.current.loadAll();
      result.current.loadStats();
    });

    expect(result.current.stats?.totalProjects).toBe(3);
  });

  it('calculates active projects correctly', async () => {
    const projects = [
      createMockProject({ status: PublishStatus.EDITING }),
      createMockProject({ status: PublishStatus.DRAFT as any }),
      createMockProject({ status: PublishStatus.PUBLISHED as any }),
    ];
    mockProjectService.getAll.mockResolvedValue(projects);

    const { result } = renderHook(() => useProjects());

    await act(async () => {
      await result.current.loadAll();
      result.current.loadStats();
    });

    expect(result.current.stats?.activeProjects).toBe(2);
  });

  it('calculates completed projects correctly', async () => {
    const projects = [
      createMockProject({ status: PublishStatus.PUBLISHED as any }),
      createMockProject({ status: PublishStatus.PUBLISHED as any }),
      createMockProject({ status: PublishStatus.DRAFT as any }),
    ];
    mockProjectService.getAll.mockResolvedValue(projects);

    const { result } = renderHook(() => useProjects());

    await act(async () => {
      await result.current.loadAll();
      result.current.loadStats();
    });

    expect(result.current.stats?.completedProjects).toBe(2);
  });

  it('calculates total word count correctly', async () => {
    const projects = [
      createMockProject({
        chapters: [
          {
            id: 'ch1',
            title: 'Chapter 1',
            summary: 'Summary',
            content: 'word1 word2 word3 word4 word5',
            status: ChapterStatus.DRAFTING as any,
            orderIndex: 0,
            wordCount: 5,
            characterCount: 25,
            estimatedReadingTime: 1,
            tags: [],
            notes: '',
            createdAt: new Date(),
            updatedAt: new Date(),
            scenes: [],
          },
        ],
      }),
      createMockProject({
        chapters: [
          {
            id: 'ch2',
            title: 'Chapter 2',
            summary: 'Summary',
            content: 'word1 word2 word3',
            status: ChapterStatus.DRAFTING as any,
            orderIndex: 0,
            wordCount: 3,
            characterCount: 15,
            estimatedReadingTime: 1,
            tags: [],
            notes: '',
            createdAt: new Date(),
            updatedAt: new Date(),
            scenes: [],
          },
        ],
      }),
    ];
    mockProjectService.getAll.mockResolvedValue(projects);

    const { result } = renderHook(() => useProjects());

    await act(async () => {
      await result.current.loadAll();
      result.current.loadStats();
    });

    expect(result.current.stats?.totalWords).toBe(8);
  });

  it('calculates average progress correctly', async () => {
    const projects = [
      createMockProject({
        chapters: [
          {
            id: 'ch1',
            title: 'Ch1',
            summary: '',
            content: '',
            status: ChapterStatus.COMPLETE as any,
            orderIndex: 0,
            wordCount: 0,
            characterCount: 0,
            estimatedReadingTime: 0,
            tags: [],
            notes: '',
            createdAt: new Date(),
            updatedAt: new Date(),
            scenes: [],
          },
          {
            id: 'ch2',
            title: 'Ch2',
            summary: '',
            content: '',
            status: ChapterStatus.DRAFTING as any,
            orderIndex: 1,
            wordCount: 0,
            characterCount: 0,
            estimatedReadingTime: 0,
            tags: [],
            notes: '',
            createdAt: new Date(),
            updatedAt: new Date(),
            scenes: [],
          },
        ],
      }),
      createMockProject({
        chapters: [
          {
            id: 'ch3',
            title: 'Ch3',
            summary: '',
            content: '',
            status: ChapterStatus.COMPLETE as any,
            orderIndex: 0,
            wordCount: 0,
            characterCount: 0,
            estimatedReadingTime: 0,
            tags: [],
            notes: '',
            createdAt: new Date(),
            updatedAt: new Date(),
            scenes: [],
          },
          {
            id: 'ch4',
            title: 'Ch4',
            summary: '',
            content: '',
            status: ChapterStatus.COMPLETE as any,
            orderIndex: 1,
            wordCount: 0,
            characterCount: 0,
            estimatedReadingTime: 0,
            tags: [],
            notes: '',
            createdAt: new Date(),
            updatedAt: new Date(),
            scenes: [],
          },
        ],
      }),
    ];
    mockProjectService.getAll.mockResolvedValue(projects);

    const { result } = renderHook(() => useProjects());

    await act(async () => {
      await result.current.loadAll();
      result.current.loadStats();
    });

    // Project 1: 50%, Project 2: 100%, Average: 75%
    expect(result.current.stats?.averageProgress).toBe(75);
  });
});

// Selector Tests
describe('selectFilteredProjects', () => {
  const project1 = createMockProject({
    title: 'Alpha Project',
    idea: 'Fantasy adventure',
    status: PublishStatus.EDITING,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-10'),
  });

  const project2 = createMockProject({
    title: 'Beta Project',
    idea: 'Science fiction',
    status: PublishStatus.DRAFT as any,
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-15'),
  });

  const project3 = createMockProject({
    title: 'Gamma Project',
    idea: 'Mystery thriller',
    status: PublishStatus.PUBLISHED as any,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-20'),
  });

  it('filters projects by search query - title match', () => {
    const state = {
      projects: [project1, project2, project3],
      filters: { search: 'beta', status: 'all', sortBy: 'updatedAt', sortOrder: 'desc' },
    } as any;

    const filtered = selectFilteredProjects(state);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.title).toBe('Beta Project');
  });

  it('filters projects by search query - idea match', () => {
    const state = {
      projects: [project1, project2, project3],
      filters: { search: 'science', status: 'all', sortBy: 'updatedAt', sortOrder: 'desc' },
    } as any;

    const filtered = selectFilteredProjects(state);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.title).toBe('Beta Project');
  });

  it('filters projects by active status', () => {
    const state = {
      projects: [project1, project2, project3],
      filters: { search: '', status: 'active', sortBy: 'updatedAt', sortOrder: 'desc' },
    } as any;

    const filtered = selectFilteredProjects(state);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.status).toBe(PublishStatus.EDITING);
  });

  it('filters projects by completed status', () => {
    const state = {
      projects: [project1, project2, project3],
      filters: { search: '', status: 'completed', sortBy: 'updatedAt', sortOrder: 'desc' },
    } as any;

    const filtered = selectFilteredProjects(state);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.status).toBe(PublishStatus.PUBLISHED);
  });

  it('sorts projects by title ascending', () => {
    const state = {
      projects: [project2, project3, project1],
      filters: { search: '', status: 'all', sortBy: 'title', sortOrder: 'asc' },
    } as any;

    const filtered = selectFilteredProjects(state);
    expect(filtered[0]?.title).toBe('Alpha Project');
    expect(filtered[1]?.title).toBe('Beta Project');
    expect(filtered[2]?.title).toBe('Gamma Project');
  });

  it('sorts projects by updatedAt descending', () => {
    const state = {
      projects: [project1, project2, project3],
      filters: { search: '', status: 'all', sortBy: 'updatedAt', sortOrder: 'desc' },
    } as any;

    const filtered = selectFilteredProjects(state);
    expect(filtered[0]?.title).toBe('Gamma Project');
    expect(filtered[1]?.title).toBe('Beta Project');
    expect(filtered[2]?.title).toBe('Alpha Project');
  });

  it('combines search and status filters', () => {
    const state = {
      projects: [project1, project2, project3],
      filters: { search: 'project', status: 'draft', sortBy: 'updatedAt', sortOrder: 'desc' },
    } as any;

    const filtered = selectFilteredProjects(state);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.title).toBe('Beta Project');
  });
});
