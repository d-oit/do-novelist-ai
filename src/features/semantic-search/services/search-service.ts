/**
 * Search Service
 *
 * High-level service for semantic search and result hydration.
 * Orchestrates vector search and entity retrieval.
 */

import { characterService } from '@/features/characters/services/characterService';
import { editorService } from '@/features/editor/services/editorService';
import { projectService } from '@/features/projects/services/projectService';
import { worldBuildingService } from '@/features/world-building/services/worldBuildingService';
import * as vectorService from '@/lib/database/services/vector-service';
import { logger } from '@/lib/logging/logger';
import type {
  SearchFilters,
  HydratedSearchResult,
  VectorEntityType,
  SimilaritySearchResult,
} from '@/types/embeddings';

export class SearchService {
  /**
   * Search and hydrate results
   */
  public async search(
    query: string,
    projectId: string,
    filters?: SearchFilters,
  ): Promise<HydratedSearchResult[]> {
    try {
      // 1. Perform vector search
      const rawResults = await vectorService.semanticSearch({
        projectId,
        queryText: query,
        threshold: filters?.minScore ?? 0.6,
        limit: filters?.limit ?? 10,
        // If entityTypes filter is singular, we can optimize
        entityType: filters?.entityTypes?.length === 1 ? filters.entityTypes[0] : undefined,
      });

      // 2. Hydrate results with actual entity data
      const hydratedResults = await Promise.all(
        rawResults.map(async (result: SimilaritySearchResult) => {
          const entity = await this.hydrateEntity(
            result.entityType as VectorEntityType,
            result.entityId,
          );

          if (!entity) return null;

          const hydrated: HydratedSearchResult = {
            ...result,
            entity,
            context: this.formatContext(result.entityType as VectorEntityType, entity),
          };
          return hydrated;
        }),
      );

      // 3. Filter valid results and any additional filters
      return hydratedResults.filter(
        (r): r is HydratedSearchResult =>
          r !== null &&
          (!filters?.entityTypes || filters.entityTypes.includes(r.entityType as VectorEntityType)),
      );
    } catch (error) {
      logger.error('Search failed', { query, projectId, error });
      throw error;
    }
  }

  /**
   * Retrieve full entity data
   */
  private async hydrateEntity(type: VectorEntityType, id: string): Promise<unknown | null> {
    try {
      switch (type) {
        case 'character':
          return await characterService.getById(id);
        case 'chapter':
          // Editor service might not have a simple "getById" that returns full content cleanly if it's based on drafts
          // We might want just metadata + summary, or load draft.
          // Let's use getDraftMetadata for speed, or loadDraft if content is needed.
          // For RAG context, we probably want the content.
          return await editorService.loadDraft(id);
        case 'world_building':
          // We need to differentiate location vs culture vs other.
          // The vector service stores 'world_building' as type, but we might need to probe or look at metadata if available.
          // However, existing vector rows don't easily tell us subtype unless we encoded it in ID or separate field.
          // Wait, `extractFromWorldBuilding` puts `type` in metadata.
          // But `semanticSearch` result just has `entityId`.
          // We'll try fetching from both stores (Location/Culture). Ideally IDs are unique UUIDs.
          const location = await worldBuildingService.getLocation(id);
          if (location) return location;
          const culture = await worldBuildingService.getCulture(id);
          if (culture) return culture;
          return null;
        case 'project':
          return await projectService.getById(id);
        default:
          return null;
      }
    } catch (error) {
      logger.warn(`Failed to hydrate entity ${type}:${id}`, { error });
      return null;
    }
  }

  /**
   * Format entity into context string for RAG
   */
  private formatContext(type: VectorEntityType, entity: unknown): string {
    switch (type) {
      case 'character': {
        const char = entity as { name: string; description: string; backstory?: string };
        return `Character: ${char.name}\nDescription: ${char.description}\nBackstory: ${char.backstory ?? 'N/A'}`;
      }
      case 'chapter': {
        const chapter = entity as { title: string; summary?: string; content: string };
        return `Chapter: ${chapter.title}\nSummary: ${chapter.summary}\nContent: ${chapter.content}`;
      }
      case 'world_building': {
        const wb = entity as { type?: string; name: string; description?: string };
        return `World Building (${wb.type || 'General'}): ${wb.name}\nDescription: ${wb.description}`;
      }
      case 'project': {
        const proj = entity as { title: string; idea: string };
        return `Project: ${proj.title}\nIdea: ${proj.idea}`;
      }
      default:
        return JSON.stringify(entity);
    }
  }
}

export const searchService = new SearchService();
