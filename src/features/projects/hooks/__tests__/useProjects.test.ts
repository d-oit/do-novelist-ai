import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useProjects, selectFilteredProjects } from '../useProjects';
import { projectService } from '../../services/projectService';
import type { Project, WritingStyle, Language } from '../../../../types';
import { PublishStatus, ChapterStatus } from '../../../../types';
import type { ProjectCreationData, ProjectUpdateData } from '../../types';

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
    complexity: 'moderate'
  } as WritingStyle,
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
    targetAudienceDefined: false
  },
  isGenerating: false,
  language: 'en' as Language,
  targetWordCount: 50000,
  settings: {
    enableDropCaps: true
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
    editingRounds: 0
  },
  version: '1.0.0',
  changeLog: [],
  ...overrides
});

describe('useProjects', () => {
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
        sortOrder: 'desc'
      },
      isLoading: false,
      error: null
    });

    mockProjectService.init.mockResolvedValue();
    mockProjectService.getAll.mockResolvedValue([]);
    mockProjectService.create.mockImplementation(async (data) => createMockProject({ title: data.title, idea: data.idea }));
    mockProjectService.update.mockResolvedValue();
    mockProjectService.delete.mockResolvedValue();
  });

  // Initialization Tests
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
      chapters: [{
        id: 'ch1',
        title: 'Chapter 1',
        summary: 'Summary',
        content: 'This is a test chapter with some words',
        status: ChapterStatus.COMPLETE as any,
        orderIndex: 0
      }]
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

  // Load All Tests
  it('loads all projects', async () => {
    const mockProjects = [
      createMockProject({ title: 'Project 1' }),
      createMockProject({ title: 'Project 2' })
    ];
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

  // Create Tests
  it('creates a new project', async () => {
    const creationData: ProjectCreationData = {
      title: 'New Project',
      idea: 'A new exciting story',
      style: {
        tone: 'dramatic',
        pacing: 'fast',
        perspective: 'first-person',
        tense: 'present',
        complexity: 'moderate'
      } as WritingStyle,
      targetWordCount: 75000
    } as any;

    const { result } = renderHook(() => useProjects());

    let createdProject: Project | undefined;
    await act(async () => {
      createdProject = await result.current.create(creationData);
    });

    expect(mockProjectService.create).toHaveBeenCalledWith(creationData);
    expect(result.current.projects).toHaveLength(1);
    expect(result.current.selectedProject).toEqual(createdProject);
  });

  it('updates stats after creating project', async () => {
    const creationData: ProjectCreationData = {
      title: 'New Project',
      idea: 'Test idea',
      style: {
        tone: 'dramatic',
        pacing: 'fast',
        perspective: 'third-person',
        tense: 'past',
        complexity: 'moderate'
      } as WritingStyle
    } as any;

    const { result } = renderHook(() => useProjects());

    await act(async () => {
      await result.current.create(creationData);
    });

    expect(result.current.stats?.totalProjects).toBe(1);
  });

  it('throws error on create failure', async () => {
    mockProjectService.create.mockRejectedValue(new Error('Create failed'));

    const { result } = renderHook(() => useProjects());

    const creationData: ProjectCreationData = {
      title: 'New Project',
      idea: 'Test idea',
      style: {
        tone: 'dramatic',
        pacing: 'fast',
        perspective: 'third-person',
        tense: 'past',
        complexity: 'moderate'
      } as WritingStyle
    } as any;

    await expect(async () => {
      await act(async () => {
        await result.current.create(creationData);
      });
    }).rejects.toThrow('Create failed');
  });

  // Update Tests
  it('updates an existing project', async () => {
    const existingProject = createMockProject({ title: 'Original Title' });
    mockProjectService.getAll.mockResolvedValue([existingProject]);

    const { result } = renderHook(() => useProjects());

    await act(async () => {
      await result.current.loadAll();
    });

    const updateData: ProjectUpdateData = { title: 'Updated Title' } as any;

    await act(async () => {
      await result.current.update(existingProject.id, updateData);
    });

    expect(mockProjectService.update).toHaveBeenCalledWith(existingProject.id, updateData);
    expect(result.current.projects[0]?.title).toBe('Updated Title');
  });

  it('updates selected project when updating current selection', async () => {
    const existingProject = createMockProject({ title: 'Original' });
    mockProjectService.getAll.mockResolvedValue([existingProject]);

    const { result } = renderHook(() => useProjects());

    await act(async () => {
      await result.current.loadAll();
      result.current.select(existingProject.id);
    });

    await act(async () => {
      await result.current.update(existingProject.id, { title: 'Updated' });
    });

    expect(result.current.selectedProject?.title).toBe('Updated');
  });

  it('updates stats after updating project', async () => {
    const existingProject = createMockProject();
    mockProjectService.getAll.mockResolvedValue([existingProject]);

    const { result } = renderHook(() => useProjects());

    await act(async () => {
      await result.current.loadAll();
    });

    await act(async () => {
      await result.current.update(existingProject.id, { status: PublishStatus.PUBLISHED as any });
    });

    expect(result.current.stats?.completedProjects).toBe(1);
  });

  it('throws error on update failure', async () => {
    const existingProject = createMockProject();
    mockProjectService.getAll.mockResolvedValue([existingProject]);
    mockProjectService.update.mockRejectedValue(new Error('Update failed'));

    const { result } = renderHook(() => useProjects());

    await act(async () => {
      await result.current.loadAll();
    });

    await expect(async () => {
      await act(async () => {
        await result.current.update(existingProject.id, { title: 'Updated' });
      });
    }).rejects.toThrow('Update failed');
  });

  // Delete Tests
  it('deletes a project', async () => {
    const project1 = createMockProject({ title: 'Project 1' });
    const project2 = createMockProject({ title: 'Project 2' });
    mockProjectService.getAll.mockResolvedValue([project1, project2]);

    const { result } = renderHook(() => useProjects());

    await act(async () => {
      await result.current.loadAll();
    });

    expect(result.current.projects).toHaveLength(2);

    await act(async () => {
      await result.current.delete(project1.id);
    });

    expect(mockProjectService.delete).toHaveBeenCalledWith(project1.id);
    expect(result.current.projects).toHaveLength(1);
    expect(result.current.projects[0]?.id).toBe(project2.id);
  });

  it('clears selection when deleting selected project', async () => {
    const project = createMockProject();
    mockProjectService.getAll.mockResolvedValue([project]);

    const { result } = renderHook(() => useProjects());

    await act(async () => {
      await result.current.loadAll();
      result.current.select(project.id);
    });

    expect(result.current.selectedProject).not.toBeNull();

    await act(async () => {
      await result.current.delete(project.id);
    });

    expect(result.current.selectedProject).toBeNull();
  });

  it('updates stats after deleting project', async () => {
    const project = createMockProject();
    mockProjectService.getAll.mockResolvedValue([project]);

    const { result } = renderHook(() => useProjects());

    await act(async () => {
      await result.current.loadAll();
      await result.current.loadStats();
    });

    expect(result.current.stats?.totalProjects).toBe(1);

    await act(async () => {
      await result.current.delete(project.id);
    });

    expect(result.current.stats?.totalProjects).toBe(0);
  });

  it('throws error on delete failure', async () => {
    const project = createMockProject();
    mockProjectService.getAll.mockResolvedValue([project]);
    mockProjectService.delete.mockRejectedValue(new Error('Delete failed'));

    const { result } = renderHook(() => useProjects());

    await act(async () => {
      await result.current.loadAll();
    });

    await expect(async () => {
      await act(async () => {
        await result.current.delete(project.id);
      });
    }).rejects.toThrow('Delete failed');
  });

  // Selection Tests
  it('selects a project by ID', async () => {
    const projects = [
      createMockProject({ title: 'Project 1' }),
      createMockProject({ title: 'Project 2' })
    ];
    mockProjectService.getAll.mockResolvedValue(projects);

    const { result } = renderHook(() => useProjects());

    await act(async () => {
      await result.current.loadAll();
    });

    act(() => {
      result.current.select(projects[0]!.id);
    });

    expect(result.current.selectedProject?.id).toBe(projects[0]!.id);
  });

  it('sets null when selecting non-existent project', async () => {
    const { result } = renderHook(() => useProjects());

    act(() => {
      result.current.select('non-existent-id');
    });

    expect(result.current.selectedProject).toBeNull();
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

  // Error Management Tests
  it('clears error state', async () => {
    mockProjectService.getAll.mockRejectedValue(new Error('Load error'));

    const { result } = renderHook(() => useProjects());

    await act(async () => {
      await result.current.loadAll();
    });

    expect(result.current.error).toBe('Load error');

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  // Stats Calculation Tests
  it('calculates total projects correctly', async () => {
    const projects = [
      createMockProject(),
      createMockProject(),
      createMockProject()
    ];
    mockProjectService.getAll.mockResolvedValue(projects);

    const { result } = renderHook(() => useProjects());

    await act(async () => {
      await result.current.loadAll();
      await result.current.loadStats();
    });

    expect(result.current.stats?.totalProjects).toBe(3);
  });

  it('calculates active projects correctly', async () => {
    const projects = [
      createMockProject({ status: PublishStatus.EDITING }),
      createMockProject({ status: PublishStatus.DRAFT as any }),
      createMockProject({ status: PublishStatus.PUBLISHED as any })
    ];
    mockProjectService.getAll.mockResolvedValue(projects);

    const { result } = renderHook(() => useProjects());

    await act(async () => {
      await result.current.loadAll();
      await result.current.loadStats();
    });

    expect(result.current.stats?.activeProjects).toBe(2);
  });

  it('calculates completed projects correctly', async () => {
    const projects = [
      createMockProject({ status: PublishStatus.PUBLISHED as any }),
      createMockProject({ status: PublishStatus.PUBLISHED as any }),
      createMockProject({ status: PublishStatus.DRAFT as any })
    ];
    mockProjectService.getAll.mockResolvedValue(projects);

    const { result } = renderHook(() => useProjects());

    await act(async () => {
      await result.current.loadAll();
      await result.current.loadStats();
    });

    expect(result.current.stats?.completedProjects).toBe(2);
  });

  it('calculates total word count correctly', async () => {
    const projects = [
      createMockProject({
        chapters: [{
          id: 'ch1',
          title: 'Chapter 1',
          summary: 'Summary',
          content: 'word1 word2 word3 word4 word5',
          status: ChapterStatus.DRAFTING as any,
          orderIndex: 0
        }]
      }),
      createMockProject({
        chapters: [{
          id: 'ch2',
          title: 'Chapter 2',
          summary: 'Summary',
          content: 'word1 word2 word3',
          status: ChapterStatus.DRAFTING as any,
          orderIndex: 0
        }]
      })
    ];
    mockProjectService.getAll.mockResolvedValue(projects);

    const { result } = renderHook(() => useProjects());

    await act(async () => {
      await result.current.loadAll();
      await result.current.loadStats();
    });

    expect(result.current.stats?.totalWords).toBe(8);
  });

  it('calculates average progress correctly', async () => {
    const projects = [
      createMockProject({
        chapters: [
          { id: 'ch1', title: 'Ch1', summary: '', content: '', status: ChapterStatus.COMPLETE as any, orderIndex: 0 },
          { id: 'ch2', title: 'Ch2', summary: '', content: '', status: ChapterStatus.DRAFTING as any, orderIndex: 1 }
        ]
      }),
      createMockProject({
        chapters: [
          { id: 'ch3', title: 'Ch3', summary: '', content: '', status: ChapterStatus.COMPLETE as any, orderIndex: 0 },
          { id: 'ch4', title: 'Ch4', summary: '', content: '', status: ChapterStatus.COMPLETE as any, orderIndex: 1 }
        ]
      })
    ];
    mockProjectService.getAll.mockResolvedValue(projects);

    const { result } = renderHook(() => useProjects());

    await act(async () => {
      await result.current.loadAll();
      await result.current.loadStats();
    });

    // Project 1: 50%, Project 2: 100%, Average: 75%
    expect(result.current.stats?.averageProgress).toBe(75);
  });

  // Initial State Tests
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
      sortOrder: 'desc'
    });
  });
});

// Selector Tests
describe('selectFilteredProjects', () => {
  const project1 = createMockProject({
    title: 'Alpha Project',
    idea: 'Fantasy adventure',
    status: PublishStatus.EDITING,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-10')
  });

  const project2 = createMockProject({
    title: 'Beta Project',
    idea: 'Science fiction',
    status: PublishStatus.DRAFT as any,
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-15')
  });

  const project3 = createMockProject({
    title: 'Gamma Project',
    idea: 'Mystery thriller',
    status: PublishStatus.PUBLISHED as any,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-20')
  });

  it('filters projects by search query - title match', () => {
    const state = {
      projects: [project1, project2, project3],
      filters: { search: 'beta', status: 'all', sortBy: 'updatedAt', sortOrder: 'desc' }
    } as any;

    const filtered = selectFilteredProjects(state);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.title).toBe('Beta Project');
  });

  it('filters projects by search query - idea match', () => {
    const state = {
      projects: [project1, project2, project3],
      filters: { search: 'science', status: 'all', sortBy: 'updatedAt', sortOrder: 'desc' }
    } as any;

    const filtered = selectFilteredProjects(state);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.title).toBe('Beta Project');
  });

  it('filters projects by active status', () => {
    const state = {
      projects: [project1, project2, project3],
      filters: { search: '', status: 'active', sortBy: 'updatedAt', sortOrder: 'desc' }
    } as any;

    const filtered = selectFilteredProjects(state);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.status).toBe(PublishStatus.EDITING);
  });

  it('filters projects by completed status', () => {
    const state = {
      projects: [project1, project2, project3],
      filters: { search: '', status: 'completed', sortBy: 'updatedAt', sortOrder: 'desc' }
    } as any;

    const filtered = selectFilteredProjects(state);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.status).toBe(PublishStatus.PUBLISHED);
  });

  it('sorts projects by title ascending', () => {
    const state = {
      projects: [project2, project3, project1],
      filters: { search: '', status: 'all', sortBy: 'title', sortOrder: 'asc' }
    } as any;

    const filtered = selectFilteredProjects(state);
    expect(filtered[0]?.title).toBe('Alpha Project');
    expect(filtered[1]?.title).toBe('Beta Project');
    expect(filtered[2]?.title).toBe('Gamma Project');
  });

  it('sorts projects by updatedAt descending', () => {
    const state = {
      projects: [project1, project2, project3],
      filters: { search: '', status: 'all', sortBy: 'updatedAt', sortOrder: 'desc' }
    } as any;

    const filtered = selectFilteredProjects(state);
    expect(filtered[0]?.title).toBe('Gamma Project');
    expect(filtered[1]?.title).toBe('Beta Project');
    expect(filtered[2]?.title).toBe('Alpha Project');
  });

  it('combines search and status filters', () => {
    const state = {
      projects: [project1, project2, project3],
      filters: { search: 'project', status: 'draft', sortBy: 'updatedAt', sortOrder: 'desc' }
    } as any;

    const filtered = selectFilteredProjects(state);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.title).toBe('Beta Project');
  });
});
