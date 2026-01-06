import { describe, it, expect, beforeEach, vi } from 'vitest';

import { plotGenerationService } from '@/features/plot-engine';
import { searchService } from '@/features/semantic-search';
import { generateText } from '@/lib/api-gateway';
import type { HydratedSearchResult } from '@/types/embeddings';

vi.mock('@/features/semantic-search', () => ({
  searchService: {
    search: vi.fn(),
  },
}));

vi.mock('@/lib/api-gateway', () => ({
  generateText: vi.fn(),
}));

const mockPlotResponse = {
  success: true,
  data: {
    text: JSON.stringify({
      acts: [
        {
          actNumber: 1,
          name: 'Act 1',
          description: 'Setup',
          plotPoints: [
            {
              type: 'inciting_incident' as const,
              title: 'Inciting Incident',
              description: 'Story begins',
              importance: 'major' as const,
              position: 10,
            },
          ],
        },
        {
          actNumber: 2,
          name: 'Act 2',
          description: 'Confrontation',
          plotPoints: [
            {
              type: 'climax' as const,
              title: 'Climax',
              description: 'Peak action',
              importance: 'major' as const,
              position: 50,
            },
          ],
        },
        {
          actNumber: 3,
          name: 'Act 3',
          description: 'Resolution',
          plotPoints: [
            {
              type: 'resolution' as const,
              title: 'Resolution',
              description: 'Ending',
              importance: 'major' as const,
              position: 90,
            },
          ],
        },
      ],
    }),
  },
};

const createMockData = (): HydratedSearchResult[] => [
  {
    id: 'char-aria',
    projectId: 'p1',
    entityType: 'character',
    entityId: 'char-aria-id',
    content: 'Aria is a brave young warrior',
    similarity: 0.92,
    entity: {
      name: 'Aria',
      description: 'A brave young warrior with hidden magical abilities',
    },
    context:
      'Character: Aria\nDescription: A brave young warrior with hidden magical abilities\nArchetype: The Reluctant Hero\nMotivation: Protect her village from an ancient evil\nFlaw: Fear of her own power\nBackstory: Once a simple farm girl until she discovered her magic during a raid',
  },
  {
    id: 'char-kael',
    projectId: 'p1',
    entityType: 'character',
    entityId: 'char-kael-id',
    content: 'Kael is a seasoned veteran',
    similarity: 0.89,
    entity: {
      name: 'Kael',
      description: 'A seasoned veteran with a dark past',
    },
    context:
      'Character: Kael\nDescription: A seasoned veteran with a dark past\nArchetype: The Mentor\nMotivation: Find redemption for past failures\nFlaw: Overprotective of Aria\nBackstory: Former royal guard who failed to protect the kingdom from the same evil',
  },
  {
    id: 'world-eldoria',
    projectId: 'p1',
    entityType: 'world_building',
    entityId: 'world-eldoria-id',
    content: 'The kingdom of Eldoria',
    similarity: 0.88,
    entity: {
      name: 'Eldoria',
      description: 'A mystical kingdom facing extinction',
    },
    context:
      'World Building (location): Eldoria\nDescription: A mystical kingdom facing extinction\nKey Locations: The Crystal Caverns, Shadow Mountains, River of Dreams\nMagic System: Elemental magic bound to bloodlines\nCurrent State: Under threat from the Shadow King',
  },
  {
    id: 'plot-chapter-5',
    projectId: 'p1',
    entityType: 'chapter',
    entityId: 'chapter-5-id',
    content: 'Chapter 5 summary',
    similarity: 0.85,
    entity: {
      title: 'Chapter 5: The Revelation',
      summary: 'Aria discovers the source of her magic',
      content: 'In the crystal caverns, Aria learns her magic comes from an ancient lineage...',
    },
    context:
      'Chapter: Chapter 5: The Revelation\nSummary: Aria discovers the source of her magic\nContent: In the crystal caverns, Aria learns her magic comes from an ancient lineage that once protected Eldoria\nThemes: Discovery, Heritage, Responsibility',
  },
  {
    id: 'project-meta',
    projectId: 'p1',
    entityType: 'project',
    entityId: 'project-meta-id',
    content: 'The Last Guardian project',
    similarity: 0.95,
    entity: {
      title: 'The Last Guardian',
      description: 'An epic fantasy adventure',
    },
    context:
      "Project: The Last Guardian\nGenre: Epic Fantasy\nCore Theme: The burden of power and the courage to face one's destiny\nTone: Heroic, with moments of despair and hope\nTarget Audience: Young Adult",
  },
];

const createPartialMockData = (): HydratedSearchResult[] => [
  {
    id: 'char-john',
    projectId: 'p2',
    entityType: 'character',
    entityId: 'char-john-id',
    content: 'John Doe character',
    similarity: 0.9,
    entity: {
      name: 'John Doe',
      description: 'A detective solving mysteries',
    },
    context:
      'Character: John Doe\nDescription: A detective solving mysteries\nArchetype: The Detective\nMotivation: Uncover the truth\nFlaw: Obsessive dedication to cases\nBackstory: Former police detective turned private investigator after a case went wrong',
  },
  {
    id: 'world-city',
    projectId: 'p2',
    entityType: 'world_building',
    entityId: 'world-city-id',
    content: 'Neo Tokyo setting',
    similarity: 0.87,
    entity: {
      name: 'Neo Tokyo',
      description: 'Cyberpunk metropolis',
    },
    context:
      'World Building (location): Neo Tokyo\nDescription: Cyberpunk metropolis in 2087\nKey Locations: Underground markets, Corporate towers, Slums\nTechnology: Advanced AI, Neural implants, Flying vehicles\nSociety: Extreme wealth inequality, Corporate control',
  },
];

const createThematicMockData = (): HydratedSearchResult[] => [
  {
    id: 'char-emma',
    projectId: 'p3',
    entityType: 'character',
    entityId: 'char-emma-id',
    content: 'Emma character',
    similarity: 0.91,
    entity: {
      name: 'Emma',
      description: 'A young artist seeking inspiration',
    },
    context:
      'Character: Emma\nDescription: A young artist seeking inspiration\nArchetype: The Seeker\nMotivation: Find meaning in her art\nFlaw: Self-doubt\nBackstory: Recent art school graduate struggling to find her voice',
  },
  {
    id: 'project-identity',
    projectId: 'p3',
    entityType: 'project',
    entityId: 'project-identity-id',
    content: 'Identity and self-discovery project',
    similarity: 0.94,
    entity: {
      title: 'Finding Her Voice',
      description: 'A coming-of-age story',
    },
    context:
      'Project: Finding Her Voice\nGenre: Contemporary Romance / Drama\nCore Themes: Self-discovery, Artistic expression, Finding love\nTone: Intimate, introspective, hopeful\nTarget Audience: Adult',
  },
];

describe('RAG End-to-End Integration Tests', () => {
  beforeEach(() => {
    vi.mocked(searchService.search).mockReset();
    vi.mocked(generateText).mockReset();
    vi.mocked(generateText).mockResolvedValue(mockPlotResponse);
  });

  describe('New Project - No Context Available', () => {
    it('should handle new projects with zero context gracefully', async () => {
      vi.mocked(searchService.search).mockResolvedValue([]);

      const request = {
        projectId: 'new-project-123',
        premise: 'A young wizard discovers a magical academy',
        genre: 'fantasy',
        targetLength: 25,
      };

      const result = await plotGenerationService.generatePlot(request);

      expect(result).toBeDefined();
      expect(result.plotStructure).toBeDefined();
      expect(result.plotStructure.acts.length).toBeGreaterThan(0);
      expect(result.suggestions.length).toBeGreaterThan(0);

      const systemCalls = vi.mocked(generateText).mock.calls.filter(call => call[0]?.system);
      expect(systemCalls.length).toBeGreaterThan(0);

      systemCalls.forEach(call => {
        expect(call[0]?.system).not.toContain('IMPORTANT CONTEXT FROM THE PROJECT');
        expect(call[0]?.system).not.toContain('EXISTING CHARACTERS:');
        expect(call[0]?.system).not.toContain('WORLD BUILDING ELEMENTS:');
      });

      expect(searchService.search).toHaveBeenCalled();
    });

    it('should generate appropriate suggestions for new projects', async () => {
      vi.mocked(searchService.search).mockResolvedValue([]);

      const request = {
        projectId: 'new-project-456',
        premise: 'A detective investigates a murder',
        genre: 'mystery',
        targetLength: 20,
      };

      const result = await plotGenerationService.generatePlot(request);

      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(
        result.suggestions.every(s => s.relatedCharacters === undefined || s.relatedCharacters?.length === 0),
      ).toBe(true);

      expect(result.suggestions.some(s => s.type === 'plot_twist' || s.type === 'character_arc')).toBe(true);
    });
  });

  describe('Existing Characters - Context Integration', () => {
    it('should retrieve and use existing characters in AI prompts', async () => {
      vi.mocked(searchService.search).mockResolvedValue(createMockData());

      const request = {
        projectId: 'p1',
        premise: 'Aria must face the Shadow King to save Eldoria',
        genre: 'fantasy',
        targetLength: 20,
      };

      await plotGenerationService.generatePlot(request);

      expect(searchService.search).toHaveBeenCalledWith(
        'fantasy Aria must face the Shadow King to save Eldoria',
        'p1',
        {
          limit: 5,
          minScore: 0.5,
        },
      );

      const systemCalls = vi.mocked(generateText).mock.calls.filter(call => call[0]?.system);

      expect(systemCalls.some(call => call[0]?.system?.includes('EXISTING CHARACTERS:'))).toBe(true);
      expect(systemCalls.some(call => call[0]?.system?.includes('Aria') && call[0]?.system?.includes('Kael'))).toBe(
        true,
      );
    });

    it('should include character-specific details in prompts', async () => {
      vi.mocked(searchService.search).mockResolvedValue(createMockData());

      const request = {
        projectId: 'p1',
        premise: 'Continue the story',
        genre: 'fantasy',
        targetLength: 15,
      };

      await plotGenerationService.generatePlot(request);

      const systemCalls = vi.mocked(generateText).mock.calls;
      const plotCall = systemCalls.find(call => call[0]?.system?.includes('narrative architect'));

      expect(plotCall?.[0]?.system).toContain('Character: Aria');
      expect(plotCall?.[0]?.system).toContain('Character: Kael');
      expect(plotCall?.[0]?.system).toContain('Archetype:');
    });

    it('should generate character-related suggestions using context', async () => {
      const characterSuggestionsResponse = {
        success: true,
        data: {
          text: JSON.stringify([
            {
              type: 'character_arc',
              title: "Aria's confidence grows",
              description: 'Show Aria overcoming her fear of magic during a critical battle',
              placement: 'middle',
              impact: 'high',
              relatedCharacters: ['Aria'],
              prerequisites: ['Establish Aria fear of magic early in Act 1'],
            },
            {
              type: 'subplot',
              title: "Kael's redemption",
              description: 'Kael helps Aria master her powers, finding redemption in teaching',
              placement: 'anywhere',
              impact: 'medium',
              relatedCharacters: ['Kael'],
            },
          ]),
        },
      };

      vi.mocked(generateText)
        .mockResolvedValueOnce(mockPlotResponse)
        .mockResolvedValueOnce(characterSuggestionsResponse)
        .mockResolvedValueOnce({ success: true, data: { text: '[]' } });

      vi.mocked(searchService.search).mockResolvedValue(createMockData());

      const request = {
        projectId: 'p1',
        premise: 'Continue the story',
        genre: 'fantasy',
        targetLength: 20,
      };

      const result = await plotGenerationService.generatePlot(request);

      expect(result.suggestions.some(s => s.relatedCharacters?.includes('Aria'))).toBe(true);
      expect(result.suggestions.some(s => s.relatedCharacters?.includes('Kael'))).toBe(true);
    });
  });

  describe('Multi-chapter Project - Continuity Validation', () => {
    it('should retrieve existing chapter content for continuity', async () => {
      const extraChapters: HydratedSearchResult[] = [
        {
          id: 'chapter-6',
          projectId: 'p1',
          entityType: 'chapter',
          entityId: 'chapter-6-id',
          content: 'Chapter 6 summary',
          similarity: 0.84,
          entity: {
            title: 'Chapter 6: The Decision',
            summary: 'Aria must choose her path',
            content: 'Confronted with two paths, Aria must decide between safety and duty...',
          },
          context:
            'Chapter: Chapter 6: The Decision\nSummary: Aria must choose her path\nContent: Confronted with two paths, Aria must decide between safety and duty\nPlot Point: Critical decision moment\nCliffhanger: Choice left unresolved',
        },
        {
          id: 'chapter-7',
          projectId: 'p1',
          entityType: 'chapter',
          entityId: 'chapter-7-id',
          content: 'Chapter 7 summary',
          similarity: 0.83,
          entity: {
            title: 'Chapter 7: The Journey Begins',
            summary: 'Setting out on quest',
            content: 'With her decision made, Aria sets out on her journey...',
          },
          context:
            'Chapter: Chapter 7: The Journey Begins\nSummary: Setting out on quest\nContent: With her decision made, Aria sets out on her journey with Kael\nPlot Point: Act 2 begins properly\nCharacter Growth: Aria takes first steps toward heroism',
        },
      ];

      const multiChapterData = [...createMockData(), ...extraChapters];

      vi.mocked(searchService.search).mockResolvedValue(multiChapterData);

      const request = {
        projectId: 'p1',
        premise: 'Continue the adventure',
        genre: 'fantasy',
        targetLength: 25,
      };

      const result = await plotGenerationService.generatePlot(request);

      expect(result).toBeDefined();
      expect(result.plotStructure).toBeDefined();
      expect(result.plotStructure.acts.length).toBeGreaterThan(0);

      const systemCalls = vi.mocked(generateText).mock.calls;
      const plotCall = systemCalls.find(call => call[0]?.system?.includes('narrative architect'));

      expect(plotCall?.[0]?.system?.includes('EXISTING CHAPTER CONTENT:')).toBe(true);
    });

    it('should limit chapter context to top 3 results', async () => {
      const extraChapters: HydratedSearchResult[] = Array.from(
        { length: 6 },
        (_, i): HydratedSearchResult => ({
          id: `chapter-${i + 8}`,
          projectId: 'p1',
          entityType: 'chapter',
          entityId: `chapter-${i + 8}-id`,
          content: `Chapter ${i + 8} summary`,
          similarity: 0.8 - i * 0.05,
          entity: {
            title: `Chapter ${i + 8}`,
            summary: `Summary ${i + 8}`,
            content: `Content ${i + 8}`,
          },
          context: `Chapter: Chapter ${i + 8}\nSummary: Summary ${i + 8}\nContent: Content ${i + 8}`,
        }),
      );

      const manyChapters = [...createMockData(), ...extraChapters];

      vi.mocked(searchService.search).mockResolvedValue(manyChapters);

      const request = {
        projectId: 'p1',
        premise: 'Continue the adventure',
        genre: 'fantasy',
        targetLength: 30,
      };

      await plotGenerationService.generatePlot(request);

      const systemCalls = vi.mocked(generateText).mock.calls;
      const plotCall = systemCalls.find(call => call[0]?.system?.includes('narrative architect'));

      const systemText = plotCall?.[0]?.system || '';
      const chapterSection = systemText.split('EXISTING CHAPTER CONTENT:')[1]?.split('\n\n---')[0];

      expect(chapterSection).toBeDefined();

      const chapterMatches = chapterSection?.match(/Chapter:/g);
      expect(chapterMatches?.length).toBeLessThanOrEqual(3);
    });

    it('should maintain continuity across chapters in plot generation', async () => {
      vi.mocked(searchService.search).mockResolvedValue(createMockData());

      const request = {
        projectId: 'p1',
        premise: 'Continue from Chapter 7',
        genre: 'fantasy',
        targetLength: 20,
      };

      const result = await plotGenerationService.generatePlot(request);

      expect(result.plotStructure.acts).toBeDefined();
      expect(result.plotStructure.acts.length).toBe(3);

      const allPlotPoints = result.plotStructure.acts.flatMap(act => act.plotPoints);
      expect(allPlotPoints.length).toBeGreaterThan(0);
    });
  });

  describe('Thematic Project - Theme-Aware Suggestions', () => {
    it('should retrieve project metadata with themes', async () => {
      vi.mocked(searchService.search).mockResolvedValue(createThematicMockData());

      const request = {
        projectId: 'p3',
        premise: 'Emma meets a fellow artist at a gallery',
        genre: 'romance',
        targetLength: 15,
      };

      await plotGenerationService.generatePlot(request);

      const systemCalls = vi.mocked(generateText).mock.calls;
      const plotCall = systemCalls.find(call => call[0]?.system?.includes('narrative architect'));

      expect(plotCall?.[0]?.system?.includes('PROJECT CONTEXT:')).toBe(true);
      expect(plotCall?.[0]?.system?.includes('Self-discovery')).toBe(true);
      expect(plotCall?.[0]?.system?.includes('Artistic expression')).toBe(true);
    });

    it('should generate theme-aligned suggestions', async () => {
      const themeAwareResponse = {
        success: true,
        data: {
          text: JSON.stringify([
            {
              type: 'theme_development',
              title: 'Art as Mirror',
              description: "Emma's art style evolves to reflect her personal growth and romantic journey",
              placement: 'anywhere',
              impact: 'medium',
              relatedCharacters: ['Emma'],
              prerequisites: ['Establish Emma initial art style'],
            },
            {
              type: 'character_arc',
              title: 'Finding Her Voice',
              description: 'Emma discovers her unique artistic voice through her relationship with the fellow artist',
              placement: 'middle',
              impact: 'high',
              relatedCharacters: ['Emma'],
            },
            {
              type: 'subplot',
              title: 'Gallery Exhibition',
              description: 'Emma prepares for her first major exhibition, testing her confidence',
              placement: 'late',
              impact: 'high',
              relatedCharacters: ['Emma'],
            },
          ]),
        },
      };

      vi.mocked(generateText)
        .mockResolvedValueOnce(mockPlotResponse)
        .mockResolvedValueOnce(themeAwareResponse)
        .mockResolvedValueOnce({ success: true, data: { text: '[]' } });

      vi.mocked(searchService.search).mockResolvedValue(createThematicMockData());

      const request = {
        projectId: 'p3',
        premise: 'Emma meets a fellow artist',
        genre: 'romance',
        targetLength: 18,
      };

      const result = await plotGenerationService.generatePlot(request);

      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions.some(s => s.type === 'theme_development' || s.type === 'character_arc')).toBe(true);

      const themeSuggestions = result.suggestions.filter(s => s.type === 'theme_development');
      expect(themeSuggestions.length).toBeGreaterThan(0);
    });
  });

  describe('Complex Project - Multiple Entity Types and Prioritization', () => {
    it('should retrieve all entity types from complex project', async () => {
      vi.mocked(searchService.search).mockResolvedValue(createMockData());

      const request = {
        projectId: 'p1',
        premise: 'The adventure continues',
        genre: 'fantasy',
        targetLength: 25,
      };

      await plotGenerationService.generatePlot(request);

      expect(searchService.search).toHaveBeenCalled();

      const systemCalls = vi.mocked(generateText).mock.calls;
      const plotCall = systemCalls.find(call => call[0]?.system?.includes('narrative architect'));

      const systemText = plotCall?.[0]?.system || '';

      expect(systemText).toContain('PROJECT CONTEXT:');
      expect(systemText).toContain('EXISTING CHARACTERS:');
      expect(systemText).toContain('WORLD BUILDING ELEMENTS:');
      expect(systemText).toContain('EXISTING CHAPTER CONTENT:');
    });

    it('should include world-building context in prompts', async () => {
      vi.mocked(searchService.search).mockResolvedValue(createMockData());

      const request = {
        projectId: 'p1',
        premise: 'Continue the adventure',
        genre: 'fantasy',
        targetLength: 20,
      };

      await plotGenerationService.generatePlot(request);

      const systemCalls = vi.mocked(generateText).mock.calls;
      const plotCall = systemCalls.find(call => call[0]?.system?.includes('narrative architect'));

      expect(plotCall?.[0]?.system?.includes('World Building')).toBe(true);
      expect(plotCall?.[0]?.system?.includes('Eldoria')).toBe(true);
      expect(plotCall?.[0]?.system?.includes('Crystal Caverns')).toBe(true);
    });

    it('should prioritize relevant context based on similarity scores', async () => {
      const prioritizedData = createMockData().map((item, index) => ({
        ...item,
        similarity: 0.95 - index * 0.01,
      }));

      vi.mocked(searchService.search).mockResolvedValue(prioritizedData);

      const request = {
        projectId: 'p1',
        premise: 'Aria and Kael continue their journey',
        genre: 'fantasy',
        targetLength: 20,
      };

      await plotGenerationService.generatePlot(request);

      const systemCalls = vi.mocked(generateText).mock.calls;
      const plotCall = systemCalls.find(call => call[0]?.system?.includes('narrative architect'));

      const systemText = plotCall?.[0]?.system || '';

      expect(systemText).toContain('Aria');
      expect(systemText).toContain('Kael');
      expect(systemText).toContain('Eldoria');
    });

    it('should generate suggestions that utilize multiple context types', async () => {
      const complexSuggestionsResponse = {
        success: true,
        data: {
          text: JSON.stringify([
            {
              type: 'subplot',
              title: 'Explore the Crystal Caverns',
              description:
                'Aria and Kael venture into the Crystal Caverns to uncover more about the ancient magic system',
              placement: 'middle',
              impact: 'medium',
              relatedCharacters: ['Aria', 'Kael'],
              prerequisites: ['Establish the Shadow King threat in Act 1'],
            },
            {
              type: 'character_arc',
              title: "Kael's burden revealed",
              description:
                "Kael reveals the full story of his past failure to protect the kingdom, deepening his and Aria's bond",
              placement: 'middle',
              impact: 'high',
              relatedCharacters: ['Kael', 'Aria'],
            },
            {
              type: 'plot_twist',
              title: 'The Shadow King Connection',
              description: 'Aria discovers her lineage connects her to the Shadow King, creating moral complexity',
              placement: 'late',
              impact: 'high',
              relatedCharacters: ['Aria'],
            },
          ]),
        },
      };

      vi.mocked(generateText)
        .mockResolvedValueOnce(mockPlotResponse)
        .mockResolvedValueOnce(complexSuggestionsResponse)
        .mockResolvedValueOnce({ success: true, data: { text: '[]' } });

      vi.mocked(searchService.search).mockResolvedValue(createMockData());

      const request = {
        projectId: 'p1',
        premise: 'Continue the adventure',
        genre: 'fantasy',
        targetLength: 22,
      };

      const result = await plotGenerationService.generatePlot(request);

      expect(result.suggestions.some(s => s.relatedCharacters?.includes('Aria'))).toBe(true);
      expect(result.suggestions.some(s => s.relatedCharacters?.includes('Kael'))).toBe(true);
      expect(result.suggestions.some(s => s.prerequisites !== undefined)).toBe(true);
    });
  });

  describe('Partial Context - Missing Entity Types', () => {
    it('should handle partial context (only characters and world)', async () => {
      vi.mocked(searchService.search).mockResolvedValue(createPartialMockData());

      const request = {
        projectId: 'p2',
        premise: 'John investigates a corporate conspiracy',
        genre: 'mystery',
        targetLength: 20,
      };

      const result = await plotGenerationService.generatePlot(request);

      expect(result).toBeDefined();
      expect(result.plotStructure).toBeDefined();

      const systemCalls = vi.mocked(generateText).mock.calls;
      const plotCall = systemCalls.find(call => call[0]?.system?.includes('narrative architect'));

      const systemText = plotCall?.[0]?.system || '';

      expect(systemText).toContain('EXISTING CHARACTERS:');
      expect(systemText).toContain('WORLD BUILDING ELEMENTS:');
      expect(systemText).toContain('John Doe');
      expect(systemText).toContain('Neo Tokyo');
    });

    it('should not include empty sections for missing context', async () => {
      vi.mocked(searchService.search).mockResolvedValue(createPartialMockData());

      const request = {
        projectId: 'p2',
        premise: 'John investigates a corporate conspiracy',
        genre: 'mystery',
        targetLength: 20,
      };

      await plotGenerationService.generatePlot(request);

      const systemCalls = vi.mocked(generateText).mock.calls;
      const plotCall = systemCalls.find(call => call[0]?.system?.includes('narrative architect'));

      const systemText = plotCall?.[0]?.system || '';

      expect(systemText).not.toContain('PROJECT CONTEXT:');
      expect(systemText).not.toContain('EXISTING CHAPTER CONTENT:');
    });

    it('should generate appropriate suggestions with limited context', async () => {
      const partialContextResponse = {
        success: true,
        data: {
          text: JSON.stringify([
            {
              type: 'character_arc',
              title: "John's obsession tested",
              description: "John's obsessive dedication to the case threatens his personal life",
              placement: 'middle',
              impact: 'high',
              relatedCharacters: ['John Doe'],
            },
            {
              type: 'subplot',
              title: 'Neo Tokyo underbelly',
              description: 'John discovers the depths of corruption in the underground markets',
              placement: 'middle',
              impact: 'medium',
            },
          ]),
        },
      };

      vi.mocked(generateText)
        .mockResolvedValueOnce(mockPlotResponse)
        .mockResolvedValueOnce(partialContextResponse)
        .mockResolvedValueOnce({ success: true, data: { text: '[]' } });

      vi.mocked(searchService.search).mockResolvedValue(createPartialMockData());

      const request = {
        projectId: 'p2',
        premise: 'John investigates a corporate conspiracy',
        genre: 'mystery',
        targetLength: 18,
      };

      const result = await plotGenerationService.generatePlot(request);

      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions.some(s => s.relatedCharacters?.includes('John Doe'))).toBe(true);
    });
  });

  describe('RAG Failure - Fallback Behavior', () => {
    it('should handle complete RAG search failure gracefully', async () => {
      vi.mocked(searchService.search).mockRejectedValue(new Error('Semantic search service unavailable'));

      const request = {
        projectId: 'p4',
        premise: 'A space adventure begins',
        genre: 'scifi',
        targetLength: 20,
      };

      const result = await plotGenerationService.generatePlot(request);

      expect(result).toBeDefined();
      expect(result.plotStructure).toBeDefined();
      expect(result.plotStructure.acts.length).toBeGreaterThan(0);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should still generate plot when RAG fails', async () => {
      vi.mocked(searchService.search).mockRejectedValue(new Error('Network error'));

      const request = {
        projectId: 'p5',
        premise: 'A time traveler changes history',
        genre: 'scifi',
        targetLength: 15,
      };

      const result = await plotGenerationService.generatePlot(request);

      expect(result.plotStructure).toBeDefined();
      expect(result.plotStructure.acts).toBeDefined();
      expect(result.plotStructure.acts.length).toBe(3);
    });

    it('should generate fallback suggestions when RAG fails', async () => {
      vi.mocked(searchService.search).mockRejectedValue(new Error('Service timeout'));

      const request = {
        projectId: 'p6',
        premise: 'A detective solves a cold case',
        genre: 'mystery',
        targetLength: 18,
      };

      const result = await plotGenerationService.generatePlot(request);

      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions[0]).toHaveProperty('id');
      expect(result.suggestions[0]).toHaveProperty('type');
      expect(result.suggestions[0]).toHaveProperty('title');
      expect(result.suggestions[0]).toHaveProperty('description');
    });

    it('should not include context sections when RAG fails', async () => {
      vi.mocked(searchService.search).mockRejectedValue(new Error('Search failed'));

      const request = {
        projectId: 'p7',
        premise: 'A romance blooms in Paris',
        genre: 'romance',
        targetLength: 20,
      };

      await plotGenerationService.generatePlot(request);

      const systemCalls = vi.mocked(generateText).mock.calls;

      systemCalls.forEach(call => {
        if (call[0]?.system) {
          expect(call[0]?.system).not.toContain('IMPORTANT CONTEXT FROM THE PROJECT');
        }
      });
    });
  });

  describe('Complete Workflow - End-to-End Validation', () => {
    it('should execute complete workflow: context retrieval → formatting → plot generation → suggestions', async () => {
      vi.mocked(searchService.search).mockResolvedValue(createMockData());

      const completeSuggestionsResponse = {
        success: true,
        data: {
          text: JSON.stringify([
            {
              type: 'character_arc',
              title: 'Aria embraces her destiny',
              description: 'Aria finally accepts her role as the last guardian of Eldoria',
              placement: 'late',
              impact: 'high',
              relatedCharacters: ['Aria'],
            },
            {
              type: 'plot_twist',
              title: 'The Betrayal',
              description: 'A trusted ally reveals they work for the Shadow King',
              placement: 'middle',
              impact: 'high',
            },
            {
              type: 'subplot',
              title: "Kael's redemption",
              description: 'Kael sacrifices himself to save Aria, finding redemption',
              placement: 'late',
              impact: 'high',
              relatedCharacters: ['Kael'],
            },
          ]),
        },
      };

      vi.mocked(generateText)
        .mockResolvedValueOnce(mockPlotResponse)
        .mockResolvedValueOnce(completeSuggestionsResponse)
        .mockResolvedValueOnce({ success: true, data: { text: '[]' } });

      const request = {
        projectId: 'p1',
        premise: 'The final battle approaches',
        genre: 'fantasy',
        targetLength: 25,
      };

      const result = await plotGenerationService.generatePlot(request);

      expect(searchService.search).toHaveBeenCalledWith('fantasy The final battle approaches', 'p1', {
        limit: 5,
        minScore: 0.5,
      });

      expect(result.plotStructure).toBeDefined();
      expect(result.plotStructure.acts.length).toBe(3);
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.alternatives).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.generatedAt).toBeInstanceOf(Date);

      const systemCalls = vi.mocked(generateText).mock.calls;
      expect(systemCalls.length).toBeGreaterThanOrEqual(2);

      const plotCall = systemCalls.find(call => call[0]?.system?.includes('narrative architect'));
      expect(plotCall?.[0]?.system?.includes('IMPORTANT CONTEXT FROM THE PROJECT')).toBe(true);
      expect(plotCall?.[0]?.system?.includes('Aria')).toBe(true);
      expect(plotCall?.[0]?.system?.includes('Eldoria')).toBe(true);
    });

    it('should verify context is actually used in AI prompts', async () => {
      vi.mocked(searchService.search).mockResolvedValue(createMockData());

      await plotGenerationService.generatePlot({
        projectId: 'p1',
        premise: 'The adventure continues',
        genre: 'fantasy',
        targetLength: 20,
      });

      const systemCalls = vi.mocked(generateText).mock.calls;

      const plotSystemCall = systemCalls.find(call => call[0]?.system?.includes('narrative architect'));
      const suggestionsSystemCall = systemCalls.find(call => call[0]?.system?.includes('story editor'));

      expect(plotSystemCall).toBeDefined();
      expect(suggestionsSystemCall).toBeDefined();

      expect(plotSystemCall?.[0]?.system?.includes('Aria')).toBe(true);
      expect(plotSystemCall?.[0]?.system?.includes('Eldoria')).toBe(true);
      expect(plotSystemCall?.[0]?.system?.includes('Kael')).toBe(true);

      expect(suggestionsSystemCall?.[0]?.prompt?.includes('Aria')).toBe(true);
    });

    it('should maintain consistent context across plot generation and suggestions', async () => {
      vi.mocked(searchService.search).mockResolvedValue(createMockData());

      const contextAwareSuggestionsResponse = {
        success: true,
        data: {
          text: JSON.stringify([
            {
              type: 'character_arc',
              title: "Aria's confidence grows",
              description: 'Aria gains confidence in her magical abilities',
              placement: 'middle',
              impact: 'high',
              relatedCharacters: ['Aria'],
            },
          ]),
        },
      };

      vi.mocked(generateText)
        .mockResolvedValueOnce(mockPlotResponse)
        .mockResolvedValueOnce(contextAwareSuggestionsResponse)
        .mockResolvedValueOnce({ success: true, data: { text: '[]' } });

      await plotGenerationService.generatePlot({
        projectId: 'p1',
        premise: 'Continue the adventure',
        genre: 'fantasy',
        targetLength: 20,
      });

      const systemCalls = vi.mocked(generateText).mock.calls;

      const plotCall = systemCalls.find(call => call[0]?.system?.includes('narrative architect'));
      const suggestionsCall = systemCalls.find(call => call[0]?.system?.includes('story editor'));

      const plotContext = plotCall?.[0]?.system || '';
      const suggestionsContext = suggestionsCall?.[0]?.prompt || '';

      expect(plotContext.includes('Aria')).toBe(true);
      expect(suggestionsContext.includes('Aria')).toBe(true);
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle very long context strings without truncation issues', async () => {
      const longContext: HydratedSearchResult[] = [
        {
          id: 'char-1',
          projectId: 'p8',
          entityType: 'character',
          entityId: 'char-1-id',
          content: 'Long character description ' + 'a'.repeat(500),
          similarity: 0.9,
          entity: {
            name: 'Long Name Character',
            description: 'A'.repeat(200),
          },
          context: 'Character: Long Name Character\n' + 'B'.repeat(400),
        },
      ];

      vi.mocked(searchService.search).mockResolvedValue(longContext);

      const request = {
        projectId: 'p8',
        premise: 'A story with long descriptions',
        genre: 'fantasy',
        targetLength: 20,
      };

      const result = await plotGenerationService.generatePlot(request);

      expect(result).toBeDefined();
      expect(result.plotStructure).toBeDefined();
    });

    it('should handle special characters in context', async () => {
      const specialCharContext: HydratedSearchResult[] = [
        {
          id: 'char-special',
          projectId: 'p9',
          entityType: 'character',
          entityId: 'char-special-id',
          content: 'Special characters: @#$%^&*()',
          similarity: 0.9,
          entity: {
            name: 'Agent X-7',
            description: 'A spy with special symbols <>&"\'',
          },
          context:
            'Character: Agent X-7\nDescription: A spy with special symbols\nCodename: "The Whisper"\nSpecial: @#$%^&*()',
        },
      ];

      vi.mocked(searchService.search).mockResolvedValue(specialCharContext);

      const request = {
        projectId: 'p9',
        premise: 'A spy thriller',
        genre: 'thriller',
        targetLength: 20,
      };

      const result = await plotGenerationService.generatePlot(request);

      expect(result).toBeDefined();
      expect(result.plotStructure).toBeDefined();
    });

    it('should handle projects with only project metadata', async () => {
      const onlyMetadata: HydratedSearchResult[] = [
        {
          id: 'project-only',
          projectId: 'p10',
          entityType: 'project',
          entityId: 'project-only-id',
          content: 'Project only test',
          similarity: 0.95,
          entity: {
            title: 'Test Project',
            description: 'A test project with only metadata',
          },
          context:
            'Project: Test Project\nGenre: Fantasy\nCore Theme: Test theme\nTone: Test tone\nTarget Audience: Test audience',
        },
      ];

      vi.mocked(searchService.search).mockResolvedValue(onlyMetadata);

      const request = {
        projectId: 'p10',
        premise: 'A test premise',
        genre: 'fantasy',
        targetLength: 20,
      };

      const result = await plotGenerationService.generatePlot(request);

      expect(result).toBeDefined();
      expect(result.plotStructure).toBeDefined();

      const systemCalls = vi.mocked(generateText).mock.calls;
      const plotCall = systemCalls.find(call => call[0]?.system?.includes('narrative architect'));

      expect(plotCall?.[0]?.system?.includes('PROJECT CONTEXT:')).toBe(true);
      expect(plotCall?.[0]?.system).not.toContain('EXISTING CHARACTERS:');
      expect(plotCall?.[0]?.system).not.toContain('WORLD BUILDING ELEMENTS:');
    });
  });
});
