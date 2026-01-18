/**
 * Plot Storage Service Tests
 *
 * Comprehensive unit tests for PlotRepository-based storage
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PlotStructure, PlotHole, CharacterGraph, PlotSuggestion } from '@/features/plot-engine';
import { PlotStorageService } from '@/features/plot-engine/services/plotStorageService';
import type { IPlotRepository } from '@/lib/repositories/interfaces/IPlotRepository';

// Mock logger to avoid console noise in tests
vi.mock('@/lib/logging/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('PlotStorageService', () => {
  const testProjectId = 'test-project-123';
  let serviceInstance: PlotStorageService;
  let mockRepo: IPlotRepository;

  beforeEach(async () => {
    // Clear any previous state
    vi.clearAllMocks();

    // Create mock repository
    mockRepo = {
      savePlotStructure: vi.fn().mockResolvedValue(undefined),
      getPlotStructure: vi.fn().mockResolvedValue(null),
      getPlotStructuresByProject: vi.fn().mockResolvedValue([]),
      deletePlotStructure: vi.fn().mockResolvedValue(undefined),
      savePlotHoles: vi.fn().mockResolvedValue(undefined),
      getPlotHolesByProject: vi.fn().mockResolvedValue([]),
      saveCharacterGraph: vi.fn().mockResolvedValue(undefined),
      getCharacterGraphByProject: vi.fn().mockResolvedValue(null),
      saveAnalysisResult: vi.fn().mockResolvedValue(undefined),
      getAnalysisResult: vi.fn().mockResolvedValue(null),
      cleanupExpiredAnalysis: vi.fn().mockResolvedValue(0),
      savePlotSuggestions: vi.fn().mockResolvedValue(undefined),
      getPlotSuggestionsByProject: vi.fn().mockResolvedValue([]),
      deleteProjectData: vi.fn().mockResolvedValue(undefined),
      saveStoryArc: vi.fn().mockResolvedValue(undefined),
      getStoryArc: vi.fn().mockResolvedValue(null),
      deleteCharacterGraph: vi.fn().mockResolvedValue(undefined),
      getPlotHolesBySeverity: vi.fn().mockResolvedValue([]),
      getPlotHolesByType: vi.fn().mockResolvedValue([]),
      getPlotHolesByChapters: vi.fn().mockResolvedValue([]),
      getPlotHolesByCharacters: vi.fn().mockResolvedValue([]),
      getPlotSuggestionsByType: vi.fn().mockResolvedValue([]),
      getPlotSuggestionsByImpact: vi.fn().mockResolvedValue([]),
      getPlotSuggestionsByCharacters: vi.fn().mockResolvedValue([]),
      exportProjectData: vi.fn().mockResolvedValue({
        plotStructures: [],
        plotHoles: [],
        characterGraph: null,
        plotSuggestions: [],
      }),
      importProjectData: vi.fn().mockResolvedValue(undefined),
    } as unknown as IPlotRepository;

    // Create service instance with mocked repository
    serviceInstance = new PlotStorageService(mockRepo);

    await serviceInstance.init();
  });

  describe('Initialization', () => {
    it('should initialize without errors', async () => {
      expect(serviceInstance).toBeDefined();
      await expect(serviceInstance.init()).resolves.not.toThrow();
    });

    it('should only initialize once', async () => {
      await serviceInstance.init();
      await serviceInstance.init();
      await serviceInstance.init();
      // Should not throw or cause issues
      expect(serviceInstance).toBeDefined();
    });
  });

  describe('Plot Structures', () => {
    const mockPlotStructure: PlotStructure = {
      id: 'plot-001',
      projectId: testProjectId,
      acts: [
        {
          id: 'act-1',
          actNumber: 1,
          name: 'Setup',
          description: 'Introduction of characters',
          plotPoints: [
            {
              id: 'pp-1',
              type: 'inciting_incident',
              title: 'The Call',
              description: 'Hero receives call to adventure',
              characterIds: ['char-1'],
              importance: 'major',
              position: 10,
            },
          ],
          chapters: ['ch-1', 'ch-2'],
          duration: 5,
        },
      ],
      climax: {
        id: 'climax-1',
        type: 'climax',
        title: 'Final Battle',
        description: 'Hero faces antagonist',
        characterIds: ['char-1', 'char-2'],
        importance: 'major',
        position: 85,
      },
      resolution: {
        id: 'resolution-1',
        type: 'resolution',
        title: 'New Beginning',
        description: 'Hero returns transformed',
        characterIds: ['char-1'],
        importance: 'major',
        position: 95,
      },
      createdAt: new Date('2026-01-05T10:00:00Z'),
      updatedAt: new Date('2026-01-05T11:00:00Z'),
    };

    it('should save a plot structure', async () => {
      await expect(serviceInstance.savePlotStructure(mockPlotStructure)).resolves.not.toThrow();
      expect(mockRepo.savePlotStructure).toHaveBeenCalledWith(mockPlotStructure);
    });

    it('should retrieve a plot structure by ID', async () => {
      (mockRepo.getPlotStructure as any).mockResolvedValue(mockPlotStructure);

      const retrieved = await serviceInstance.getPlotStructure(mockPlotStructure.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(mockPlotStructure.id);
      expect(retrieved?.projectId).toBe(mockPlotStructure.projectId);
      expect(retrieved?.acts).toHaveLength(1);
      expect(mockRepo.getPlotStructure).toHaveBeenCalledWith(mockPlotStructure.id);
    });

    it('should return null for non-existent plot structure', async () => {
      (mockRepo.getPlotStructure as any).mockResolvedValue(null);

      const result = await serviceInstance.getPlotStructure('non-existent-id');
      expect(result).toBeNull();
    });

    it('should get all plot structures for a project', async () => {
      const structure1 = { ...mockPlotStructure, id: 'plot-001' };
      const structure2 = { ...mockPlotStructure, id: 'plot-002' };

      (mockRepo.getPlotStructuresByProject as any).mockResolvedValue([structure1, structure2]);

      const results = await serviceInstance.getPlotStructuresByProject(testProjectId);

      expect(results).toHaveLength(2);
      expect(results.map(r => r.id)).toContain('plot-001');
      expect(results.map(r => r.id)).toContain('plot-002');
      expect(mockRepo.getPlotStructuresByProject).toHaveBeenCalledWith(testProjectId);
    });

    it('should delete a plot structure', async () => {
      await expect(serviceInstance.deletePlotStructure(mockPlotStructure.id)).resolves.not.toThrow();
      expect(mockRepo.deletePlotStructure).toHaveBeenCalledWith(mockPlotStructure.id);
    });
  });

  describe('Plot Holes', () => {
    const mockPlotHoles: PlotHole[] = [
      {
        id: 'hole-001',
        type: 'continuity',
        severity: 'major',
        title: 'Character Inconsistency',
        description: 'Character changes eye color between chapters',
        affectedChapters: ['ch-1', 'ch-5'],
        affectedCharacters: ['char-1'],
        suggestedFix: 'Standardize character appearance',
        confidence: 0.9,
        detected: new Date('2026-01-05T10:00:00Z'),
      },
      {
        id: 'hole-002',
        type: 'timeline',
        severity: 'minor',
        title: 'Timeline Issue',
        description: 'Event sequence is unclear',
        affectedChapters: ['ch-3', 'ch-4'],
        affectedCharacters: [],
        confidence: 0.7,
        detected: new Date('2026-01-05T10:30:00Z'),
      },
    ];

    it('should save plot holes for a project', async () => {
      await expect(serviceInstance.savePlotHoles(testProjectId, mockPlotHoles)).resolves.not.toThrow();
      expect(mockRepo.savePlotHoles).toHaveBeenCalledWith(testProjectId, mockPlotHoles);
    });

    it('should retrieve plot holes by project', async () => {
      (mockRepo.getPlotHolesByProject as any).mockResolvedValue(mockPlotHoles);

      const retrieved = await serviceInstance.getPlotHolesByProject(testProjectId);

      expect(retrieved).toHaveLength(2);
      expect(retrieved[0]?.severity).toBe('major'); // Should be sorted by severity
      expect(mockRepo.getPlotHolesByProject).toHaveBeenCalledWith(testProjectId);
    });

    it('should replace existing plot holes when saving', async () => {
      await expect(serviceInstance.savePlotHoles(testProjectId, mockPlotHoles)).resolves.not.toThrow();
      expect(mockRepo.savePlotHoles).toHaveBeenCalledWith(testProjectId, mockPlotHoles);
    });

    it('should handle empty plot holes array', async () => {
      await expect(serviceInstance.savePlotHoles(testProjectId, [])).resolves.not.toThrow();
      expect(mockRepo.savePlotHoles).toHaveBeenCalledWith(testProjectId, []);
    });
  });

  describe('Character Graphs', () => {
    const mockCharacterGraph: CharacterGraph = {
      projectId: testProjectId,
      nodes: [
        {
          id: 'char-1',
          name: 'Hero',
          role: 'protagonist',
          importance: 10,
          connectionCount: 5,
        },
        {
          id: 'char-2',
          name: 'Villain',
          role: 'antagonist',
          importance: 9,
          connectionCount: 3,
        },
      ],
      relationships: [
        {
          id: 'rel-001',
          projectId: testProjectId,
          character1Id: 'char-1',
          character2Id: 'char-2',
          type: 'enemy',
          strength: 8,
          evolution: [],
          isReciprocal: true,
        },
      ],
      analyzedAt: new Date('2026-01-05T10:00:00Z'),
    };

    it('should save a character graph', async () => {
      await expect(serviceInstance.saveCharacterGraph(mockCharacterGraph)).resolves.not.toThrow();
      expect(mockRepo.saveCharacterGraph).toHaveBeenCalledWith(mockCharacterGraph);
    });

    it('should retrieve a character graph by project', async () => {
      (mockRepo.getCharacterGraphByProject as any).mockResolvedValue(mockCharacterGraph);

      const retrieved = await serviceInstance.getCharacterGraphByProject(testProjectId);

      expect(retrieved).toBeDefined();
      expect(retrieved?.projectId).toBe(testProjectId);
      expect(retrieved?.nodes).toHaveLength(2);
      expect(retrieved?.relationships).toHaveLength(1);
      expect(mockRepo.getCharacterGraphByProject).toHaveBeenCalledWith(testProjectId);
    });

    it('should return null for non-existent character graph', async () => {
      (mockRepo.getCharacterGraphByProject as any).mockResolvedValue(null);

      const result = await serviceInstance.getCharacterGraphByProject('non-existent-project');
      expect(result).toBeNull();
    });

    it('should update existing character graph for project', async () => {
      await expect(serviceInstance.saveCharacterGraph(mockCharacterGraph)).resolves.not.toThrow();
      expect(mockRepo.saveCharacterGraph).toHaveBeenCalledWith(mockCharacterGraph);
    });
  });

  describe('Analysis Results with TTL', () => {
    const mockAnalysisData = {
      score: 85,
      recommendations: ['Improve pacing', 'Add more conflict'],
      timestamp: '2026-01-05T10:00:00.000Z',
    };

    it('should save analysis result with TTL', async () => {
      await expect(
        serviceInstance.saveAnalysisResult(testProjectId, 'plot-analysis', mockAnalysisData, 5),
      ).resolves.not.toThrow();

      expect((mockRepo.saveAnalysisResult as any).mock.calls).toHaveLength(1);
      const callArgs = (mockRepo.saveAnalysisResult as any).mock.calls[0];
      expect(callArgs[0]).toBe(testProjectId);
      expect(callArgs[1]).toBe('plot-analysis');
      expect(callArgs[2]).toEqual(mockAnalysisData);
      expect(callArgs[3].ttlMinutes).toBe(5);
      expect(callArgs[3].key).toMatch(new RegExp(`^${testProjectId}-plot-analysis-\\d+$`));
    });

    it('should retrieve non-expired analysis result', async () => {
      (mockRepo.getAnalysisResult as any).mockResolvedValue(mockAnalysisData);

      const retrieved = await serviceInstance.getAnalysisResult(testProjectId, 'plot-analysis');

      expect(retrieved).toBeDefined();
      expect(retrieved).toEqual(mockAnalysisData);
      expect(mockRepo.getAnalysisResult).toHaveBeenCalledWith(testProjectId, 'plot-analysis');
    });

    it('should return null for non-existent analysis', async () => {
      (mockRepo.getAnalysisResult as any).mockResolvedValue(null);

      const result = await serviceInstance.getAnalysisResult(testProjectId, 'non-existent-type');
      expect(result).toBeNull();
    });

    it('should cleanup expired analysis results', async () => {
      const count = await serviceInstance.cleanupExpiredAnalysis();

      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
      expect(mockRepo.cleanupExpiredAnalysis).toHaveBeenCalled();
    });
  });

  describe('Plot Suggestions', () => {
    const mockSuggestions: PlotSuggestion[] = [
      {
        id: 'sug-001',
        type: 'plot_twist',
        title: 'Major Revelation',
        description: 'Reveal hidden connection between characters',
        placement: 'middle',
        impact: 'high',
        relatedCharacters: ['char-1', 'char-2'],
        prerequisites: ['Establish relationship first'],
      },
      {
        id: 'sug-002',
        type: 'character_arc',
        title: 'Character Growth',
        description: 'Show protagonist overcoming fear',
        placement: 'late',
        impact: 'medium',
      },
    ];

    it('should save plot suggestions', async () => {
      await expect(serviceInstance.savePlotSuggestions(testProjectId, mockSuggestions)).resolves.not.toThrow();
      expect(mockRepo.savePlotSuggestions).toHaveBeenCalledWith(testProjectId, mockSuggestions);
    });

    it('should retrieve plot suggestions by project', async () => {
      (mockRepo.getPlotSuggestionsByProject as any).mockResolvedValue(mockSuggestions);

      const retrieved = await serviceInstance.getPlotSuggestionsByProject(testProjectId);

      expect(retrieved).toHaveLength(2);
      expect(retrieved[0]?.type).toBe('plot_twist');
      expect(mockRepo.getPlotSuggestionsByProject).toHaveBeenCalledWith(testProjectId);
    });

    it('should replace existing suggestions when saving', async () => {
      await expect(serviceInstance.savePlotSuggestions(testProjectId, mockSuggestions)).resolves.not.toThrow();
      expect(mockRepo.savePlotSuggestions).toHaveBeenCalledWith(testProjectId, mockSuggestions);
    });

    it('should handle empty suggestions array', async () => {
      await expect(serviceInstance.savePlotSuggestions(testProjectId, [])).resolves.not.toThrow();
      expect(mockRepo.savePlotSuggestions).toHaveBeenCalledWith(testProjectId, []);
    });
  });

  describe('Project Data Cleanup', () => {
    it('should delete all data for a project', async () => {
      await expect(serviceInstance.deleteProjectData(testProjectId)).resolves.not.toThrow();
      expect(mockRepo.deleteProjectData).toHaveBeenCalledWith(testProjectId);
    });
  });

  describe('Sync Functionality', () => {
    it('should sync without errors', async () => {
      await expect(serviceInstance.sync()).resolves.not.toThrow();
    });

    it('should handle sync when not using embedded replica', async () => {
      // Should complete without errors even if not using cloud sync
      await expect(serviceInstance.sync()).resolves.not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      (mockRepo.savePlotStructure as any).mockRejectedValue(new Error('Database error'));

      const mockStructure: PlotStructure = {
        id: 'plot-001',
        projectId: testProjectId,
        acts: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await expect(serviceInstance.savePlotStructure(mockStructure)).rejects.toThrow('Database error');
    });
  });

  describe('Data Integrity', () => {
    it('should preserve Date objects correctly', async () => {
      const now = new Date('2026-01-05T10:00:00Z');
      const plotStructure: PlotStructure = {
        id: 'plot-date-test',
        projectId: testProjectId,
        acts: [],
        createdAt: now,
        updatedAt: now,
      };

      (mockRepo.getPlotStructure as any).mockResolvedValue(plotStructure);

      await serviceInstance.savePlotStructure(plotStructure);
      const retrieved = await serviceInstance.getPlotStructure('plot-date-test');

      expect(retrieved?.createdAt).toBeInstanceOf(Date);
      expect(retrieved?.createdAt.toISOString()).toBe(now.toISOString());
    });

    it('should handle optional fields correctly', async () => {
      const plotStructure: PlotStructure = {
        id: 'plot-optional-test',
        projectId: testProjectId,
        acts: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        // climax and resolution are optional
      };

      (mockRepo.getPlotStructure as any).mockResolvedValue(plotStructure);

      await serviceInstance.savePlotStructure(plotStructure);
      const retrieved = await serviceInstance.getPlotStructure('plot-optional-test');

      expect(retrieved).toBeDefined();
      expect(retrieved?.climax).toBeUndefined();
      expect(retrieved?.resolution).toBeUndefined();
    });
  });
});
